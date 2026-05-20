// 📡 제공해주신 Firebase 리얼타임 데이터베이스 환경정보 연동 설정
const firebaseConfig = {
  apiKey: "AIzaSyAnaa6EtIpvtCxqGPVtbuclexr2agHJWP8",
  authDomain: "myloveletter-for-you.firebaseapp.com",
  databaseURL: "https://myloveletter-for-you-default-rtdb.firebaseio.com",
  projectId: "myloveletter-for-you",
  storageBucket: "myloveletter-for-you.firebasestorage.app",
  messagingSenderId: "567184694523",
  appId: "1:567184694523:web:e5c92804e673c22b7ca45e",
  measurementId: "G-TM826Q76TT"
};

// Firebase 초기화 진행
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// 상태 관리 전역 변수
let posts = [];            // DB에서 가져온 글들이 보관될 배열
let currentSort = 'latest';
let isAdminMode = false;
let currentAdminName = "";
let editingPostId = null;
let replyingPostId = null;

// 💡 페이징 조건 설정 (3개의 글마다 페이지 전환 / 내비게이션 최대 5개 노출)
let currentPage = 1;
const postsPerPage = 3;
const maxNavPages = 5;

// 초기화 가동 및 데이터베이스 실시간 리스너 작동
window.onload = function() {
    listenToFirebase();
};

// Firebase posts 경로 실시간 데이터 추적 리스너
function listenToFirebase() {
    database.ref('posts').on('value', (snapshot) => {
        const data = snapshot.val();
        posts = [];
        
        if (data) {
            // Firebase 객체 데이터를 가공하여 내부 배열 구조로 변환
            for (let key in data) {
                posts.push({
                    firebaseKey: key, // 삭제/수정/즐겨찾기 관리를 위한 DB 고유 식별 키
                    id: data[key].id || Date.now(),
                    author: data[key].author || "익명",
                    title: data[key].title || "",
                    content: data[key].content || "",
                    date: data[key].date || "",
                    isPinned: data[key].isPinned || false,
                    isFavorite: data[key].isFavorite || false
                });
            }
        }
        // 데이터 전송 완료 후 자동 화면 갱신
        renderPosts();
    });
}

// 데이터 계산 및 최종 화면 렌더링
function renderPosts() {
    const feed = document.getElementById('posts-mailbox-feed');
    feed.innerHTML = "";

    const searchTitleVal = document.getElementById('search-title').value.toLowerCase();
    const filterFavVal = document.getElementById('filter-fav').value;

    // 1. 검색 및 즐겨찾기 필터 가공
    let filtered = posts.filter(post => {
        const matchTitle = post.title.toLowerCase().includes(searchTitleVal);
        const matchFav = filterFavVal === 'fav' ? post.isFavorite : true;
        return matchTitle && matchFav;
    });

    // 2. 정렬 규격 연산 (고정글 상단 우선)
    filtered.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        
        if (currentSort === 'latest') {
            return new Date(b.date) - new Date(a.date) || b.id - a.id;
        } else {
            return new Date(a.date) - new Date(b.date) || a.id - b.id;
        }
    });

    // 3. 🧩 페이징 구획 연산 (3개씩 분할 처리)
    const totalPosts = filtered.length;
    const totalPages = Math.ceil(totalPosts / postsPerPage) || 1;
    
    if (currentPage > totalPages) currentPage = totalPages;

    const startIndex = (currentPage - 1) * postsPerPage;
    const endIndex = startIndex + postsPerPage;
    const pagePosts = filtered.slice(startIndex, endIndex);

    if(pagePosts.length === 0) {
        feed.innerHTML = `<div style="text-align:center; padding:40px; color:rgba(255,255,255,0.3); font-size:0.9rem;">우체통이 고요합니다. 일치하는 편지가 없습니다.</div>`;
        renderPaginationControls(totalPages);
        return;
    }

    // 조건 충족 타겟 카드 그리기
    pagePosts.forEach(post => {
        const card = document.createElement('div');
        card.className = `post-card ${post.isPinned ? 'pinned' : ''}`;
        
        card.innerHTML = `
            <div class="post-meta">
                <div class="meta-info">
                    ${post.isPinned ? '<span class="pin-tag">📌 고정됨</span> | ' : ''}
                    <span>${post.author}</span> | <span>${post.date}</span>
                </div>
                <button class="fav-btn ${post.isFavorite ? 'active' : ''}" onclick="toggleFavorite('${post.firebaseKey}', ${post.isFavorite}, event)">★</button>
            </div>
            <h2 class="post-title">${post.title}</h2>
            <div class="post-content">${post.content}</div>
            <div class="card-actions">
                <button class="reply-btn" onclick="openReplyModal('${post.firebaseKey}')">답장 보내기</button>
                ${isAdminMode ? `
                    <button onclick="togglePin('${post.firebaseKey}', ${post.isPinned})">${post.isPinned ? '고정 해제' : '글 고정'}</button>
                    <button onclick="openEditModal('${post.firebaseKey}')">수정</button>
                    <button style="color:#ff8b8b;" onclick="deletePost('${post.firebaseKey}')">삭제</button>
                ` : ''}
            </div>
        `;
        feed.appendChild(card);
    });

    // 페이징 컨트롤 제어 바 렌더링 호출
    renderPaginationControls(totalPages);
}

