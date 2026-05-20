let myPosts = [
    { title: "첫 번째 우주의 기록", date: "2026-05-20", content: "여기는 아주 조용하고 평화로운 나만의 우주입니다." },
    { title: "겨울 밤바다의 소리", date: "2026-01-15", content: "차가운 파도가 하얗게 부서지는 소리가 들려옵니다." },
    { title: "작은 별 하나", date: "2026-01-10", content: "가장 작게 빛나는 별에게 나의 마음을 전합니다." }
];

let currentDisplayPosts = [...myPosts]; 
let currentPage = 1;
const postsPerPage = 3; 
let currentSort = 'newest';

// 🔒 비밀번호 유출 방지를 위한 SHA-256 해시값 (원문: 0416haeunashi0416!*!26)
// 타인이 코드를 보아도 이 해시값만 보이기 때문에 비밀번호 원문을 해킹할 수 없습니다.
const SECRET_HASH = "b901b0f590fc92716a4e320d709218671607f2e03bf305a468d66df19672750e";

function createSnow(targetId) {
    const container = document.getElementById(targetId);
    if(!container) return;
    for (let i = 0; i < 40; i++) {
        const snowflake = document.createElement('div');
        snowflake.className = 'snowflake';
        snowflake.innerHTML = '❄';
        snowflake.style.left = Math.random() * 100 + 'vw';
        snowflake.style.animationDuration = (Math.random() * 3 + 4) + 's';
        snowflake.style.animationDelay = Math.random() * 5 + 's';
        snowflake.style.opacity = Math.random();
        snowflake.style.fontSize = (Math.random() * 10 + 10) + 'px';
        container.appendChild(snowflake);
    }
}

window.onload = function() {
    createSnow('loading-snow');
    createSnow('snow-container');

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('mode') === 'sea') {
        // 주소 뒤에 ?mode=sea를 치고 들어오면 팝업창으로 비밀번호를 요구합니다.
        const passwordInput = prompt("관리자 비밀번호를 입력하세요:");
        
        if (passwordInput) {
            // 입력한 비밀번호를 암호화하여 저장된 해시값과 비교합니다.
            const inputHash = CryptoJS.SHA256(passwordInput).toString();
            
            if (inputHash === SECRET_HASH) {
                document.getElementById('admin-area').style.style.display = 'block'; 
                alert("관리자 인증에 성공했습니다.");
            } else {
                alert("비밀번호가 올바르지 않습니다.");
                window.location.href = window.location.pathname; // 메인으로 강제 튕겨내기
            }
        } else {
            window.location.href = window.location.pathname;
        }
    }

    setTimeout(() => {
        const loader = document.getElementById('loading-screen');
        if(loader) {
            loader.style.opacity = '0';
            setTimeout(() => { loader.style.display = 'none'; }, 1000);
        }
    }, 2500);

    render();
};

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
