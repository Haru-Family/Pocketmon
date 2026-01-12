// Global State
let numPairs = 5;
let cards = []; // Array of { id, imageUrl, matched }
let flippedCards = []; // Currently flipped cards (max 2)
let isLocked = false; // Lock board during mismatch animation
let moves = 0;
let timerInterval = null;
let startTime = 0;

// DOM Elements
const setupScreen = document.getElementById('setup-screen');
const gameScreen = document.getElementById('game-screen');
const startBtn = document.getElementById('start-btn');
const gameBoard = document.getElementById('game-board');
const timerDisplay = document.getElementById('timer-display');
const movesDisplay = document.getElementById('moves-display');
const resultModal = document.getElementById('result-modal');
const finalTime = document.getElementById('final-time');
const finalMoves = document.getElementById('final-moves');
const restartBtn = document.getElementById('restart-btn');
const quitBtn = document.getElementById('quit-btn');

// --- Initialization ---
startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', () => location.reload()); // Simple reload
quitBtn.addEventListener('click', () => location.reload());

async function startGame() {
    // Get settings
    const selectedRadio = document.querySelector('input[name="pairs"]:checked');
    numPairs = parseInt(selectedRadio.value);

    setupScreen.classList.add('hidden');
    setupScreen.classList.remove('active');
    gameScreen.classList.remove('hidden');
    gameScreen.classList.add('active');

    // Reset State
    moves = 0;
    flippedCards = [];
    isLocked = true; // Lock until preview finishes
    updateUI();

    // Fetch and Setup
    try {
        const pokemonList = await fetchRandomGen1Pokemon(numPairs);
        setupBoard(pokemonList);
        startPreview();
    } catch (err) {
        console.error(err);
        alert("데이터 로딩 실패. 다시 시도해주세요.");
        location.reload();
    }
}

function updateUI() {
    movesDisplay.innerText = moves;
    // Timer update happens in interval
}

// --- Logic ---

function getRandomGen1Ids(count) {
    // Gen 1: 1-151
    const set = new Set();
    while (set.size < count) {
        set.add(Math.floor(Math.random() * 151) + 1);
    }
    return Array.from(set);
}

async function fetchRandomGen1Pokemon(count) {
    const ids = getRandomGen1Ids(count);
    // We only need images. No names/cries really needed for this game logic, but maybe for alt text.
    // Let's just construct image URLs directly to save API calls.
    // Official Artwork is best.
    return ids.map(id => ({
        id,
        imageUrl: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`
    }));
}

function setupBoard(pokemonList) {
    // Duplicate for pairs
    let deck = [...pokemonList, ...pokemonList];

    // Shuffle
    deck.sort(() => Math.random() - 0.5);

    gameBoard.innerHTML = '';

    // Adjust Grid Columns based on Total Cards
    // 10 cards (5 pairs) -> 5x2 or 4x3? 
    // 12 cards (6 pairs) -> 4x3
    // 14 cards (7 pairs) -> 4x4 (2 empty) or 5x3 (1 empty)? 
    // 16 cards (8 pairs) -> 4x4

    // Let's use flexible grid with CSS.
    // But we can suggest row count via style if needed.

    deck.forEach((data, index) => {
        const card = createCardElement(data, index);
        gameBoard.appendChild(card);
    });
}

function createCardElement(data, index) {
    const container = document.createElement('div');
    container.className = 'card-container';
    container.dataset.id = data.id;
    container.dataset.index = index; // Unique ID for finding DOM element

    const inner = document.createElement('div');
    inner.className = 'card-inner';

    const front = document.createElement('div');
    front.className = 'card-front';
    // Pattern via CSS

    const back = document.createElement('div');
    back.className = 'card-back';
    const img = document.createElement('img');
    img.src = data.imageUrl;
    back.appendChild(img);

    inner.appendChild(front);
    inner.appendChild(back);
    container.appendChild(inner);

    container.addEventListener('click', () => flipCard(container));

    return container;
}

function startPreview() {
    // Flip all cards face up
    const cards = document.querySelectorAll('.card-container');

    // 1. Show setup for a moment
    setTimeout(() => {
        cards.forEach(card => card.classList.add('flipped'));
    }, 500);

    // 2. Wait 2 seconds then flip back
    setTimeout(() => {
        cards.forEach(card => card.classList.remove('flipped'));
        isLocked = false; // Unlock game
        startTimer();
    }, 2500); // 0.5s + 2s
}

function startTimer() {
    startTime = Date.now();
    timerInterval = setInterval(() => {
        const delta = Math.floor((Date.now() - startTime) / 1000);
        const m = Math.floor(delta / 60).toString().padStart(2, '0');
        const s = (delta % 60).toString().padStart(2, '0');
        timerDisplay.innerText = `${m}:${s}`;
    }, 1000);
}

function stopTimer() {
    clearInterval(timerInterval);
}

function flipCard(card) {
    if (isLocked) return;
    if (card.classList.contains('flipped')) return; // Already flipped
    if (card.classList.contains('matched')) return; // Already matched

    card.classList.add('flipped');
    flippedCards.push(card);

    if (flippedCards.length === 2) {
        checkMatch();
    }
}

function checkMatch() {
    isLocked = true;
    moves++;
    updateUI();

    const [card1, card2] = flippedCards;
    const id1 = card1.dataset.id;
    const id2 = card2.dataset.id;

    if (id1 === id2) {
        // Match
        card1.classList.add('matched');
        card2.classList.add('matched');
        flippedCards = [];
        isLocked = false;
        checkWin();
    } else {
        // Mismatch
        setTimeout(() => {
            card1.classList.remove('flipped');
            card2.classList.remove('flipped');
            flippedCards = [];
            isLocked = false;
        }, 1000);
    }
}

function checkWin() {
    const matched = document.querySelectorAll('.matched');
    if (matched.length === numPairs * 2) {
        stopTimer();
        setTimeout(() => {
            finalTime.innerText = timerDisplay.innerText;
            finalMoves.innerText = moves;
            resultModal.classList.remove('hidden');
        }, 500);
    }
}
