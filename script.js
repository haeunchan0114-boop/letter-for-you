// ✍️ [기록 데이터]기에 새 글 코드를 복사해서 붙여넣으세요.
let myPosts = [
    { title: "첫 번째 우주의 기록", date: "2026-05-20", content: "여기는 아주 조용하고 평화로운 나만의 우주입니다." },
    { title: "겨울 밤바다의 소리", date: "2026-01-15", content: "차가운 파도가 하얗게 부서지는 소리가 들려옵니다." },
    { title: "작은 별 하나", date: "2026-01-10", content: "가장 작게 빛나는 별에게 나의 마음을 전합니다." }
];

let currentDisplayPosts = [...myPosts]; 
let currentPage = 1;
const postsPerPage = 3; 
let currentSort = 'newest';

// 🔒 암호화된 비밀번호 해시값 (원문: 0416haeunashi0416!*!26)
const SECRET_HASH = "b901b0f590fc92716a4e320d709218671607f2e03bf305a468d66df19672750e";

// ❄️ 실시간 눈 내리기 기능
function startSnowing() {
    const container = document.getElementById('snow-container');
    if(!container) return;
    
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

// 🚀 페이지가 열리자마자 가장 먼저 실행되는 구역
document.addEventListener("DOMContentLoaded", function() {
    // 1. 배경 눈내림 작동
    startSnowing();

    // 2. 관리자 인증 절차 및 주소 파라미터(?mode=sea) 감지
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('mode') === 'sea') {
        
        // 브라우저 로딩 직후 즉시 암호 알림창 실행
        const passwordInput = prompt("관리자 인증이 필요합니다.\n비밀번호를 입력하세요:");
        
        if (passwordInput) {
            // 입력값을 SHA-256 구조로 변환
            const inputHash = CryptoJS.SHA256(passwordInput).toString();
            
            // 기존 오타 수정: style.style.display -> style.display
            if (inputHash === SECRET_HASH) {
                document.getElementById('admin-area').style.display = 'block'; 
                alert("인증되었습니다. 우주의 글쓰기 권한이 활성화됩니다.");
            } else {
                alert("비밀번호가 올바르지 않습니다.");
                window.location.href = window.location.pathname; // 비밀번호 틀리면 즉시 메인으로 튕김
            }
        } else {
            window.location.href = window.location.pathname; // 취소 누르면 메인으로 이동
        }
    }

    // 3. 메인 콘텐츠 렌더링
    render();
});

// 화면에 글 목록을 뿌려주는 기능
function render() {
    currentDisplayPosts.sort((a, b) => {
        return currentSort === 'newest' ? new Date(b.date) - new Date(a.date) : new Date(a.date) - new Date(b.date);
    });

    const start = (currentPage - 1) * postsPerPage;
    const end = start + postsPerPage;
    const pagedPosts = currentDisplayPosts.slice(start, end);
    const container = document.getElementById('post-list');
    container.innerHTML = '';

    if(pagedPosts.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#718096; padding: 50px 0;">우주에 아직 기록이 없습니다.</p>';
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
    document.getElementById('page-indicator').innerText = currentPage;
}

// 필터 및 페이지네이션 기능 함수들
function setSort(type) { currentSort = type; currentPage = 1; render(); }
function filterDate(date) { 
    if(!date) return;
    currentDisplayPosts = myPosts.filter(p => p.date === date); 
    currentPage = 1; 
    render(); 
}
function resetFilter() { 
    document.getElementById('date-picker').value = ''; 
    currentDisplayPosts = [...myPosts]; 
    currentPage = 1; 
    render(); 
}
function prevPage() { if (currentPage > 1) { currentPage--; window.scrollTo(0,0); render(); } }
function nextPage() { if (currentPage * postsPerPage < currentDisplayPosts.length) { currentPage++; window.scrollTo(0,0); render(); } }

// 새 글 코드 추출기
function generateCode() {
    const t = document.getElementById('new-title').value;
    const d = document.getElementById('new-date').value;
    const c = document.getElementById('new-content').value;
    if(!t || !d || !c) return alert("내용을 모두 채워주세요.");
    const code = `{ title: "${t}", date: "${d}", content: "${c.replace(/\n/g, '<br>')}" },`;
    document.getElementById('code-output').value = code;
    document.getElementById('code-output-box').style.display = 'block';
}
