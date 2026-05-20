// 상태 제어 변수들
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

// 브라우저가 관리자 인증 성공을 기억하도록 전역 변수 설정
if (window.isAdminAuthenticated === undefined) {
    window.isAdminAuthenticated = false;
}
let isPromptOpening = false; // [모바일 락] 중복 실행 방어막 변수

// 크로스 브라우저 호환용 날짜 객체 생성 함수
function parseSafeDate(dateString) {
    if (!dateString) return new Date();
    const safeString = dateString.replace(/-/g, '/');
    return new Date(safeString);
}

// 눈송이 효과
function startSnowingEffect() {
    const container = document.getElementById('snow-container');
    if (!container) return;
    container.innerHTML = '';
    for (let i = 0; i < 30; i++) {
        const snowflake = document.createElement('div');
        snowflake.className = 'snowflake';
        snowflake.innerHTML = '❄';
        snowflake.style.left = Math.random() * 100 + 'vw';
        snowflake.style.animationDuration = (Math.random() * 4 + 5) + 's'; 
        snowflake.style.animationDelay = Math.random() * 6 + 's';
        snowflake.style.opacity = Math.random() * 0.5 + 0.2;
        snowflake.style.fontSize = (Math.random() * 8 + 10) + 'px';
        container.appendChild(snowflake);
    }
}

// [핵심 엔진] 파이어베이스 연결과 시스템 인증을 무조건 안정적으로 호출해주는 총괄 스타터 함수
window.initApp = function() {
    startSnowingEffect();
    initFirebaseListeners();
    checkAdminAuthentication();
};

// 기존 DOMContentLoaded 타이머를 완벽히 대체하여 초기 부팅 억까 방지
document.addEventListener("DOMContentLoaded", function() {
    if (window.fbDB) {
        window.initApp();
    }
});

// [수정] 관리자 비밀번호인증 -> 이름 필수입력 순차 진행 함수 (모바일 중복팝업 완벽방어)
function checkAdminAuthentication() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('mode') === 'sea') {
        if (isPromptOpening) return; // 이미 진행 중이면 무시
        isPromptOpening = true;

        setTimeout(function() {
            // 1단계: 비밀번호 검증
            const passwordInput = prompt("기록자 시스템 보안 인증\n비밀번호를 입력해 주세요:");
            
            if (passwordInput === "0416haeunashi0416!*!26") {
                
                // 2단계: 이름 입력 (취소하거나 공백이면 무한 루프 돌려 무조건 쓰게 만듦)
                let nameInput = "";
                while (true) {
                    nameInput = prompt("우주에 새겨질 기록자 이름을 무조건 입력해 주세요:\n(공백이나 취소는 허용되지 않습니다)");
                    
                    // 취소 버튼을 누르거나 글자를 안 썼을 때 거름
                    if (nameInput === null) {
                        alert("이름 등록이 취소되었습니다. 인증 과정을 처음부터 다시 해주세요.");
                        isPromptOpening = false;
                        window.location.href = window.location.pathname; // 페이지 원상복구
                        return;
                    }
                    
                    if (nameInput.trim() !== "") {
                        adminName = nameInput.trim();
                        break; // 유효한 이름이면 루프 탈출
                    }
                    alert("이름을 공백으로 둘 수 없습니다!");
                }

                // 3단계: 인증 최종 성공 처리
                isAdminMode = true;
                window.isAdminAuthenticated = true; // 전역 관리자 도장 가동
                
                const adminWrap = document.getElementById('admin-wrapper');
                if (adminWrap) adminWrap.style.display = 'block';
                
                try {
                    const sheet = window.document.styleSheets[0];
                    sheet.insertRule('.admin-card-controls { display: flex !important; }', sheet.cssRules.length);
                } catch(e) { console.log(e); }
                
                // 성공 안내
                alert(`인증 성공. 반갑습니다, ${adminName}님.`);

                // 주소창 초기화로 중복 실행 원천 봉쇄
                const cleanURL = window.location.protocol + "//" + window.location.host + window.location.pathname;
                window.history.replaceState({ path: cleanURL }, '', cleanURL);

                updateMailboxButtonUI();
                applyFilters(); 
            } else {
                alert("비밀번호가 일치하지 않습니다.");
                window.location.href = window.location.pathname; 
            }
            isPromptOpening = false; // 락 해제
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
        filterMailbox(); 
    });
}

