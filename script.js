// ✍️ [기록 데이터] 여기에 새 글 코드를 복사해서 붙여넣으세요.
let myPosts = [
    { title: "첫 번째 우주의 기록", date: "2026-05-20", content: "여기는 아주 조용하고 평화로운 나만의 우주입니다." },
    { title: "겨울 밤바다의 소리", date: "2026-01-15", content: "차가운 파도가 하얗게 부서지는 소리가 들려옵니다." },
    { title: "작은 별 하나", date: "2026-01-10", content: "가장 작게 빛나는 별에게 나의 마음을 전합니다." }
];

let currentDisplayPosts = [...myPosts]; 
let currentPage = 1;
const postsPerPage = 3; 
let currentSort = 'newest';

// 1. 눈 내리는 효과 함수 (로딩용, 본문용 공용)
function createSnow(targetId) {
    const container = document.getElementById(targetId);
    if(!container) return;
    
    for (let i = 0; i < 40; i++) {
        const snowflake = document.createElement('div');
        snowflake.className = 'snowflake';
        snowflake.innerHTML = '❄';
        snowflake.style.left = Math.random() * 100 + 'vw';
        snowflake.style.animationDuration = (Math.random() * 3 + 4) + 's'; // 4~7초 사이 천천히
        snowflake.style.animationDelay = Math.random() * 5 + 's';
        snowflake.style.opacity = Math.random();
        snowflake.style.fontSize = (Math.random() * 10 + 10) + 'px';
        container.appendChild(snowflake);
    }
}

// 2. 초기 로딩 시스템
window.onload = function() {
    // 로딩 화면과 본문에 눈 내리는 효과 적용
    createSnow('loading-snow');
    createSnow('snow-container');

    // 관리자 모드 확인 (?mode=sea)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('mode') === 'sea') {
        document.getElementById('admin-area').style.display = 'block'; 
    }

    // 2.5초 후 로딩 화면 해제
    setTimeout(() => {
        const loader = document.getElementById('loading-screen');
        if(loader) {
            loader.style.opacity = '0';
            setTimeout(() => {
                loader.style.display = 'none';
            }, 1000);
        }
    }, 2500);

    render();
};

// 3. 화면 렌더링 함수
function render() {
    // 정렬 로직
    currentDisplayPosts.sort((a, b) => {
        return currentSort === 'newest' ? new Date(b.date) - new Date(a.date) : new Date(a.date) - new Date(b.date);
    });

    // 페이징 로직 (3개씩)
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

// 4. 기능 함수들
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

function generateCode() {
    const t = document.getElementById('new-title').value;
    const d = document.getElementById('new-date').value;
    const c = document.getElementById('new-content').value;
    if(!t || !d || !c) return alert("내용을 모두 채워주세요.");
    const code = `{ title: "${t}", date: "${d}", content: "${c.replace(/\n/g, '<br>')}" },`;
    document.getElementById('code-output').value = code;
    document.getElementById('code-output-box').style.display = 'block';
}
