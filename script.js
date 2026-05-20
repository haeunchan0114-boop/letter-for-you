```javascript
let myPosts = [
    { title: "첫 번째 우주의 기록", date: "2026-05-20", content: "여기는 아주 조용하고 평화롭습니다." },
    { title: "겨울 가로등", date: "2026-01-15", content: "눈이 내리는 날의 기록입니다." },
    { title: "차가운 밤바다", date: "2026-01-10", content: "파도 소리가 들리는 밤입니다." }
];

let currentDisplayPosts = [...myPosts]; 
let currentPage = 1;
const postsPerPage = 3; 
let currentSort = 'newest';

window.addEventListener('load', () => {
    // ❄️ 눈송이 생성 시스템
    const snowContainer = document.querySelector('.snow-container');
    for(let i=0; i<50; i++) {
        let snowflake = document.createElement('div');
        snowflake.className = 'snowflake';
        snowflake.innerHTML = '❄';
        snowflake.style.left = Math.random() * 100 + 'vw';
        snowflake.style.animationDuration = (Math.random() * 3 + 2) + 's';
        snowflake.style.opacity = Math.random();
        snowflake.style.fontSize = (Math.random() * 10 + 10) + 'px';
        snowContainer.appendChild(snowflake);
    }

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('mode') === 'sea') {
        document.getElementById('admin-area').style.display = 'block'; 
    }

    setTimeout(() => {
        const loader = document.getElementById('loading-screen');
        loader.style.opacity = '0';
        setTimeout(() => loader.style.display = 'none', 800);
    }, 2500); 
    render();
});

function render() {
    currentDisplayPosts.sort((a, b) => {
        return currentSort === 'newest' ? new Date(b.date) - new Date(a.date) : new Date(a.date) - new Date(b.date);
    });

    const start = (currentPage - 1) * postsPerPage;
    const end = start + postsPerPage;
    const pagedPosts = currentDisplayPosts.slice(start, end);
    const container = document.getElementById('post-list');
    container.innerHTML = '';

    if(pagedPosts.length === 0) container.innerHTML = '<p style="text-align:center; color:#64748b;">우주에 기록된 이야기가 없습니다.</p>';

    pagedPosts.forEach(post => {
        const card = document.createElement('div');
        card.className = 'post-card';
        card.innerHTML = `<div class="post-date">${post.date}</div><h2 class="post-title">${post.title}</h2><p>${post.content}</p>`;
        container.appendChild(card);
    });
    document.getElementById('page-indicator').innerText = currentPage;
}

function setSort(type) { currentSort = type; currentPage = 1; render(); }
function filterDate(date) { currentDisplayPosts = myPosts.filter(p => p.date === date); currentPage = 1; render(); }
function resetFilter() { document.getElementById('date-picker').value = ''; currentDisplayPosts = [...myPosts]; currentPage = 1; render(); }
function prevPage() { if (currentPage > 1) { currentPage--; render(); } }
function nextPage() { if (currentPage * postsPerPage < currentDisplayPosts.length) { currentPage++; render(); } }

function generateCode() {
    const t = document.getElementById('new-title').value;
    const d = document.getElementById('new-date').value;
    const c = document.getElementById('new-content').value;
    const code = `{ title: "${t}", date: "${d}", content: "${c.replace(/\n/g, '<br>')}" },`;
    document.getElementById('code-output').value = code;
    document.getElementById('code-output-box').style.display = 'block';
}
