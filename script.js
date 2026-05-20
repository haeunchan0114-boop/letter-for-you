let myPosts = [];
let globalLetters = [];
let currentDisplayPosts = []; 
let currentPage = 1;
const postsPerPage = 3; 
let currentSort = 'newest';
let searchQuery = '';
let isAdminMode = false;
let adminName = ''; 

let mailboxMode = 'global'; 
let targetPostTitleForReply = ''; 
let mailboxFilteredLetters = [];
let mailboxCurrentPage = 1;
const mailboxLettersPerPage = 3; 
let currentMailboxTab = 'all';

if (window.isAdminAuthenticated === undefined) {
    window.isAdminAuthenticated = false;
}
let isPromptOpening = false; 

function parseSafeDate(dateString) {
    if (!dateString) return new Date();
    return new Date(dateString.replace(/-/g, '/'));
}

function startSnowingEffect() {
    if (document.body.classList.contains('optimized')) return;
    const container = document.getElementById('snow-container');
    if (!container) return;
    container.innerHTML = '';
    for (let i = 0; i < 20; i++) {
        const snowflake = document.createElement('div');
        snowflake.className = 'snowflake';
        snowflake.innerHTML = '❄';
        snowflake.style.position = 'absolute';
        snowflake.style.top = '-20px';
        snowflake.style.left = Math.random() * 100 + 'vw';
        snowflake.style.animationName = 'fall';
        snowflake.style.animationIterationCount = 'infinite';
        snowflake.style.animationTimingFunction = 'linear';
        snowflake.style.animationDuration = (Math.random() * 4 + 6) + 's'; 
        snowflake.style.animationDelay = Math.random() * 5 + 's';
        snowflake.style.opacity = Math.random() * 0.4 + 0.1;
        snowflake.style.fontSize = (Math.random() * 6 + 10) + 'px';
        snowflake.style.color = '#fff';
        container.appendChild(snowflake);
    }
}

// 키프레임 동적 엔진 생성 가드
try {
    const style = document.createElement('style');
    style.innerHTML = `@keyframes fall { to { transform: translateY(105vh); } }`;
    document.head.appendChild(style);
} catch(e){}

window.initApp = function() {
    applySavedOptimization();
    startSnowingEffect();
    initFirebaseListeners();
    checkAdminAuthentication();
};

document.addEventListener("DOMContentLoaded", function() {
    if (window.fbDB) window.initApp();
});

function checkAdminAuthentication() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('mode') === 'sea') {
        if (isPromptOpening) return; 
        isPromptOpening = true;

        setTimeout(function() {
            const passwordInput = prompt("기록자 시스템 보안 인증\n비밀번호를 입력해 주세요:");
            if (passwordInput === "0416haeunashi0416!*!26") {
                let nameInput = "";
                while (true) {
                    nameInput = prompt("우주에 새겨질 기록자 이름을 입력해 주세요:");
                    if (nameInput === null) {
                        alert("인증이 취소되었습니다.");
                        isPromptOpening = false;
                        window.location.href = window.location.pathname;
                        return;
                    }
                    if (nameInput.trim() !== "") {
                        adminName = nameInput.trim();
                        break;
                    }
                    alert("이름을 공백으로 둘 수 없습니다.");
                }

                isAdminMode = true;
                window.isAdminAuthenticated = true; 
                
                const adminWrap = document.getElementById('admin-wrapper');
                if (adminWrap) adminWrap.style.display = 'block';
                
                try {
                    const sheet = window.document.styleSheets[0];
                    sheet.insertRule('.admin-card-controls { display: flex !important; }', sheet.cssRules.length);
                } catch(e) {}
                
                alert(`인증 성공. 반갑습니다, ${adminName}님.`);
                const cleanURL = window.location.protocol + "//" + window.location.host + window.location.pathname;
                window.history.replaceState({ path: cleanURL }, '', cleanURL);
                updateMailboxButtonUI();
                applyFilters(); 
            } else {
                alert("비밀번호가 일치하지 않습니다.");
                window.location.href = window.location.pathname; 
            }
            isPromptOpening = false; 
        }, 300);
    } else {
        updateMailboxButtonUI();
    }
}

