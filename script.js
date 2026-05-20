// 상태 제어 변수들
let myPosts = [];
let globalLetters = [];
let currentDisplayPosts = []; 
let currentPage = 1;
const postsPerPage = 3; 
let currentSort = 'newest';
let selectedDate = '';
let searchQuery = '';
let isAdminMode = false;
let adminName = ''; 

let mailboxMode = 'global'; 
let targetPostTitleForReply = ''; 
let mailboxFilteredLetters = [];
let mailboxCurrentPage = 1;
const mailboxLettersPerPage = 3; 

function startSnowingEffect() {
    const container = document.getElementById('snow-container');
    if (!container) return;
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

document.addEventListener("DOMContentLoaded", function() {
    startSnowingEffect();

    // Firebase 로드가 완료될 때까지 주기적으로 체크 후 데이터 바인딩 시작
    const checkFB = setInterval(() => {
        if (window.fbDB) {
            clearInterval(checkFB);
            initFirebaseListeners();
        }
    }, 100);

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('mode') === 'sea') {
        setTimeout(function() {
            const passwordInput = prompt("관리자 시스템 보안 인증! \n 비밀번호를 입력해 주세요! :");
            if (passwordInput === "0416haeunashi0416!*!26") {
                const nameInput = prompt("우주에 새겨질 기록자 이름을 입력해 주세요:");
                adminName = (nameInput && nameInput.trim() !== "") ? nameInput.trim() : "빛의 기록자";

                isAdminMode = true;
                document.getElementById('admin-wrapper').style.display = 'block';
                
                const sheet = window.document.styleSheets[0];
                sheet.insertRule('.admin-card-controls { display: flex !important; }', sheet.cssRules.length);
                
                alert(`빛의 기록자 ${adminName}님! 어서오세요!.`);
                updateMailboxButtonUI();
                applyFilters(); 
            } else {
                alert("비밀번호가 일치하지 않아ㅜ 다시 시도해줘!");
                window.location.href = window.location.pathname; 
            }
        }, 200);
    }
});

// 🌐 Firebase 실시간 리스너 및 기존 데이터 백업 연동
function initFirebaseListeners() {
    // 1) 포스트 리스트 실시간 동기화
    window.fbOnValue(window.fbRef(window.fbDB, 'posts'), (snapshot) => {
        const data = snapshot.val();
        myPosts = [];
        
        if (data) {
            // Firebase에 데이터가 있으면 가져와서 배열로 가공
            Object.keys(data).forEach(key => {
                myPosts.push({ id: key, ...data[key] });
            });
            applyFilters();
        } else {
            // [중요] Firebase가 완전히 비어있을 때만 기존 localStorage에 있던 글을 이전합니다.
            // 안 적은 글(기본 샘플 데이터)은 빼고 사용자가 진짜 썼던 글만 옮기기 위해 검사합니다.
            const localData = localStorage.getItem('myUniversePosts');
            if (localData) {
                try {
                    const parsedLocal = JSON.parse(localData);
                    // 혹시 모를 샘플 더미 데이터가 섞여 있다면 제외하고 진짜 글만 필터링해서 DB에 전송
                    const userRealPosts = parsedLocal.filter(p => p.title && p.content);
                    
                    if (userRealPosts.length > 0) {
                        userRealPosts.forEach(post => {
                            const newPostRef = window.fbPush(window.fbRef(window.fbDB, 'posts'));
                            window.fbSet(newPostRef, {
                                title: post.title,
                                author: post.author || "관리인",
                                date: post.date || getFormattedCurrentTime(),
                                content: post.content,
                                pinned: post.pinned || false
                            });
                        });
                        // 백업 성공 후 로컬스토리지 청소
                        localStorage.removeItem('myUniversePosts');
                    } else {
                        // 유의미한 기존 글이 없었다면 화면에 빈 상태 표시
                        applyFilters();
                    }
                } catch(e) {
                    applyFilters();
                }
            } else {
                applyFilters();
            }
        }
    });

    // 2) 우체통 편지함 실시간 동기화 (기존 로컬 편지가 있었다면 이것도 함께 이전)
    window.fbOnValue(window.fbRef(window.fbDB, 'global_letters'), (snapshot) => {
        const data = snapshot.val();
        globalLetters = [];
        
        if (data) {
            Object.keys(data).forEach(key => {
                globalLetters.push({ id: key, ...data[key] });
            });
        } else {
            // 기존에 오프라인 상태에서 모인 편지가 로컬에 있었다면 디비로 자동 백업
            const localLetters = localStorage.getItem('myUniverseLetters');
            if (localLetters) {
                try {
                    const parsedLetters = JSON.parse(localLetters);
                    if (parsedLetters.length > 0) {
                        parsedLetters.forEach(letter => {
                            const newLetterPushRef = window.fbPush(window.fbRef(window.fbDB, 'global_letters'));
                            window.fbSet(newLetterPushRef, letter);
                        });
                        localStorage.removeItem('myUniverseLetters');
                    }
                } catch(e) {}
            }
        }
        updateMailboxButtonUI();
        if (document.getElementById('mailbox-modal').style.display === 'flex') {
            filterMailbox();
        }
    });
}