function updateMailboxButtonUI() {
    const btn = document.getElementById('global-mailbox-btn');
    if (!btn) return;

    if (isAdminMode) {
        btn.innerHTML = `<i class="fa-solid fa-envelope-open-text"></i> 별빛 우체통 (${globalLetters.length})`;
        btn.className = "winter-btn main-mailbox-trigger admin-mailbox-theme";
    } else {
        btn.innerHTML = `<i class="fa-solid fa-paper-plane"></i> 하은이에게 편지 쓰기`;
        btn.className = "winter-btn main-mailbox-trigger visitor-mailbox-theme";
    }
}

function handleMailboxClick() {
    if (isAdminMode) {
        openMailboxModal();
    } else {
        openGeneralLetterModal();
    }
}

// 1. 오직 '글쓰기 판넬 수동 토글 버튼' 작동용 (주소창 로그인 성공했다면 바로 열리고 닫힘)
function toggleAdminForm() {
    const adminArea = document.getElementById('admin-area');
    const toggleBtn = document.getElementById('admin-open-toggle');

    if (!adminArea) return;

    if (adminArea.style.display === 'block') {
        adminArea.style.display = 'none';
        if (toggleBtn) toggleBtn.style.display = 'block';
    } else {
        // 주소창 인증(?mode=sea)을 거치지 않은 경우 방어막 작동
        if (!window.isAdminAuthenticated) {
            alert("주소창 보안 링크(?mode=sea)를 통해 접속해야 관리자 권한을 부여받을 수 있습니다.");
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

        let replyBtnHTML = '';
        if (!isAdminMode) {
            replyBtnHTML = `
                <div class="reply-zone">
                    <button class="winter-btn card-reply-trigger-btn" onclick="openPostReplyModal('${post.title.replace(/'/g, "\\'")}')">
                        <i class="fa-solid fa-reply"></i> 답장 보내기
                    </button>
                </div>
            `;
        }

        const card = document.createElement('div');
        card.className = `post-card ${isPinned ? 'pinned' : ''}`;
        card.innerHTML = `
            <div class="post-date">
                ${isPinned ? '<span class="pin-badge"><i class="fa-solid fa-thumbtack"></i> 고정됨</span> | ' : ''} 
                <span class="author-tag">${authorDisplay}</span> | ${post.date}
            </div>
            <h2 class="post-title">${post.title}</h2>
            <p>${post.content}</p>
            
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

    if (!author || !content) {
        return alert("이름과 내용을 모두 채워주세요.");
    }

    const newLetterItem = {
        type: mailboxMode,
        targetTitle: mailboxMode === 'reply' ? targetPostTitleForReply : '',
        writer: author,
        text: content.replace(/\n/g, '<br>'),
        date: getFormattedCurrentTime(),
        starred: false
    };

    const lettersRef = window.fbRef(window.fbDB, 'global_letters');
    const newLetterPushRef = window.fbPush(lettersRef);
    window.fbSet(newLetterPushRef, newLetterItem)
        .then(() => {
            closeReplyModal();
            alert("별빛을 통하여 메시지가 전송되었습니다!");
        })
        .catch(() => alert("전송에 실패했습니다. 네트워크를 확인해 주세요."));
}

function openMailboxModal() {
    mailboxCurrentPage = 1;
    currentMailboxTab = 'all'; 
    
    const btnAll = document.getElementById('tab-all');
    const btnStarred = document.getElementById('tab-starred');
    if (btnAll && btnStarred) {
        btnAll.style.background = 'rgba(255,255,255,0.15)';
        btnAll.style.fontWeight = 'bold';
        btnStarred.style.background = 'none';
        btnStarred.style.fontWeight = 'normal';
    }

    if(document.getElementById('mailbox-search')) document.getElementById('mailbox-search').value = '';
    if(document.getElementById('mailbox-date')) document.getElementById('mailbox-date').value = '';
    
    filterMailbox(); 
    document.getElementById('mailbox-modal').style.display = 'flex';
}

function switchMailboxTab(tabType) {
    currentMailboxTab = tabType;
    const btnAll = document.getElementById('tab-all');
    const btnStarred = document.getElementById('tab-starred');
    
    if (tabType === 'starred') {
        if(btnStarred) { btnStarred.style.background = 'rgba(255,255,255,0.15)'; btnStarred.style.fontWeight = 'bold'; }
        if(btnAll) { btnAll.style.background = 'none'; btnAll.style.fontWeight = 'normal'; }
    } else {
        if(btnAll) { btnAll.style.background = 'rgba(255,255,255,0.15)'; btnAll.style.fontWeight = 'bold'; }
        if(btnStarred) { btnStarred.style.background = 'none'; btnStarred.style.fontWeight = 'normal'; }
    }
    mailboxCurrentPage = 1;
    filterMailbox();
}

function filterMailbox() {
    const searchVal = document.getElementById('mailbox-search') ? document.getElementById('mailbox-search').value.trim().toLowerCase() : '';
    const dateVal = document.getElementById('mailbox-date') ? document.getElementById('mailbox-date').value : '';
    
    let indexed = [...globalLetters];
    indexed.reverse(); 

    if (currentMailboxTab === 'starred') {
        indexed = indexed.filter(l => l.starred === true);
    }

    if (searchVal) {
        indexed = indexed.filter(l => l.writer.toLowerCase().includes(searchVal));
    }
    if (dateVal) {
        const tDateObj = parseSafeDate(dateVal);
        const tYear = tDateObj.getFullYear();
        const tMonth = String(tDateObj.getMonth() + 1).padStart(2, '0');
        const tDay = String(tDateObj.getDate()).padStart(2, '0');
        const fTarget = `${tYear}-${tMonth}-${tDay}`;
        indexed = indexed.filter(l => l.date && l.date.substring(0, 10).trim() === fTarget);
    }

    mailboxFilteredLetters = indexed;
    renderMailboxPosts();
}

function renderMailboxPosts() {
    const listContainer = document.getElementById('mailbox-list');
    const pageZone = document.getElementById('mailbox-page-zone');
    if (!listContainer) return;
    listContainer.innerHTML = "";

    if (globalLetters.length === 0) {
        listContainer.innerHTML = `<p style="text-align:center; color:#e2e8f0; font-size:1.05rem; padding:40px 0; font-weight:bold; letter-spacing:0.5px;">도착한 답장이 없습니다.</p>`;
        if(pageZone) pageZone.style.display = 'none';
        return;
    }

    if (mailboxFilteredLetters.length === 0) {
        const emptyMsg = currentMailboxTab === 'starred' ? '즐겨찾기한 편지가 없습니다.' : '검색 조건에 맞는 편지가 없습니다.';
        listContainer.innerHTML = `<p style="text-align:center; color:#a0aec0; padding:40px 0;">${emptyMsg}</p>`;
        if(pageZone) pageZone.style.display = 'none';
        return;
    }

    if(pageZone) pageZone.style.display = 'flex';
    const start = (mailboxCurrentPage - 1) * mailboxLettersPerPage;
    const end = start + mailboxLettersPerPage;
    const paged = mailboxFilteredLetters.slice(start, end);

    paged.forEach(letter => {
        let originBadgeHTML = (letter.type === 'reply') 
            ? `<div class="mailbox-type-badge reply-type">글 답장 | 원문: ${letter.targetTitle}</div>`
            : `<div class="mailbox-type-badge global-type">우주 일반 편지</div>`;

        const isStarred = letter.starred === true;
        const item = document.createElement('div');
        
        item.className = `mailbox-item ${isStarred ? 'starred-letter' : ''}`;
        item.style.position = 'relative';
        item.style.paddingBottom = '45px'; 
        
        item.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; width:100%; position: relative;">
                ${originBadgeHTML}
                <button class="star-btn ${isStarred ? 'active' : ''}" 
                        style="position: relative; z-index: 10; padding: 10px; margin: -10px; cursor: pointer; -webkit-tap-highlight-color: transparent;" 
                        onclick="toggleStarLetter('${letter.id}', ${isStarred}); event.stopPropagation();">
                    <i class="${isStarred ? 'fa-solid' : 'fa-regular'} fa-star" style="pointer-events: none;"></i>
                </button>
            </div>
            <div class="mailbox-item-meta" style="margin-top: 12px;">
                <span style="color:#F5E6C8; font-weight:bold;">기록: ${letter.writer}</span>
                <span style="font-size:0.8rem; color:#718096;">${letter.date}</span>
            </div>
            <p class="mailbox-item-text" style="position: relative; z-index: 1; margin-bottom: 10px;">${letter.text}</p>
            
            <button class="reply-delete-btn" 
                    style="position: absolute; bottom: 15px; right: 15px; z-index: 5; margin: 0;" 
                    onclick="deleteGlobalLetter('${letter.id}')">삭제</button>
        `;
        listContainer.appendChild(item);
    });

    if(document.getElementById('mailbox-page-indicator')) {
        document.getElementById('mailbox-page-indicator').innerText = mailboxCurrentPage;
    }
}