function initFirebaseListeners() {
    if (!window.fbOnValue || !window.fbRef || !window.fbDB) return;

    window.fbOnValue(window.fbRef(window.fbDB, 'posts'), (snapshot) => {
        const data = snapshot.val();
        myPosts = [];
        if (data) {
            Object.keys(data).forEach(key => {
                myPosts.push({ id: key, ...data[key] });
            });
        }
        applyFilters(); 
    });

    window.fbOnValue(window.fbRef(window.fbDB, 'global_letters'), (snapshot) => {
        const data = snapshot.val();
        globalLetters = [];
        if (data) {
            Object.keys(data).forEach(key => {
                globalLetters.push({ id: key, ...data[key] });
            });
        }
        updateMailboxButtonUI();
    });
}

function updateMailboxButtonUI() {
    const btn = document.getElementById('global-mailbox-btn');
    if (!btn) return;
    if (isAdminMode) {
        btn.innerHTML = `<i class="fa-solid fa-envelope-open-text"></i> 별빛 우체통 (${globalLetters.length})`;
        btn.className = "winter-btn admin-mailbox-theme";
    } else {
        btn.innerHTML = `<i class="fa-solid fa-paper-plane"></i> 하은이에게 편지 쓰기`;
        btn.className = "winter-btn visitor-mailbox-theme";
    }
}

function handleMailboxClick() {
    if (isAdminMode) {
        alert("관리자 우체통 기능이 연동되어 활성화됩니다.");
    } else {
        openGeneralLetterModal();
    }
}

function toggleAdminForm() {
    const adminArea = document.getElementById('admin-area');
    const toggleBtn = document.getElementById('admin-open-toggle');
    if (!adminArea) return;

    if (adminArea.style.display === 'block') {
        adminArea.style.display = 'none';
        if (toggleBtn) toggleBtn.style.display = 'block';
    } else {
        if (!window.isAdminAuthenticated) {
            alert("주소창 보안 링크(?mode=sea) 권한이 필요합니다.");
            return;
        }
        adminArea.style.display = 'block';
        if (toggleBtn) toggleBtn.style.display = 'none';
        clearAdminForm();
    }
}

function searchTitle(value) {
    searchQuery = value.trim().toLowerCase();
    currentPage = 1; 
    applyFilters();
}

function applyFilters() {
    let filtered = [...myPosts];
    if (searchQuery) {
        filtered = filtered.filter(p => p.title.toLowerCase().includes(searchQuery));
    }
    filtered.sort((a, b) => {
        return currentSort === 'newest' ? parseSafeDate(b.date) - parseSafeDate(a.date) : parseSafeDate(a.date) - parseSafeDate(b.date);
    });
    filtered.sort((a, b) => (b.pinned || false) - (a.pinned || false));
    currentDisplayPosts = filtered;
    renderPosts();
}

/* ==========================================
   🔒 [핵심 동적 렌더러] 잠금 및 가림막 기능 
   ========================================== */
