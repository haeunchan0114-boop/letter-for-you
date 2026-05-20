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
let publicPosts = [];      // 'posts' 노드의 데이터 (메인 피드용 글)
let globalLetters = [];    // 'global_letters' 노드의 데이터 (독립 우체통 창 전용 편지)
let displayPosts = [];     // 메인 피드 화면에 최종 출력될 배열
let unlockedPostIds = [];  // 사용자가 비밀번호를 입력해 잠금 해제한 글 ID 배열

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
    // 1. 피드용 posts 추적
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
                    isFavorite: data[key].isFavorite || false,
                    postPassword: data[key].postPassword || "" 
                });
            }
        }
        mergeAndRender();
    });

    // 2. global_letters 데이터 파싱
    database.ref('global_letters').on('value', (snapshot) => {
        const data = snapshot.val();
        globalLetters = [];
        if (data) {
            for (let key in data) {
                globalLetters.push({
                    firebaseKey: key,
                    nodeType: 'global_letters',
                    id: data[key].id || Date.now(),
                    author: data[key].writer || "익명",  
                    title: data[key].title || "별빛 편지",
                    content: data[key].text || "",       
                    date: data[key].date || "",         
                    isPinned: data[key].isPinned || false,
                    isFavorite: data[key].isFavorite || false
                });
            }
        }
        if (document.getElementById('secretMailboxModal').classList.contains('active')) {
            renderSecretMailboxWindow();
        }
    });
}

// 🧩 데이터 통합 및 관리자 인터페이스 분리 구조
function mergeAndRender() {
    const userWriteBtn = document.getElementById('user-write-btn');
    const adminWriteBtn = document.getElementById('admin-write-btn');
    const secretMailIcon = document.getElementById('secret-mailbox-icon');
    const passwordInput = document.getElementById('post-password');
    const noticeZone = document.getElementById('admin-notice-zone');

    document.getElementById('mailbox-status-title').innerText = `🌌 별빛 우체통`;

    displayPosts = [...publicPosts];

    if (isAdminMode) {
        userWriteBtn.style.display = 'none';
        adminWriteBtn.style.display = 'block';
        secretMailIcon.style.display = 'inline-flex'; 
        passwordInput.style.display = 'block'; 
        noticeZone.style.display = 'flex'; // 💡 관리자 모드일 때 공지 설정 체크박스 활성화
    } else {
        userWriteBtn.style.display = 'block';
        adminWriteBtn.style.display = 'none';
        secretMailIcon.style.display = 'none';
        passwordInput.style.display = 'none';  
        noticeZone.style.display = 'none';  // 일반 유저에겐 숨김
    }
    renderPosts();
}

// 📬 📨 우체통 아이콘 클릭 시 전용 독립 창 모달 팝업 열기
function toggleSecretLetters() {
    openModal('secretMailboxModal');
    renderSecretMailboxWindow();
}

