// 📦 기초 데이터 구조 정의
const defaultPosts = [
  { title: "첫 번째 우주의 기록", date: "2026-05-20", content: "여기는 아주 조용하고 평화로운 나만의 우주입니다.", pinned: false },
  { title: "겨울 밤바다의 소리", date: "2026-01-15", content: "차가운 파도가 하얗게 부서지는 소리가 들려옵니다.", pinned: false },
  { title: "작은 별 하나", date: "2026-01-10", content: "가장 작게 빛나는 별에게 나의 마음을 전합니다.", pinned: false }
];

// 로컬스토리지 연동 브릿지 활성화
let myPosts = JSON.parse(localStorage.getItem('galaxy_posts'));
if (!myPosts) {
    myPosts = defaultPosts;
    localStorage.setItem('galaxy_posts', JSON.stringify(myPosts));
}

// 렌더링용 변수셋
let currentDisplayPosts = []; 
let currentPage = 1;
const postsPerPage = 3; 
let currentSort = 'newest';
let selectedDate = '';
let searchQuery = '';
let isAdminMode = false; // 기본 모드는 거짓(사용자 환경)

// ❄️ 눈 내리는 밤 연출
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

// 🚀 페이지 초기화 센서 및 관리자 보안 확인 장치
document.addEventListener("DOMContentLoaded", function() {
    startSnowingEffect();

    const urlParams = new URLSearchParams(window.location.search);
    
    // 주소창 뒤에 ?mode=sea 가 적혀 있을 때만 관리자 모드 프롬프트 발동
    if (urlParams.get('mode') === 'sea') {
        setTimeout(function() {
            const passwordInput = prompt("🔒 관리자 시스템 보안 인증\n비밀번호를 입력해 주세요:");
            
            if (passwordInput === "0416haeunashi0416!*!26") {
                isAdminMode = true; // 관리자 인증 완료 플래그 적용
                
                // 1. 숨겨진 상단 글쓰기 패널 박스 노출
                document.getElementById('admin-wrapper').style.display = 'block';
                
                // 2. 글 내부 관리 단추(고정/수정/삭제)를 노출하는 CSS 규칙을 실시간 주입
                const sheet = window.document.styleSheets[0];
                sheet.insertRule('.admin-card-controls { display: flex !important; }', sheet.cssRules.length);
                
                alert("🔓 관리자 인증 성공. 우주의 제어 장치들이 연결되었습니다.");
                applyFilters(); // 관리자 전용 제어 단추들이 렌더링되도록 다시 한번 갱신
            } else {
                alert("❌ 비밀번호가 올치하지 않습니다.");
                // 비정상 접근 시 일반 주소로 튕겨내기 처리
                window.location.href = window.location.pathname; 
            }
        }, 200);
    }

    applyFilters();
});

// ✍️ 글쓰기 컴포넌트 여닫기 토글러
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

// 🔍 실시간 제목 검색 핸들러
function searchTitle(value) {
    searchQuery = value.trim().toLowerCase();
    currentPage = 1; 
    applyFilters();
}

// 🛠️ 필터 및 상단 고정 병합 정렬 장치
function applyFilters() {
    let filtered = [...myPosts];

    if (selectedDate) filtered = filtered.filter(p => p.date === selectedDate);
    if (searchQuery) filtered = filtered.filter(p => p.title.toLowerCase().includes(searchQuery));

    // 일반 날짜 정렬 작동
    filtered.sort((a, b) => {
        return currentSort === 'newest' ? new Date(b.date) - new Date(a.date) : new Date(a.date) - new Date(b.date);
    });

    // 📌 상단 고정 처리된 포스트 최상단 강제 리배치 연산
    filtered.sort((a, b) => (b.pinned || false) - (a.pinned || false));

    currentDisplayPosts = filtered;
    renderPosts();
}

// 📜 피드 생성 출력 엔진
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

// 로컬스토리지 백업 저장 처리
function syncStorage() {
    localStorage.setItem('galaxy_posts', JSON.stringify(myPosts));
}

// 1) 포스트 저장 (등록 및 수정 커밋)
function savePost() {
    const titleVal = document.getElementById('new-title').value.trim();
    const dateVal = document.getElementById('new-date').value;
    const contentVal = document.getElementById('new-content').value.trim();
    const editIndex = document.getElementById('edit-index').value;

    if (!titleVal || !dateVal || !contentVal) {
        return alert("기록 양식을 빠짐없이 기입해 주세요.");
    }

    const cleanContent = contentVal.replace(/\n/g, '<br>');

    if (editIndex !== "") {
        myPosts[parseInt(editIndex)].title = titleVal;
        myPosts[parseInt(editIndex)].date = dateVal;
        myPosts[parseInt(editIndex)].content = cleanContent;
        alert("기록이 수정되었습니다.");
    } else {
        myPosts.unshift({
            title: titleVal,
            date: dateVal,
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

// 2) 수정 프로세스 발동
function startEditPost(index) {
    const post = myPosts[index];
    const form = document.getElementById('admin-area');
    if (form.style.display === 'none') toggleAdminForm();

    document.getElementById('new-title').value = post.title;
    document.getElementById('new-date').value = post.date;
    document.getElementById('new-content').value = post.content.replace(/<br>/g, '\n');
    document.getElementById('edit-index').value = index;

    document.getElementById('admin-panel-title').innerText = "✏️ 우주의 기록 수정하기 (관리자)";
    document.getElementById('admin-main-btn').innerHTML = '<i class="fa-solid fa-check"></i> 빛의 기록 수정 완료하기';
    
    window.scrollTo({ top: document.getElementById('admin-wrapper').offsetTop - 30, behavior: 'smooth' });
}

// 3) 글 삭제
function deletePost(index) {
    if (confirm("정말로 이 기록을 우주에서 완전히 삭제하시겠습니까?")) {
        myPosts.splice(index, 1);
        syncStorage();
        applyFilters();
        alert("기록이 우주 너머로 소멸되었습니다.");
    }
}

// 4) 핀 고정 제어
function togglePin(index) {
    myPosts[index].pinned = !myPosts[index].pinned;
    syncStorage();
    applyFilters();
}

// 5) 입력 필드 청소 리셋
function clearAdminForm() {
    document.getElementById('new-title').value = "";
    document.getElementById('new-date').value = "";
    document.getElementById('new-content').value = "";
    document.getElementById('edit-index').value = "";
    document.getElementById('admin-panel-title').innerText = "✍️ 새로운 우주의 기록 (관리자)";
    document.getElementById('admin-main-btn').innerHTML = '<i class="fa-solid fa-star"></i> ⭐ 나의 우주에게 빛을 전하기';
}

// 필터 컨트롤러 스텁 함수들
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
