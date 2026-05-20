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
let currentReplyTargetId = null; 

// 초기 구동 감지 시스템
window.addEventListener('DOMContentLoaded', () => {
    checkAdminMode();
    listenFirebasePosts();
    initSnowFall();
});

// 관리자 파라미터 식별 함수
function checkAdminMode() {
    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'sea') {
        isAdminMode = true;
        document.getElementById('admin-wrapper').style.display = 'block';
        
        // 관리자용 메일박스 테마 체인지
        const mailBtn = document.getElementById('global-mailbox-btn');
        if (mailBtn) {
            mailBtn.className = "winter-btn main-mailbox-trigger admin-mailbox-theme";
            mailBtn.innerHTML = '<i class="fa-solid fa-mailbox"></i> 별빛우체통 확인하기 (관리자)';
        }
    }
}

// 파이어베이스 데이터 실시간 바인딩 리스너
function listenFirebasePosts() {
    const postsRef = ref(db, 'posts');
    onValue(postsRef, (snapshot) => {
        const data = snapshot.val();
        myPosts = [];
        mailboxLetters = [];

        if (data) {
            Object.keys(data).forEach(key => {
                const item = { id: key, ...data[key] };
                
                // 데이터 분류 필터링 설계
                if (item.type === 'reply' || item.type === 'global' || item.targetTitle) {
                    // 편지 및 답장 관련 글들은 오직 관리자 우체통 저장소로 분리 격리
                    mailboxLetters.push(item);
                } else {
                    // 순수 일반 posts 글만 메인 피드 저장소로 확보
                    myPosts.push(item);
                }
            });
        }
        applyFilters();
        if (isAdminMode && document.getElementById('reply-modal').style.display === 'flex') {
            renderMailboxLetters();
        }
    });
}

// 필터 마운트 및 데이터 파이프라인 가공
function applyFilters() {
    let filtered = [...myPosts];

    // 1차 검색어 필터
    if (searchQuery) {
        filtered = filtered.filter(p => p.title && p.title.toLowerCase().includes(searchQuery));
    }
    
    // 2차 날짜 기반 정렬 필터
    filtered.sort((a, b) => {
        const dateA = new Date(a.date || 0);
        const dateB = new Date(b.date || 0);
        return currentSort === 'newest' ? dateB - dateA : dateA - dateB;
    });
    
    // 3차 최상단 상단 고정(Pinned) 요소 강제 전치 배열
    filtered.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
    
    currentDisplayPosts = filtered;
    renderPosts();
}

// 메인 피드 목록 엘리먼트 렌더링 함수
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
        
        // 비밀글 제어 장치 변수선언
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
        
        // 관리자 모드인 경우 제어 버튼 레이어 노출
        if (isAdminMode) {
            const ctrlBox = document.getElementById(`controls-${post.id}`);
            if (ctrlBox) ctrlBox.style.display = 'flex';
        }
    });
}

// 페이징 제어 함수 핸들러
window.nextPage = function() {
    const totalPages = Math.ceil(currentDisplayPosts.length / postsPerPage);
    if (currentPage < totalPages) { currentPage++; applyFilters(); }
};
window.prevPage = function() {
    if (currentPage > 1) { currentPage--; applyFilters(); }
};

// 정렬 및 검색 처리 기능 바인딩
window.setSort = function(sortType) { currentSort = sortType; applyFilters(); };
window.searchTitle = function(val) { searchQuery = val.toLowerCase().trim(); currentPage = 1; applyFilters(); };
window.resetFilter = function() {
    document.getElementById('search-input').value = "";
    searchQuery = ""; currentSort = 'newest'; currentPage = 1; applyFilters();
};

// 관리자 글쓰기 패널 토글 스위치
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

// 기록 생성 및 수정 반영 로직 (글쓰기)
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

// 기존 기록 데이터 수정 폼 컴파일로드
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

// 데이터 완전 파기 프로세스
window.deletePost = function(id) {
    if (confirm('이 기록을 우주 공간에서 영구히 삭제하시겠습니까?')) {
        remove(ref(db, `posts/${id}`));
    }
};

// 최상단 상단 노드 고정 변경 함수
window.togglePin = function(id, currentStatus) {
    set(ref(db, `posts/${id}/pinned`), !currentStatus);
};

// ==========================================
// 📬 통합 메일박스 우체통 제어 시스템 
// ==========================================
window.handleMailboxClick = function() {
    const modal = document.getElementById('reply-modal');
    modal.style.display = 'flex';

    if (isAdminMode) {
        // 관리자 모드: 수신 편지함 출력 모드 전환
        document.getElementById('modal-form-title').innerText = "🌌 은하수 관리자 우체통";
        document.getElementById('modal-form-desc').innerText = "방문자들이 남긴 모든 익명 편지 리스트입니다.";
        document.getElementById('mailbox-admin-view').style.display = 'block';
        document.getElementById('mailbox-user-form').style.display = 'none';
        document.getElementById('reply-submit-btn').style.display = 'none';
        currentMailboxPage = 1;
        renderMailboxLetters();
    } else {
        // 일반 유저 모드: 하은이에게 편지 쓰기 폼 전환
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

// 일반 유저 편지 전송 기능
window.submitLetterOrReply = function() {
    const author = document.getElementById('reply-author').value.trim();
    const content = document.getElementById('reply-content').value.trim();

    if (!author || !content) { alert('이름과 편지 내용을 모두 기입해 주세요.'); return; }

    const letterData = {
        type: 'global',
        author: author,
        content: content,
        date: new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
    };

    push(ref(db, 'posts'), letterData).then(() => {
        alert('편지가 우주 공간을 지나 안전하게 발송되었습니다.');
        closeReplyModal();
    });
};

// 관리자용 우체통 리스트 전용 렌더러
function renderMailboxLetters() {
    const container = document.getElementById('mailbox-letters-list');
    container.innerHTML = '';

    let filteredLetters = [...mailboxLetters];
    if (mailboxFilterKeyword) {
        filteredLetters = filteredLetters.filter(l => l.author && l.author.toLowerCase().includes(mailboxFilterKeyword));
    }

    // 최신 편지 순 정렬
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

window.deleteMailboxLetter = function(id) {
    if (confirm('이 우체통 편지를 데이터베이스에서 영구히 삭제합니까?')) {
        remove(ref(db, `posts/${id}`));
    }
};

// ==========================================
// ✨ 비주얼 부가 효과 (최적화 토글 및 눈송이)
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