// 💡 독립 우체통 창 렌더러
function renderSecretMailboxWindow() {
    const container = document.getElementById('secret-letters-container');
    container.innerHTML = "";

    if (globalLetters.length === 0) {
        container.innerHTML = `<div style="text-align:center; padding:40px; color:rgba(255,255,255,0.3); font-size:0.85rem;">별빛 우체통에 도착한 편지가 없습니다.</div>`;
        return;
    }

    const sortedLetters = [...globalLetters].sort((a, b) => new Date(b.date) - new Date(a.date) || b.id - a.id);

    sortedLetters.forEach(letter => {
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

// 메인 화면 피드 렌더링 출력부
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
        feed.innerHTML = `<div style="text-align:center; padding:40px; color:rgba(255,255,255,0.3); font-size:0.9rem;">우체통이 조용합니다. 일치하는 글이 없습니다.</div>`;
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
        
        // 비밀번호 처리 로직
        const isLocked = post.postPassword && !isAdminMode && !unlockedPostIds.includes(post.firebaseKey);
        
        let displayContent = "";
        if (isLocked) {
            displayContent = `
                <div class="locked-zone" style="text-align:center; padding:15px; background:rgba(0,0,0,0.2); border-radius:10px; margin:10px 0;">
                    <p style="color:rgba(255,255,255,0.5); font-size:0.9rem; margin-bottom:10px;">🔒 비밀번호로 보호된 기록입니다.</p>
                    <div style="display:flex; gap:5px; justify-content:center;">
                        <input type="password" id="unlock-pw-${post.firebaseKey}" placeholder="비밀번호 입력" style="padding:4px 8px; border-radius:6px; border:1px solid rgba(255,255,255,0.2); background:rgba(255,255,255,0.05); color:#fff; font-size:0.8rem; width:120px;">
                        <button onclick="unlockPost('${post.firebaseKey}', '${post.postPassword}')" style="padding:4px 10px; background:#FFE6BA; border:none; border-radius:6px; color:#0d0e2d; font-size:0.8rem; cursor:pointer; font-weight:bold;">해제</button>
                    </div>
                </div>
            `;
        } else {
            displayContent = `<div class="post-content">${post.content}</div>`;
        }

        card.innerHTML = `
            <div class="post-meta">
                <div class="meta-info">
                    ${post.isPinned ? '<span class="pin-tag">📌 고정됨(공지)</span> | ' : ''}
                    <span>작성자: ${post.author}</span>
                    ${post.postPassword ? ' <span style="font-size:0.8rem; color:#8A99AD;">🔒 잠금설정됨</span>' : ''}
                </div>
                <button class="fav-btn ${post.isFavorite ? 'active' : ''}" onclick="toggleFavorite('${post.nodeType}', '${post.firebaseKey}', ${post.isFavorite}, event)">★</button>
            </div>
            <h2 class="post-title">${post.title}</h2>
            
            ${displayContent}
            
            <div class="post-center-date">— ${formattedDate} —</div>
            
            <div class="card-actions">
                <button class="reply-btn" onclick="openReplyModal('${post.nodeType}', '${post.firebaseKey}')" ${isLocked ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ''}>답장 보내기</button>
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

// 사용자가 입력한 비번 검증 후 본문 열어주는 함수
function unlockPost(firebaseKey, correctPassword) {
    const inputVal = document.getElementById(`unlock-pw-${firebaseKey}`).value;
    if (inputVal === correctPassword) {
        unlockedPostIds.push(firebaseKey); 
        renderPosts(); 
    } else {
        alert("비밀번호가 일치하지 않습니다.");
    }
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
            document.getElementById('write-modal-title').innerText = isAdminMode ? "빛의 기록 기록하기" : "나의 우주에게 편지 쓰기";
            document.getElementById('post-author').value = isAdminMode ? currentAdminName : "";
            document.getElementById('post-author').disabled = isAdminMode;
            document.getElementById('post-title').value = "";
            document.getElementById('post-content').value = "";
            document.getElementById('post-password').value = ""; 
            document.getElementById('post-is-pinned').checked = false; // 💡 기본 베이스는 공지 미체크 상태!
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
        alert("비밀번호가 일치하지 않습니다.");
    }
}

function saveAdminProfile() {
    const nameInput = document.getElementById('admin-name-input').value.trim();
    currentAdminName = nameInput ? nameInput : "관리자";
    isAdminMode = true;
    
    closeModal('adminNameModal');
    alert(`어서와~! 편지지 아이콘을 누르면 도착한 편지를 읽을 수 있어~!`);
    
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
    const postPassword = document.getElementById('post-password').value.trim(); 
    const isPinned = document.getElementById('post-is-pinned').checked; // 💡 체크박스 상태 수집

    if(!title || !content) {
        alert("제목과 내용을 모두 기입해주세요.");
        return;
    }

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
            updateData.postPassword = postPassword; 
            updateData.isPinned = isPinned; // 수정 시 공지 상태도 반영
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
            isFavorite: false,
            postPassword: "" 
        }).then(() => closeModal('writeModal'));
        
    } else {
        if (isAdminMode) {
            database.ref('posts').push({
                id: Date.now(),
                author: author,
                title: title,
                content: content,
                date: today,
                isPinned: isPinned, // 💡 관리자가 체크한 상태값 그대로 저장 (미체크면 false)
                isFavorite: false,
                postPassword: postPassword 
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
    document.getElementById('write-modal-title').innerText = "빛의 기록 수정하기";
    document.getElementById('post-author').value = post.author;
    document.getElementById('post-author').disabled = true;
    document.getElementById('post-title').value = post.title;
    document.getElementById('post-content').value = post.content;
    if(nodeType === 'posts') {
        document.getElementById('post-password').value = post.postPassword || "";
        document.getElementById('post-is-pinned').checked = post.isPinned || false; // 기존 공지 상태 로드
    }
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
