// ==========================================
// ✍️ [우주의 역사 데이터 저장소] 
// 관리자창 하단에 생성되는 코드를 통째로 복사해서 이곳에 대치(덮어쓰기)하세요.
// ==========================================
let myPosts = [
  { title: "첫 번째 우주의 기록", date: "2026-05-20", content: "여기는 아주 조용하고 평화로운 나만의 우주입니다.", pinned: false },
  { title: "겨울 밤바다의 소리", date: "2026-01-15", content: "차가운 파도가 하얗게 부서지는 소리가 들려옵니다.", pinned: false },
  { title: "작은 별 하나", date: "2026-01-10", content: "가장 작게 빛나는 별에게 나의 마음을 전합니다.", pinned: false }
];

// 시스템 제어 전역 매개변수
let currentDisplayPosts = []; 
let currentPage = 1;
const postsPerPage = 3; 
let currentSort = 'newest';
let selectedDate = '';
let searchQuery = '';
let isAdminMode = false; // 관리자 모드 가동 상태 체크

// ❄️ 실시간 눈 내리기 효과
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

// 🚀 주 시스템 통합 구동 컨트롤러
document.addEventListener("DOMContentLoaded", function() {
    startSnowingEffect();

    const urlParams = new URLSearchParams(window.location.search);
    
    if (urlParams.get('mode') === 'sea') {
        setTimeout(function() {
            const passwordInput = prompt("관리자 인증 시스템입니다.\n비밀번호를 입력해 주세요:");
            
            if (passwordInput === "0416haeunashi0416!*!26") {
                isAdminMode = true;
                document.getElementById('admin-area').style.display = 'block';
                
                // 관리자용 소형 편집 버튼들을 보이기 위해 CSS 동적 주입
                const sheet = window.document.styleSheets[0];
                sheet.insertRule('.admin-card-controls { display: flex !important; }', sheet.cssRules.length);
                
                alert("인증에 성공했습니다. 우주의 제어 버튼들이 활성화됩니다.");
                updateOutputCode();
            } else {
                alert("비밀번호가 일치하지 않습니다.");
                window.location.href = window.location.pathname; 
            }
        }, 200);
    }

    applyFilters();
});

// 🔍 실시간 제목 필터 처리
function searchTitle(value) {
    searchQuery = value.trim().toLowerCase();
    currentPage = 1; 
    applyFilters();
}

// 🛠️ 정렬, 날짜 필터, 제목 검색 및 [상단 고정 우선 배치] 로직 융합
function applyFilters() {
    let filtered = [...myPosts];

    // 1. 날짜 처리
    if (selectedDate) {
        filtered = filtered.filter(p => p.date === selectedDate);
    }

    // 2. 제목 검색 처리
    if (searchQuery) {
        filtered = filtered.filter(p => p.title.toLowerCase().includes(searchQuery));
    }

    // 3. 정렬 알고리즘 작동 (기본 정렬 진행)
    filtered.sort((a, b) => {
        return currentSort === 'newest' ? new Date(b.date) - new Date(a.date) : new Date(a.date) - new Date(b.date);
    });

    // ⭐ 핵심 알고리즘: 고정(pinned: true)된 포스트를 최상단으로 재배치
    filtered.sort((a, b) => (b.pinned || false) - (a.pinned || false));

    currentDisplayPosts = filtered;
    renderPosts();
}