function renderPosts() {
    const start = (currentPage - 1) * postsPerPage;
    const end = start + postsPerPage;
    const pagedPosts = currentDisplayPosts.slice(start, end);
    
    const container = document.getElementById('post-list');
    if (!container) return;
    container.innerHTML = '';

    if (pagedPosts.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#718096; padding: 50px 0;">우주에 기록된 이야기가 없습니다.</p>';
        return;
    }

    pagedPosts.forEach(post => {
        const isPinned = post.pinned === true;
        const authorDisplay = post.author ? post.author : "알 수 없음"; 
        const hasPassword = post.password && post.password.trim() !== "";

        let displayContent = post.content;
        let lockClass = "";
        let lockControlsHTML = "";

        // 일반 유저용 패스워드 가드 연출 활성화
        if (hasPassword && !isAdminMode) {
            lockClass = "post-locked";
            displayContent = `
                <div class="lock-container">
                    <span class="lock-text">
                        <i class="fa-solid fa-lock" style="color:#f6ad55;"></i> 빛을 보려면 암호가 필요해!
                    </span>
                </div>`;
            
            lockControlsHTML = `
                <div class="lock-btn-zone">
                    <button class="winter-btn lock-unlock-btn" onclick="unlockPost('${post.id}', '${post.password}')">
                        <i class="fa-solid fa-key"></i> 암호 입력하고 빛 확인하기
                    </button>
                </div>
            `;
        }

        // 인증 성공 토글 확인 후 복구
        if (window[`unlocked_${post.id}`]) {
            displayContent = post.content;
            lockControlsHTML = `<div style="color:#48bb78; font-size:0.85rem; margin-top:14px; font-weight:bold;"><i class="fa-solid fa-lock-open"></i> 투명하게 밝혀진 기록입니다.</div>`;
        }

        let replyBtnHTML = '';
        if (!isAdminMode && (!hasPassword || window[`unlocked_${post.id}`])) {
            replyBtnHTML = `
                <div class="reply-zone" style="margin-top: 15px;">
                    <button class="winter-btn card-reply-trigger-btn" style="background:rgba(99,179,237,0.1); border-color:rgba(99,179,237,0.3); color:#90cdf4;" onclick="openPostReplyModal('${post.title.replace(/'/g, "\\'")}')">
                        <i class="fa-solid fa-reply"></i> 답장 보내기
                    </button>
                </div>
            `;
        }

        const card = document.createElement('div');
        card.className = `post-card ${isPinned ? 'pinned' : ''} ${lockClass}`;
        card.innerHTML = `
            <div class="post-date">
                ${isPinned ? '<span class="pin-badge"><i class="fa-solid fa-thumbtack"></i> 고정됨</span> | ' : ''} 
                <span class="author-tag">${authorDisplay}</span> | ${post.date}
                ${hasPassword ? ' | <span style="color:#f6ad55; font-weight:500;"><i class="fa-solid fa-lock"></i> 비밀글</span>' : ''}
            </div>
            <h2 class="post-title">${post.title}</h2>
            <div id="content-${post.id}" style="line-height:1.65; white-space:pre-wrap; color:#e2e8f0; font-size:0.98rem;">${displayContent}</div>
            
                    ${lockControlsHTML}
                    ${replyBtnHTML}
            
            <div class="admin-card-controls">
                <button class="admin-mini-btn ${isPinned ? 'pin-active' : ''}" onclick="togglePin('${post.id}', ${isPinned})">
                    <i class="fa-solid fa-thumbtack"></i> ${isPinned ? '고정해제' : '글고정'}
                </button>
                <button class="admin-mini-btn" onclick="startEditPost('${post.id}')">
                    <i class="fa-solid fa-pen"></i> 수정
                </button>
                <button class="admin-mini-btn del-btn" onclick="deletePost('${post.id}')">
                    <i class="fa-solid fa-trash-can"></i> 삭제
                </button>
            </div>
        `;
        container.appendChild(card);
    });
    
    if(document.getElementById('page-indicator')) {
        document.getElementById('page-indicator').innerText = currentPage;
    }
}

function unlockPost(postId, correctPassword) {
    const userInput = prompt("이 기록의 빛을 밝힐 암호(숫자 4자리)를 입력하세요:");
    if (userInput === null) return; 

    if (userInput.trim() === correctPassword) {
        alert("암호가 일치합니다. 빛의 기록이 열립니다.");
        window[`unlocked_${postId}`] = true; 
        renderPosts(); 
    } else {
        alert("암호가 올바르지 않습니다. 빛이 완강히 거부합니다.");
    }
}

function openGeneralLetterModal() {
    mailboxMode = 'global';
    document.getElementById('modal-form-title').innerText = "하은이에게 편지 보내기";
    document.getElementById('modal-form-desc').innerText = "하은이에게 전하고 싶은 이야기를 별빛에 실어 보내세요.";
    clearFormFields();
    document.getElementById('reply-modal').style.display = 'flex';
}

