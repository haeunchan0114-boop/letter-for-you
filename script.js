import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, push, set, onValue, remove } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// 파이어베이스 계정 연동 명세
const firebaseConfig = {
    apiKey: "AIzaSyAnaa6EtIpvtCxqGPVtbuclexr2agHJWP8",
    authDomain: "myloveletter-for-you.firebaseapp.com",
    databaseURL: "https://myloveletter-for-you-default-rtdb.firebaseio.com",
    projectId: "myloveletter-for-you",
    storageBucket: "myloveletter-for-you.firebasestorage.app",
    messagingSenderId: "567184694523",
    appId: "1:567184694523:web:e5c92804e673c22b7ca45e",
    measurementId: "G-TM826Q76TT"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// 글로벌 제어 상숫값
let myPosts = [];
let currentDisplayPosts = [];
let currentPage = 1;
const postsPerPage = 4;

let isAdminMode = false;
let currentSort = 'newest';
let searchQuery = "";

// 우체통 전용 페이징 상태값
let mailboxLetters = [];
let currentMailboxPage = 1;
const lettersPerPage = 4;
let mailboxFilterKeyword = "";

// 🔒 핵심 마스터 보안 비밀번호 설정
const ADMIN_MASTER_PASSWORD = "0416haeunashi0416!*!26";

// 초기 구동 감지 시스템
window.addEventListener('DOMContentLoaded', () => {
    checkAdminMode();
    listenFirebasePosts();
    listenFirebaseMailbox(); // 📬 global_letters 전용 리스너 추가 고정
    initSnowFall();
});

// 관리자 진입 인증 게이트
window.enterAdminMode = function(event) {
    if (event) event.preventDefault();
    
    if (isAdminMode) {
        alert("이미 기록자 관리자 모드가 활성화되어 있습니다.");
        return;
    }

    const userInput = prompt("🔒 우주의 문을 열기 위한 절대 암호를 입력하세요:");
    
    if (userInput === ADMIN_MASTER_PASSWORD) {
        alert("인증 성공. 빛의 기록 권한이 개방되었습니다.");
        activateAdminLayout();
        applyFilters();
    } else if (userInput !== null) {
        alert("암호가 일치하지 않습니다. 접근이 거부되었습니다.");
    }
};

// URL 파라미터 감지식 (다이렉트 주소 진입 대응용)
function checkAdminMode() {
    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'sea') {
        const userInput = prompt("🔒 관리자 주소로 접근 중입니다. 마스터 암호를 입력하세요:");
        if (userInput === ADMIN_MASTER_PASSWORD) {
            activateAdminLayout();
        } else {
            alert("암호 오류. 일반 모드로 강제 전환됩니다.");
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }
}

// 관리자 레이아웃 시각적 즉시 변경 장치
function activateAdminLayout() {
    isAdminMode = true;
    document.getElementById('admin-wrapper').style.display = 'block';
    
    const mailBtn = document.getElementById('global-mailbox-btn');
    if (mailBtn) {
        mailBtn.className = "winter-btn main-mailbox-trigger admin-mailbox-theme";
        mailBtn.innerHTML = '<i class="fa-solid fa-mailbox"></i> 별빛우체통 확인하기 (관리자)';
    }
}

// 1. 일반 메인 피드 글(posts) 실시간 리스너
function listenFirebasePosts() {
    const postsRef = ref(db, 'posts');
    onValue(postsRef, (snapshot) => {
        const data = snapshot.val();
        myPosts = [];

        if (data) {
            Object.keys(data).forEach(key => {
                const item = { id: key, ...data[key] };
                // 기존에 posts에 잘못 섞여 들어간 편지가 있다면 제외하고 순수 포스트만 골라냄
                if (item.type !== 'reply' && item.type !== 'global' && !item.targetTitle) {
                    myPosts.push(item);
                }
            });
        }
        applyFilters();
    });
}

// 2. 📬 진짜 방문자 우체통(global_letters) 실시간 리스너 (강력 연동 부품)
function listenFirebaseMailbox() {
    const mailboxRef = ref(db, 'global_letters');
    onValue(mailboxRef, (snapshot) => {
        const data = snapshot.val();
        mailboxLetters = [];

        if (data) {
            Object.keys(data).forEach(key => {
                mailboxLetters.push({ id: key, ...data[key] });
            });
        }
        
        // 관리자 모드 상태에서 우체통 모달이 열려있다면 실시간 화면 새로고침
        if (isAdminMode && document.getElementById('reply-modal').style.display === 'flex') {
            renderMailboxLetters();
        }
    });
}

// 필터 마운트 및 데이터 파이프라인 가공
function applyFilters() {
    let filtered = [...myPosts];

    if (searchQuery) {
        filtered = filtered.filter(p => p.title && p.title.toLowerCase().includes(searchQuery));
    }
    
    filtered.sort((a, b) => {
        const dateA = new Date(a.date || 0);
        const dateB = new Date(b.date || 0);
        return currentSort === 'newest' ? dateB - dateA : dateA - dateB;
    });
    
    filtered.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
    
    currentDisplayPosts = filtered;
    renderPosts();
}

// 메인 피드 목록 엘리먼트 렌더링
function renderPosts() {
    const listEl = document.getElementById('post-list');
    listEl.innerHTML = '';

    if (currentDisplayPosts.length === 0) {
        listEl.innerHTML = '<div class="post-card" style="text-align:center; color:#7F8EA3;">우주 공간에 부합하는 빛의 기록이 존재하지 않습니다.</div>';
        document.getElementById('page-indicator').innerText = '1';
        return;
    }

    const totalPages = Math.ceil(currentDisplayPosts.length / postsPerPage);
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    const startIndex = (currentPage - 1) * postsPerPage;
    const endIndex = startIndex + postsPerPage;
    const pagePosts = currentDisplayPosts.slice(startIndex, endIndex);

    document.getElementById('page-indicator').innerText = currentPage;

    pagePosts.forEach(post => {
        const card = document.createElement('div');
        card.className = `post-card ${post.pinned ? 'pinned' : ''}`;
        
        const isLocked = post.password && post.password.trim() !== "";
        let displayContent = post.content || "";
        
        if (isLocked && !isAdminMode) {
            displayContent = `<span style="color:#7F8EA3; font-style:italic;"><i class="fa-solid fa-lock"></i> 이 기록은 영혼의 암호로 보호받고 있습니다. 내용을 보려면 관리자 모드가 필요합니다.</span>`;
        }

        const pinText = post.pinned ? '<span class="pin-badge">📌 [고정됨] </span>' : '';
        const lockBadge = isLocked ? ` <span style="font-size:0.8rem; color:#f5e6c8; background:rgba(245,230,200,0.1); padding:2px 6px; border-radius:4px; margin-left:6px;">🔒 비밀글</span>` : '';

        card.innerHTML = `
            <div class="post-date">
                <i class="fa-regular fa-star"></i>
                <span class="author-tag">${post.author || '기록자'}</span> | ${post.date || '날짜 미상'}
            </div>
            <div class="post-title">${pinText}${post.title || '제목 없음'}${lockBadge}</div>
            <p>${displayContent.replace(/\n/g, '<br>')}</p>
            
            <div class="admin-card-controls" id="controls-${post.id}">
                <button onclick="togglePin('${post.id}', ${post.pinned || false})" class="admin-mini-btn ${post.pinned ? 'pin-active' : ''}">고정</button>
                <button onclick="editPost('${post.id}')" class="admin-mini-btn">수정</button>
                <button onclick="deletePost('${post.id}')" class="admin-mini-btn del-btn">삭제</button>
            </div>
        `;

        listEl.appendChild(card);
        
        if (isAdminMode) {
            const ctrlBox = document.getElementById(`controls-${post.id}`);
            if (ctrlBox) ctrlBox.style.display = 'flex';
        }
    });
}

// 페이징 제어
window.nextPage = function() {
    const totalPages = Math.ceil(currentDisplayPosts.length / postsPerPage);
    if (currentPage < totalPages) { currentPage++; applyFilters(); }
};
window.prevPage = function() {
    if (currentPage > 1) { currentPage--; applyFilters(); }
};

// 정렬 및 검색 처리
window.setSort = function(sortType) { currentSort = sortType; applyFilters(); };
window.searchTitle = function(val) { searchQuery = val.toLowerCase().trim(); currentPage = 1; applyFilters(); };
window.resetFilter = function() {
    document.getElementById('search-input').value = "";
    searchQuery = ""; currentSort = 'newest'; currentPage = 1; applyFilters();
};

// 관리자 글쓰기 패널 토글
window.toggleAdminForm = function() {
    const area = document.getElementById('admin-area');
    const toggleBtn = document.getElementById('admin-open-toggle');
    if (area.style.display === 'none') {
        area.style.display = 'block';
        toggleBtn.innerHTML = '<i class="fa-solid fa-xmark"></i> 기록자 글쓰기 판넬 닫기';
    } else {
        area.style.display = 'none';
        toggleBtn.innerHTML = '<i class="fa-solid fa-pen-to-square"></i> 기록자 글쓰기 판넬 열기';
        clearAdminForm();
    }
};

function clearAdminForm() {
    document.getElementById('edit-id').value = '';
    document.getElementById('new-title').value = '';
    document.getElementById('new-password').value = '';
    document.getElementById('new-content').value = '';
    document.getElementById('admin-main-btn').innerHTML = '<i class="fa-solid fa-feather"></i> 기록 새겨넣기';
    document.getElementById('admin-panel-title').innerHTML = '<i class="fa-solid fa-feather"></i> 우주에 새로운 빛의 기록 남기기';
}

// 기록 저장 및 수정
window.savePost = function() {
    const id = document.getElementById('edit-id').value;
    const title = document.getElementById('new-title').value.trim();
    const password = document.getElementById('new-password').value.trim();
    const content = document.getElementById('new-content').value.trim();

    if (!title || !content) { alert('제목과 내용을 모두 채워주세요.'); return; }

    const postData = {
        title: title,
        content: content,
        password: password,
        author: "관리자",
        date: id ? myPosts.find(p => p.id === id).date : new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
    };

    if (id) {
        const existing = myPosts.find(p => p.id === id);
        postData.pinned = existing.pinned || false;
        set(ref(db, `posts/${id}`), postData).then(() => {
            toggleAdminForm(); triggerEasterEgg();
        });
    } else {
        postData.pinned = false;
        push(ref(db, 'posts'), postData).then(() => {
            toggleAdminForm(); triggerEasterEgg();
        });
    }
};

window.editPost = function(id) {
    const post = myPosts.find(p => p.id === id);
    if (!post) return;
    
    document.getElementById('edit-id').value = post.id;
    document.getElementById('new-title').value = post.title || '';
    document.getElementById('new-password').value = post.password || '';
    document.getElementById('new-content').value = post.content || '';
    
    document.getElementById('admin-main-btn').innerHTML = '<i class="fa-solid fa-arrows-rotate"></i> 별빛의 기록 수정하기';
    document.getElementById('admin-panel-title').innerHTML = '<i class="fa-solid fa-pen-fancy"></i> 새겨진 기존 별빛 기록 수정하기';
    
    const area = document.getElementById('admin-area');
    if (area.style.display === 'none') toggleAdminForm();
    window.scrollTo({ top: area.offsetTop - 40, behavior: 'smooth' });
};

window.deletePost = function(id) {
    if (confirm('이 기록을 우주 공간에서 영구히 삭제하시겠습니까?')) {
        remove(ref(db, `posts/${id}`));
    }
};

window.togglePin = function(id, currentStatus) {
    set(ref(db, `posts/${id}/pinned`), !currentStatus);
};

// ==========================================
// 📬 통합 메일박스 우체통 제어 시스템 (global_letters 연동)
// ==========================================
window.handleMailboxClick = function() {
    const modal = document.getElementById('reply-modal');
    modal.style.display = 'flex';

    if (isAdminMode) {
        document.getElementById('modal-form-title').innerText = "🌌 은하수 관리자 우체통";
        document.getElementById('modal-form-desc').innerText = "global_letters 노드에 수신된 익명 편지 목록입니다.";
        document.getElementById('mailbox-admin-view').style.display = 'block';
        document.getElementById('mailbox-user-form').style.display = 'none';
        document.getElementById('reply-submit-btn').style.display = 'none';
        currentMailboxPage = 1;
        renderMailboxLetters();
    } else {
        document.getElementById('modal-form-title').innerText = "하은이에게 편지 보내기";
        document.getElementById('modal-form-desc').innerText = "우주 공간을 넘어서 마음을 담은 다리를 놓아보세요.";
        document.getElementById('mailbox-admin-view').style.display = 'none';
        document.getElementById('mailbox-user-form').style.display = 'block';
        document.getElementById('reply-submit-btn').style.display = 'block';
    }
};

window.closeReplyModal = function() {
    document.getElementById('reply-modal').style.display = 'none';
    document.getElementById('reply-author').value = '';
    document.getElementById('reply-content').value = '';
};

// 사용자가 편지를 쓰면 이제 정확하게 'global_letters' 경로로 들어갑니다!
window.submitLetterOrReply = function() {
    const author = document.getElementById('reply-author').value.trim();
    const content = document.getElementById('reply-content').value.trim();

    if (!author || !content) { alert('이름과 편지 내용을 모두 기입해 주세요.'); return; }

    const letterData = {
        author: author,
        content: content,
        date: new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
    };

    // 🚀 저장 경로를 posts에서 global_letters로 명확하게 정정
    push(ref(db, 'global_letters'), letterData).then(() => {
        alert('편지가 우주 공간을 지나 안전하게 발송되었습니다.');
        closeReplyModal();
    });
};

// global_letters 기반의 관리자 우체통 뷰 렌더링
function renderMailboxLetters() {
    const container = document.getElementById('mailbox-letters-list');
    container.innerHTML = '';

    let filteredLetters = [...mailboxLetters];
    if (mailboxFilterKeyword) {
        filteredLetters = filteredLetters.filter(l => l.author && l.author.toLowerCase().includes(mailboxFilterKeyword));
    }

    // 최신 편지가 위로 오게 날짜순 정렬
    filteredLetters.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

    if (filteredLetters.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:30px 0; color:#7F8EA3; font-size:0.85rem;">수신된 익명 편지가 존재하지 않습니다.</div>';
        document.getElementById('mailbox-page-indicator').innerText = '1 / 1';
        return;
    }

    const totalPages = Math.ceil(filteredLetters.length / lettersPerPage);
    if (currentMailboxPage > totalPages) currentMailboxPage = totalPages;

    const start = (currentMailboxPage - 1) * lettersPerPage;
    const end = start + lettersPerPage;
    const pageLetters = filteredLetters.slice(start, end);

    document.getElementById('mailbox-page-indicator').innerText = `${currentMailboxPage} / ${totalPages}`;

    pageLetters.forEach(letItem => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'mailbox-item';
        itemDiv.innerHTML = `
            <div class="mailbox-item-meta">
                <span style="color:#f5e6c8; font-weight:bold;">From. ${letItem.author || '익명'}</span>
                <span style="color:#7F8EA3; font-size:0.75rem;">${letItem.date || '날짜 미상'}</span>
            </div>
            <div class="mailbox-item-text">${letItem.content ? letItem.content.replace(/\n/g, '<br>') : ''}</div>
            <button onclick="deleteMailboxLetter('${letItem.id}')" class="reply-delete-btn">영구삭제</button>
        `;
        container.appendChild(itemDiv);
    });
}

