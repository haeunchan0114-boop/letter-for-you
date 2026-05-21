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

// 🛠️ 최적화 관련 제어 전역 변수
let isOptimizationOn = false;
let shootingStarIntervalId = null;

// 페이징 설정 규칙
let currentPage = 1;
const postsPerPage = 3;
const maxNavPages = 5;

window.onload = function() {
    initBackgroundStars(); 
    listenToFirebase();
    startDynamicShootingStars(); // 기본 상태에서는 효과 시작
};

// 🎛️ 최적화 모드 ON / OFF 전환 토글 코어 엔진 함수
function toggleOptimizationMode() {
    isOptimizationOn = !isOptimizationOn;
    const btn = document.getElementById('optimize-btn');

    if (isOptimizationOn) {
        // [ON 상태 전환]
        document.body.classList.add('performance-mode');
        btn.innerText = "⚙️ 최적화 모드: ON (애니메이션 꺼짐)";
        btn.style.borderColor = "#7fe7cc";
        btn.style.color = "#7fe7cc";

        // 메모리를 가장 크게 차지하는 반복 실행 인터벌 전면 차단 및 노드 제거
        if (shootingStarIntervalId) {
            clearInterval(shootingStarIntervalId);
            shootingStarIntervalId = null;
        }
        document.querySelectorAll('.dynamic-star, .background-star').forEach(el => el.remove());
    } else {
        // [OFF 상태 전환]
        document.body.classList.remove('performance-mode');
        btn.innerText = "⚙️ 최적화 모드: OFF (애니메이션 켜짐)";
        btn.style.borderColor = "rgba(255, 255, 255, 0.15)";
        btn.style.color = "rgba(255, 255, 255, 0.8)";

        // 그래픽 효과 재초기화 실행
        initBackgroundStars();
        startDynamicShootingStars();
    }
}

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
        if (document.getElementById('noticeMailboxModal')?.classList.contains('active')) renderNoticeMailboxWindow();
        if (document.getElementById('recentMailboxModal')?.classList.contains('active')) renderRecentLettersWindow();
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
        if (document.getElementById('secretMailboxModal').classList.contains('active')) renderSecretMailboxWindow();
        if (document.getElementById('recentMailboxModal')?.classList.contains('active')) renderRecentLettersWindow();
    });
}

