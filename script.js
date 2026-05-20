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
let publicPosts = [];      
let globalLetters = [];    
let displayPosts = [];     
let unlockedPostIds = [];  

let currentSort = 'latest';
let currentSecretTab = 'all'; 
let isAdminMode = false;
let currentAdminName = "";
let editingPostId = null;
let replyingPostId = null;
let editingTargetNode = 'posts'; 

// 페이징 설정 규칙 (3개 단위 절삭)
let currentPage = 1;
const postsPerPage = 3;
const maxNavPages = 5;

window.onload = function() {
    initBackgroundStars(); // ✨ 배경에 무수한 아기 별 대량 배치
    listenToFirebase();
    startDynamicShootingStars(); // 🌠 변화된 새로운 별똥별 디자인 엔진 작동
};

// 📡 Firebase 실시간 리스너 작동부
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
                    isMainNotice: data[key].isMainNotice || false, 
                    pinnedAt: data[key].pinnedAt || 0,
                    isFavorite: data[key].isFavorite || false,
                    postPassword: data[key].postPassword || "" 
                });
            }
        }
        mergeAndRender();
        if (document.getElementById('noticeMailboxModal') && document.getElementById('noticeMailboxModal').classList.contains('active')) {
            renderNoticeMailboxWindow();
        }
        if (document.getElementById('recentMailboxModal') && document.getElementById('recentMailboxModal').classList.contains('active')) {
            renderRecentLettersWindow();
        }
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
                    author: data[key].writer || "익명",  
                    title: data[key].title || "별빛 편지",
                    content: data[key].text || "",       
                    date: data[key].date || "",         
                    isPinned: data[key].isPinned || false,
                    isMainNotice: false,
                    pinnedAt: data[key].pinnedAt || 0,
                    isFavorite: data[key].isFavorite || false
                });
            }
        }
        if (document.getElementById('secretMailboxModal').classList.contains('active')) {
            renderSecretMailboxWindow();
        }
        if (document.getElementById('recentMailboxModal') && document.getElementById('recentMailboxModal').classList.contains('active')) {
            renderRecentLettersWindow();
        }
    });
}

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
        noticeZone.style.display = 'flex'; 
    } else {
        userWriteBtn.style.display = 'block';
        adminWriteBtn.style.display = 'none';
        secretMailIcon.style.display = 'none';
        passwordInput.style.display = 'none';  
        noticeZone.style.display = 'none';  
    }
    renderPosts();
}

function toggleSecretLetters() {
    currentSecretTab = 'all'; 
    openModal('secretMailboxModal');
    renderSecretMailboxWindow();
}

function changeSecretTab(tab) {
    currentSecretTab = tab;
    document.getElementById('secret-tab-all').classList.toggle('active', tab === 'all');
    document.getElementById('secret-tab-fav').classList.toggle('active', tab === 'fav');
    renderSecretMailboxWindow();
}