function updateMailboxButtonUI() {
    const btn = document.getElementById('global-mailbox-btn');
    if (!btn) return;

    if (isAdminMode) {
        btn.innerHTML = `<i class="fa-solid fa-envelope-open-text"></i> 📬 별빛 우체통 (${globalLetters.length})`;
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
    if (selectedDate) {
        filtered = filtered.filter(p => p.date.substring(0, 10) === selectedDate);
    }
    if (searchQuery) {
        filtered = filtered.filter(p => p.title.toLowerCase().includes(searchQuery));
    }

    filtered.sort((a, b) => {
        return currentSort === 'newest' ? new Date(b.date) - new Date(a.date) : new Date(a.date) - new Date(b.date);
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
                <span class="author-tag">⭐ ${authorDisplay}</span> | ${post.date}
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
    
    document.getElementById('page-indicator').innerText = currentPage;
}

/* ==========================================
   📬 방문자용 입력 제어 시스템 (편지 / 답장)
   ========================================== */
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
    document.getElementById('reply-author').value = "";
    document.getElementById('reply-content').value = "";
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
        date: getFormattedCurrentTime()
    };

    const lettersRef = window.fbRef(window.fbDB, 'global_letters');
    const newLetterPushRef = window.fbPush(lettersRef);
    window.fbSet(newLetterPushRef, newLetterItem)
        .then(() => {
            closeReplyModal();
            alert("🚀 별빛을 따라 글이 전송되었습니다!");
        })
        .catch(() => alert("전송에 실패했습니다. 네트워크를 확인해 주세요."));
}

/* ==========================================
   📨 관리자 전용 통합 우체통 관제 코어
   ========================================== */
function openMailboxModal() {
    mailboxCurrentPage = 1;
    document.getElementById('mailbox-search').value = '';
    document.getElementById('mailbox-date').value = '';
    filterMailbox();
    document.getElementById('mailbox-modal').style.display = 'flex';
}

function filterMailbox() {
    const searchVal = document.getElementById('mailbox-search').value.trim().toLowerCase();
    const dateVal = document.getElementById('mailbox-date').value;
    
    let indexed = [...globalLetters];
    indexed.reverse(); 

    if (searchVal) {
        indexed = indexed.filter(l => l.writer.toLowerCase().includes(searchVal));
    }
    if (dateVal) {
        indexed = indexed.filter(l => l.date.substring(0, 10) === dateVal);
    }

    mailboxFilteredLetters = indexed;
    renderMailboxPosts();
}

function renderMailboxPosts() {
    const listContainer = document.getElementById('mailbox-list');
    const pageZone = document.getElementById('mailbox-page-zone');
    listContainer.innerHTML = "";

    if (globalLetters.length === 0) {
        listContainer.innerHTML = `<p style="text-align:center; color:#e2e8f0; font-size:1.05rem; padding:40px 0; font-weight:bold; letter-spacing:0.5px;">☄️ 도착한 답장이 없어!</p>`;
        pageZone.style.display = 'none';
        return;
    }

    if (mailboxFilteredLetters.length === 0) {
        listContainer.innerHTML = `<p style="text-align:center; color:#a0aec0; padding:40px 0;">검색 조건에 맞는 편지가 없어..</p>';
        pageZone.style.display = 'none';
        return;
    }

    pageZone.style.display = 'flex';
    const start = (mailboxCurrentPage - 1) * mailboxLettersPerPage;
    const end = start + mailboxLettersPerPage;
    const paged = mailboxFilteredLetters.slice(start, end);

    paged.forEach(letter => {
        let originBadgeHTML = (letter.type === 'reply') 
            ? `<div class="mailbox-type-badge reply-type">💬 글 답장 | 원문: ${letter.targetTitle}</div>`
            : `<div class="mailbox-type-badge global-type">✉️ 우주 별빛 편지</div>`;

        const item = document.createElement('div');
        item.className = 'mailbox-item';
        item.innerHTML = `
            ${originBadgeHTML}
            <div class="mailbox-item-meta">
                <span style="color:#F5E6C8; font-weight:bold;">✍️ ${letter.writer}</span>
                <span style="font-size:0.8rem; color:#718096;">${letter.date}</span>
            </div>
            <p class="mailbox-item-text">${letter.text}</p>
            <button class="reply-delete-btn" onclick="deleteGlobalLetter('${letter.id}')">소멸</button>
        `;
        listContainer.appendChild(item);
    });

    document.getElementById('mailbox-page-indicator').innerText = mailboxCurrentPage;
}

function prevMailboxPage() { if (mailboxCurrentPage > 1) { mailboxCurrentPage--; renderMailboxPosts(); } }
function nextMailboxPage() { if (mailboxCurrentPage * mailboxLettersPerPage < mailboxFilteredLetters.length) { mailboxCurrentPage++; renderMailboxPosts(); } }
function resetMailboxFilter() { document.getElementById('mailbox-search').value = ''; document.getElementById('mailbox-date').value = ''; mailboxCurrentPage = 1; filterMailbox(); }

function deleteGlobalLetter(letterId) {
    if (confirm("이 우주 편지(답장)를 영구히 소멸시키겠습니까?")) {
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

/* ==========================================
   🔒 관리자 피드 기록 보존 및 수정/삭제
   ========================================== */
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

    document.getElementById('admin-panel-title').innerText = "우주의 기록 수정하기";
    document.getElementById('admin-main-btn').innerHTML = '<i class="fa-solid fa-check"></i> 빛의 기록 수정 완료하기';
    window.scrollTo({ top: document.getElementById('admin-wrapper').offsetTop - 30, behavior: 'smooth' });
}

function deletePost(postId) {
    if (confirm("정말로 이 기록을 우주에서 완전히 삭제하시겠습니까?")) {
        window.fbRemove(window.fbRef(window.fbDB, `posts/${postId}`))
            .then(() => alert("기록이 우주 너머로 소멸되었습니다."));
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
    document.getElementById('admin-panel-title').innerText = "새로운 빛의 기록";
    document.getElementById('admin-main-btn').innerHTML = '<i class="fa-solid fa-star"></i> 나의 우주에게 빛을 전하기';
}

function setSort(type) { currentSort = type; currentPage = 1; applyFilters(); }
function filterDate(date) { selectedDate = date; currentPage = 1; applyFilters(); }
function resetFilter() { 
    const picker = document.getElementById('date-picker');
    const searcher = document.getElementById('search-input');
    if (picker) picker.value = ''; 
    if (searcher) searcher.value = ''; 
    selectedDate = ''; searchQuery = ''; currentSort = 'newest';
    currentPage = 1; applyFilters(); 
}
function prevPage() { if (currentPage > 1) { currentPage--; window.scrollTo({ top: 0, behavior: 'smooth' }); renderPosts(); } }
function nextPage() { if (currentPage * postsPerPage < currentDisplayPosts.length) { currentPage++; window.scrollTo({ top: 0, behavior: 'smooth' }); renderPosts(); } }
