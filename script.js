// ✍️ [관리자 영역] 여기에 글을 쓰면 자동으로 사이트에 반영됩니다!
let myPosts = [
    { title: "첫 번째 밤바다 방문", date: "2026-01-10", content: "차가운 파도 소리가 가슴을 뻥 뚫어줍니다." },
    { title: "겨울 가로등 밑에서", date: "2026-01-15", content: "은은한 불빛이 꼭 눈송이 같습니다." },
    { title: "따뜻한 캔커피", date: "2026-02-02", content: "손은 시리지만 마음은 따뜻한 밤입니다." },
    { title: "네 번째 남긴 기록", date: "2026-02-10", content: "3개 넘기기 테스트용 글입니다." },
    { title: "다섯 번째 글 제목", date: "2026-05-20", content: "날짜 필터로 이 글을 찾아보세요." }
];

let currentDisplayPosts = [...myPosts]; 
let currentPage = 1;
const postsPerPage = 3; // 3개 단위 설정
let currentSort = 'newest';

// 1. 로딩 화면 해제 (페이지 열리고 1.5초 뒤 부드럽게 사라짐)
window.addEventListener('load', () => {
    setTimeout(() => {
        const loader = document.getElementById('loading-screen');
        loader.style.opacity = '0';
        setTimeout(() => loader.style.display = 'none', 800);
    }, 1500); 
    render();
});

// 2. 화면에 글 그려주는 함수
function render() {
    // 정렬 적용
    currentDisplayPosts.sort((a, b) => {
        return currentSort === 'newest' ? new Date(b.date) - new Date(a.date) : new Date(a.date) - new Date(b.date);
    });

    // 3개 단위로 자르기 (페이지네이션)
    const start = (currentPage - 1) * postsPerPage;
    const end = start + postsPerPage;
    const pagedPosts = currentDisplayPosts.slice(start, end);

    const container = document.getElementById('post-list');
    container.innerHTML = '';

    if(pagedPosts.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#8A99AD;">해당 날짜에 작성된 글이 없습니다.</p>';
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

// 3. 기능 함수들 (정렬, 필터, 페이지 이동)
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
