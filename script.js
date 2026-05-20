// 기본 탑재 데이터 (답장 보관용 replies 배열 확장)
const defaultPosts = [
  { title: "첫 번째 우주의 기록", author: "은하 관리인", date: "2026-05-20 12:00", content: "여기는 아주 조용하고 평화로운 나만의 우주입니다.", pinned: false, replies: [] },
  { title: "겨울 밤바다의 소리", author: "여행자", date: "2026-01-15 23:45", content: "차가운 파도가 하얗게 부서지는 소리가 들려옵니다.", pinned: false, replies: [] },
  { title: "작은 별 하나", author: "스텔라", date: "2026-01-10 03:10", content: "가장 작게 빛나는 별에게 나의 마음을 전합니다.", pinned: false, replies: [] }
];

let myPosts = JSON.parse(localStorage.getItem('galaxy_posts'));
if (!myPosts) {
    myPosts = defaultPosts;
    localStorage.setItem('galaxy_posts', JSON.stringify(myPosts));
}

let currentDisplayPosts = []; 
let currentPage = 1;
const postsPerPage = 3; 
let currentSort = 'newest';
let selectedDate = '';
let searchQuery = '';
let isAdminMode = false;
let adminName = ''; 

let activePostIndexForReply = null; // 현재 답장을 쓰거나 확인중인 글의 인덱스

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

// 초기화 구동 및 로그인 절차 제어 커널
document.addEventListener("DOMContentLoaded", function() {
    startSnowingEffect();

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('mode') === 'sea') {
        setTimeout(function() {
            const passwordInput = prompt("🔒 관리자 시스템 보안 인증\n비밀번호를 입력해 주세요:");
            if (passwordInput === "0416haeunashi0416!*!26") {
                
                const nameInput = prompt("✍️ 우주에 새겨질 관리자 이름을 입력해 주세요:");
                if(nameInput && nameInput.trim() !== "") {
                    adminName = nameInput.trim();
                } else {
                    adminName = "무명 관리인"; 
                }

                isAdminMode = true;
                document.getElementById('admin-wrapper').style.display = 'block';
                
                const sheet = window.document.styleSheets[0];
                sheet.insertRule('.admin-card-controls { display: flex !important; }', sheet.cssRules.length);
                
                alert(`🔓 인증 성공. 반갑습니다, ${adminName}님.`);
                applyFilters(); 
            } else {
                alert("❌ 비밀번호가 일치하지 않습니다.");
                window.location.href = window.location.pathname; 
            }
        }, 200);
    }
    applyFilters();
});

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

// 피드 빌더 (답장 단추 vs 편지지 아이콘 분기 로직 탑재)
function renderPosts() {
    const start = (currentPage - 1) * postsPerPage;
    const end = start + postsPerPage;
    const pagedPosts = currentDisplayPosts.slice(start, end);
    
    const container = document.getElementById('post-list');
    if (!container) return;
    container.innerHTML = '';

    if (pagedPosts.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#718096; padding: 50px 0;">조건에 맞는 기록을 찾을 수 없습니다.</p>';
        return;
    }

    pagedPosts.forEach(post => {
        const originalIndex = myPosts.findIndex(p => p.title === post.title && p.date === post.date && p.content === post.content);
        const isPinned = post.pinned === true;
        const authorDisplay = post.author ? post.author : "알 수 없음"; 
        const replyCount = post.replies ? post.replies.length : 0;

        // 📬 모드에 따른 답장 UI 분기처리
        let replyButtonHTML = '';
        if (isAdminMode) {
            // 관리자: 답장 보내기 버튼이 없고 대신 답장을 확인하는 [편지지 아이콘] 등장
            replyButtonHTML = `
                <button class="mailbox-view-btn" onclick="openMailboxModal(${originalIndex})">
                    <i class="fa-solid fa-envelope-open-text"></i> 편지함 (${replyCount})
                </button>
            `;
        } else {
            // 방문자: [답장 보내기] 버튼 제공
            replyButtonHTML = `
                <button class="visitor-reply-btn" onclick="openReplyModal(${originalIndex})">
                    <i class="fa-solid fa-paper-plane"></i> 답장 보내기
                </button>
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
            
            <div class="reply-zone">
                ${replyButtonHTML}
            </div>
            
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
   📬 방문자용 답장 프로세서 구동부
   ========================================== */
function openReplyModal(index) {
    activePostIndexForReply = index;
    document.getElementById('reply-target-title').innerText = `원문: "${myPosts[index].title}"`;
    document.getElementById('reply-author').value = "";
    document.getElementById('reply-content').value = "";
    document.getElementById('reply-modal').style.display = 'flex';
}

function closeReplyModal() {
    document.getElementById('reply-modal').style.display = 'none';
}

function submitReply() {
    const author = document.getElementById('reply-author').value.trim();
    const content = document.getElementById('reply-content').value.trim();

    if (!author || !content) {
        return alert("이름과 답장 내용을 모두 채워주세요.");
    }

    if (!myPosts[activePostIndexForReply].replies) {
        myPosts[activePostIndexForReply].replies = [];
    }

    // 답장 저장
    myPosts[activePostIndexForReply].replies.push({
        writer: author,
        text: content.replace(/\n/g, '<br>'),
        date: getFormattedCurrentTime()
    });

    syncStorage();
    closeReplyModal();
    alert("🚀 답장이 별빛을 타고 전송되었습니다!");
    applyFilters();
}

/* ==========================================
   📨 관리자 전용 우체통 열람 제어 모듈
   ========================================== */
function openMailboxModal(index) {
    activePostIndexForReply = index;
    const post = myPosts[index];
    document.getElementById('mailbox-target-title').innerText = `"${post.title}" 글에 도착한 편지`;
    
    const listContainer = document.getElementById('mailbox-list');
    listContainer.innerHTML = "";

    const replies = post.replies || [];
    if (replies.length === 0) {
        listContainer.innerHTML = `<p style="text-align:center; color:#a0aec0; padding:30px 0;">아직 도착한 우주 편지가 없습니다.</p>`;
    } else {
        // 최신 답장이 위로 오도록 반대로 표시
        [...replies].reverse().forEach((reply, revIdx) => {
            // 거꾸로 돌렸으므로 실제 원본 인덱스 연산
            const realReplyIndex = replies.length - 1 - revIdx;
            
            const item = document.createElement('div');
            item.className = 'mailbox-item';
            item.innerHTML = `
                <div class="mailbox-item-meta">
                    <span style="color:#F5E6C8; font-weight:bold;">✍️ ${reply.writer}</span>
                    <span style="font-size:0.8rem; color:#718096;">${reply.date}</span>
                </div>
                <p class="mailbox-item-text">${reply.text}</p>
                <button class="reply-delete-btn" onclick="deleteReply(${realReplyIndex})">편지 소멸</button>
            `;
            listContainer.appendChild(item);
        });
    }
    document.getElementById('mailbox-modal').style.display = 'flex';
}

function closeMailboxModal() {
    document.getElementById('mailbox-modal').style.display = 'none';
}

function deleteReply(replyIndex) {
    if (confirm("이 답장 편지를 영구히 삭제하시겠습니까?")) {
        myPosts[activePostIndexForReply].replies.splice(replyIndex, 1);
        syncStorage();
        // 편지함 내용 실시간 갱신
        openMailboxModal(activePostIndexForReply);
        applyFilters();
    }
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
            pinned: false,
            replies: [] // 새 글 생성 시에도 답장 리스트 빈 배열로 확보
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

    document.getElementById('admin-panel-title').innerText = "우주의 기록 수정하기";
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
