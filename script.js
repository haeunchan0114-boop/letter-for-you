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
let publicPosts = [];      // 'posts' 노드의 데이터
let globalLetters = [];    // 'global_letters' 노드의 데이터
let displayPosts = [];     // 화면에 최종 출력될 배열

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

// 📡 Firebase 동시 멀티 리스닝 가동
function listenToFirebase() {
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

    database.ref('global_letters').on('value', (snapshot) => {
        const data = snapshot.val();
        globalLetters = [];
        if (data) {
            for (let key in data) {
                globalLetters.push({
                    firebaseKey: key,
                    nodeType: 'global_letters',
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
}

// 🧩 권한별 데이터 결합 및 UI 버튼 제어 스위칭
function mergeAndRender() {
    const userWriteBtn = document.getElementById('user-write-btn');
    const adminWriteBtn = document.getElementById('admin-write-btn');

    if (isAdminMode) {
        // 관리자 모드: 수신 편지함 데이터까지 결합 노출
        displayPosts = [...publicPosts, ...globalLetters];
        document.getElementById('mailbox-status-title').innerText = `🔒 관리자 전용 비밀 우체통 (전체보기 중)`;
        
        // 💡 [요구사항] 하은이에게 편지쓰기를 숨기고 관리자용 글쓰기 버튼 활성화
        userWriteBtn.style.display = 'none';
        adminWriteBtn.style.display = 'block';
    } else {
        // 일반 사용자 모드
        displayPosts = [...publicPosts];
        document.getElementById('mailbox-status-title').innerText = `🌌 별빛 우체통`;
        
        userWriteBtn.style.display = 'block';
        adminWriteBtn.style.display = 'none';
    }
    renderPosts();
}

// 화면 렌더링 출력부
function renderPosts() {
    const feed = document.getElementById('posts-mailbox-feed');
    feed.innerHTML = "";

    const searchTitleVal = document.getElementById('search-title').value.toLowerCase();

    // 제목 필터링
    let filtered = displayPosts.filter(post => {
        return post.title.toLowerCase().includes(searchTitleVal);
    });

    // 정렬 (고정글 상단 우선)
    filtered.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        
        if (currentSort === 'latest') {
            return new Date(b.date) - new Date(a.date) || b.id - a.id;
        } else {
            return new Date(a.date) - new Date(b.date) || a.id - b.id;
        }
    });

    // 페이징 연산
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

    // 카드 생성 루프
    pagePosts.forEach(post => {
        const card = document.createElement('div');
        card.className = `post-card ${post.isPinned ? 'pinned' : ''} ${post.nodeType === 'global_letters' ? 'secret-type' : ''}`;
        
        card.innerHTML = `
            <div class="post-meta">
                <div class="meta-info">
                    ${post.isPinned ? '<span class="pin-tag">📌 고정됨</span> | ' : ''}
                    ${post.nodeType === 'global_letters' ? '<span class="secret-tag">✉️ 수신 편지</span> | ' : ''}
                    <span>${post.author}</span> | <span>${post.date}</span>
                </div>
                <button class="fav-btn ${post.isFavorite ? 'active' : ''}" onclick="toggleFavorite('${post.nodeType}', '${post.firebaseKey}', ${post.isFavorite}, event)">★</button>
            </div>
            <h2 class="post-title">${post.title}</h2>
            <div class="post-content">${post.content}</div>
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

// 하단 페이지네이션 바
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

// 모달 오픈 핸들러 최적화
function openModal(id) {
    if (id === 'writeModal') {
        if (!editingPostId && !replyingPostId) {
            // 💡 관리자 유무에 따라 모달 양식을 유연하게 전환
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
    alert(`인증 성공! 관리자 글쓰기 모드로 전환합니다.`);
    
    document.querySelector('.admin-entry-btn').innerText = `관리자 모드 (${currentAdminName})`;
    mergeAndRender();
}

function toggleFavorite(nodeType, firebaseKey, currentStatus, e) {
    e.stopPropagation();
    database.ref(`${nodeType}/${firebaseKey}`).update({
        isFavorite: !currentStatus
    });
}

// 📡 Firebase 쓰기 엔진 최종 연산 함수
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
        database.ref(`${editingTargetNode}/${editingPostId}`).update({
            title: title,
            content: content
        }).then(() => closeModal('writeModal'));
        
    } else if (replyingPostId) {
        // 관리자의 답장은 누구나 볼 수 있는 피드인 'posts'에 축적됩니다.
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
        // [💡 신규 작성 저장 로직 분기]
        // 관리자가 쓸 땐 전역 공지 피드인 'posts', 일반 유저가 쓸 땐 밀실 비밀함인 'global_letters'
        const targetNode = isAdminMode ? 'posts' : 'global_letters';
        
        database.ref(targetNode).push({
            id: Date.now(),
            author: author,
            title: title,
            content: content,
            date: today,
            isPinned: isAdminMode, 
            isFavorite: false
        }).then(() => closeModal('writeModal'));
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
        database.ref(`${nodeType}/${firebaseKey}`).remove();
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