// 🧩 요구사항: 5개씩 묶여 나오도록 동적 페이지네이션 바 처리 함수
function renderPaginationControls(totalPages) {
    const container = document.getElementById('pagination-control');
    container.innerHTML = "";

    // 현재 페이지 위치 기반으로 시작 그룹과 끝 그룹 계산 (5단위 블록 연산)
    const currentBlock = Math.ceil(currentPage / maxNavPages);
    const startPage = (currentBlock - 1) * maxNavPages + 1;
    let endPage = startPage + maxNavPages - 1;
    if (endPage > totalPages) endPage = totalPages;

    // 이전 페이지 블록 버튼 (◀)
    const prevBtn = document.createElement('button');
    prevBtn.className = 'page-arrow';
    prevBtn.innerText = '‹';
    prevBtn.disabled = currentPage === 1;
    prevBtn.onclick = () => changePage(currentPage - 1);
    container.appendChild(prevBtn);

    // 순차적 숫자 버튼 표출 (최대 5개 노출)
    for (let i = startPage; i <= endPage; i++) {
        const numBtn = document.createElement('button');
        numBtn.className = `page-num-btn ${i === currentPage ? 'active' : ''}`;
        numBtn.innerText = i;
        numBtn.onclick = () => changePage(i);
        container.appendChild(numBtn);
    }

    // 다음 페이지 블록 버튼 (▶)
    const nextBtn = document.createElement('button');
    nextBtn.className = 'page-arrow';
    nextBtn.innerText = '›';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.onclick = () => changePage(currentPage + 1);
    container.appendChild(nextBtn);
}

function changePage(page) {
    currentPage = page;
    renderPosts();
}

// 정렬 설정 제어
function changeSort(type) {
    currentSort = type;
    document.getElementById('sort-latest').classList.toggle('active', type === 'latest');
    document.getElementById('sort-oldest').classList.toggle('active', type === 'oldest');
    currentPage = 1;
    renderPosts();
}

// 초기화 버튼 가동
function resetFilters() {
    document.getElementById('search-title').value = "";
    document.getElementById('filter-fav').value = "all";
    changeSort('latest');
}

// 모달창 여닫기 모듈
function openModal(id) {
    if (id === 'writeModal') {
        if (!editingPostId && !replyingPostId) {
            document.getElementById('write-modal-title').innerText = isAdminMode ? "관리자 권한 글 작성" : "나의 우주에게 편지 쓰기";
            document.getElementById('post-author').value = isAdminMode ? currentAdminName : "";
            document.getElementById('post-author').disabled = isAdminMode;
            document.getElementById('post-title').value = "";
            document.getElementById('post-content').value = "";
        }
    }
    document.getElementById(id).classList.add('active');
}

function closeModal(id) {
    document.getElementById(id).classList.remove('active');
    if (id === 'adminAuthModal') document.getElementById('admin-password-input').value = "";
    if (id === 'writeModal') {
        editingPostId = null;
        replyingPostId = null;
    }
}

// 관리자 패스워드 검증
function checkAdminPassword() {
    const pw = document.getElementById('admin-password-input').value;
    if (pw === 'haeunashi0416!') {
        closeModal('adminAuthModal');
        openModal('adminNameModal');
    } else {
        alert("비밀번호가 일치하지 않습니다 우주인님.");
    }
}