function mergeAndRender() {
    const userWriteBtn = document.getElementById('user-write-btn');
    const adminWriteBtn = document.getElementById('admin-write-btn');
    const secretMailIcon = document.getElementById('secret-mailbox-icon');
    const passwordInput = document.getElementById('post-password');
    const noticeZone = document.getElementById('admin-notice-zone');

    displayPosts = [...publicPosts];

    if (isAdminMode) {
        userWriteBtn.style.display = 'none';
        adminWriteBtn.style.display = 'block';
        secretMailIcon.style.display = 'inline-flex'; 
        if(passwordInput) passwordInput.style.display = 'block'; 
        if(noticeZone) noticeZone.style.display = 'flex'; 
    } else {
        userWriteBtn.style.display = 'block';
        adminWriteBtn.style.display = 'none';
        secretMailIcon.style.display = 'none';
        if(passwordInput) passwordInput.style.display = 'none';  
        if(noticeZone) noticeZone.style.display = 'none';  
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
    if (currentSecretTab === 'fav') targetLetters = targetLetters.filter(letter => letter.isFavorite);

    if (targetLetters.length === 0) {
        container.innerHTML = `<div style="text-align:center; padding:40px; color:rgba(255,255,255,0.3); font-size:0.85rem;">우체통에 보관된 편지가 없습니다.</div>`;
        return;
    }

    const sortedLetters = targetLetters.sort((a, b) => new Date(b.date) - new Date(a.date) || b.id - a.id);

    sortedLetters.forEach(letter => {
        let formattedDate = letter.date ? letter.date.trim() : "";
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

function renderNoticeMailboxWindow() {
    const container = document.getElementById('notice-letters-container');
    if (!container) return;
    container.innerHTML = "";

    const noticePosts = publicPosts.filter(post => post.isPinned);

    if (noticePosts.length === 0) {
        container.innerHTML = `<div style="text-align:center; padding:40px; color:rgba(255,255,255,0.3); font-size:0.85rem;">고정 공지사항이 없습니다.</div>`;
        return;
    }

    const sortedNotices = noticePosts.sort((a, b) => b.pinnedAt - a.pinnedAt);

    sortedNotices.forEach(post => {
        let formattedDate = post.date ? post.date.trim() : "";
        const isLocked = post.postPassword && !isAdminMode && !unlockedPostIds.includes(post.firebaseKey);
        let displayContent = isLocked ? `
            <div class="locked-zone" style="text-align:center; padding:12px; background:rgba(0,0,0,0.2); border-radius:10px; margin:10px 0;">
                <p style="color:rgba(255,255,255,0.5); font-size:0.8rem; margin-bottom:8px;">🔒 비밀번호 보호 잠금 상태</p>
                <div style="display:flex; gap:5px; justify-content:center;">
                    <input type="password" id="notice-unlock-pw-${post.firebaseKey}" placeholder="비밀번호" style="padding:4px 8px; border-radius:6px; background:rgba(255,255,255,0.05); color:#fff; font-size:0.8rem; width:120px;">
                    <button onclick="unlockNoticePost('${post.firebaseKey}', '${post.postPassword}')" style="padding:4px 10px; background:#FFE6BA; border:none; border-radius:6px; font-weight:bold; cursor:pointer;">해제</button>
                </div>
            </div>
        ` : `<div class="mini-content">${post.content}</div>`;

        const miniCard = document.createElement('div');
        miniCard.className = 'secret-mini-card notice-mini-card';
        miniCard.innerHTML = `
            <div class="mini-meta"><span>📌 공지 | <b>${post.author}</b></span></div>
            <div class="mini-title">${post.title}</div>
            ${displayContent}
            <div class="mini-center-date">— ${formattedDate} —</div>
            <div class="mini-actions">
                <button onclick="openReplyModal('${post.nodeType}', '${post.firebaseKey}')" ${isLocked ? 'disabled style="opacity:0.5;"' : ''}>답장</button>
                ${isAdminMode ? `
                    <button onclick="toggleMainNoticeStatus('${post.firebaseKey}', ${post.isMainNotice})">${post.isMainNotice?'메인 해제':'메인 지정'}</button>
                    <button onclick="togglePin('${post.nodeType}', '${post.firebaseKey}', true)">공지 해제</button>
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
        if (a.isMainNotice && b.isMainNotice) return b.pinnedAt - a.pinnedAt; 
        return currentSort === 'latest' ? new Date(b.date) - new Date(a.date) || b.id - a.id : new Date(a.date) - new Date(b.date) || a.id - b.id;
    });

    const totalPosts = filtered.length;
    const totalPages = Math.ceil(totalPosts / postsPerPage) || 1;
    if (currentPage > totalPages) currentPage = totalPages;

    const startIndex = (currentPage - 1) * postsPerPage;
    const pagePosts = filtered.slice(startIndex, totalPosts < endIndex ? totalPosts : startIndex + postsPerPage);

    feed.innerHTML = "";

    if(pagePosts.length === 0) {
        feed.innerHTML = `<div style="text-align:center; padding:40px; color:rgba(255,255,255,0.3); font-size:0.9rem;">작성된 기록이 없습니다.</div>`;
        renderPaginationControls(totalPages);
        return;
    }

    pagePosts.forEach(post => {
        let formattedDate = post.date ? post.date.trim() : "";
        const card = document.createElement('div');
        card.className = `post-card ${post.isMainNotice ? 'pinned' : ''}`;
        
        const isLocked = post.postPassword && !isAdminMode && !unlockedPostIds.includes(post.firebaseKey);
        let displayContent = isLocked ? `
            <div class="locked-zone" style="text-align:center; padding:15px; background:rgba(0,0,0,0.2); border-radius:10px; margin:10px 0;">
                <p style="color:rgba(255,255,255,0.5); font-size:0.9rem; margin-bottom:10px;">🔒 암호 보호 기록</p>
                <div style="display:flex; gap:5px; justify-content:center;">
                    <input type="password" id="unlock-pw-${post.firebaseKey}" placeholder="비밀번호" style="padding:4px 8px; border-radius:6px; background:rgba(255,255,255,0.05); color:#fff; font-size:0.8rem; width:120px;">
                    <button onclick="unlockPost('${post.firebaseKey}', '${post.postPassword}')" style="padding:4px 10px; background:#FFE6BA; border:none; border-radius:6px; font-weight:bold; cursor:pointer;">해제</button>
                </div>
            </div>
        ` : `<div class="post-content">${post.content}</div>`;

        card.innerHTML = `
            <div class="post-meta">
                <div>
                    ${post.isMainNotice ? '<span class="pin-tag">📌 메인 공지</span> | ' : ''}
                    <span>작성자: ${post.author}</span>
                </div>
            </div>
            <h2 class="post-title">${post.title}</h2>
            ${displayContent}
            <div class="post-center-date">— ${formattedDate} —</div>
            <div class="card-actions">
                <button class="reply-btn" onclick="openReplyModal('${post.nodeType}', '${post.firebaseKey}')" ${isLocked ? 'disabled' : ''}>답장 보내기</button>
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
        if (publicPosts.filter(post => post.isPinned && post.isMainNotice).length >= 3) {
            alert("메인 보드에는 공지를 최대 3개까지만 채울 수 있어!");
            return;
        }
    }
    database.ref(`posts/${firebaseKey}`).update({ isMainNotice: !currentMainStatus });
}

function unlockPost(firebaseKey, correctPassword) {
    if (document.getElementById(`unlock-pw-${firebaseKey}`).value === correctPassword) {
        unlockedPostIds.push(firebaseKey); 
        renderPosts(); 
    } else {
        alert("비밀번호가 일치하지 않습니다.");
    }
}

function renderPaginationControls(totalPages) {
    const container = document.getElementById('pagination-control');
    container.innerHTML = "";
    const currentBlock = Math.ceil(currentPage / maxNavPages);
    const startPage = (currentBlock - 1) * maxNavPages + 1;
    let endPage = Math.min(startPage + maxNavPages - 1, totalPages);

    const prevBtn = document.createElement('button');
    prevBtn.className = 'page-arrow'; prevBtn.innerText = '‹'; prevBtn.disabled = currentPage === 1;
    prevBtn.onclick = () => changePage(currentPage - 1);
    container.appendChild(prevBtn);

    for (let i = startPage; i <= endPage; i++) {
        const numBtn = document.createElement('button');
        numBtn.className = `page-num-btn ${i === currentPage ? 'active' : ''}`; numBtn.innerText = i;
        numBtn.onclick = () => changePage(i);
        container.appendChild(numBtn);
    }

    const nextBtn = document.createElement('button');
    nextBtn.className = 'page-arrow'; nextBtn.innerText = '›'; nextBtn.disabled = currentPage === totalPages;
    nextBtn.onclick = () => changePage(currentPage + 1);
    container.appendChild(nextBtn);
}

function changePage(page) { currentPage = page; renderPosts(); }
function changeSort(type) {
    currentSort = type;
    document.getElementById('sort-latest').classList.toggle('active', type === 'latest');
    document.getElementById('sort-oldest').classList.toggle('active', type === 'oldest');
    currentPage = 1; renderPosts();
}
function resetFilters() { document.getElementById('search-title').value = ""; changeSort('latest'); }

function openModal(id) {
    if (id === 'writeModal' && !editingPostId && !replyingPostId) {
        document.getElementById('post-author').value = isAdminMode ? currentAdminName : "";
        document.getElementById('post-author').disabled = isAdminMode;
        document.getElementById('post-title').value = "";
        document.getElementById('post-content').value = "";
    }
    document.getElementById(id).classList.add('active');
}
function closeModal(id) {
    document.getElementById(id).classList.remove('active');
    if (id === 'writeModal') { editingPostId = null; replyingPostId = null; }
}

function checkAdminPassword() {
    if (document.getElementById('admin-password-input').value === 'haeunashi0416!') {
        closeModal('adminAuthModal'); openModal('adminNameModal');
    } else {
        alert("비밀번호가 일치하지 않습니다.");
    }
}
function saveAdminProfile() {
    currentAdminName = document.getElementById('admin-name-input').value.trim() || "관리자";
    isAdminMode = true; closeModal('adminNameModal'); mergeAndRender();
}

function toggleFavorite(nodeType, firebaseKey, currentStatus, e) {
    e.stopPropagation(); database.ref(`${nodeType}/${firebaseKey}`).update({ isFavorite: !currentStatus });
}
function togglePin(nodeType, firebaseKey, currentStatus) {
    database.ref(`${nodeType}/${firebaseKey}`).update({ isPinned: !currentStatus, pinnedAt: !currentStatus ? Date.now() : 0, isMainNotice: false });
}

function submitPost() {
    const author = document.getElementById('post-author').value.trim() || "익명의 우주";
    const title = document.getElementById('post-title').value.trim();
    const content = document.getElementById('post-content').value.trim();
    const postPassword = document.getElementById('post-password')?.value.trim() || ""; 
    const isPinned = document.getElementById('post-is-pinned')?.checked || false; 

    if(!title || !content) return alert("빈칸을 채워주세요.");

    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    if (editingPostId) {
        const updateData = editingTargetNode === 'global_letters' ? { title, text: content } : { title, content, postPassword, isPinned, pinnedAt: isPinned ? Date.now() : 0 };
        database.ref(`${editingTargetNode}/${editingPostId}`).update(updateData).then(() => closeModal('writeModal'));
    } else if (replyingPostId) {
        database.ref('posts').push({ id: Date.now(), author: currentAdminName, title: `Re: ${title}`, content, date: today }).then(() => closeModal('writeModal'));
    } else {
        if (isAdminMode) {
            database.ref('posts').push({ id: Date.now(), author, title, content, date: today, isPinned, pinnedAt: isPinned ? Date.now() : 0, postPassword }).then(() => closeModal('writeModal'));
        } else {
            database.ref('global_letters').push({ id: Date.now(), writer: author, title, text: content, date: today }).then(() => { closeModal('writeModal'); alert("편지가 안전하게 발송되었어요.✨"); });
        }
    }
}

function openReplyModal(nodeType, firebaseKey) {
    const target = (nodeType === 'posts' ? publicPosts : globalLetters).find(p => p.firebaseKey === firebaseKey);
    if (!target) return; replyingPostId = firebaseKey; openModal('writeModal');
    document.getElementById('post-title').value = `Re: ${target.title}`;
}
function openEditModal(nodeType, firebaseKey) {
    const post = (nodeType === 'posts' ? publicPosts : globalLetters).find(p => p.firebaseKey === firebaseKey);
    if (!post) return; editingPostId = firebaseKey; editingTargetNode = nodeType; openModal('writeModal');
    document.getElementById('post-author').value = post.author;
    document.getElementById('post-title').value = post.title;
    document.getElementById('post-content').value = post.content;
}
function deletePost(nodeType, firebaseKey) {
    if (confirm("기록을 파기할까요?")) database.ref(`${nodeType}/${firebaseKey}`).remove().then(() => closeModal('secretMailboxModal'));
}

function triggerUniverseEasterEgg() {
    if (isOptimizationOn) return; // 최적화 켜져있을 시 이스터에그 연출도 생략하여 프레임 보존
    const messageBox = document.getElementById('easter-message');
    messageBox.innerText = "✨ 너는 나만의 소중한 우주야 ✨"; messageBox.classList.add('active');
    setTimeout(() => messageBox.classList.remove('active'), 2500);

    const container = document.getElementById('easter-stars-container');
    for (let i = 0; i < 20; i++) {
        setTimeout(() => {
            const star = document.createElement('div'); star.className = 'falling-easter-star'; star.innerText = '✦';
            star.style.left = (Math.random() * window.innerWidth) + 'px';
            star.style.setProperty('--sway', (Math.random() * 200 - 100) + 'px');
            star.style.animationDuration = (Math.random() * 2 + 1.5) + 's';
            container.appendChild(star); star.addEventListener('animationend', () => star.remove());
        }, i * 40);
    }
}

function initBackgroundStars() {
    if (isOptimizationOn) return;
    const spaceBg = document.querySelector('.space-background');
    if (!spaceBg) return;
    for (let i = 0; i < 45; i++) {
        const star = document.createElement('div'); star.className = 'background-star';
        star.style.width = `2px`; star.style.height = `2px`;
        star.style.top = `${Math.random() * 100}%`; star.style.left = `${Math.random() * 100}%`;
        star.style.animationDelay = `${Math.random() * 3}s`;
        spaceBg.appendChild(star);
    }
}

function startDynamicShootingStars() {
    if (isOptimizationOn) return;
    const spaceBg = document.querySelector('.space-background');
    if (!spaceBg) return;

    shootingStarIntervalId = setInterval(() => {
        if (spaceBg.querySelectorAll('.dynamic-star').length > 8) return;
        const dynamicStar = document.createElement('div');
        dynamicStar.className = 'shooting-star dynamic-star';
        dynamicStar.style.left = `${Math.floor(Math.random() * 85) + 5}%`;
        dynamicStar.style.animationDuration = `${Math.random() * 2 + 3}s`;
        spaceBg.appendChild(dynamicStar);
        setTimeout(() => dynamicStar.remove(), 5000);
    }, 2000);
}

function toggleRecentLetters() { openModal('recentMailboxModal'); renderRecentLettersWindow(); }
function renderRecentLettersWindow() {
    const container = document.getElementById('recent-letters-container');
    if (!container) return; container.innerHTML = "";
    let allCombinedPosts = [...publicPosts, ...globalLetters];
    if (allCombinedPosts.length === 0) return;

    allCombinedPosts.sort((a, b) => new Date(b.date) - new Date(a.date) || b.id - a.id);
    allCombinedPosts.slice(0, 5).forEach(post => {
        const isLocked = post.postPassword && !isAdminMode && !unlockedPostIds.includes(post.firebaseKey);
        const miniCard = document.createElement('div');
        miniCard.className = 'secret-mini-card notice-mini-card';
        miniCard.innerHTML = `
            <div class="mini-meta"><span><b>[${post.nodeType==='posts'?'기록':'편지'}]</b> | ${post.author}</span></div>
            <div class="mini-title">${post.title}</div>
            ${isLocked ? '<p style="font-size:0.8rem; opacity:0.5; padding:8px;">🔒 잠긴 글</p>' : `<div class="mini-content">${post.content}</div>`}
            <div class="mini-center-date">— ${post.date} —</div>
        `;
        container.appendChild(miniCard);
    });
}
