// 기본 탑재 데이터
const defaultPosts = [
  { title: "첫 번째 우주의 기록", author: "은하 관리인", date: "2026-05-20 12:00", content: "여기는 아주 조용하고 평화로운 나만의 우주입니다.", pinned: false },
  { title: "겨울 밤바다의 소리", author: "여행자", date: "2026-01-15 23:45", content: "차가운 파도가 하얗게 부서지는 소리가 들려옵니다.", pinned: false },
  { title: "작은 별 하나", author: "스텔라", date: "2026-01-10 03:10", content: "가장 작게 빛나는 별에게 나의 마음을 전합니다.", pinned: false }
];

let myPosts = JSON.parse(localStorage.getItem('galaxy_posts'));
if (!myPosts) {
    myPosts = defaultPosts;
    localStorage.setItem('galaxy_posts', JSON.stringify(myPosts));
}

// 📬 글로벌 통합 편지 데이터 레이어 스토리지 연동
let globalLetters = JSON.parse(localStorage.getItem('galaxy_global_letters')) || [];

let currentDisplayPosts = []; 
let currentPage = 1;
const postsPerPage = 3; 
let currentSort = 'newest';
let selectedDate = '';
let searchQuery = '';
let isAdminMode = false;
let adminName = ''; 

// 📨 통합 우체통 모달 전용 상태 제어 변수
let mailboxFilteredLetters = [];
let mailboxCurrentPage = 1;
const mailboxLettersPerPage = 3; 

function startSnowingEffect() {
    const container = document.getElementById('snow-container');
    if (!container) return;
    for (let i = 0; i < 40; i++) {
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

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('mode') === 'sea') {
        setTimeout(function() {
            const passwordInput = prompt("관리자 시스템 보안 인증! \n비밀번호를 입력해 주세요:");
            if (passwordInput === "0416haeunashi0416!*!26") {
                
                const nameInput = prompt("우주에 새겨질 빛의 기록자 이름을 입력해 주세요:");
                if(nameInput && nameInput.trim() !== "") {
                    adminName = nameInput.trim();
                } else {
                    adminName = "빛의 기록자"; 
                }

                isAdminMode = true;
                document.getElementById('admin-wrapper').style.display = 'block';
                
                const sheet = window.document.styleSheets[0];
                sheet.insertRule('.admin-card-controls { display: flex !important; }', sheet.cssRules.length);
                
                alert(`빛의 기록자 ${adminName}님! 어서오세요~!`);
                updateMailboxButtonUI();
                applyFilters(); 
            } else {
                alert("비밀번호가 일치하지 않아요..ㅜ 다시 확인해주세요");
                window.location.href = window.location.pathname; 
            }
        }, 200);
    } else {
        updateMailboxButtonUI();
    }
    applyFilters();
});

// 상단 우체통 제어 단추를 모드에 맞게 동적 바인딩하는 로직
function updateMailboxButtonUI() {
    const btn = document.getElementById('global-mailbox-btn');
    if (!btn) return;

    if (isAdminMode) {
        btn.innerHTML = `<i class="fa-solid fa-envelope-open-text"></i> 📬 빛의 우체통 (${globalLetters.length})`;
        btn.className = "winter-btn main-mailbox-trigger admin-mailbox-theme";
    } else {
        btn.innerHTML = `<i class="fa-solid fa-paper-plane"></i> ✉️ 하은이에게 편지 쓰기`;
        btn.className = "winter-btn main-mailbox-trigger visitor-mailbox-theme";
    }
}

// 메인 우체통 버튼 클릭 시 분기 커널
function handleMailboxClick() {
    if (isAdminMode) {
        openMailboxModal();
    } else {
        openReplyModal();
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
    if (searchQuery) filtered = filtered.filter(p => p.title.toLowerCase().includes(searchQuery));

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
        container.innerHTML = '<p style="text-align:center; color:#718096; padding: 50px 0;">빛의 기록을 찾을 수 없습니다.</p>';
        return;
    }

    pagedPosts.forEach(post => {
        const originalIndex = myPosts.findIndex(p => p.title === post.title && p.date === post.date && p.content === post.content);
        const isPinned = post.pinned === true;
        const authorDisplay = post.author ? post.author : "알 수 없음"; 

        const card = document.createElement('div');
        card.className = `post-card ${isPinned ? 'pinned' : ''}`;
        card.innerHTML = `
            <div class="post-date">
                ${isPinned ? '<span class="pin-badge"><i class="fa-solid fa-thumbtack"></i> 고정됨</span> | ' : ''} 
                <span class="author-tag">⭐ ${authorDisplay}</span> | ${post.date}
            </div>
            <h2 class="post-title">${post.title}</h2>
            <p>${post.content}</p>
            
            <div class="admin-card-controls">
                <button class="admin-mini-btn ${isPinned ? 'pin-active' : ''}" onclick="togglePin(${originalIndex})">
                    <i class="fa-solid fa-thumbtack"></i> ${isPinned ? '고정해제' : '글고정'}
                </button>
                <button class="admin-mini-btn" onclick="startEditPost(${originalIndex})">
                    <i class="fa-solid fa-pen"></i> 수정
                </button>
                <button class="admin-mini-btn del-btn" onclick="deletePost(${originalIndex})">
                    <i class="fa-solid fa-trash-can"></i> 삭제
                </button>
            </div>
        `;
        container.appendChild(card);
    });
    
    const pageIndicator = document.getElementById('page-indicator');
    if (pageIndicator) pageIndicator.innerText = currentPage;
}

