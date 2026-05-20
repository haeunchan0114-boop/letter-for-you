// 초기 가상 데이터베이스 구조 정의
let posts = [
    { id: 1, author: "하은", title: "별빛 우체통 공지사항!", content: "편지 쓰려고 여기까지 와줘서 고마워~\n편지는 너희가 이름 설정하면 되니까 편하게 하고 싶은 말 적고 가주라!\n이름 공개하기 싫으면 아무 말이나 적어줘~", date: "2026-05-20", isPinned: true, isFavorite: false },
    { id: 2, author: "우주여행자", title: "오늘 밤하늘이 유난히 맑네요", content: "하은님 사이트 분위기가 너무 예뻐요. 좋은 밤 되세요.", date: "2026-05-21", isPinned: false, isFavorite: true }
];

let currentSort = 'latest';
let isAdminMode = false;
let currentAdminName = "";
let editingPostId = null;
let replyingPostId = null;

// 화면 로드 시 구동
window.onload = function() {
    renderPosts();
};

// 데이터 그리기 함수 (검색, 정렬, 필터 포함 일괄 처리)
function renderPosts() {
    const feed = document.getElementById('posts-mailbox-feed');
    feed.innerHTML = "";

    const searchTitleVal = document.getElementById('search-title').value.toLowerCase();
    const filterDateVal = document.getElementById('filter-date').value;
    const filterAuthorVal = document.getElementById('filter-author').value.toLowerCase();
    const filterFavVal = document.getElementById('filter-fav').value;

    // 필터링 처리
    let filtered = posts.filter(post => {
        const matchTitle = post.title.toLowerCase().includes(searchTitleVal);
        const matchDate = filterDateVal ? (post.date === filterDateVal) : true;
        const matchAuthor = post.author.toLowerCase().includes(filterAuthorVal);
        const matchFav = filterFavVal === 'fav' ? post.isFavorite : true;
        return matchTitle && matchDate && matchAuthor && matchFav;
    });

    // 정렬 처리 (고정글 상단 보장 우선 배정)
    filtered.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        
        if (currentSort === 'latest') {
            return new Date(b.date) - new Date(a.date) || b.id - a.id;
        } else {
            return new Date(a.date) - new Date(b.date) || a.id - b.id;
        }
    });

    if(filtered.length === 0) {
        feed.innerHTML = `<div style="text-align:center; padding:40px; color:rgba(255,255,255,0.3); font-size:0.9rem;">우체통이 고요합니다. 일치하는 편지가 없습니다.</div>`;
        return;
    }

    // 루프 생성 DOM 주입
    filtered.forEach(post => {
        const card = document.createElement('div');
        card.className = `post-card ${post.isPinned ? 'pinned' : ''}`;
        
        // 구조 조립
        card.innerHTML = `
            <div class="post-meta">
                <div class="meta-info">
                    ${post.isPinned ? '<span class="pin-tag">📌 고정됨</span> | ' : ''}
                    <span>${post.author}</span> | <span>${post.date}</span>
                </div>
                <button class="fav-btn ${post.isFavorite ? 'active' : ''}" onclick="toggleFavorite(${post.id}, event)">★</button>
            </div>
            <h2 class="post-title">${post.title}</h2>
            <div class="post-content">${post.content}</div>
            <div class="card-actions">
                <button class="reply-btn" onclick="openReplyModal(${post.id})">답장 보내기</button>
                ${isAdminMode ? `
                    <button onclick="togglePin(${post.id})">${post.isPinned ? '고정 해제' : '글 고정'}</button>
                    <button onclick="openEditModal(${post.id})">수정</button>
                    <button style="color:#ff8b8b;" onclick="deletePost(${post.id})">삭제</button>
                ` : ''}
            </div>
        `;
        feed.appendChild(card);
    });
}

// 정렬 전환
function changeSort(type) {
    currentSort = type;
    document.getElementById('sort-latest').classList.toggle('active', type === 'latest');
    document.getElementById('sort-oldest').classList.toggle('active', type === 'oldest');
    renderPosts();
}

// 검색조건 전체 클리어 초기화
function resetFilters() {
    document.getElementById('search-title').value = "";
    document.getElementById('filter-date').value = "";
    document.getElementById('filter-author').value = "";
    document.getElementById('filter-fav').value = "all";
    changeSort('latest');
}

// 모달창 여닫기 제어
function openModal(id) {
    if (id === 'writeModal') {
        editingPostId = null;
        replyingPostId = null;
        document.getElementById('write-modal-title').innerText = isAdminMode ? "관리자 권한 글 작성" : "나의 우주에게 편지 쓰기";
        document.getElementById('post-author').value = isAdminMode ? currentAdminName : "";
        document.getElementById('post-author').disabled = isAdminMode;
        document.getElementById('post-title').value = "";
        document.getElementById('post-content').value = "";
    }
    document.getElementById(id).classList.add('active');
}

// 모달 닫기
function closeModal(id) {
    document.getElementById(id).classList.remove('active');
    if (id === 'adminAuthModal') document.getElementById('admin-password-input').value = "";
}