// 📜 가공된 카드를 화면에 뿌려주는 핵심 렌더러
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
        // 원본 배열(myPosts)에서의 정확한 실시간 인덱스를 추적하여 제어권 매칭
        const originalIndex = myPosts.findIndex(p => p.title === post.title && p.date === post.date && p.content === post.content);
        
        const isPinned = post.pinned === true;

        const card = document.createElement('div');
        card.className = `post-card ${isPinned ? 'pinned' : ''}`;
        card.innerHTML = `
            <div class="post-date">
                ${isPinned ? '<span class="pin-badge"><i class="fa-solid fa-thumbtack"></i> 고정됨</span> | ' : ''} 
                ${post.date}
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

// ==========================================
// 🔒 관리자 전용 제어 액션 백엔드 로직 함수군
// ==========================================

// 1) 글 작성 및 수정본 임시 세이브 처리
function savePost() {
    const titleVal = document.getElementById('new-title').value.trim();
    const dateVal = document.getElementById('new-date').value;
    const contentVal = document.getElementById('new-content').value.trim();
    const editIndex = document.getElementById('edit-index').value;

    if (!titleVal || !dateVal || !contentVal) {
        return alert("우주 기록 양식을 빠짐없이 기입해 주세요.");
    }

    const cleanContent = contentVal.replace(/\n/g, '<br>');

    if (editIndex !== "") {
        // [수정 모드 실행]
        myPosts[parseInt(editIndex)].title = titleVal;
        myPosts[parseInt(editIndex)].date = dateVal;
        myPosts[parseInt(editIndex)].content = cleanContent;
        alert("기록이 성공적으로 수정되었습니다.");
    } else {
        // [신규 작성 모드 실행]
        myPosts.unshift({
            title: titleVal,
            date: dateVal,
            content: cleanContent,
            pinned: false
        });
        alert("새로운 우주의 기록이 등록되었습니다.");
    }

    clearAdminForm();
    applyFilters();
    updateOutputCode();
}

// 2) 수정 모드 진입 (기존 텍스트를 관리자 입력창으로 이식)
function startEditPost(index) {
    const post = myPosts[index];
    document.getElementById('new-title').value = post.title;
    document.getElementById('new-date').value = post.date;
    // 브라우저 출력용 줄바꿈 태그(<br>)를 다시 텍스트창용 줄바꿈(\n)으로 역치환
    document.getElementById('new-content').value = post.content.replace(/<br>/g, '\n');
    document.getElementById('edit-index').value = index;

    document.getElementById('admin-panel-title').innerText = "✏️ 우주의 기록 수정하기 (관리자)";
    document.getElementById('admin-main-btn').innerHTML = '<i class="fa-solid fa-check"></i> 수정 완료하기';
    document.getElementById('admin-cancel-btn').style.display = "block";
    
    window.scrollTo({ top: document.getElementById('admin-area').offsetTop - 30, behavior: 'smooth' });
}

// 3) 글 삭제 처리
function deletePost(index) {
    if (confirm("정말로 이 기록을 우주에서 완전히 영구 삭제하시겠습니까?")) {
        myPosts.splice(index, 1);
        applyFilters();
        updateOutputCode();
        alert("기록이 삭제되었습니다.");
    }
}

// 4) 상단 글 고정 / 해제 스위치 토글 기능
function togglePin(index) {
    myPosts[index].pinned = !myPosts[index].pinned;
    applyFilters();
    updateOutputCode();
}

// 5) 관리자 폼 초기화 리셋
function clearAdminForm() {
    document.getElementById('new-title').value = "";
    document.getElementById('new-date').value = "";
    document.getElementById('new-content').value = "";
    document.getElementById('edit-index').value = "";
    
    document.getElementById('admin-panel-title').innerText = "✍️ 새로운 우주의 기록 (관리자)";
    document.getElementById('admin-main-btn').innerHTML = '<i class="fa-solid fa-pen-nib"></i> 우주에 글 등록하기';
    document.getElementById('admin-cancel-btn').style.display = "none";
}

// 6) 데이터 변동 시 코드를 자동 재배출해 주는 장치
function updateOutputCode() {
    const outputField = document.getElementById('code-output');
    if (!outputField) return;
    
    // 이쁘게 정렬된 문자열 객체 코드로 가공
    let codeString = "[\n";
    myPosts.forEach((p, i) => {
        codeString += `    { title: "${p.title}", date: "${p.date}", content: "${p.content}", pinned: ${p.pinned || false} }${i === myPosts.length - 1 ? '' : ','}\n`;
    });
    codeString += "]";
    
    outputField.value = codeString;
}

// 일반 필터 바인딩 함수군
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