function renderSecretMailboxWindow() {
    const container = document.getElementById('secret-letters-container');
    container.innerHTML = "";

    let targetLetters = [...globalLetters];
    if (currentSecretTab === 'fav') {
        targetLetters = targetLetters.filter(letter => letter.isFavorite);
    }

    if (targetLetters.length === 0) {
        if (currentSecretTab === 'fav') {
            container.innerHTML = `<div style="text-align:center; padding:60px 20px; color:#ffe6ba; font-size:1rem; font-weight:bold;">특별한 빛이 없어!</div>`;
        } else {
            container.innerHTML = `<div style="text-align:center; padding:40px; color:rgba(255,255,255,0.3); font-size:0.85rem;">비밀 우체통에 도착한 편지가 없습니다.</div>`;
        }
        return;
    }

    const sortedLetters = targetLetters.sort((a, b) => new Date(b.date) - new Date(a.date) || b.id - a.id);

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
                <button style="background:none; border:none; font-size:1.25rem; color:${letter.isFavorite ? '#FFE6BA' : 'rgba(255,255,255,0.2)'}; cursor:pointer;" onclick="toggleFavorite('${letter.nodeType}', '${letter.firebaseKey}', ${letter.isFavorite}, event)">★</button>
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

function toggleNoticeLetters() {
    openModal('noticeMailboxModal');
    renderNoticeMailboxWindow();
}

// 📢 공지사항 전체 모아보기 독립 창 렌더러 (내부 잠금해제 포함)
function renderNoticeMailboxWindow() {
    const container = document.getElementById('notice-letters-container');
    if (!container) return;
    container.innerHTML = "";

    const noticePosts = publicPosts.filter(post => post.isPinned);

    if (noticePosts.length === 0) {
        container.innerHTML = `<div style="text-align:center; padding:40px; color:rgba(255,255,255,0.3); font-size:0.85rem;">고정된 별빛 공지사항이 없습니다.</div>`;
        return;
    }

    const sortedNotices = noticePosts.sort((a, b) => b.pinnedAt - a.pinnedAt);

    sortedNotices.forEach(post => {
        let formattedDate = post.date ? post.date.trim() : "";
        if (/\d{4}-\d{2}-\d{2}\s\d{2}\s\d{2}/.test(formattedDate)) {
            const parts = formattedDate.split(/\s+/);
            if(parts.length >= 3) {
                formattedDate = `${parts[0]} ${parts[1]}:${parts[2]}`;
            }
        }

        const isLocked = post.postPassword && !isAdminMode && !unlockedPostIds.includes(post.firebaseKey);
        let displayContent = "";

        if (isLocked) {
            displayContent = `
                <div class="locked-zone" style="text-align:center; padding:12px; background:rgba(0,0,0,0.2); border-radius:10px; margin:10px 0;">
                    <p style="color:rgba(255,255,255,0.5); font-size:0.8rem; margin-bottom:8px;">🔒 비밀번호로 보호된 공지입니다.</p>
                    <div style="display:flex; gap:5px; justify-content:center;">
                        <input type="password" id="notice-unlock-pw-${post.firebaseKey}" placeholder="비밀번호 입력" style="padding:4px 8px; border-radius:6px; border:1px solid rgba(255,255,255,0.2); background:rgba(255,255,255,0.05); color:#fff; font-size:0.8rem; width:120px; margin-bottom:0;">
                        <button onclick="unlockNoticePost('${post.firebaseKey}', '${post.postPassword}')" style="padding:4px 10px; background:#FFE6BA; border:none; border-radius:6px; color:#0d0e2d; font-size:0.8rem; cursor:pointer; font-weight:bold;">해제</button>
                    </div>
                </div>
            `;
        } else {
            displayContent = `<div class="mini-content">${post.content}</div>`;
        }

        const miniCard = document.createElement('div');
        miniCard.className = 'secret-mini-card notice-mini-card';
        miniCard.style.borderLeft = post.isMainNotice ? "3px solid #FFE6BA" : "3px solid rgba(255,255,255,0.2)";
        
        miniCard.innerHTML = `
            <div class="mini-meta" style="display:flex; justify-content:space-between; align-items:center;">
                <span>📌 공지사항 | 작성자: <b>${post.author}</b> ${post.isMainNotice ? '<b style="color:#FFE6BA; margin-left:5px;">[메인 노출중]</b>' : ''}</span>
            </div>
            <div class="mini-title" style="color:${post.isMainNotice ? '#FFE6BA' : '#fff'};">${post.title}</div>
            
            ${displayContent}
            
            <div class="mini-center-date">— ${formattedDate} —</div>
            <div class="mini-actions">
                <button onclick="openReplyModal('${post.nodeType}', '${post.firebaseKey}')" ${isLocked ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ''}>답장</button>
                ${isAdminMode ? `
                    <button onclick="toggleMainNoticeStatus('${post.firebaseKey}', ${post.isMainNotice})">
                        ${post.isMainNotice ? '메인 공지 해제' : '메인 공지 지정'}
                    </button>
                    <button onclick="togglePin('${post.nodeType}', '${post.firebaseKey}', true)">공지 해제</button>
                    <button onclick="openEditModal('${post.nodeType}', '${post.firebaseKey}')">수정</button>
                ` : ''}
            </div>
        `;
        container.appendChild(miniCard);
    });
}

function unlockNoticePost(firebaseKey, correctPassword) {
    const inputVal = document.getElementById(`notice-unlock-pw-${firebaseKey}`).value;
    if (inputVal === correctPassword) {
        unlockedPostIds.push(firebaseKey);
        renderNoticeMailboxWindow();       
        renderPosts();                     
    } else {
        alert("비밀번호가 일치하지 않습니다.");
    }
}

// 메인 게시판 피드 렌더러
function renderPosts() {
    const feed = document.getElementById('posts-mailbox-feed');
    if(!feed) return;

    const searchTitleVal = document.getElementById('search-title').value.toLowerCase();

    let filtered = displayPosts.filter(post => {
        const matchesSearch = post.title.toLowerCase().includes(searchTitleVal);
        const isNormalOrMainNotice = !post.isPinned || (post.isPinned && post.isMainNotice);
        return matchesSearch && isNormalOrMainNotice;
    });

    filtered.sort((a, b) => {
        if (a.isMainNotice && !b.isMainNotice) return -1;
        if (!a.isMainNotice && b.isMainNotice) return 1;
        
        if (a.isMainNotice && b.isMainNotice) {
            return b.pinnedAt - a.pinnedAt; 
        }
        
        const timeA = new Date(a.date).getTime() || 0;
        const timeB = new Date(b.date).getTime() || 0;
        
        if (currentSort === 'latest') {
            if (timeB !== timeA) return timeB - timeA; 
            return b.id - a.id; 
        } else {
            if (timeA !== timeB) return timeA - timeB; 
            return a.id - b.id; 
        }
    });

    const totalPosts = filtered.length;
    const totalPages = Math.ceil(totalPosts / postsPerPage) || 1;
    if (currentPage > totalPages) currentPage = totalPages;

    const startIndex = (currentPage - 1) * postsPerPage;
    const endIndex = startIndex + postsPerPage;
    const pagePosts = filtered.slice(startIndex, endIndex);

    feed.innerHTML = "";

    if(pagePosts.length === 0) {
        feed.innerHTML = `<div style="text-align:center; padding:40px; color:rgba(255,255,255,0.3); font-size:0.9rem;">우체통이 고요합니다. 일치하는 글이 없습니다.</div>`;
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
        card.className = `post-card ${post.isMainNotice ? 'pinned' : ''}`;
        
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
                    ${post.isMainNotice ? '<span class="pin-tag">📌 메인 공지사항</span> | ' : ''}
                    <span>작성자: ${post.author}</span>
                    ${post.postPassword ? ' <span style="font-size:0.8rem; color:#8A99AD;">🔒 잠금설정됨</span>' : ''}
                </div>
            </div>
            <h2 class="post-title">${post.title}</h2>
            
            ${displayContent}
            
            <div class="post-center-date">— ${formattedDate} —</div>
            
            <div class="card-actions">
                <button class="reply-btn" onclick="openReplyModal('${post.nodeType}', '${post.firebaseKey}')" ${isLocked ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ''}>답장 보내기</button>
                ${isAdminMode ? `
                    <button onclick="toggleMainNoticeStatus('${post.firebaseKey}', ${post.isMainNotice})">${post.isMainNotice ? '메인 해제' : '메인 지정'}</button>
                    <button onclick="togglePin('${post.nodeType}', '${post.firebaseKey}', ${post.isPinned})">공지 해제</button>
                    <button onclick="openEditModal('${post.nodeType}', '${post.firebaseKey}')">수정</button>
                    <button style="color:#ff8b8b;" onclick="deletePost('${post.nodeType}', '${post.firebaseKey}')">삭제</button>
                ` : ''}
            </div>
        `;
        feed.appendChild(card);
    });

    renderPaginationControls(totalPages);
}

function toggleMainNoticeStatus(firebaseKey, currentMainStatus) {
    if (!currentMainStatus) {
        const currentMainCount = publicPosts.filter(post => post.isPinned && post.isMainNotice).length;
        if (currentMainCount >= 3) {
            alert("화면에 메인 공지가 다 찼어! 더 이상 지정할 수 없습니다.");
            return;
        }
    }
    database.ref(`posts/${firebaseKey}`).update({
        isMainNotice: !currentMainStatus
    });
}

function unlockPost(firebaseKey, correctPassword) {
    const inputVal = document.getElementById(`unlock-pw-${firebaseKey}`).value;
    if (inputVal === correctPassword) {
        unlockedPostIds.push(firebaseKey); 
        renderPosts(); 
        if (document.getElementById('noticeMailboxModal').classList.contains('active')) renderNoticeMailboxWindow();
    } else {
        alert("비밀번호가 일치하지 않습니다.");
    }
}

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
            document.getElementById('write-modal-title').innerText = isAdminMode ? "별빛 기록 기록하기" : "하은이에게 편지 쓰기";
            document.getElementById('post-author').value = isAdminMode ? currentAdminName : "";
            document.getElementById('post-author').disabled = isAdminMode;
            document.getElementById('post-title').value = "";
            document.getElementById('post-content').value = "";
            document.getElementById('post-password').value = ""; 
            document.getElementById('post-is-pinned').checked = false; 
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
    alert(`인증 성공! 📨 버튼을 누르면 비밀 편지들을 읽을 수 있어!`);
    
    document.querySelector('.admin-entry-btn').innerText = `관리자 모드 (${currentAdminName})`;
    mergeAndRender();
}

function toggleFavorite(nodeType, firebaseKey, currentStatus, e) {
    e.stopPropagation();
    database.ref(`${nodeType}/${firebaseKey}`).update({
        isFavorite: !currentStatus
    });
}

function togglePin(nodeType, firebaseKey, currentStatus) {
    const nextStatus = !currentStatus;
    const updatePayload = {
        isPinned: nextStatus,
        pinnedAt: nextStatus ? Date.now() : 0
    };
    if (!nextStatus) {
        updatePayload.isMainNotice = false;
    }
    database.ref(`${nodeType}/${firebaseKey}`).update(updatePayload);
}

function submitPost() {
    const author = document.getElementById('post-author').value.trim() || "익명의 우주";
    const title = document.getElementById('post-title').value.trim();
    const content = document.getElementById('post-content').value.trim();
    const postPassword = document.getElementById('post-password').value.trim(); 
    const isPinned = document.getElementById('post-is-pinned').checked; 

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
            updateData.isPinned = isPinned; 
            if(isPinned) {
                updateData.pinnedAt = Date.now(); 
            } else {
                updateData.isMainNotice = false; 
            }
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
            isMainNotice: false,
            pinnedAt: 0,
            isFavorite: false,
            postPassword: "" 
        }).then(() => {
            closeModal('writeModal');
        });
        
    } else {
        if (isAdminMode) {
            database.ref('posts').push({
                id: Date.now(),
                author: author,
                title: title,
                content: content,
                date: today,
                isPinned: isPinned, 
                isMainNotice: false, 
                pinnedAt: isPinned ? Date.now() : 0,
                isFavorite: false,
                postPassword: postPassword 
            }).then(() => {
                closeModal('writeModal');
            });
        } else {
            database.ref('global_letters').push({
                id: Date.now(),
                writer: author,
                title: title,
                text: content,
                date: today,
                isPinned: false,
                isMainNotice: false,
                pinnedAt: 0,
                isFavorite: false
            }).then(() => {
                closeModal('writeModal');
                alert("편지가 은하수를 건너 전달되었습니다.✨"); 
            });
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
    if(nodeType === 'posts') {
        document.getElementById('post-password').value = post.postPassword || "";
        document.getElementById('post-is-pinned').checked = post.isPinned || false; 
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
            star.addEventListener('animationend', () => { star.remove(); });
        }, i * 40);
    }
}

// ✨ 밤하늘 배경에 고정된 채 은은하게 반짝이는 아기 별 60개 생성 엔진
function initBackgroundStars() {
    const spaceBg = document.querySelector('.space-background');
    if (!spaceBg) return;

    for (let i = 0; i < 60; i++) {
        const star = document.createElement('div');
        star.className = 'background-star';
        
        const size = Math.random() * 2 + 1; // 1px ~ 3px 크기 차등 배분
        const top = Math.random() * 100;
        const left = Math.random() * 100;
        const delay = Math.random() * 3;

        star.style.width = `${size}px`;
        star.style.height = `${size}px`;
        star.style.top = `${top}%`;
        star.style.left = `${left}%`;
        star.style.animationDelay = `${delay}s`;

        spaceBg.appendChild(star);
    }
}

// 🌠 밤하늘에 한층 선명하고 잦은 빈도로 별똥별을 실시간 떨구는 엔진
function startDynamicShootingStars() {
    const spaceBg = document.querySelector('.space-background');
    if (!spaceBg) return;

    setInterval(() => {
        if (spaceBg.querySelectorAll('.dynamic-star').length > 15) return;

        const dynamicStar = document.createElement('div');
        dynamicStar.className = 'shooting-star dynamic-star';
        
        const randomLeft = Math.floor(Math.random() * 85) + 5; 
        const randomDelay = Math.random() * 1; 
        const randomDuration = Math.random() * 2 + 4; // 더 가볍고 빠르게 떨어지도록 연출 속도 소폭 가속

        dynamicStar.style.left = `${randomLeft}%`;
        dynamicStar.style.animationDelay = `${randomDelay}s`;
        dynamicStar.style.animationDuration = `${randomDuration}s`;

        spaceBg.appendChild(dynamicStar);

        setTimeout(() => {
            dynamicStar.remove();
        }, (randomDuration + randomDelay) * 1000);

    }, 1500); // 1.5초마다 빠르게 순환 판정하여 끊김 없이 별똥별 발사
}

// 🆕 최근 글 모아보기 창 열기
function toggleRecentLetters() {
    openModal('recentMailboxModal');
    renderRecentLettersWindow();
}

// 🆕 최근 글 5개 전용 렌더러
function renderRecentLettersWindow() {
    const container = document.getElementById('recent-letters-container');
    if (!container) return;
    container.innerHTML = "";

    let allCombinedPosts = [...publicPosts, ...globalLetters];

    if (allCombinedPosts.length === 0) {
        container.innerHTML = `<div style="text-align:center; padding:40px; color:rgba(255,255,255,0.3); font-size:0.85rem;">우주에 새겨진 기록이 전혀 없습니다.</div>`;
        return;
    }

    allCombinedPosts.sort((a, b) => {
        const timeA = new Date(a.date).getTime() || 0;
        const timeB = new Date(b.date).getTime() || 0;
        if (timeB !== timeA) return timeB - timeA;
        return b.id - a.id;
    });

    const recent5 = allCombinedPosts.slice(0, 5);

    recent5.forEach(post => {
        let formattedDate = post.date ? post.date.trim() : "";
        if (/\d{4}-\d{2}-\d{2}\s\d{2}\s\d{2}/.test(formattedDate)) {
            const parts = formattedDate.split(/\s+/);
            if(parts.length >= 3) {
                formattedDate = `${parts[0]} ${parts[1]}:${parts[2]}`;
            }
        }

        let typeTag = "✉️ 편지";
        if (post.nodeType === 'posts') {
            typeTag = post.isPinned ? "📌 공지사항" : "📜 일반 기록";
        }

        const isLocked = post.postPassword && !isAdminMode && !unlockedPostIds.includes(post.firebaseKey);
        let displayContent = "";

        if (isLocked) {
            displayContent = `
                <div class="locked-zone" style="text-align:center; padding:12px; background:rgba(0,0,0,0.2); border-radius:10px; margin:10px 0;">
                    <p style="color:rgba(255,255,255,0.5); font-size:0.8rem; margin-bottom:8px;">🔒 비밀번호로 보호된 기록입니다.</p>
                    <div style="display:flex; gap:5px; justify-content:center;">
                        <input type="password" id="recent-unlock-pw-${post.firebaseKey}" placeholder="비밀번호 입력" style="padding:4px 8px; border-radius:6px; border:1px solid rgba(255,255,255,0.2); background:rgba(255,255,255,0.05); color:#fff; font-size:0.8rem; width:120px; margin-bottom:0;">
                        <button onclick="unlockRecentPost('${post.firebaseKey}', '${post.postPassword}')" style="padding:4px 10px; background:#FFE6BA; border:none; border-radius:6px; color:#0d0e2d; font-size:0.8rem; cursor:pointer; font-weight:bold;">해제</button>
                    </div>
                </div>
            `;
        } else {
            displayContent = `<div class="mini-content">${post.content}</div>`;
        }

        const miniCard = document.createElement('div');
        miniCard.className = 'secret-mini-card notice-mini-card';
        if(post.isMainNotice) {
            miniCard.style.borderLeft = "3px solid #FFE6BA";
        }

        miniCard.innerHTML = `
            <div class="mini-meta" style="display:flex; justify-content:space-between; align-items:center;">
                <span><b>[${typeTag}]</b> | 작성자: <b>${post.author}</b></span>
            </div>
            <div class="mini-title" style="color:${post.isMainNotice ? '#FFE6BA' : '#fff'};">${post.title}</div>
            
            ${displayContent}
            
            <div class="mini-center-date">— ${formattedDate} —</div>
            <div class="mini-actions">
                <button onclick="openReplyModal('${post.nodeType}', '${post.firebaseKey}')" ${isLocked ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ''}>답장</button>
                ${isAdminMode ? `
                    ${post.nodeType === 'posts' ? `<button onclick="toggleMainNoticeStatus('${post.firebaseKey}', ${post.isMainNotice})">${post.isMainNotice ? '메인 해제' : '메인 지정'}</button>` : ''}
                    <button onclick="openEditModal('${post.nodeType}', '${post.firebaseKey}')">수정</button>
                ` : ''}
            </div>
        `;
        container.appendChild(miniCard);
    });
}

// 🔐 최근 글 창 전용 잠금 해제 처리 함수
function unlockRecentPost(firebaseKey, correctPassword) {
    const inputVal = document.getElementById(`recent-unlock-pw-${firebaseKey}`).value;
    if (inputVal === correctPassword) {
        unlockedPostIds.push(firebaseKey); 
        renderRecentLettersWindow();       
        renderPosts();                     
        if (document.getElementById('noticeMailboxModal').classList.contains('active')) renderNoticeMailboxWindow(); 
    } else {
        alert("비밀번호가 일치하지 않습니다.");
    }
}
