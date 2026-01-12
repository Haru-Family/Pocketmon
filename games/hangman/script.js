const GEN_RANGES = {
    1: [1, 151],
    2: [152, 251],
    3: [252, 386],
    4: [387, 493],
    5: [494, 649],
    6: [650, 721],
    7: [722, 809],
    8: [810, 905]
};

// Global State
let selectedGens = [];
let currentPokemon = null;
let currentSyllables = []; // Array of {char: '피', guessed: false}
let lives = 3;
let score = 0;
let isGameActive = false;

// DOM Elements
const setupScreen = document.getElementById('setup-screen');
const gameScreen = document.getElementById('game-screen');
const startBtn = document.getElementById('start-btn');
const pokemonImg = document.getElementById('pokemon-img');
const wordContainer = document.getElementById('word-container');
const keyboardContainer = document.getElementById('keyboard-container');
const livesDisplay = document.getElementById('lives-display');
const scoreDisplay = document.getElementById('score-display');
const spinner = document.getElementById('loading-spinner');
const resultModal = document.getElementById('result-modal');
const resultTitle = document.getElementById('result-title');
const resultMessage = document.getElementById('result-message');
const revealImg = document.getElementById('reveal-img');
const revealName = document.getElementById('reveal-name');
const nextBtn = document.getElementById('next-btn');
const quitBtn = document.getElementById('quit-btn');

// --- Initialization ---
startBtn.addEventListener('click', startGame);
nextBtn.addEventListener('click', nextRound);
quitBtn.addEventListener('click', () => location.reload()); // Simple reload to quit

function startGame() {
    // Get selected generations
    const checkboxes = document.querySelectorAll('.gen-option input:checked');
    selectedGens = Array.from(checkboxes).map(cb => parseInt(cb.value));

    if (selectedGens.length === 0) {
        alert("최소 1개의 세대를 선택해주세요!");
        return;
    }

    setupScreen.classList.add('hidden');
    setupScreen.classList.remove('active');
    gameScreen.classList.remove('hidden');
    gameScreen.classList.add('active');

    score = 0;
    updateScoreUI();
    nextRound();
}

function updateScoreUI() {
    scoreDisplay.innerText = score;
}

// --- Game Logic ---

async function nextRound() {
    resultModal.classList.add('hidden');
    isGameActive = false;
    lives = 3;
    livesDisplay.innerText = lives;

    // Show loading
    spinner.classList.remove('hidden');
    pokemonImg.style.display = 'none';
    wordContainer.innerHTML = '';
    keyboardContainer.innerHTML = '';

    // 1. Pick Random Pokemon ID from selected Gens
    const id = getRandomPokemonId();

    // 2. Fetch Data
    let data;
    try {
        data = await fetchPokemonData(id);
    } catch (err) {
        console.error("Fetch failed:", err);
        alert(`포켓몬 데이터를 불러오지 못했습니다. (ID: ${id})\n에러: ${err.message}`);
        location.reload();
        return;
    }

    // 3. Setup Game State
    try {
        currentPokemon = data;
        setupRound(data);
    } catch (err) {
        console.error("Setup failed:", err);
        alert(`게임 설정 중 오류가 발생했습니다.\n에러: ${err.message}`);
        location.reload();
    }
}

function getRandomPokemonId() {
    // Flatten allowed ID ranges
    let allowedIds = [];
    selectedGens.forEach(gen => {
        const [min, max] = GEN_RANGES[gen];
        for (let i = min; i <= max; i++) allowedIds.push(i);
    });

    // Pick random
    return allowedIds[Math.floor(Math.random() * allowedIds.length)];
}

