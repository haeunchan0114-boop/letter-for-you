// ==========================================
// ✍️ [우주의 역사 저장소] 새 글 코드를 여기에 추가하세요
// ==========================================
let myPosts = [
    { title: "첫 번째 우주의 기록", date: "2026-05-20", content: "여기는 아주 조용하고 평화로운 나만의 우주입니다." },
    { title: "겨울 밤바다의 소리", date: "2026-01-15", content: "차가운 파도가 하얗게 부서지는 소리가 들려옵니다." },
    { title: "작은 별 하나", date: "2026-01-10", content: "가장 작게 빛나는 별에게 나의 마음을 전합니다." }
];

// 시스템 제어 전역 변수들
let currentDisplayPosts = [...myPosts]; 
let currentPage = 1;
const postsPerPage = 3; 
let currentSort = 'newest';

// 🔒 암호화된 관리자 비밀번호 대조용 해시 (원문: 0416haeunashi0416!*!26)
const SECRET_HASH = "b901b0f590fc92716a4e320d709218671607f2e03bf305a468d66df19672750e";

// ==========================================
// ❄️ 실시간 눈송이 생성기
// ==========================================
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

// ==========================================
// 🚀 도큐먼트 로드 직후 핵심 컨트롤타워 작동
// ==========================================
document.addEventListener("DOMContentLoaded", function() {
    // 1. 그래픽 이펙트 시작
    startSnowingEffect();

    // 2. 주소창 주소 검사 및 관리자 로그인 유도 (?mode=sea)
    const urlParams = new URLSearchParams(window.location.search);
    
    if (urlParams.get('mode') === 'sea') {
        // 브라우저 렌더링 직후 prompt 창을 의도적으로 미세하게 지연시켜 완벽 로드 확보
        setTimeout(function() {
            const passwordInput = prompt("관리자 인증 시스템입니다.\n비밀번호를 입력해 주세요:");
            
            if (passwordInput) {
                // CryptoJS 라이브러리를 사용해 입력값을 해싱
                const inputHash = CryptoJS.SHA256(passwordInput).toString();
                
                if (inputHash === SECRET_HASH) {
                    // ID 탐색 및 스타일 제어 흐름 수정
                    const adminPanel = document.getElementById('admin-area');
                    if (adminPanel) {
                        adminPanel.style.display = 'block';
                        alert("인증에 성공했습니다. 우주의 제어권이 활성화됩니다.");
                    }
                } else {
                    alert("비밀번호가 일치하지 않습니다.");
                    window.location.href = window.location.pathname; // 비번 실패 시 일반 메인으로 추방
                }
            } else {
                window.location.href = window.location.pathname; // 취소 버튼 선택 시 되돌리기
            }
        }, 150);
    }

    // 3. 포스트 데이터 초기화 화면 출력
    renderPosts();
});

// ==========================================
// 📜 화면에 포스트 카드들을 정렬하고 분할 출력하는 함수
// ==========================================
function renderPosts() {
    // 날짜 데이터 정렬 처리
    currentDisplayPosts.sort((a, b) => {
        return currentSort === 'newest' ? new Date(b.date) - new Date(a.date) : new Date(a.date) - new Date(b.date);
    });

    // 3개씩 페이지 자르기 연산
    const start = (currentPage - 1) * postsPerPage;
    const end = start + postsPerPage;
    const pagedPosts = currentDisplayPosts.slice(start, end);
    
    const container = document.getElementById('post-list');
    if (!container) return;
    container.innerHTML = '';

    if (pagedPosts.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#718096; padding: 50px 0;">우주에 아직 기록이 없습니다.</p>';
        return;
    }

    // 데이터 루프 순회하며 구조물 동적 조립
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
    if (pageIndicator) {
        pageIndicator.innerText = currentPage;
    }
}

// ==========================================
// 🛠️ 기능 제어 컨트롤러 유틸리티 함수 그룹
// ==========================================
function setSort(type) { 
    currentSort = type; 
    currentPage = 1; 
    renderPosts(); 
}

function filterDate(date) { 
    if (!date) return;
    currentDisplayPosts = myPosts.filter(p => p.date === date); 
    currentPage = 1; 
    renderPosts(); 
}

function resetFilter() { 
    const picker = document.getElementById('date-picker');
    if (picker) picker.value = ''; 
    currentDisplayPosts = [...myPosts]; 
    currentPage = 1; 
    renderPosts(); 
}

function prevPage() { 
    if (currentPage > 1) { 
        currentPage--; 
        window.scrollTo({ top: 0, behavior: 'smooth' }); 
        renderPosts(); 
    } 
}

function nextPage() { 
    if (currentPage * postsPerPage < currentDisplayPosts.length) { 
        currentPage++; 
        window.scrollTo({ top: 0, behavior: 'smooth' }); 
        renderPosts(); 
    } 
}

// ==========================================
// 🪄 신규 기록용 시스템 원본 코드 변환 모듈
// ==========================================
function generateCode() {
    const titleVal = document.getElementById('new-title').value;
    const dateVal = document.getElementById('new-date').value;
    const contentVal = document.getElementById('new-content').value;
    
    if (!titleVal || !dateVal || !contentVal) {
        return alert("모든 양식을 작성해야 코드를 추출할 수 있습니다.");
    }
    
    // 줄바꿈 보존용 포맷팅 처리
    const cleanContent = contentVal.replace(/\n/g, '<br>');
    const dynamicCode = `{ title: "${titleVal}", date: "${dateVal}", content: "${cleanContent}" },`;
    
    const outputField = document.getElementById('code-output');
    const outputBox = document.getElementById('code-output-box');
    
    if (outputField && outputBox) {
        outputField.value = dynamicCode;
        outputBox.style.display = 'block';
    }
}
