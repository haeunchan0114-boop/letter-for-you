/* ==========================================
   1. 전체 레이아웃 및 폰트 설정
   ========================================== */
body {
    background: #02040a;
    color: #E2E8F0;
    margin: 0; padding: 0;
    font-family: 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif;
    min-height: 100vh;
    position: relative;
}

#wrap { 
    max-width: 650px; margin: 0 auto; padding: 80px 20px; 
    position: relative; z-index: 10; 
}

h1 { 
    text-align: center; color: #F5E6C8; font-weight: normal; 
    letter-spacing: 4px; margin-bottom: 50px;
    text-shadow: 0 0 25px rgba(245, 230, 200, 0.5), 0 0 50px rgba(245, 230, 200, 0.2);
}

/* ==========================================
   2. 🌌 우주, 오로라, 별똥별, 밤바다 비주얼 시스템 (CSS 아트)
   ========================================== */
.space-background {
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    z-index: -5; overflow: hidden;
    /* 심해와 깊은 밤하늘이 만나는 리얼 그라데이션 */
    background: linear-gradient(180deg, #02040f 0%, #050c24 40%, #0a1931 75%, #15305b 100%);
}

/* 🟢 초록빛 오로라 레이어 1 */
.aurora-layer-1 {
    position: absolute; width: 200%; height: 60%; top: -10%; left: -50%;
    background: radial-gradient(circle at 40% 20%, rgba(0, 255, 150, 0.12) 0%, rgba(0, 0, 0, 0) 50%);
    filter: blur(60px); animation: auroraWave 12s ease-in-out infinite alternate;
}

/* 🟣 보랏빛 오로라 레이어 2 */
.aurora-layer-2 {
    position: absolute; width: 180%; height: 50%; top: -5%; left: -30%;
    background: radial-gradient(circle at 70% 30%, rgba(140, 0, 255, 0.1) 0%, rgba(0, 0, 0, 0) 45%);
    filter: blur(80px); animation: auroraWave 18s ease-in-out infinite alternate-reverse;
}

/* 수많은 미세한 은하수 별빛 */
.stars-layer-1 {
    position: absolute; width: 100%; height: 100%;
    background-image: 
        radial-gradient(1px 1px at 25px 40px, #fff, rgba(0,0,0,0)),
        radial-gradient(1px 1px at 125px 190px, #fff, rgba(0,0,0,0)),
        radial-gradient(1.5px 1.5px at 240px 320px, #e2e8f0, rgba(0,0,0,0)),
        radial-gradient(1px 1px at 350px 80px, #fff, rgba(0,0,0,0)),
        radial-gradient(2px 2px at 480px 260px, #f5e6c8, rgba(0,0,0,0)),
        radial-gradient(1px 1px at 580px 410px, #fff, rgba(0,0,0,0)),
        radial-gradient(1.5px 1.5px at 720px 150px, #fff, rgba(0,0,0,0)),
        radial-gradient(1px 1px at 890px 330px, #e2e8f0, rgba(0,0,0,0)),
        radial-gradient(2px 2px at 950px 70px, #fff, rgba(0,0,0,0));
    background-size: 550px 550px; opacity: 0.45;
}

/* 스스로 반짝이는 큰 별빛들 */
.stars-layer-2 {
    position: absolute; width: 100%; height: 100%;
    background-image: 
        radial-gradient(2px 2px at 80px 120px, #fff, rgba(0,0,0,0)),
        radial-gradient(2.5px 2.5px at 300px 450px, #f5e6c8, rgba(0,0,0,0)),
        radial-gradient(2px 2px at 600px 200px, #fff, rgba(0,0,0,0)),
        radial-gradient(3px 3px at 820px 380px, #fff, rgba(0,0,0,0));
    background-size: 400px 400px; opacity: 0.6;
    animation: starTwinkle 4s ease-in-out infinite;
}

/* 🌠 우주를 가르는 별똥별 시스템 */
.shooting-star {
    position: absolute; top: -10%; left: 50%; width: 2px; height: 2px;
    background: linear-gradient(90deg, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 100%);
    border-radius: 50%; opacity: 0; transform: rotate(-35deg);
    animation: shoot 8s linear infinite;
}
.shooting-star:nth-child(1) { top: 5%; left: 20%; animation-delay: 0s; animation-duration: 6s; }
.shooting-star:nth-child(2) { top: 15%; left: 60%; animation-delay: 2s; animation-duration: 9s; width: 3px; }
.shooting-star:nth-child(3) { top: 0%; left: 40%; animation-delay: 4.5s; animation-duration: 7s; }
.shooting-star:nth-child(4) { top: 25%; left: 10%; animation-delay: 6s; animation-duration: 8s; }
.shooting-star:nth-child(5) { top: 8%; left: 80%; animation-delay: 1.5s; animation-duration: 11s; }

/* ==========================================
   3. ❄️ 밤하늘에 내리는 눈송이 및 애니메이션 정의
   ========================================== */
.snowflake {
    position: fixed; top: -20px; color: white; opacity: 0.5;
    user-select: none; pointer-events: none; z-index: 2;
    animation: fall linear infinite;
}

@keyframes fall {
    0% { transform: translateY(0) rotate(0deg); }
    100% { transform: translateY(105vh) rotate(360deg); }
}
@keyframes auroraWave {
    0% { transform: translate(0, 0) scale(1) rotate(0deg); opacity: 0.7; }
    100% { transform: translate(-5%, 8%) scale(1.1) rotate(4deg); opacity: 1; }
}
@keyframes starTwinkle {
    0%, 100% { opacity: 0.3; }
    50% { opacity: 0.9; }
}
@keyframes shoot {
    0% { transform: translateX(0) translateY(0) scale(0) rotate(-35deg); opacity: 0; width: 0px; }
    1% { opacity: 1; width: 80px; scale: 1; }
    10% { transform: translateX(-300px) translateY(210px) scale(1) rotate(-35deg); opacity: 0; width: 0px; }
    100% { transform: translateX(-300px) translateY(210px) scale(0) rotate(-35deg); opacity: 0; }
}

/* ==========================================
   4. 겨울 분위기 버튼 (Frosted Glass 디자인)
   ========================================== */
.winter-btn, .page-btn, .winter-input {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.12);
    color: #F5E6C8;
    padding: 11px 22px;
    border-radius: 25px;
    cursor: pointer;
    font-size: 0.9rem;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    margin: 5px;
}

.winter-btn:hover, .page-btn:hover {
    background: rgba(245, 230, 200, 0.15);
    border-color: #F5E6C8;
    box-shadow: 0 0 20px rgba(245, 230, 200, 0.35);
    transform: translateY(-2px);
}

.controls { display: flex; justify-content: center; flex-wrap: wrap; margin-bottom: 40px; gap: 5px; }
.date-group { display: flex; align-items: center; }
.pagination { display: flex; justify-content: center; align-items: center; gap: 40px; margin-top: 50px; }
#page-indicator { color: #F5E6C8; font-weight: bold; font-size: 1.2rem; text-shadow: 0 0 10px #F5E6C8; }

/* ==========================================
   5. 카드 및 컴포넌트 스타일 (얼음 유리 감성)
   ========================================== */
.post-card {
    background: rgba(10, 20, 45, 0.4);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 24px; padding: 40px; margin-bottom: 30px;
    box-shadow: 0 20px 50px rgba(0,0,0,0.5);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    transition: transform 0.3s ease;
}
.post-card:hover {
    transform: translateY(-3px);
    border-color: rgba(245, 230, 200, 0.2);
}
.post-date { color: #64748b; font-size: 0.85rem; margin-bottom: 15px; letter-spacing: 1px; }
.post-title { color: #F5E6C8; font-size: 1.45rem; margin: 0 0 14px 0; font-weight: normal; }
.post-card p { color: #CBD5E0; line-height: 1.8; margin: 0; font-size: 1rem; }

/* ==========================================
   6. 🔒 관리자 제어 영역
   ========================================== */
#admin-area { 
    background: rgba(245, 230, 200, 0.03); border: 1px dashed rgba(245, 230, 200, 0.35); 
    border-radius: 24px; padding: 35px; margin-bottom: 40px;
    backdrop-filter: blur(10px);
}
#admin-area input, #admin-area textarea { 
    width: 100%; background: rgba(0,0,0,0.6); border: 1px solid rgba(255,255,255,0.1); color: #fff; 
    padding: 14px; margin-bottom: 14px; border-radius: 12px; box-sizing: border-box;
}
.admin-submit-btn { 
    background: #F5E6C8 !important; color: #02040f !important; 
    width: 100%; padding: 14px; border: none; border-radius: 12px; font-weight: bold; cursor: pointer;
    transition: all 0.2s;
}
.admin-submit-btn:hover { opacity: 0.9; transform: scale(0.99); }
#code-output { background: #050505; color: #A3E635; width: 100%; height: 80px; margin-top: 10px; border-radius: 8px; border: 1px solid #222; }
