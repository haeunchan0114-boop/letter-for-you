// ✍️ [내 글 저장소] 새 글 코드는 아래 대괄호 [ ] 안에 추가됩니다.
let myPosts = [
    { title: "겨울 가로등 밑에서", date: "2026-01-15", content: "은은한 불빛이 꼭 눈송이 같습니다." },
    { title: "첫 번째 밤바다 방문", date: "2026-01-10", content: "차가운 파도 소리가 가슴을 뻥 뚫어줍니다." }
];

let currentDisplayPosts = [...myPosts]; 
let currentPage = 1;
const postsPerPage = 3; 
let currentSort = 'newest';

// 페이지가 로드될 때 실행
window.addEventListener('load', () => {
    // 🔒 주소창 검사: 주소 끝에 ?mode=sea 가 붙어있는지 확인
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('mode') === 'sea') {
        document.getElementById('admin-area').style.display = 'block'; 
        document.getElementById('new-date').value = new Date().toISOString().substring(0, 10); 
    }

    // 눈 내리는 효과를 충분히 감상할 수 있도록 2초(2000ms) 작동 후 해제
    setTimeout(() => {
        const loader = document.getElementById('loading-screen');
        loader.style.opacity = '0';
        setTimeout(() => loader.style.display = 'none', 800);
    }, 2000); 
    render();
});

// 관리자가 입력한 글로 코드를 만들어주는 함수
function generateCode() {
    const title = document.getElementById('new-title').value;
    const date = document.getElementById('new-date').value;
    const content = document.getElementById('new-content').value;

    if(!title || !content) { alert("제목과 내용을 입력해주세요."); return; }

    const generatedText = `{ title: "${title}", date: "${date}", content: "${content.replace(/\n/g, '<br>')}" },`;
    
    document.getElementById('code-output').value = generatedText;
    document.getElementById('code-output-box').style.display = 'block';
}

// 화면에 글 그려주는 메인 시스템 함수
function render() {
    // 1. 정렬 시스템 작동
    currentDisplayPosts.sort((a, b) => {
        return currentSort === 'newest' ? new Date(b.date) - new Date(a.date) : new Date(a.date) - new Date(b.date);
    });

    // 2. 3개 단위 페이징 계산
    const start = (currentPage - 1) * postsPerPage;
    const end = start + postsPerPage;
    const pagedPosts = currentDisplayPosts.slice(start, end);
    
    const container = document.getElementById('post-list');
    container.innerHTML = '';

    if(pagedPosts.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#718096; padding: 40px 0;">작성된 글이 없습니다.</p>';
    }

    // 3. 자른 데이터를 카드로 띄우기
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

// 정렬, 날짜 필터, 버튼 핸들러들
function setSort(sortType) { currentSort = sortType; currentPage = 1; render(); }
function filterDate(selectedDate) { 
    if(!selectedDate) return; 
    currentDisplayPosts = myPosts.filter(post => post.date === selectedDate); 
    currentPage = 1; 
    render(); 
}
function resetFilter() { document.getElementById('date-picker').value = ''; currentDisplayPosts = [...myPosts]; currentPage = 1; render(); }
function prevPage() { if (currentPage > 1) { currentPage--; render(); } }
function nextPage() { if (currentPage * postsPerPage < currentDisplayPosts.length) { currentPage++; render(); } }
