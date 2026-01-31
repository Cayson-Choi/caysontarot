// 스프레드 정의
const SPREADS = {
    one_card: {
        name: '원 카드',
        count: 1,
        positions: ['오늘의 메시지']
    },
    three_card: {
        name: '쓰리 카드',
        count: 3,
        positions: ['과거', '현재', '미래']
    },
    relationship: {
        name: '관계 스프레드',
        count: 7,
        positions: [
            '나의 현재 상태', '상대방의 현재 상태', '나의 감정',
            '상대방의 감정', '관계의 장애물', '관계의 잠재력', '최종 결과'
        ]
    },
    celtic_cross: {
        name: '켈틱 크로스',
        count: 10,
        positions: [
            '현재 상황', '장애물/도전', '과거의 영향', '가까운 미래', '목표/이상',
            '잠재의식', '조언', '외부 영향', '희망과 두려움', '최종 결과'
        ]
    },
    custom: {
        name: '커스텀',
        count: 0,
        positions: []
    }
};

// 카드 목록 (78장)
const ALL_CARDS = [
    '0. 바보 카드.jpg', '1. 마법사 카드.jpg', '10. 운명의 수레바퀴.jpg', '11. 정의 카드.jpg',
    '12. 행맨 카드.jpg', '13. 죽음 카드.jpg', '14. 절제 카드.jpg', '15. 악마 카드.jpg',
    '16. 타워 카드.jpg', '17. 별 카드.jpg', '18. 달 카드.jpg', '19. 태양 카드.jpg',
    '2. 여사제 카드.jpg', '20. 심판 카드.jpg', '21. 세계 카드.jpg', '3. 여황제 카드.jpg',
    '4. 황제 카드.jpg', '5. 교황 카드.jpg', '6. 연인 카드.jpg', '7. 전차 카드.jpg',
    '8. 힘 카드.jpg', '9. 은둔자 카드.jpg',
    '소드 나이트.jpg', '소드 에이스.jpg', '소드 퀸.jpg', '소드 킹.jpg', '소드 페이지.jpg',
    '소드10.jpg', '소드2.jpg', '소드3.jpg', '소드4.jpg', '소드5.jpg', '소드6.jpg',
    '소드7.jpg', '소드8.jpg', '소드9.jpg',
    '완드 나이트.jpg', '완드 에이스.jpg', '완드 퀸.jpg', '완드 킹.jpg', '완드 페이지.jpg',
    '완드10.jpg', '완드2.jpg', '완드3.jpg', '완드4.jpg', '완드5.jpg', '완드6.jpg',
    '완드7.jpg', '완드8.jpg', '완드9.jpg',
    '컵 나이트.jpg', '컵 에이스.jpg', '컵 퀸.jpg', '컵 킹.jpg', '컵 페이지.jpg',
    '컵10.jpg', '컵2.jpg', '컵3.jpg', '컵4.jpg', '컵5.jpg', '컵6.jpg',
    '컵7.jpg', '컵8.jpg', '컵9.jpg',
    '펜타클 나이트.jpg', '펜타클 에이스.jpg', '펜타클 퀸.jpg', '펜타클 킹.jpg', '펜타클 페이지.jpg',
    '펜타클10.jpg', '펜타클2.jpg', '펜타클3.jpg', '펜타클4.jpg', '펜타클5.jpg', '펜타클6.jpg',
    '펜타클7.jpg', '펜타클8.jpg', '펜타클9.jpg'
];

// 앱 상태
let currentSpread = null;
let availableCards = [];
let drawnCards = [];
let currentCardIndex = 0;
let isMuted = false;

// DOM 요소
const screens = {
    mainMenu: document.getElementById('mainMenu'),
    reading: document.getElementById('readingScreen'),
    history: document.getElementById('historyScreen')
};

// 초기화
function init() {
    // 이벤트 리스너 등록
    document.querySelectorAll('.spread-btn').forEach(btn => {
        btn.addEventListener('click', () => selectSpread(btn.dataset.spread));
    });

    document.getElementById('historyBtn').addEventListener('click', showHistory);
    document.getElementById('drawBtn').addEventListener('click', drawNextCard);
    document.getElementById('backBtn').addEventListener('click', showMainMenu);
    document.getElementById('resetBtn').addEventListener('click', resetReading);
    document.getElementById('saveBtn').addEventListener('click', saveReading);
    document.getElementById('historyBackBtn').addEventListener('click', showMainMenu);
    document.getElementById('clearHistoryBtn').addEventListener('click', clearHistory);
    document.getElementById('muteBtn').addEventListener('click', toggleMute);
    document.getElementById('fullscreenBtn').addEventListener('click', toggleFullscreen);

    // 모달 버튼
    document.getElementById('customOkBtn').addEventListener('click', confirmCustomSpread);
    document.getElementById('customCancelBtn').addEventListener('click', () => {
        document.getElementById('customModal').classList.remove('active');
    });
    document.getElementById('detailCloseBtn').addEventListener('click', () => {
        document.getElementById('detailModal').classList.remove('active');
    });
}

// 화면 전환
function showScreen(screenName) {
    Object.values(screens).forEach(screen => screen.classList.remove('active'));
    screens[screenName].classList.add('active');
}

function showMainMenu() {
    showScreen('mainMenu');
}

// 스프레드 선택
function selectSpread(spreadType) {
    if (spreadType === 'custom') {
        document.getElementById('customModal').classList.add('active');
        return;
    }

    const spread = SPREADS[spreadType];
    startReading(spread);
}

function confirmCustomSpread() {
    const count = parseInt(document.getElementById('customCount').value);
    if (count < 1 || count > 10) {
        alert('1~10 사이의 숫자를 입력하세요!');
        return;
    }

    const customSpread = {
        name: '커스텀',
        count: count,
        positions: Array.from({length: count}, (_, i) => `카드 ${i + 1}`)
    };

    document.getElementById('customModal').classList.remove('active');
    startReading(customSpread);
}

