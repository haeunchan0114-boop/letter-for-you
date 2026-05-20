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

// 관리자 인증 처리 로직 함수화 (비밀번호창 미작동 문제 원천 해결)
// 관리자 인증 처리 로직 (비밀번호 창 연속 팝업 버그 완전 해결 버전)
function checkAdminAuthentication() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('mode') === 'sea') {
        setTimeout(function() {
            const passwordInput = prompt("기록자 시스템 보안 인증\n비밀번호를 입력해 주세요:");
            if (passwordInput === "0416haeunashi0416!*!26") {
                const nameInput = prompt("우주에 새겨질 기록자 이름을 입력해 주세요:");
                adminName = (nameInput && nameInput.trim() !== "") ? nameInput.trim() : "무명 기록자";

                isAdminMode = true;
                const adminWrap = document.getElementById('admin-wrapper');
                if (adminWrap) adminWrap.style.display = 'block';
                
                try {
                    const sheet = window.document.styleSheets[0];
                    sheet.insertRule('.admin-card-controls { display: flex !important; }', sheet.cssRules.length);
                } catch(e) { console.log(e); }
                
                // [개선] 인증 성공 메시지 팝업
                alert(`인증 성공. 반갑습니다, ${adminName}님.`);

                // [핵심 해결책] 주소창의 ?mode=sea를 새로고침 없이 즉시 지워버려서 비번창이 다시 뜨는 현상을 원천 차단합니다.
                const cleanURL = window.location.protocol + "//" + window.location.host + window.location.pathname;
                window.history.replaceState({ path: cleanURL }, '', cleanURL);

                updateMailboxButtonUI();
                applyFilters(); 
            } else {
                alert("비밀번호가 일치하지 않습니다.");
                window.location.href = window.location.pathname; 
            }
        }, 300);
    } else {
        updateMailboxButtonUI();
    }
}

function initFirebaseListeners() {
    if (!window.fbOnValue || !window.fbRef || !window.fbDB) return;

    // 1. 메인 게시글 동기화 스위치
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

    // 2. 우체통 데이터 실시간 연동
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

function toggleAdminForm() {
    const form = document.getElementById('admin-area');
    const toggleBtn = document.getElementById('admin-open-toggle');
    if (!form || !toggleBtn) return;
    if (form.style.display === 'none') {
        form.style.display = 'block';
        toggleBtn.style.display = 'none';
    } else {
        form.style.display = 'none';
        toggleBtn.style.display = 'block';
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
        
        // 편지 카드 자체에 상대 위치(relative)와 아래쪽 여백을 주어 버튼이 안 겹치게 설계
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
    const titleVal = document.getElementById('new-title').value.trim();
    const contentVal = document.getElementById('new-content').value.trim();
    const editId = document.getElementById('edit-id').value;

    if (!titleVal || !contentVal) return alert("기록 양식을 빠짐없이 기입해 주세요.");
    const cleanContent = contentVal.replace(/\n/g, '<br>');

    if (editId !== "") {
        window.fbUpdate(window.fbRef(window.fbDB, `posts/${editId}`), {
            title: titleVal,
            content: cleanContent
        }).then(() => alert("기록이 수정되었습니다."));
    } else {
        const autoDateTime = getFormattedCurrentTime();
        const newPostRef = window.fbPush(window.fbRef(window.fbDB, 'posts'));
        window.fbSet(newPostRef, {
            title: titleVal,
            author: adminName, 
            date: autoDateTime, 
            content: cleanContent,
            pinned: false
        }).then(() => alert("빛나는 새로운 기록이 보존되었습니다."));
    }

    clearAdminForm();
    toggleAdminForm(); 
}

function startEditPost(postId) {
    const post = myPosts.find(p => p.id === postId);
    if (!post) return;
    
    const form = document.getElementById('admin-area');
    if (form.style.display === 'none') toggleAdminForm();

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
    document.getElementById('new-title').value = "";
    document.getElementById('new-content').value = "";
    document.getElementById('edit-id').value = "";
    document.getElementById('admin-panel-title').innerText = "새로운 우주의 빛의 기록";
    document.getElementById('admin-main-btn').innerHTML = '<i class="fa-solid fa-star"></i> 나의 우주에게 빛을 보내기';
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
// [추가] 타이틀 클릭 시 이스터에그 발동 함수
function triggerSpaceEasterEgg() {
    const msgBox = document.getElementById('easter-egg-message');
    const starContainer = document.getElementById('easter-stars-container');
    if (!msgBox || !starContainer) return;

    // 이미 작동 중이면 중복 실행 방지
    if (msgBox.classList.contains('active')) return;

    // 1. "너는 나만의 빛나는 우주야" 문구 등장
    msgBox.classList.add('active');

    // 3.5초 뒤에 문구 스르륵 사라지게 설정
    setTimeout(() => {
        msgBox.classList.remove('active');
    }, 3500);

    // 2. 파스텔톤 우주 별빛 쏟아지기 연출
    const starShapes = ['✦', '★', '✨', '✧'];
    const colors = ['#F5E6C8', '#FFD1DC', '#E2F0CB', '#BFFCC6', '#FFC6FF', '#9BF6FF', '#FFFFFC'];
    const totalStars = 80; // 쏟아질 별의 개수

    for (let i = 0; i < totalStars; i++) {
        const star = document.createElement('div');
        star.className = 'falling-easter-star';
        
        // 모양 및 색상 무작위 조합
        star.innerHTML = starShapes[Math.floor(Math.random() * starShapes.length)];
        star.style.color = colors[Math.floor(Math.random() * colors.length)];
        
        // 가로축 배치 및 크기 다채롭게 설정
        star.style.left = Math.random() * 100 + 'vw';
        star.style.fontSize = (Math.random() * 14 + 12) + 'px'; // 12px ~ 26px
        
        // 떨어지는 속도와 타이밍 분산 (체증 현상 방지)
        const duration = Math.random() * 2 + 2; // 2초 ~ 4초 동안 떨어짐
        const delay = Math.random() * 1.5;      // 최대 1.5초 안에서 엇박자로 출발
        star.style.animationDuration = duration + 's';
        star.style.animationDelay = delay + 's';

        // CSS 변수를 이용해 떨어질 때의 회전각과 좌우 흔들림 거리 주입
        const sway = (Math.random() * 160 - 80) + 'px'; // 좌우로 -80px ~ 80px 흔들림
        const spin = (Math.random() * 720 - 360) + 'deg'; // 회전 각도
        star.style.setProperty('--sway-distance', sway);
        star.style.setProperty('--spin-angle', spin);

        starContainer.appendChild(star);

        // 애니메이션이 끝나 화면 밖으로 나간 별 객체는 메모리 보호를 위해 즉시 자동 삭제
        setTimeout(() => {
            star.remove();
        }, (duration + delay) * 1000);
    }
}