function prevMailboxPage() { if (mailboxCurrentPage > 1) { mailboxCurrentPage--; renderMailboxPosts(); } }
function nextMailboxPage() { if (mailboxCurrentPage * mailboxLettersPerPage < mailboxFilteredLetters.length) { mailboxCurrentPage++; renderMailboxPosts(); } }
function resetMailboxFilter() { 
    if(document.getElementById('mailbox-search')) document.getElementById('mailbox-search').value = ''; 
    if(document.getElementById('mailbox-date')) document.getElementById('mailbox-date').value = ''; 
    mailboxCurrentPage = 1; 
    filterMailbox(); 
}

function deleteGlobalLetter(letterId) {
    if (confirm("이 빛나는 답장을 영구히 소멸시키겠습니까?")) {
        window.fbRemove(window.fbRef(window.fbDB, `global_letters/${letterId}`))
            .then(() => {
                const maxPage = Math.ceil((globalLetters.length - 1) / mailboxLettersPerPage);
                if (mailboxCurrentPage > maxPage && maxPage > 0) mailboxCurrentPage = maxPage;
            });
    }
}

function closeMailboxModal() { document.getElementById('mailbox-modal').style.display = 'none'; }

function getFormattedCurrentTime() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

function savePost() {
    if (!window.isAdminAuthenticated) {
        alert("권한이 없습니다. 페이지를 새로고침 후 다시 로그인해 주세요.");
        return;
    }

    const titleInput = document.getElementById('new-title');
    const contentInput = document.getElementById('new-content');
    const editIdInput = document.getElementById('edit-id');

    if (!titleInput || !contentInput) return;

    const title = titleInput.value.trim();
    const content = contentInput.value.trim();
    const editId = editIdInput ? editIdInput.value : '';

    if (!title || !content) {
        alert("제목과 내용을 모두 입력해주세요.");
        return;
    }

    try {
        if (editId) {
            const postRef = window.fbRef(window.fbDB, `posts/${editId}`);
            window.fbUpdate(postRef, { title, content, author: adminName, updatedAt: Date.now() });
        } else {
            const postsRef = window.fbRef(window.fbDB, 'posts');
            const newPostRef = window.fbPush(postsRef);
            window.fbSet(newPostRef, {
                title,
                content,
                author: adminName, // 등록한 이름 강제 바인딩
                createdAt: Date.now()
            });
        }
        
        alert("우주에 빛의 기록이 새겨졌습니다.");
        clearAdminForm();
        
        const adminArea = document.getElementById('admin-area');
        const toggleBtn = document.getElementById('admin-open-toggle');
        if (adminArea) adminArea.style.display = 'none';
        if (toggleBtn) toggleBtn.style.display = 'block';

    } catch (error) {
        console.error("저장 실패:", error);
        alert("데이터베이스 연결에 실패했습니다.");
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

    document.getElementById('admin-panel-title').innerText = "우주 속 빛의 기록 수정하기";
    document.getElementById('admin-main-btn').innerHTML = '<i class="fa-solid fa-check"></i> 빛의 기록 수정 완료하기';
    window.scrollTo({ top: document.getElementById('admin-wrapper').offsetTop - 30, behavior: 'smooth' });
}

function deletePost(postId) {
    if (confirm("정말로 이 빛의 기록을 우주에서 완전히 삭제하시겠습니까?")) {
        window.fbRemove(window.fbRef(window.fbDB, `posts/${postId}`))
            .then(() => alert("빛의 기록이 우주 너머로 소멸되었습니다."));
    }
}

function togglePin(postId, currentPinnedStatus) {
    window.fbUpdate(window.fbRef(window.fbDB, `posts/${postId}`), {
        pinned: !currentPinnedStatus
    });
}

function clearAdminForm() {
    if (document.getElementById('edit-id')) document.getElementById('edit-id').value = '';
    if (document.getElementById('new-title')) document.getElementById('new-title').value = '';
    if (document.getElementById('new-content')) document.getElementById('new-content').value = '';
}

function setSort(type) { currentSort = type; currentPage = 1; applyFilters(); }
function resetFilter() { 
    const searcher = document.getElementById('search-input');
    if (searcher) searcher.value = ''; 
    searchQuery = ''; currentSort = 'newest';
    currentPage = 1; applyFilters(); 
}
function prevPage() { if (currentPage > 1) { currentPage--; window.scrollTo({ top: 0, behavior: 'smooth' }); renderPosts(); } }
function nextPage() { if (currentPage * postsPerPage < currentDisplayPosts.length) { currentPage++; window.scrollTo({ top: 0, behavior: 'smooth' }); renderPosts(); } }

function toggleStarLetter(letterId, currentStarredStatus) {
    const nextStatus = !currentStarredStatus;
    window.fbUpdate(window.fbRef(window.fbDB, `global_letters/${letterId}`), {
        starred: nextStatus
    }).then(() => {
        filterMailbox(); 
    }).catch((e) => console.error("즐겨찾기 실패:", e));
}
// 타이틀 클릭 시 이스터에그 발동 함수
function triggerSpaceEasterEgg() {
    const msgBox = document.getElementById('easter-egg-message');
    const starContainer = document.getElementById('easter-stars-container');
    if (!msgBox || !starContainer) return;

    if (msgBox.classList.contains('active')) return;

    msgBox.classList.add('active');
    setTimeout(() => { msgBox.classList.remove('active'); }, 3000);

    const starShapes = ['✦', '★', '✧'];
    const totalStars = 60; 

    for (let i = 0; i < totalStars; i++) {
        const star = document.createElement('div');
        star.className = 'falling-easter-star';
        star.innerHTML = starShapes[Math.floor(Math.random() * starShapes.length)];
        
        star.style.left = Math.random() * 100 + 'vw';
        star.style.fontSize = (Math.random() * 6 + 10) + 'px'; 
        
        const duration = Math.random() * 2.5 + 2; 
        const delay = Math.random() * 1.2;
        star.style.animationDuration = duration + 's';
        star.style.animationDelay = delay + 's';

        const sway = (Math.random() * 100 - 50) + 'px'; 
        const spin = (Math.random() * 360 - 180) + 'deg';
        star.style.setProperty('--sway-distance', sway);
        star.style.setProperty('--spin-angle', spin);

        starContainer.appendChild(star);

        setTimeout(() => { star.remove(); }, (duration + delay) * 1000);
    }
} // 👈 triggerSpaceEasterEgg 함수의 중괄호가 여기서 확실하게 닫혀야 합니다!


// ==========================================
// 🌌 [구조 독립] 화면 전체 적용: 연노랑 단색 특수기호 트레일 (마우스/터치)
// ==========================================
// 이스터에그 함수 밖으로 탈출시켜 페이지 로드와 동시에 무조건 실행되도록 고정했습니다.
(function() {
    const spaceSymbols = ['✦', '★', '✧', '•', '﹡', '⁺'];
    
    const handleMove = (e) => {
        const x = e.touches ? e.touches[0].clientX : e.clientX;
        const y = e.touches ? e.touches[0].clientY : e.clientY;
        
        // 너무 빽빽하게 생겨서 지저분해지는 것을 방지 (스폰 확률 조절)
        if (Math.random() > 0.4) return;

        const particle = document.createElement('span');
        particle.innerText = spaceSymbols[Math.floor(Math.random() * spaceSymbols.length)];
        
        particle.style.position = 'fixed';
        particle.style.left = x + 'px';
        particle.style.top = y + 'px';
        particle.style.color = '#F5E6C8'; /* 연노랑 단색 고정 */
        particle.style.fontSize = (Math.random() * 6 + 10) + 'px'; 
        particle.style.pointerEvents = 'none';
        particle.style.zIndex = '999999';
        particle.style.userSelect = 'none';
        particle.style.fontFamily = 'sans-serif';
        particle.style.opacity = '0.85';
        particle.style.transition = 'all 0.9s cubic-bezier(0.1, 0.8, 0.2, 1)';
        
        document.body.appendChild(particle);

        const velocityX = (Math.random() - 0.5) * 25;
        const velocityY = (Math.random() - 0.5) * 25 - 10;
        const rotation = Math.random() * 360;

        setTimeout(() => {
            particle.style.transform = `translate(${velocityX}px, ${velocityY}px) rotate(${rotation}deg) scale(0.4)`;
            particle.style.opacity = '0';
        }, 10);

        setTimeout(() => { particle.remove(); }, 950);
    };

    // 마우스 및 모바일 터치 이벤트 감지기를 브라우저 창에 즉시 결합
    window.addEventListener('mousemove', handleMove, { passive: true });
    window.addEventListener('touchmove', handleMove, { passive: true });
})();
