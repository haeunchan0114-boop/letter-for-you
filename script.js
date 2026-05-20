// 📡 Firebase 리얼타임 데이터베이스 설정
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

// Firebase 초기화
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// 상태 제어 변수들
let publicPosts = [];      // 'posts' 노드의 데이터 (메인 피드용 공지글)
let globalLetters = [];    // 'global_letters' 노드의 데이터 (독립 우체통 창 전용 편지)
let displayPosts = [];     // 메인 피드 화면에 최종 출력될 배열

let currentSort = 'latest';
let isAdminMode = false;
let currentAdminName = "";
let editingPostId = null;
let replyingPostId = null;
let editingTargetNode = 'posts'; 

// 페이징 설정 규칙 (3개 단위 절삭, 인덱스 최대 5개 제한)
let currentPage = 1;
const postsPerPage = 3;
const maxNavPages = 5;

window.onload = function() {
    listenToFirebase();
};

// 📡 Firebase 실시간 리스너 작동부
function listenToFirebase() {
    // 1. 공지 피드용 posts 추적
    database.ref('posts').on('value', (snapshot) => {
        const data = snapshot.val();
        publicPosts = [];
        if (data) {
            for (let key in data) {
                publicPosts.push({
                    firebaseKey: key,
                    nodeType: 'posts',
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
        mergeAndRender();
    });

    // 2. global_letters 데이터 파싱 (writer -> author, text -> content 완벽 매핑)
    database.ref('global_letters').on('value', (snapshot) => {
        const data = snapshot.val();
        globalLetters = [];
        if (data) {
            for (let key in data) {
                globalLetters.push({
                    firebaseKey: key,
                    nodeType: 'global_letters',
                    id: data[key].id || Date.now(),
                    author: data[key].writer || "익명",  // writer 매핑
                    title: data[key].title || "비밀 편지 조각",
                    content: data[key].text || "",       // text 매핑
                    date: data[key].date || "",         
                    isPinned: data[key].isPinned || false,
                    isFavorite: data[key].isFavorite || false
                });
            }
        }
        // 💡 따로 열려있는 독립 팝업 창이 켜져 있는 상태라면 실시간으로 리스트를 자동 갱신해 줍니다.
        if (document.getElementById('secretMailboxModal').classList.contains('active')) {
            renderSecretMailboxWindow();
        }
    });
}

// 🧩 데이터 통합 및 관리자 인터페이스 분리 구조 (메인 화면 피드 제어)
function mergeAndRender() {
    const userWriteBtn = document.getElementById('user-write-btn');
    const adminWriteBtn = document.getElementById('admin-write-btn');
    const secretMailIcon = document.getElementById('secret-mailbox-icon');

    document.getElementById('mailbox-status-title').innerText = `🌌 별빛 우체통`;

    // 💡 이제 메인 피드에는 관리자 모드 여부와 관계없이 순수 공지글(posts 노드)만 깔끔히 로드됩니다.
    displayPosts = [...publicPosts];

    if (isAdminMode) {
        userWriteBtn.style.display = 'none';
        adminWriteBtn.style.display = 'block';
        secretMailIcon.style.display = 'inline-flex'; // 📨 아이콘 버튼 활성화
    } else {
        userWriteBtn.style.display = 'block';
        adminWriteBtn.style.display = 'none';
        secretMailIcon.style.display = 'none';
    }
    renderPosts();
}

// 📬 📨 우체통 아이콘 클릭 시 전용 독립 창 모달 팝업 열기
function toggleSecretLetters() {
    openModal('secretMailboxModal');
    renderSecretMailboxWindow();
}

// 💡 [독립 렌더러 함수] 따로 열린 팝업 창 내부에 비밀 편지만 모아서 빌드하는 로직
function renderSecretMailboxWindow() {
    const container = document.getElementById('secret-letters-container');
    container.innerHTML = "";

    if (globalLetters.length === 0) {
        container.innerHTML = `<div style="text-align:center; padding:40px; color:rgba(255,255,255,0.3); font-size:0.85rem;">비밀 우체통에 도착한 편지가 없습니다.</div>`;
        return;
    }

    // 최신 비밀 편지가 상단에 오도록 정렬
    const sortedLetters = [...globalLetters].sort((a, b) => new Date(b.date) - new Date(a.date) || b.id - a.id);

    sortedLetters.forEach(letter => {
        // 💡 날짜 중간에 공백이 있거나 콜론(:)이 누락되어 있다면 자동으로 보정해 줍니다.
        let formattedDate = letter.date ? letter.date.trim() : "";
        if (/\d{4}-\d{2}-\d{2}\s\d{2}\s\d{2}/.test(formattedDate)) {
            const parts = formattedDate.split(/\s+/);
            if(parts.length >= 3) {
                formattedDate = `${parts[0]} ${parts[1]}:${parts[2]}`;
            }
        }

        const miniCard = document.createElement('div');
        miniCard.className = 'secret-mini-card';
        miniCard.innerHTML = `
            <div class="mini-meta">
                <span>✉️ 보낸 사람: <b>${letter.author}</b></span>
                <button style="background:none; border:none; color:${letter.isFavorite ? '#FFE6BA' : 'rgba(255,255,255,0.2)'}; cursor:pointer;" onclick="toggleFavorite('${letter.nodeType}', '${letter.firebaseKey}', ${letter.isFavorite}, event)">★</button>
            </div>
            <div class="mini-title">${letter.title}</div>
            <div class="mini-content">${letter.content}</div>
            
            <div class="mini-center-date">— ${formattedDate} —</div>
            
            <div class="mini-actions">
                <button onclick="openReplyModal('${letter.nodeType}', '${letter.firebaseKey}')">답장</button>
                <button onclick="openEditModal('${letter.nodeType}', '${letter.firebaseKey}')">수정</button>
                <button style="color:#ff8b8b;" onclick="deletePost('${letter.nodeType}', '${letter.firebaseKey}')">삭제</button>
            </div>
        `;
        container.appendChild(miniCard);
    });
}

// 메인 화면 피드 렌더링 출력부 (공지 및 작성글 표시 전용)
function renderPosts() {
    const feed = document.getElementById('posts-mailbox-feed');
    feed.innerHTML = "";

    const searchTitleVal = document.getElementById('search-title').value.toLowerCase();

    let filtered = displayPosts.filter(post => {
        return post.title.toLowerCase().includes(searchTitleVal);
    });

    filtered.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        
        if (currentSort === 'latest') {
            return new Date(b.date) - new Date(a.date) || b.id - a.id;
        } else {
            return new Date(a.date) - new Date(b.date) || a.id - b.id;
        }
    });

    const totalPosts = filtered.length;
    const totalPages = Math.ceil(totalPosts / postsPerPage) || 1;
    if (currentPage > totalPages) currentPage = totalPages;

    const startIndex = (currentPage - 1) * postsPerPage;
    const endIndex = startIndex + postsPerPage;
    const pagePosts = filtered.slice(startIndex, endIndex);

    if(pagePosts.length === 0) {
        feed.innerHTML = `<div style="text-align:center; padding:40px; color:rgba(255,255,255,0.3); font-size:0.9rem;">우체통이 고요합니다. 일치하는 공지글이 없습니다.</div>`;
        renderPaginationControls(totalPages);
        return;
    }

    pagePosts.forEach(post => {
        let formattedDate = post.date ? post.date.trim() : "";
        if (/\d{4}-\d{2}-\d{2}\s\d{2}\s\d{2}/.test(formattedDate)) {
            const parts = formattedDate.split(/\s+/);
            if(parts.length >= 3) {
                formattedDate = `${parts[0]} ${parts[1]}:${parts[2]}`;
            }
        }

        const card = document.createElement('div');
        card.className = `post-card ${post.isPinned ? 'pinned' : ''}`;
        
        card.innerHTML = `
            <div class="post-meta">
                <div class="meta-info">
                    ${post.isPinned ? '<span class="pin-tag">📌 고정됨</span> | ' : ''}
                    <span>작성자: ${post.author}</span>
                </div>
                <button class="fav-btn ${post.isFavorite ? 'active' : ''}" onclick="toggleFavorite('${post.nodeType}', '${post.firebaseKey}', ${post.isFavorite}, event)">★</button>
            </div>
            <h2 class="post-title">${post.title}</h2>
            <div class="post-content">${post.content}</div>
            
            <div class="post-center-date">— ${formattedDate} —</div>
            
            <div class="card-actions">
                <button class="reply-btn" onclick="openReplyModal('${post.nodeType}', '${post.firebaseKey}')">답장 보내기</button>
                ${isAdminMode ? `
                    <button onclick="togglePin('${post.nodeType}', '${post.firebaseKey}', ${post.isPinned})">${post.isPinned ? '고정 해제' : '글 고정'}</button>
                    <button onclick="openEditModal('${post.nodeType}', '${post.firebaseKey}')">수정</button>
                    <button style="color:#ff8b8b;" onclick="deletePost('${post.nodeType}', '${post.firebaseKey}')">삭제</button>
                ` : ''}
            </div>
        `;
        feed.appendChild(card);
    });

    renderPaginationControls(totalPages);
}

// 하단 페이지네이션 바 제어
function renderPaginationControls(totalPages) {
    const container = document.getElementById('pagination-control');
    container.innerHTML = "";

    const currentBlock = Math.ceil(currentPage / maxNavPages);
    const startPage = (currentBlock - 1) * maxNavPages + 1;
    let endPage = startPage + maxNavPages - 1;
    if (endPage > totalPages) endPage = totalPages;

    const prevBtn = document.createElement('button');
    prevBtn.className = 'page-arrow';
    prevBtn.innerText = '‹';
    prevBtn.disabled = currentPage === 1;
    prevBtn.onclick = () => changePage(currentPage - 1);
    container.appendChild(prevBtn);

    for (let i = startPage; i <= endPage; i++) {
        const numBtn = document.createElement('button');
        numBtn.className = `page-num-btn ${i === currentPage ? 'active' : ''}`;
        numBtn.innerText = i;
        numBtn.onclick = () => changePage(i);
        container.appendChild(numBtn);
    }

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

function changeSort(type) {
    currentSort = type;
    document.getElementById('sort-latest').classList.toggle('active', type === 'latest');
    document.getElementById('sort-oldest').classList.toggle('active', type === 'oldest');
    currentPage = 1;
    renderPosts();
}

function resetFilters() {
    document.getElementById('search-title').value = "";
    changeSort('latest');
}

function openModal(id) {
    if (id === 'writeModal') {
        if (!editingPostId && !replyingPostId) {
            document.getElementById('write-modal-title').innerText = isAdminMode ? "✍️ 관리자 우주 조각 기록하기" : "나의 우주에게 편지 쓰기";
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

function checkAdminPassword() {
    const pw = document.getElementById('admin-password-input').value;
    if (pw === 'haeunashi0416!') {
        closeModal('adminAuthModal');
        openModal('adminNameModal');
    } else {
        alert("비밀번호가 일치하지 않습니다 우주인님.");
    }
}

function saveAdminProfile() {
    const nameInput = document.getElementById('admin-name-input').value.trim();
    currentAdminName = nameInput ? nameInput : "관리자";
    isAdminMode = true;
    
    closeModal('adminNameModal');
    alert(`인증 성공! 우측 상단 단색 우체통 아이콘(📨)을 누르면 별도의 독립 창에서 수신 편지들을 열람할 수 있습니다.`);
    
    document.querySelector('.admin-entry-btn').innerText = `관리자 모드 (${currentAdminName})`;
    mergeAndRender();
}

function toggleFavorite(nodeType, firebaseKey, currentStatus, e) {
    e.stopPropagation();
    database.ref(`${nodeType}/${firebaseKey}`).update({
        isFavorite: !currentStatus
    });
}

// 📡 파이어베이스에 작성 글 업로드 세션
function submitPost() {
    const author = document.getElementById('post-author').value.trim() || "익명의 우주";
    const title = document.getElementById('post-title').value.trim();
    const content = document.getElementById('post-content').value.trim();

    if(!title || !content) {
        alert("제목과 내용을 모두 기입해주세요.");
        return;
    }

    // 💡 신규 작성 시 현재 날짜를 처음부터 ":" 콜론이 확실하게 부착된 완벽한 포맷으로 제작합니다.
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const today = `${year}-${month}-${day} ${hours}:${minutes}`;

    if (editingPostId) {
        const updateData = {};
        if (editingTargetNode === 'global_letters') {
            updateData.title = title;
            updateData.text = content; 
        } else {
            updateData.title = title;
            updateData.content = content;
        }
        database.ref(`${editingTargetNode}/${editingPostId}`).update(updateData).then(() => {
            closeModal('writeModal');
            if(editingTargetNode === 'global_letters') renderSecretMailboxWindow();
        });
        
    } else if (replyingPostId) {
        database.ref('posts').push({
            id: Date.now(),
            author: currentAdminName || "관리자",
            title: title.startsWith("Re:") ? title : `Re: ${title}`,
            content: content,
            date: today,
            isPinned: false,
            isFavorite: false
        }).then(() => closeModal('writeModal'));
        
    } else {
        if (isAdminMode) {
            database.ref('posts').push({
                id: Date.now(),
                author: author,
                title: title,
                content: content,
                date: today,
                isPinned: true, 
                isFavorite: false
            }).then(() => closeModal('writeModal'));
        } else {
            database.ref('global_letters').push({
                id: Date.now(),
                writer: author,
                title: title,
                text: content,
                date: today,
                isPinned: false,
                isFavorite: false
            }).then(() => closeModal('writeModal'));
        }
    }
}

function openReplyModal(nodeType, firebaseKey) {
    const pool = nodeType === 'posts' ? publicPosts : globalLetters;
    const target = pool.find(p => p.firebaseKey === firebaseKey);
    if (!target) return;

    replyingPostId = firebaseKey;
    openModal('writeModal');
    document.getElementById('write-modal-title').innerText = `'${target.author}' 님에게 답장 전송`;
    document.getElementById('post-title').value = `Re: ${target.title}`;
    document.getElementById('post-content').value = "";
}

function togglePin(nodeType, firebaseKey, currentStatus) {
    database.ref(`${nodeType}/${firebaseKey}`).update({
        isPinned: !currentStatus
    });
}

function openEditModal(nodeType, firebaseKey) {
    const pool = nodeType === 'posts' ? publicPosts : globalLetters;
    const post = pool.find(p => p.firebaseKey === firebaseKey);
    if (!post) return;

    editingPostId = firebaseKey;
    editingTargetNode = nodeType;
    
    openModal('writeModal');
    document.getElementById('write-modal-title').innerText = "기록 수정하기";
    document.getElementById('post-author').value = post.author;
    document.getElementById('post-author').disabled = true;
    document.getElementById('post-title').value = post.title;
    document.getElementById('post-content').value = post.content;
}

function deletePost(nodeType, firebaseKey) {
    if (confirm("이 기록을 우주에서 영구히 삭제할까요?")) {
        database.ref(`${nodeType}/${firebaseKey}`).remove().then(() => {
            if(nodeType === 'global_letters') renderSecretMailboxWindow();
        });
    }
}

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