window.filterMailbox = function() {
    mailboxFilterKeyword = document.getElementById('mailbox-search').value.toLowerCase().trim();
    currentMailboxPage = 1;
    renderMailboxLetters();
};

window.moveMailboxPage = function(dir) {
    currentMailboxPage += dir;
    renderMailboxLetters();
};

// global_letters 경로에서 진짜 편지 원본 데이터 삭제
window.deleteMailboxLetter = function(id) {
    if (confirm('이 우체통 편지를 데이터베이스에서 영구히 삭제합니까?')) {
        remove(ref(db, `global_letters/${id}`));
    }
};

// ==========================================
// 비주얼 부가 효과 (최적화 토글 및 눈송이)
// ==========================================
window.toggleOptimization = function() {
    document.body.classList.toggle('optimized');
    const isOpt = document.body.classList.contains('optimized');
    const btn = document.getElementById('opt-toggle-btn');
    if (btn) {
        btn.innerHTML = isOpt ? '<i class="fa-solid fa-bolt"></i> 최적화 모드: ON (애니메이션 꺼짐)' : '<i class="fa-solid fa-circle-notch"></i> 최적화 모드: OFF (애니메이션 켜짐)';
    }
};

function initSnowFall() {
    const container = document.getElementById('snow-container');
    if (!container) return;
    const snowCount = 25;
    for (let i = 0; i < snowCount; i++) {
        const flake = document.createElement('div');
        flake.className = 'snowflake';
        flake.innerText = '❄';
        flake.style.left = Math.random() * 100 + 'vw';
        flake.style.fontSize = Math.random() * 10 + 10 + 'px';
        flake.style.animationDuration = Math.random() * 10 + 10 + 's';
        flake.style.animationDelay = Math.random() * -10 + 's';
        container.appendChild(flake);
    }
}

function triggerEasterEgg() {
    const msg = document.getElementById('easter-egg-message');
    if (!msg) return;
    msg.classList.add('active');
    setTimeout(() => msg.classList.remove('active'), 4000);
}