/* ==========================================
   📬 방문자 전용 글로벌 편지 전송 파트
   ========================================== */
function openReplyModal() {
    document.getElementById('reply-author').value = "";
    document.getElementById('reply-content').value = "";
    document.getElementById('reply-modal').style.display = 'flex';
}

function closeReplyModal() {
    document.getElementById('reply-modal').style.display = 'none';
}

function submitGlobalLetter() {
    const author = document.getElementById('reply-author').value.trim();
    const content = document.getElementById('reply-content').value.trim();

    if (!author || !content) {
        return alert("이름과 편지 내용을 모두 채워주세요.");
    }

    // 전역 편지 배열에 삽입
    globalLetters.push({
        writer: author,
        text: content.replace(/\n/g, '<br>'),
        date: getFormattedCurrentTime()
    });

    localStorage.setItem('galaxy_global_letters', JSON.stringify(globalLetters));
    closeReplyModal();
    alert("🚀 편지가 빛의 길을 따라 하은이에게 전송되었어!");
    updateMailboxButtonUI();
}

/* ==========================================
   📨 관리자 전용 통합 우체통 관제 모듈 (검색, 페이징 포함)
   ========================================== */
function openMailboxModal() {
    mailboxCurrentPage = 1;
    
    const searchInput = document.getElementById('mailbox-search');
    const dateInput = document.getElementById('mailbox-date');
    if(searchInput) searchInput.value = '';
    if(dateInput) dateInput.value = '';

    filterMailbox();
    document.getElementById('mailbox-modal').style.display = 'flex';
}

function filterMailbox() {
    const searchVal = document.getElementById('mailbox-search').value.trim().toLowerCase();
    const dateVal = document.getElementById('mailbox-date').value;
    
    // 원본 위치 추적을 위한 데이터 맵 가공 및 최신편지 상단 역순 배치
    let indexedLetters = globalLetters.map((l, idx) => ({ ...l, originalIndex: idx }));
    indexedLetters.reverse();

    if (searchVal) {
        indexedLetters = indexedLetters.filter(l => l.writer.toLowerCase().includes(searchVal));
    }
    if (dateVal) {
        indexedLetters = indexedLetters.filter(l => l.date.substring(0, 10) === dateVal);
    }

    mailboxFilteredLetters = indexedLetters;
    renderMailboxPosts();
}

function renderMailboxPosts() {
    const listContainer = document.getElementById('mailbox-list');
    const pageZone = document.getElementById('mailbox-page-zone');
    listContainer.innerHTML = "";

    // 1. 편지함 자체가 완전히 비어있을 때 표출 조건 (요청 사안 완벽 가동)
    if (globalLetters.length === 0) {
        listContainer.innerHTML = `<p style="text-align:center; color:#e2e8f0; font-size:1.05rem; padding:40px 0; font-weight:bold; letter-spacing:0.5px;"> 도착한 답장이 없어!</p>`;
        pageZone.style.display = 'none';
        return;
    }

    // 2. 편지는 있으나 검색 결과에 매칭되는 게 없을 때 조건
    if (mailboxFilteredLetters.length === 0) {
        listContainer.innerHTML = `<p style="text-align:center; color:#a0aec0; padding:40px 0;">검색 조건에 맞는 편지가 없습니다.</p>`;
        pageZone.style.display = 'none';
        return;
    }

    // 3개 단위 스케일링 슬라이싱 연산 진행
    pageZone.style.display = 'flex';
    const start = (mailboxCurrentPage - 1) * mailboxLettersPerPage;
    const end = start + mailboxLettersPerPage;
    const pagedLetters = mailboxFilteredLetters.slice(start, end);

    pagedLetters.forEach(letter => {
        const item = document.createElement('div');
        item.className = 'mailbox-item';
        item.innerHTML = `
            <div class="mailbox-item-meta">
                <span style="color:#F5E6C8; font-weight:bold;">✍️ ${letter.writer}</span>
                <span style="font-size:0.8rem; color:#718096;">${letter.date}</span>
            </div>
            <p class="mailbox-item-text">${letter.text}</p>
            <button class="reply-delete-btn" onclick="deleteGlobalLetter(${letter.originalIndex})">편지 소멸</button>
        `;
        listContainer.appendChild(item);
    });

    document.getElementById('mailbox-page-indicator').innerText = mailboxCurrentPage;
}