async function fetchPokemonData(id) {
    // Fetch Species (for Korean Name)
    const speciesRes = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${id}`);
    if (!speciesRes.ok) throw new Error(`Species API Error: ${speciesRes.status}`);
    const speciesData = await speciesRes.json();

    // Find Korean Name
    if (!speciesData.names) throw new Error("Names data missing");
    const koreanNameEntry = speciesData.names.find(n => n.language.name === 'ko');
    const koreanName = koreanNameEntry ? koreanNameEntry.name : speciesData.name; // Fallback to English if no Korean

    // Fetch Details (for Image)
    // We use the official artwork if available, else default sprite
    // Fetch Cries (latest)
    const cryUrl = `https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/${id}.ogg`;

    // Note: We don't fetch the image URL itself, we construct it.
    // However, verify image exists? No, we use onerror handler for that.
    const imageUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;

    return { id, name: koreanName, imageUrl, cryUrl };
}

function setupRound(pokemon) {
    // Prepare Image
    if (!pokemonImg) throw new Error("Image element not found");
    pokemonImg.src = pokemon.imageUrl;
    pokemonImg.className = `blur-${lives}`; // Set initial blur

    pokemonImg.onload = () => {
        spinner.classList.add('hidden');
        pokemonImg.style.display = 'block';
    };

    pokemonImg.onerror = () => {
        console.warn("Image load failed, skipping round");
        alert("이미지 로딩 실패! 다음 문제로 넘어갑니다.");
        nextRound();
    };

    // Prepare Word Logic
    const cleanName = pokemon.name.replace(/[^가-힣]/g, "");
    currentSyllables = cleanName.split('').map(char => ({ char, guessed: false }));

    renderWord();
    generateKeyboard(cleanName);

    isGameActive = true;
}

// ... existing renderWord, generateKeyboard, generateDistractors, handleGuess, loseLife, checkWin ...

function renderWord() {
    wordContainer.innerHTML = '';
    currentSyllables.forEach(s => {
        const box = document.createElement('div');
        box.className = 'syllable-box';
        // Show char if guessed, otherwise empty/underscore
        box.innerText = s.guessed ? s.char : '';
        wordContainer.appendChild(box);
    });
}

function generateKeyboard(correctName) {
    keyboardContainer.innerHTML = '';

    // 1. Get correct chars
    const correctChars = new Set(correctName.split(''));

    // 2. Add some random distractors
    const distractors = generateDistractors(8); // Add 8 random distractors
    const allOptions = new Set([...correctChars, ...distractors]);

    // 3. Convert to Array and Shuffle
    const shuffledOptions = Array.from(allOptions).sort(() => Math.random() - 0.5);

    // 4. Render Buttons
    shuffledOptions.forEach(char => {
        const btn = document.createElement('button');
        btn.className = 'key-btn';
        btn.innerText = char;
        btn.onclick = () => handleGuess(char, btn);
        keyboardContainer.appendChild(btn);
    });
}

const RANDOM_SYLLABLES_POOL = "가나다라마바사아자차카타파하거너더러머버서어저처커터퍼허고노도로모보소오조초코토포호구누두루무부수우주추쿠투푸후기니디리미비시이지치키티피히에애게네데레메베세에제체케테페헤";

function generateDistractors(count) {
    const arr = [];
    for (let i = 0; i < count; i++) {
        const idx = Math.floor(Math.random() * RANDOM_SYLLABLES_POOL.length);
        arr.push(RANDOM_SYLLABLES_POOL[idx]);
    }
    return arr;
}

function handleGuess(char, btnElement) {
    if (!isGameActive) return;

    // Check if char is in the name
    let found = false;
    currentSyllables.forEach(s => {
        if (s.char === char) {
            s.guessed = true;
            found = true;
        }
    });

    if (found) {
        btnElement.classList.add('correct');
        renderWord();
        checkWin();
    } else {
        btnElement.classList.add('wrong');
        loseLife();
    }
}

function loseLife() {
    lives--;
    livesDisplay.innerText = lives;

    // Update Blur
    // Lives: 3 (Blur 3) -> 2 (Blur 2) -> 1 (Blur 1) -> 0 (Loss)
    // Actually our css classes are blur-3, blur-2, blur-1. 
    // If lives is 2, we want blur-2.
    if (lives >= 0) {
        pokemonImg.className = `blur-${lives}`;
    }

    if (lives <= 0) {
        endGame(false);
    }
}

function checkWin() {
    const allGuessed = currentSyllables.every(s => s.guessed);
    if (allGuessed) {
        endGame(true);
    }
}

function endGame(win) {
    isGameActive = false;

    // Reveal Image
    pokemonImg.className = 'blur-0';

    setTimeout(() => {
        resultModal.classList.remove('hidden');
        revealImg.src = currentPokemon.imageUrl;
        revealName.innerText = currentPokemon.name;

        if (win) {
            score += 100; // Simple score
            updateScoreUI();
            resultTitle.innerText = "정답입니다! 🎉";
            resultMessage.innerText = "정말 대단해요! 포켓몬 박사님이시네요!";
            resultTitle.style.color = "var(--primary-blue)";

            // Play Cry
            if (currentPokemon.cryUrl) {
                const audio = new Audio(currentPokemon.cryUrl);
                audio.volume = 0.5;
                audio.play().catch(e => console.warn("Audio play failed (interaction needed or file missing):", e));
            }
        } else {
            resultTitle.innerText = "아쉬워요... 😢";
            resultMessage.innerText = `정답은 "${currentPokemon.name}" 였습니다!`;
            resultTitle.style.color = "var(--primary-red)";
        }
    }, 1000); // Wait a sec to see the unblurred image
}