function openPostReplyModal(postTitle) {
    mailboxMode = 'reply';
    targetPostTitleForReply = postTitle;
    document.getElementById('modal-form-title').innerText = "기록에 답장 남기기";
    document.getElementById('modal-form-desc').innerText = `원문: "${postTitle}" 글에 대한 답장입니다.`;
    clearFormFields();
    document.getElementById('reply-modal').style.display = 'flex';
}

function clearFormFields() {
    if(document.getElementById('reply-author')) document.getElementById('reply-author').value = "";
    if(document.getElementById('reply-content')) document.getElementById('reply-content').value = "";
}

function closeReplyModal() {
    document.getElementById('reply-modal').style.display = 'none';
}

function submitLetterOrReply() {
    const author = document.getElementById('reply-author').value.trim();
    const content = document.getElementById('reply-content').value.trim();
    if (!author || !content) return alert("이름과 내용을 모두 채워주세요.");

    const newLetterItem = {
        type: mailboxMode,
        targetTitle: mailboxMode === 'reply' ? targetPostTitleForReply : '',
        writer: author,
        text: content.replace(/\n/g, '<br>'),
        date: getFormattedCurrentTime(),
        starred: false
    };

    if(window.fbRef && window.fbPush && window.fbSet) {
        const lettersRef = window.fbRef(window.fbDB, 'global_letters');
        const newLetterPushRef = window.fbPush(lettersRef);
        window.fbSet(newLetterPushRef, newLetterItem)
            .then(() => {
                closeReplyModal();
                alert("별빛을 통하여 메시지가 전송되었습니다!");
            })
            .catch(() => alert("전송에 실패했습니다."));
    }
}

function getFormattedCurrentTime() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

function savePost() {
    if (!window.isAdminAuthenticated) {
        alert("권한이 없습니다.");
        return;
    }

    const titleInput = document.getElementById('new-title');
    const contentInput = document.getElementById('new-content');
    const editIdInput = document.getElementById('edit-id');
    const passwordInput = document.getElementById('new-password'); 

    if (!titleInput || !contentInput) return;

    const title = titleInput.value.trim();
    const content = contentInput.value.trim();
    const editId = editIdInput ? editIdInput.value : '';
    let password = passwordInput ? passwordInput.value.trim() : '';

    if (!title || !content) {
        alert("제목과 내용을 모두 입력해주세요.");
        return;
    }

    if (password !== "" && !/^\d{4}$/.test(password)) {
        alert("비밀번호는 반드시 숫자 4자리 구조로 설정하셔야 합니다!");
        return;
    }

    try {
        if (editId) {
            const postRef = window.fbRef(window.fbDB, `posts/${editId}`);
            window.fbUpdate(postRef, { title, content, password: password, author: adminName, updatedAt: Date.now() });
        } else {
            const postsRef = window.fbRef(window.fbDB, 'posts');
            const newPostRef = window.fbPush(postsRef);
            window.fbSet(newPostRef, {
                title, content, password: password, author: adminName, createdAt: Date.now(),
                date: getFormattedCurrentTime().substring(0, 10)
            });
        }
        alert("우주에 빛의 기록이 새겨졌습니다.");
        clearAdminForm();
        toggleAdminForm();
    } catch (error) {
        alert("데이터베이스 연결 실패");
    }
}

function startEditPost(postId) {
    const post = myPosts.find(p => p.id === postId);
    if (!post) return;
    
    const form = document.getElementById('admin-area');
    if (form && form.style.display === 'none') toggleAdminForm();

    document.getElementById('new-title').value = post.title;
    document.getElementById('new-content').value = post.content.replace(/<br>/g, '\n');
    document.getElementById('edit-id').value = postId;
    if (document.getElementById('new-password')) {
        document.getElementById('new-password').value = post.password ? post.password : '';
    }

    document.getElementById('admin-panel-title').innerHTML = "<i class='fa-solid fa-pen'></i> 우주 속 빛의 기록 수정하기";
    document.getElementById('admin-main-btn').innerHTML = '<i class="fa-solid fa-check"></i> 수정 완료';
    window.scrollTo({ top: document.getElementById('admin-wrapper').offsetTop - 30, behavior: 'smooth' });
}