// 관리자 비번 인증 로직
function checkAdminPassword() {
    const pw = document.getElementById('admin-password-input').value;
    if (pw === 'haeunashi0416!') {
        closeModal('adminAuthModal');
        openModal('adminNameModal'); // 이름 쓰는 모달로 연동 진입
    } else {
        alert("비밀번호가 일치하지 않습니다 우주인님.");
    }
}

// 관리자 이름 연동 저장
function saveAdminProfile() {
    const nameInput = document.getElementById('admin-name-input').value.trim();
    currentAdminName = nameInput ? nameInput : "관리자";
    isAdminMode = true;
    
    closeModal('adminNameModal');
    alert(`인증 성공! 이제부터 모든 글은 '${currentAdminName}' 명의로 제어가 가능합니다.`);
    
    // 상단 모드 안내 변경 및 리렌더링
    document.querySelector('.admin-entry-btn').innerText = `관리자 모드 활성화 중 (${currentAdminName})`;
    renderPosts();
}

// 즐겨찾기 스위치 기능
function toggleFavorite(id, e) {
    e.stopPropagation();
    const post = posts.find(p => p.id === id);
    if(post) {
        post.isFavorite = !post.isFavorite;
        renderPosts();
    }
}

// 편지 작성, 답장 쓰기 처리 통합 엔진
function submitPost() {
    const author = document.getElementById('post-author').value.trim() || "익명의 우주";
    const title = document.getElementById('post-title').value.trim();
    const content = document.getElementById('post-content').value.trim();

    if(!title || !content) {
        alert("제목과 내용을 모두 기입해주세요.");
        return;
    }

    const today = new Date().toISOString().split('T')[0];

    if (editingPostId) {
        // 수정 모드 진행 시
        const post = posts.find(p => p.id === editingPostId);
        if (post) {
            post.title = title;
            post.content = content;
        }
    } else if (replyingPostId) {
        // 답장 처리 시
        const targetPost = posts.find(p => p.id === replyingPostId);
        const replyTitle = title.startsWith("Re:") ? title : `Re: ${title}`;
        posts.push({
            id: Date.now(),
            author: isAdminMode ? currentAdminName : author,
            title: replyTitle,
            content: `[원문 대댓글 대상: ${targetPost.author}님의 글]\n\n${content}`,
            date: today,
            isPinned: false,
            isFavorite: false
        });
    } else {
        // 일반 새 편지 등록
        posts.push({
            id: Date.now(),
            author: author,
            title: title,
            content: content,
            date: today,
            isPinned: isAdminMode, // 관리자가 쓸 땐 자동 고정 활성화 가능
            isFavorite: false
        });
    }

    closeModal('writeModal');
    renderPosts();
}

// 답장 보내기 창 열기
function openReplyModal(id) {
    const targetPost = posts.find(p => p.id === id);
    if (!targetPost) return;

    openModal('writeModal');
    replyingPostId = id;
    document.getElementById('write-modal-title').innerText = `'${targetPost.author}' 님에게 답장 전송`;
    document.getElementById('post-title').value = `Re: ${targetPost.title}`;
}

// 관리자 전용 기능: 글 고정 토글
function togglePin(id) {
    const post = posts.find(p => p.id === id);
    if (post) {
        post.isPinned = !post.isPinned;
        renderPosts();
    }
}

// 관리자 전용 기능: 수정창 열기
function openEditModal(id) {
    const post = posts.find(p => p.id === id);
    if (!post) return;

    openModal('writeModal');
    editingPostId = id;
    document.getElementById('write-modal-title').innerText = "기록 수정하기";
    document.getElementById('post-author').value = post.author;
    document.getElementById('post-title').value = post.title;
    document.getElementById('post-content').value = post.content;
}

// 관리자 전용 기능: 삭제
function deletePost(id) {
    if (confirm("이 기록을 우주에서 영구히 삭제할까요?")) {
        posts = posts.filter(p => p.id !== id);
        renderPosts();
    }
}

// 💡 타이틀 클릭 시 발동하는 연노랑 이스터에그 로직
function triggerUniverseEasterEgg() {
    // [A] 문구 박스 연출
    const messageBox = document.getElementById('easter-message');
    messageBox.classList.add('active');
    setTimeout(() => messageBox.classList.remove('active'), 2500);

    // [B] 연노랑 잔별 파티클 와르르 투하
    const container = document.getElementById('easter-stars-container');
    
    for (let i = 0; i < 25; i++) {
        setTimeout(() => {
            const star = document.createElement('div');
            star.className = 'falling-easter-star';
            star.innerText = ['✦', '✧', '★', '🌟', '*'][Math.floor(Math.random() * 5)];
            
            star.style.left = (Math.random() * window.innerWidth) + 'px';
            star.style.fontSize = (Math.random() * 14 + 10) + 'px';
            
            star.style.setProperty('--sway', (Math.random() * 200 - 100) + 'px');
            star.style.setProperty('--angle', (Math.random() * 720 - 360) + 'deg');
            
            star.style.animationDuration = (Math.random() * 2 + 1.5) + 's';
            
            container.appendChild(star);
            
            star.addEventListener('animationend', () => star.remove());
        }, i * 40); // 0.04초 간격 순차 생성
    }
}
