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
let currentPokemon = null; // { id, name, details, cryUrl, types }
let options = []; // Array of 3 items
let lives = 3;
let score = 0;
let hintsUsed = 0;
let audio = null;

// DOM Elements
const setupScreen = document.getElementById('setup-screen');
const gameScreen = document.getElementById('game-screen');
const startBtn = document.getElementById('start-btn');
const playCryBtn = document.getElementById('play-cry-btn');
const hint1Btn = document.getElementById('hint-1-btn');
const hint2Btn = document.getElementById('hint-2-btn');
const hintMessage = document.getElementById('hint-message');
const hiddenCover = document.getElementById('hidden-cover');
const revealOptionsBtn = document.getElementById('reveal-options-btn');
const optionsList = document.getElementById('options-list');
const livesDisplay = document.getElementById('lives-display');
const scoreDisplay = document.getElementById('score-display');
const resultModal = document.getElementById('result-modal');
const resultTitle = document.getElementById('result-title');
const resultMessage = document.getElementById('result-message');
const revealImg = document.getElementById('reveal-img');
const revealName = document.getElementById('reveal-name');
const nextBtn = document.getElementById('next-btn');
const quitBtn = document.getElementById('quit-btn');

// --- Initialization ---
startBtn.addEventListener('click', startGame);
playCryBtn.addEventListener('click', playCry);
revealOptionsBtn.addEventListener('click', revealOptions);
hint1Btn.addEventListener('click', () => showHint(1));
hint2Btn.addEventListener('click', () => showHint(2));
nextBtn.addEventListener('click', nextRound);
quitBtn.addEventListener('click', () => location.reload());

function startGame() {
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

function updateScoreUI() { scoreDisplay.innerText = score; }

async function nextRound() {
    resultModal.classList.add('hidden');

    // Reset Round State
    hintsUsed = 0;
    hint1Btn.classList.remove('disabled', 'hidden');
    hint2Btn.classList.add('hidden');
    hint2Btn.classList.remove('disabled');
    hintMessage.innerText = "";

    hiddenCover.classList.remove('removed');
    optionsList.classList.remove('active', 'hidden'); // reset visibility
    optionsList.classList.add('hidden'); // Initially hidden logic (actually handled by active/hidden class on container)
    // Actually the logic is: hidden-cover covers options-list. options-list is opacity 0.

    lives = 3;
    livesDisplay.innerText = lives;

    // 1. Pick Correct Pokemon
    const targetId = getRandomPokemonId();
    try {
        currentPokemon = await fetchPokemonData(targetId);

        // 2. Pick 2 Distractors
        const distractor1 = await fetchPokemonData(getRandomPokemonId(targetId));
        const distractor2 = await fetchPokemonData(getRandomPokemonId(targetId)); // Simple random, might duplicate rarely but acceptable or fix below

        options = [currentPokemon, distractor1, distractor2].sort(() => Math.random() - 0.5);

        // 3. Setup Audio
        // Cry URL is fetched in fetchPokemonData

        // 4. Render Options (Hidden initially)
        renderOptions();

        // Auto Play sound after a short delay
        setTimeout(playCry, 500);

    } catch (err) {
        console.error(err);
        alert("데이터 로딩 실패. 다시 시도합니다.");
        nextRound();
    }
}

function getRandomPokemonId(excludeId = -1) {
    let allowedIds = [];
    selectedGens.forEach(gen => {
        const [min, max] = GEN_RANGES[gen];
        for (let i = min; i <= max; i++) allowedIds.push(i);
    });

    let pick;
    do {
        pick = allowedIds[Math.floor(Math.random() * allowedIds.length)];
    } while (pick === excludeId);
    return pick;
}

async function fetchPokemonData(id) {
    // Basic Data
    const speciesRes = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${id}`);
    const speciesData = await speciesRes.json();

    const entry = speciesData.names.find(n => n.language.name === 'ko');
    const name = entry ? entry.name : speciesData.name;

    // Gen info (from URL or tracked)
    // speciesData.generation.name is like "generation-i"
    const genName = speciesData.generation.name;

    // Type info
    const pokemonRes = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
    const pokemonData = await pokemonRes.json();
    const types = pokemonData.types.map(t => translateType(t.type.name)).join(", ");

    // Image & Cry
    const imageUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
    const cryUrl = `https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/${id}.ogg`;

    return { id, name, genName, types, imageUrl, cryUrl, rawGen: speciesData.generation.name };
}

function translateType(engType) {
    const table = {
        normal: "노말", fire: "불꽃", water: "물", grass: "풀", electric: "전기", ice: "얼음", fighting: "격투",
        poison: "독", ground: "땅", flying: "비행", psychic: "에스퍼", bug: "벌레", rock: "바위", ghost: "고스트",
        dragon: "드래곤", steel: "강철", fairy: "페어리", dark: "악"
    };
    return table[engType] || engType;
}

function renderOptions() {
    optionsList.innerHTML = '';
    options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'option-card';
        btn.innerHTML = `<img src="${opt.imageUrl}"> <span>${opt.name}</span>`;
        btn.onclick = () => checkAnswer(opt, btn);
        optionsList.appendChild(btn);
    });
}

function revealOptions() {
    hiddenCover.classList.add('removed');
    optionsList.classList.remove('hidden');
    optionsList.classList.add('active');
}

function playCry() {
    if (currentPokemon && currentPokemon.cryUrl) {
        if (audio) { audio.pause(); audio.currentTime = 0; }
        audio = new Audio(currentPokemon.cryUrl);
        // audio.volume = 0.5;
        audio.play().catch(e => console.warn("Auto-play blocked", e));

        // Animate bars? CSS animation is infinite, maybe toggle class?
        // kept simple for now
    }
}

function showHint(level) {
    if (level === 1) {
        const genNum = getGenNumber(currentPokemon.rawGen);
        hintMessage.innerText = `이 친구는 ${genNum}세대 친구예요!`;
        hint1Btn.classList.add('disabled');
        hint2Btn.classList.remove('hidden'); // Unlock hint 2
        score -= 10; // Penalty
    } else if (level === 2) {
        hintMessage.innerText = `이 친구의 속성은 [${currentPokemon.types}] 이에요!`;
        hint2Btn.classList.add('disabled');
        score -= 20; // Penalty
    }
}

function getGenNumber(genStr) {
    // generation-i -> 1
    const roman = genStr.split('-')[1];
    const romanMap = { i: 1, ii: 2, iii: 3, iv: 4, v: 5, vi: 6, vii: 7, viii: 8 };
    return romanMap[roman] || "?";
}

function checkAnswer(selected, btn) {
    if (selected.id === currentPokemon.id) {
        btn.classList.add('correct');
        score += 100;
        endGame(true);
    } else {
        btn.classList.add('wrong');
        btn.style.pointerEvents = 'none'; // Disable click
        lives--;
        livesDisplay.innerText = lives;
        if (lives <= 0) endGame(false);
    }
}

function endGame(win) {
    revealImg.src = currentPokemon.imageUrl;
    revealName.innerText = currentPokemon.name;

    resultModal.classList.remove('hidden');

    if (win) {
        resultTitle.innerText = "정답입니다! 🎉";
        resultMessage.innerText = "귀가 정말 밝으시네요!";
        resultTitle.style.color = "var(--primary-blue)";
    } else {
        resultTitle.innerText = "아쉬워요... 😢";
        resultMessage.innerText = `정답은 "${currentPokemon.name}" 였습니다!`;
        resultTitle.style.color = "var(--primary-red)";
    }
}