function deletePost(postId) {
    if (confirm("정말로 이 기록을 완전히 삭제하시겠습니까?")) {
        window.fbRemove(window.fbRef(window.fbDB, `posts/${postId}`));
    }
}

function togglePin(postId, currentPinnedStatus) {
    window.fbUpdate(window.fbRef(window.fbDB, `posts/${postId}`), { pinned: !currentPinnedStatus });
}

function clearAdminForm() {
    if (document.getElementById('edit-id')) document.getElementById('edit-id').value = '';
    if (document.getElementById('new-title')) document.getElementById('new-title').value = '';
    if (document.getElementById('new-content')) document.getElementById('new-content').value = '';
    if (document.getElementById('new-password')) document.getElementById('new-password').value = ''; 
    if (document.getElementById('admin-panel-title')) document.getElementById('admin-panel-title').innerHTML = "<i class='fa-solid fa-feather'></i> 우주에 새로운 빛의 기록 남기기";
    if (document.getElementById('admin-main-btn')) document.getElementById('admin-main-btn').innerHTML = '<i class="fa-solid fa-feather"></i> 기록 새겨넣기';
}

function setSort(type) { currentSort = type; currentPage = 1; applyFilters(); }
function resetFilter() { 
    if (document.getElementById('search-input')) document.getElementById('search-input').value = ''; 
    searchQuery = ''; currentSort = 'newest'; currentPage = 1; applyFilters(); 
}
function prevPage() { if (currentPage > 1) { currentPage--; window.scrollTo({ top:0, behavior:'smooth' }); renderPosts(); } }
function nextPage() { if (currentPage * postsPerPage < currentDisplayPosts.length) { currentPage++; window.scrollTo({ top:0, behavior:'smooth' }); renderPosts(); } }

function toggleOptimization() {
    const isOptimized = document.body.classList.toggle('optimized');
    const btn = document.getElementById('opt-toggle-btn');
    if (isOptimized) {
        if(btn) btn.innerHTML = `<i class="fa-solid fa-bolt"></i> 최적화 모드: ON`;
        localStorage.setItem('site-optimized', 'true');
        const sc = document.getElementById('snow-container'); if(sc) sc.innerHTML = '';
    } else {
        if(btn) btn.innerHTML = `<i class="fa-solid fa-gauge-high"></i> 최적화 모드: OFF`;
        localStorage.setItem('site-optimized', 'false');
        startSnowingEffect();
    }
}

function applySavedOptimization() {
    if (localStorage.getItem('site-optimized') === 'true') {
        document.body.classList.add('optimized');
        const btn = document.getElementById('opt-toggle-btn');
        if (btn) btn.innerHTML = `<i class="fa-solid fa-bolt"></i> 최적화 모드: ON`;
    }
}

// 마우스 이펙트 트레일 독립 기동
(function() {
    const symbols = ['✦', '★', '✧', '•'];
    window.addEventListener('mousemove', (e) => {
        if (document.body.classList.contains('optimized') || Math.random() > 0.3) return;
        const p = document.createElement('span');
        p.innerText = symbols[Math.floor(Math.random() * symbols.length)];
        p.style.position = 'fixed';
        p.style.left = e.clientX + 'px';
        p.style.top = e.clientY + 'px';
        p.style.color = '#F5E6C8';
        p.style.pointerEvents = 'none';
        p.style.zIndex = '999999';
        p.style.fontSize = '12px';
        p.style.transition = 'all 0.8s ease';
        document.body.appendChild(p);
        setTimeout(() => {
            p.style.transform = `translate(${(Math.random()-0.5)*20}px, ${(Math.random()-0.5)*20}px) scale(0)`;
            p.style.opacity = '0';
        }, 10);
        setTimeout(() => p.remove(), 800);
    }, { passive: true });
})();