// 리딩 시작
function startReading(spread) {
    currentSpread = spread;
    currentCardIndex = 0;
    drawnCards = [];

    // 카드 덱 초기화 및 셔플
    availableCards = [...ALL_CARDS];
    shuffleArray(availableCards);

    // UI 업데이트
    document.getElementById('readingTitle').textContent = `📖 ${spread.name}`;
    const wrapper = document.getElementById('cardsWrapper');
    wrapper.innerHTML = '';

    // 카드 슬롯 생성
    for (let i = 0; i < spread.count; i++) {
        const slot = document.createElement('div');
        slot.className = 'card-slot';

        const card = document.createElement('div');
        card.className = 'card';
        card.dataset.index = i;

        const img = document.createElement('img');
        img.src = 'public/assets/card_back.png';
        img.alt = '카드 뒷면';

        card.appendChild(img);
        slot.appendChild(card);

        const position = document.createElement('div');
        position.className = 'card-position';
        position.textContent = spread.positions[i];
        slot.appendChild(position);

        wrapper.appendChild(slot);
    }

    // 버튼 초기화
    const drawBtn = document.getElementById('drawBtn');
    drawBtn.textContent = '🎴 카드 뽑기';
    drawBtn.disabled = false;

    document.getElementById('drawnCardsList').textContent = '뽑은 카드: ';

    showScreen('reading');
}

// 다음 카드 뽑기
function drawNextCard() {
    if (currentCardIndex >= currentSpread.count) {
        alert('모든 카드를 뽑았습니다!');
        return;
    }

    if (availableCards.length === 0) {
        alert('더 이상 뽑을 카드가 없습니다!');
        return;
    }

    // 랜덤 카드 선택
    const cardFile = availableCards.pop();
    const cardName = cardFile.replace('.jpg', '');

    // 카드 정보 저장
    drawnCards.push({
        position: currentSpread.positions[currentCardIndex],
        card: cardName,
        file: cardFile
    });

    // 카드 표시 (애니메이션)
    const cards = document.querySelectorAll('.card');
    const card = cards[currentCardIndex];

    card.classList.add('revealed');

    setTimeout(() => {
        const img = card.querySelector('img');
        img.src = `public/cards/${cardFile}`;
        img.alt = cardName;
    }, 300);

    // 뽑은 카드 목록 업데이트
    updateDrawnCardsList();

    // 다음 카드로
    currentCardIndex++;

    // 버튼 텍스트 업데이트
    const drawBtn = document.getElementById('drawBtn');
    const remaining = currentSpread.count - currentCardIndex;
    if (remaining > 0) {
        drawBtn.textContent = `🎴 카드 뽑기 (${remaining}장 남음)`;
    } else {
        drawBtn.textContent = '✅ 완료';
        drawBtn.disabled = true;
    }
}

function updateDrawnCardsList() {
    let text = '뽑은 카드: ';
    drawnCards.forEach(card => {
        text += `🃏 ${card.card} (${card.position})  `;
    });
    document.getElementById('drawnCardsList').textContent = text;
}

// 다시 뽑기
function resetReading() {
    if (confirm('다시 뽑으시겠습니까?')) {
        startReading(currentSpread);
    }
}

// 리딩 저장
function saveReading() {
    if (drawnCards.length === 0) {
        alert('뽑은 카드가 없습니다!');
        return;
    }

    const reading = {
        date: new Date().toLocaleString('ko-KR'),
        spread: currentSpread.name,
        cards: drawnCards
    };

    // LocalStorage에 저장
    const history = getHistory();
    history.unshift(reading);
    localStorage.setItem('tarotHistory', JSON.stringify(history));

    alert('리딩이 저장되었습니다!');
}

// 히스토리 관리
function getHistory() {
    const stored = localStorage.getItem('tarotHistory');
    return stored ? JSON.parse(stored) : [];
}

function showHistory() {
    const history = getHistory();
    const list = document.getElementById('historyList');
    list.innerHTML = '';

    if (history.length === 0) {
        list.innerHTML = '<p style="text-align: center; color: #9ca3af; padding: 40px;">저장된 리딩이 없습니다.</p>';
    } else {
        history.forEach((reading, index) => {
            const item = document.createElement('div');
            item.className = 'history-item';
            item.innerHTML = `
                <div class="history-date">${reading.date}</div>
                <div class="history-spread">${reading.spread} (${reading.cards.length}장)</div>
            `;
            item.addEventListener('click', () => showReadingDetail(reading));
            list.appendChild(item);
        });
    }

    showScreen('history');
}

function showReadingDetail(reading) {
    const content = document.getElementById('detailContent');
    let html = `<strong>날짜:</strong> ${reading.date}<br>`;
    html += `<strong>스프레드:</strong> ${reading.spread}<br><br>`;
    html += '<strong>뽑은 카드:</strong><br>';

    reading.cards.forEach(card => {
        html += `• ${card.position}: ${card.card}<br>`;
    });

    content.innerHTML = html;
    document.getElementById('detailModal').classList.add('active');
}

function clearHistory() {
    if (confirm('모든 히스토리를 삭제하시겠습니까?')) {
        localStorage.removeItem('tarotHistory');
        showHistory();
    }
}

// 유틸리티
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function toggleMute() {
    isMuted = !isMuted;
    document.getElementById('muteBtn').textContent = isMuted ? '🔇' : '🔊';
}

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else {
        document.exitFullscreen();
    }
}

// ESC 키로 전체화면 종료
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && document.fullscreenElement) {
        document.exitFullscreen();
    }
});

// 앱 시작
init();
