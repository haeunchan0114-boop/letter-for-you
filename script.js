// ✍️ [우주의 역사 데이터]
let myPosts = [
    { title: "첫 번째 우주의 기록", date: "2026-05-20", content: "여기는 아주 조용하고 평화로운 나만의 우주입니다." },
    { title: "겨울 밤바다의 소리", date: "2026-01-15", content: "차가운 파도가 하얗게 부서지는 소리가 들려옵니다." },
    { title: "작은 별 하나", date: "2026-01-10", content: "가장 작게 빛나는 별에게 나의 마음을 전합니다." }
];

// 시스템 제어 변수
let currentDisplayPosts = [...myPosts]; 
let currentPage = 1;
const postsPerPage = 3; 
let currentSort = 'newest';
let selectedDate = '';
let searchQuery = '';

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

// 🚀 즉시 작동하는 메인 제어기
document.addEventListener("DOMContentLoaded", function() {
    startSnowingEffect();

    const urlParams = new URLSearchParams(window.location.search);
    
    if (urlParams.get('mode') === 'sea') {
        setTimeout(function() {
            // 복잡한 해싱을 걷어내고 지정하신 고유 비밀번호 원문과 직관적으로 1:1 대조합니다.
            const passwordInput = prompt("관리자 인증 시스템입니다.\n비밀번호를 입력해 주세요:");
            
            if (passwordInput) {
                if (passwordInput === "0416haeunashi0416!*!26") {
                    const adminPanel = document.getElementById('admin-area');
                    if (adminPanel) {
                        adminPanel.style.display = 'block';
                        alert("인증에 성공했습니다. 관리자 작성 폼이 활성화됩니다.");
                    }
                } else {
                    alert("비밀번호가 일치하지 않습니다.");
                    window.location.href = window.location.pathname; 
                }
            } else {
                window.location.href = window.location.pathname; 
            }
        }, 200);
    }

    renderPosts();
});

// 🔍 제목 검색 실시간 반응 처리 함수
function searchTitle(value) {
    searchQuery = value.trim().toLowerCase();
    currentPage = 1; // 검색할 때 첫 페이지로 이동
    applyFilters();
}

// 🛠️ 정렬, 날짜 필터, 제목 검색을 한곳에 융합 처리하는 마스터 함수
function applyFilters() {
    let filtered = [...myPosts];

    // 1. 날짜 필터링 적용
    if (selectedDate) {
        filtered = filtered.filter(p => p.date === selectedDate);
    }

    // 2. 제목 검색어 필터링 적용
    if (searchQuery) {
        filtered = filtered.filter(p => p.title.toLowerCase().includes(searchQuery));
    }

    currentDisplayPosts = filtered;
    renderPosts();
}

// 📜 화면에 가공된 포스트 카드를 빌드하는 함수
function renderPosts() {
    currentDisplayPosts.sort((a, b) => {
        return currentSort === 'newest' ? new Date(b.date) - new Date(a.date) : new Date(a.date) - new Date(b.date);
    });

    const start = (currentPage - 1) * postsPerPage;
    const end = start + postsPerPage;
    const pagedPosts = currentDisplayPosts.slice(start, end);
    
    const container = document.getElementById('post-list');
    if (!container) return;
    container.innerHTML = '';

    if (pagedPosts.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#718096; padding: 60px 0;">조건에 맞는 기록을 찾을 수 없습니다.</p>';
        return;
    }

    pagedPosts.forEach(post => {
        const card = document.createElement('div');
        card.className = 'post-card';
        card.innerHTML = `
            <div class="post-date">${post.date}</div>
            <h2 class="post-title">${post.title}</h2>
            <p>${post.content}</p>
        `;
        container.appendChild(card);
    });
    
    const pageIndicator = document.getElementById('page-indicator');
    if (pageIndicator) pageIndicator.innerText = currentPage;
}

// 상단 유틸리티 이벤트 바인딩
function setSort(type) { currentSort = type; currentPage = 1; renderPosts(); }
function filterDate(date) { selectedDate = date; currentPage = 1; applyFilters(); }

function resetFilter() { 
    const picker = document.getElementById('date-picker');
    const searcher = document.getElementById('search-input');
    if (picker) picker.value = ''; 
    if (searcher) searcher.value = ''; 
    selectedDate = '';
    searchQuery = '';
    currentDisplayPosts = [...myPosts]; 
    currentPage = 1; 
    renderPosts(); 
}

function prevPage() { if (currentPage > 1) { currentPage--; window.scrollTo({ top: 0, behavior: 'smooth' }); renderPosts(); } }
function nextPage() { if (currentPage * postsPerPage < currentDisplayPosts.length) { currentPage++; window.scrollTo({ top: 0, behavior: 'smooth' }); renderPosts(); } }

// 🪄 코드 생성기
function generateCode() {
    const titleVal = document.getElementById('new-title').value;
    const dateVal = document.getElementById('new-date').value;
    const contentVal = document.getElementById('new-content').value;
    
    if (!titleVal || !dateVal || !contentVal) {
        return alert("모든 칸을 입력하셔야 시스템 소스 코드가 생성됩니다.");
    }
    
    const cleanContent = contentVal.replace(/\n/g, '<br>');
    const dynamicCode = `{ title: "${titleVal}", date: "${dateVal}", content: "${cleanContent}" },`;
    
    const outputField = document.getElementById('code-output');
    const outputBox = document.getElementById('code-output-box');
    
    if (outputField && outputBox) {
        outputField.value = dynamicCode;
        outputBox.style.display = 'block';
    }
}