// 관리자 닉네임 로컬 연동 선언 완료
function saveAdminProfile() {
    const nameInput = document.getElementById('admin-name-input').value.trim();
    currentAdminName = nameInput ? nameInput : "관리자";
    isAdminMode = true;
    
    closeModal('adminNameModal');
    alert(`인증 성공! 이제부터 모든 글은 '${currentAdminName}' 명의로 제어가 가능합니다.`);
    
    document.querySelector('.admin-entry-btn').innerText = `관리자 모드 활성화 중 (${currentAdminName})`;
    renderPosts();
}

// 📡 Firebase 연동 기능: 즐겨찾기 상태 실시간 DB 업데이트
function toggleFavorite(firebaseKey, currentStatus, e) {
    e.stopPropagation();
    database.ref(`posts/${firebaseKey}`).update({
        isFavorite: !currentStatus
    });
}

// 📡 Firebase 연동 기능: 데이터 전송 및 수정 기능 처리부
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
        // [수정] DB 전송 처리
        database.ref(`posts/${editingPostId}`).update({
            title: title,
            content: content
        }).then(() => {
            closeModal('writeModal');
        });
    } else if (replyingPostId) {
        // [답장하기] 원본 객체 조회 후 DB 밀어넣기
        const target = posts.find(p => p.firebaseKey === replyingPostId);
        const replyTitle = title.startsWith("Re:") ? title : `Re: ${title}`;
        
        database.ref('posts').push({
            id: Date.now(),
            author: isAdminMode ? currentAdminName : author,
            title: replyTitle,
            content: `[원문 대댓글 대상: ${target.author}님의 글]\n\n${content}`,
            date: today,
            isPinned: false,
            isFavorite: false
        }).then(() => {
            closeModal('writeModal');
        });
    } else {
        // [신규 편지] DB 추가
        database.ref('posts').push({
            id: Date.now(),
            author: author,
            title: title,
            content: content,
            date: today,
            isPinned: isAdminMode,
            isFavorite: false
        }).then(() => {
            closeModal('writeModal');
        });
    }
}

// 답장 창 활성화 바인딩
function openReplyModal(firebaseKey) {
    const target = posts.find(p => p.firebaseKey === firebaseKey);
    if (!target) return;

    replyingPostId = firebaseKey;
    openModal('writeModal');
    document.getElementById('write-modal-title').innerText = `'${target.author}' 님에게 답장 전송`;
    document.getElementById('post-title').value = `Re: ${target.title}`;
    document.getElementById('post-content').value = "";
}

// 📡 Firebase 연동 기능: 관리자 전용 글 고정 토글
function togglePin(firebaseKey, currentStatus) {
    database.ref(`posts/${firebaseKey}`).update({
        isPinned: !currentStatus
    });
}

// 📡 Firebase 연동 기능: 관리자 전용 수정 셋업 호출
function openEditModal(firebaseKey) {
    const post = posts.find(p => p.firebaseKey === firebaseKey);
    if (!post) return;

    editingPostId = firebaseKey;
    openModal('writeModal');
    document.getElementById('write-modal-title').innerText = "기록 수정하기";
    document.getElementById('post-author').value = post.author;
    document.getElementById('post-author').disabled = true;
    document.getElementById('post-title').value = post.title;
    document.getElementById('post-content').value = post.content;
}

// 📡 Firebase 연동 기능: 관리자 전용 원격 데이터 영구 파괴
function deletePost(firebaseKey) {
    if (confirm("이 기록을 우주에서 영구히 삭제할까요?")) {
        database.ref(`posts/${firebaseKey}`).remove();
    }
}

// 💡 제목 클릭 시 연노랑 빛무리 별 쏟아내기 이스터에그 로직
function triggerUniverseEasterEgg() {
    const messageBox = document.getElementById('easter-message');
    messageBox.innerText = "✨ 너는 나만의 소중한 우주야 ✨";
    messageBox.classList.add('active');
    
    setTimeout(() => {
        messageBox.classList.remove('active');
    }, 2500);

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
            
            star.addEventListener('animationend', () => {
                star.remove();
            });
        }, i * 40);
    }
}