function prevMailboxPage() {
    if (mailboxCurrentPage > 1) {
        mailboxCurrentPage--;
        renderMailboxPosts();
    }
}

function nextMailboxPage() {
    if (mailboxCurrentPage * mailboxLettersPerPage < mailboxFilteredLetters.length) {
        mailboxCurrentPage++;
        renderMailboxPosts();
    }
}

function resetMailboxFilter() {
    document.getElementById('mailbox-search').value = '';
    document.getElementById('mailbox-date').value = '';
    mailboxCurrentPage = 1;
    filterMailbox();
}

function deleteGlobalLetter(originalIndex) {
    if (confirm("이 우주 편지를 영구히 소멸시키겠습니까?")) {
        globalLetters.splice(originalIndex, 1);
        localStorage.setItem('galaxy_global_letters', JSON.stringify(globalLetters));
        
        const maxPage = Math.ceil(globalLetters.length / mailboxLettersPerPage);
        if (mailboxCurrentPage > maxPage && maxPage > 0) {
            mailboxCurrentPage = maxPage;
        }
        
        filterMailbox();
        updateMailboxButtonUI();
    }
}

function closeMailboxModal() {
    document.getElementById('mailbox-modal').style.display = 'none';
}

function syncStorage() {
    localStorage.setItem('galaxy_posts', JSON.stringify(myPosts));
}

function getFormattedCurrentTime() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
}

function savePost() {
    const titleVal = document.getElementById('new-title').value.trim();
    const contentVal = document.getElementById('new-content').value.trim();
    const editIndex = document.getElementById('edit-index').value;

    if (!titleVal || !contentVal) {
        return alert("기록 양식을 빠짐없이 기입해 주세요.");
    }

    const cleanContent = contentVal.replace(/\n/g, '<br>');

    if (editIndex !== "") {
        myPosts[parseInt(editIndex)].title = titleVal;
        myPosts[parseInt(editIndex)].content = cleanContent;
        alert("기록이 수정되었습니다.");
    } else {
        const autoDateTime = getFormattedCurrentTime();
        myPosts.unshift({
            title: titleVal,
            author: adminName, 
            date: autoDateTime, 
            content: cleanContent,
            pinned: false
        });
        alert("빛나는 새로운 기록이 보존되었습니다.");
    }

    clearAdminForm();
    toggleAdminForm(); 
    syncStorage();
    applyFilters();
}

function startEditPost(index) {
    const post = myPosts[index];
    const form = document.getElementById('admin-area');
    if (form.style.display === 'none') toggleAdminForm();

    document.getElementById('new-title').value = post.title;
    document.getElementById('new-content').value = post.content.replace(/<br>/g, '\n');
    document.getElementById('edit-index').value = index;

    document.getElementById('admin-panel-title').innerText = "빛의 기록 수정하기";
    document.getElementById('admin-main-btn').innerHTML = '<i class="fa-solid fa-check"></i> 빛의 기록 수정 완료하기';
    
    window.scrollTo({ top: document.getElementById('admin-wrapper').offsetTop - 30, behavior: 'smooth' });
}

function deletePost(index) {
    if (confirm("정말로 이 기록을 우주에서 완전히 삭제하시겠습니까?")) {
        myPosts.splice(index, 1);
        syncStorage();
        applyFilters();
        alert("기록이 우주 너머로 소멸되었습니다.");
    }
}

function togglePin(index) {
    myPosts[index].pinned = !myPosts[index].pinned;
    syncStorage();
    applyFilters();
}

function clearAdminForm() {
    document.getElementById('new-title').value = "";
    document.getElementById('new-content').value = "";
    document.getElementById('edit-index').value = "";
    document.getElementById('admin-panel-title').innerText = "새로운 우주의 기록";
    document.getElementById('admin-main-btn').innerHTML = '<i class="fa-solid fa-star"></i> 나의 우주에게 빛을 보내기';
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
