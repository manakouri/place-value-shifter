// Firebase CDN setup (make sure <script> tags are in your HTML head)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-app.js";
import { getDatabase, ref, set, onValue, update } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-database.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-analytics.js";

const firebaseConfig = {
    apiKey: "AIzaSyAakXPbECFWlXMjG-EpB5_NSPcDWK0BkjY",
    authDomain: "place-value-shifter.firebaseapp.com",
    projectId: "place-value-shifter",
    storageBucket: "place-value-shifter.firebasestorage.app",
    messagingSenderId: "388817467603",
    appId: "1:388817467603:web:26f323802399f959dd7c26",
    measurementId: "G-TMZC74RWR2"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app, "https://place-value-shifter-default-rtdb.asia-southeast1.firebasedatabase.app");
const analytics = getAnalytics(app);

window.showScreen = showScreen;
window.startGame = startGame;
window.joinGame = joinGame;
window.startChallenge = startChallenge;
window.startPractice = startPractice;
window.checkAnswer = checkAnswer;
window.applyLuck = applyLuck;
window.checkPracticeAnswer = checkPracticeAnswer;
window.nextQuestion = nextQuestion; // Expose for the "Try Again" button

// Global variables
let gameCode = '';
let teams = [];
let score = 0;
let correctStreak = 0;
let gameDuration = 0;
let selectedTypes = [];
let timerInterval;
let teamName = "";
let gameHasStarted = false;

const screens = document.querySelectorAll('.screen');
function showScreen(id) {
    screens.forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    if (id === 'create-game') setupCreateGame();
    if (id === 'practice-mode') setupPracticeOptions();
}

function setupCreateGame() {
    gameCode = Math.floor(1000000 + Math.random() * 9000000).toString();
    document.getElementById('game-code').textContent = gameCode;

    const questionTypesDiv = document.getElementById('question-types');
    questionTypesDiv.innerHTML = '';
    const types = [
        "Whole x 10", "Whole x 100", "Whole ÷ 10", "Whole ÷ 100",
        "1dp x 10", "1dp x 100", "1dp ÷ 10", "1dp ÷ 100",
        "2dp x 10", "2dp x 100", "2dp ÷ 10", "2dp ÷ 100"
    ];
    types.forEach(type => {
        const label = document.createElement('label');
        label.innerHTML = `<input type="checkbox" value="${type}" /> ${type}`;
        questionTypesDiv.appendChild(label);
    });

    listenForTeams(gameCode);
    listenForLeaderboard(gameCode);
}

function joinGame() {
    const code = document.getElementById('join-code').value;
    const name = document.getElementById('team-name').value;
    teamName = name;
    if (!code || !name) return alert("Enter both fields");

    // NEW FIX: Reset the game state flag for players joining a new game.
    gameHasStarted = false;

    const teamRef = ref(db, `games/${code}/teams/${name}`);
    set(teamRef, { score: 0, joinedAt: Date.now() });

    showScreen('waiting-screen');
    listenForGameStart(code);
}

function listenForTeams(code) {
    const teamsRef = ref(db, `games/${code}/teams`);
    onValue(teamsRef, snapshot => {
        const data = snapshot.val();
        teams = Object.keys(data || {});
        const teamList = document.getElementById('team-list');
        teamList.innerHTML = teams.map(t => `<li>${t}</li>`).join('');
        document.getElementById('start-game-btn').disabled = teams.length === 0;
    });
}

function listenForLeaderboard(code) {
    const leaderboardRef = ref(db, `games/${code}/teams`);
    onValue(leaderboardRef, snapshot => {
        const data = snapshot.val();
        const sorted = Object.entries(data || {}).sort((a, b) => b[1].score - a[1].score);
        const leaderboard = document.getElementById('leaderboard');
        leaderboard.innerHTML = sorted.map(([name, info]) =>
            `<li>${name}: ${info.score}</li>`).join('');
    });
}

function startGame() {
    selectedTypes = Array.from(document.querySelectorAll('#question-types input:checked')).map(cb => cb.value);
    gameDuration = parseInt(document.getElementById('game-length').value) * 60;
    
    if (selectedTypes.length === 0) {
        return alert("Please select at least one question type.");
    }

    update(ref(db, `games/${gameCode}`), {
        started: true,
        types: selectedTypes,
        duration: gameDuration,
        startTime: Date.now()
    });

    startTimer(gameDuration, document.getElementById('create-timer'), () => {
        document.getElementById('create-timer').textContent = "Game Over";
    });
}

function renderPlaceValueTable() {
    const div = document.getElementById('place-value-table');
    if (!div) return;
    div.innerHTML = `
    <table style="margin: 0 auto;">
      <tr><th>Thousands</th><th>Hundreds</th><th>Tens</th><th>Ones</th><th>Decimal</th><th>Tenths</th><th>Hundredths</th></tr>
      <tr><td>1000</td><td>100</td><td>10</td><td>1</td><td>.</td><td>0.1</td><td>0.01</td></tr>
    </table>
  `;
}

function listenForGameStart(code) {
    const gameRef = ref(db, `games/${code}`);
    onValue(gameRef, snapshot => {
        const data = snapshot.val();
        if (data?.started && !gameHasStarted) {
            gameHasStarted = true;
            selectedTypes = data.types;
            gameDuration = data.duration;
            gameCode = code;

            showScreen('game-screen');
            renderPlaceValueTable();
            startTimer(gameDuration, document.getElementById('game-timer'), endGame);
            nextQuestion();
        }
    });
}

function startTimer(duration, display, callback) {
    clearInterval(timerInterval);
    let time = duration;
    timerInterval = setInterval(() => {
        const min = Math.floor(time / 60);
        const sec = time % 60;
        display.textContent = `${min}:${sec < 10 ? '0' + sec : sec}`;
        if (--time < 0) {
            clearInterval(timerInterval);
            if(callback) callback();
        }
    }, 1000);
}

function nextQuestion() {
    const container = document.getElementById('question-container');
    if (!Array.isArray(selectedTypes) || selectedTypes.length === 0) {
        container.innerHTML = `<p>Error: No question types selected.</p>`;
        return;
    }

    const q = generateQuestion(selectedTypes);

    // NEW FIX: Instead of a recursive timeout, show a user-friendly error.
    if (!q || !q.prompt || !Array.isArray(q.options)) {
        console.error("CRITICAL: Invalid question generated. Halting to prevent freeze.", q);
        container.innerHTML = `<p>Oops! An error occurred while generating a question.</p><button onclick="nextQuestion()">Try Again</button>`;
        return;
    }

    container.innerHTML = `<p>${q.prompt}</p>` + q.options.map((opt, i) =>
        `<button onclick="checkAnswer(${i}, ${q.correct})">${opt}</button>`).join('');
}

function checkAnswer(index, correctIndex) {
    if (index === correctIndex) {
        score++;
        correctStreak++;
        document.getElementById('team-score').textContent = score;
        updateScore(score);
        if (correctStreak >= 2 && Math.random() > 0.5) {
            showLuckBoxes();
        } else {
            nextQuestion();
        }
    } else {
        correctStreak = 0;
        nextQuestion();
    }
}

function showLuckBoxes() {
    const luckBoxes = document.getElementById('luck-boxes');
    luckBoxes.classList.remove('hidden');
    const rewards = shuffleArray(['Double', 'Triple', 'Halve', '+5']);
    luckBoxes.innerHTML = `
    <p>Choose a secret box:</p>
    <button onclick="applyLuck('${rewards[0]}')">Box 1</button>
    <button onclick="applyLuck('${rewards[1]}')">Box 2</button>
    <button onclick="applyLuck('${rewards[2]}')">Box 3</button>
  `;
}

function applyLuck(type) {
    if (type === 'Double') score *= 2;
    if (type === 'Triple') score *= 3;
    if (type === 'Halve') score = Math.floor(score / 2);
    if (type === '+5') score += 5;
    
    document.getElementById('team-score').textContent = score;
    updateScore(score);
    document.getElementById('luck-boxes').classList.add('hidden');
    correctStreak = 0;
    nextQuestion();
}

function setupPracticeOptions() {
    document.getElementById('practice-container').innerHTML = '';
    renderPlaceValueTable();
}

function startChallenge() {
    score = 0;
    correctStreak = 0;
    startTimer(180, document.getElementById('game-timer'), () => {
        document.getElementById('practice-container').innerHTML = `<p>Challenge Over! Score: ${score}</p>`;
    });
    nextPracticeQuestion();
}

function startPractice() {
    selectedTypes = ["Whole x 10", "1dp ÷ 10", "2dp x 100", "2dp ÷ 10"];
    nextPracticeQuestion();
}

function nextPracticeQuestion() {
    const q = generateQuestion(selectedTypes);
    const container = document.getElementById('practice-container');
    container.innerHTML = `<p>${q.prompt}</p>` + q.options.map((opt, i) =>
        `<button onclick="checkPracticeAnswer(${i}, ${q.correct}, '${q.prompt}', '${JSON.stringify(q.options)}')">${opt}</button>`).join('');
}

function checkPracticeAnswer(index, correctIndex, prompt, optionsStr) {
    const container = document.getElementById('practice-container');
    const options = JSON.parse(optionsStr);
    if (index === correctIndex) {
        container.innerHTML = `<p>Correct!</p>`;
        setTimeout(nextPracticeQuestion, 1000);
    } else {
        container.innerHTML = `<p>Try again: ${prompt}</p>` + options.map((opt, i) =>
            `<button onclick="checkPracticeAnswer(${i}, ${correctIndex}, '${prompt}', '${JSON.stringify(options)}')">${opt}</button>`).join('');
    }
}

function generateQuestion(types) {
    // NEW FIX: Add a try...catch block for ultimate safety.
    try {
        if (!Array.isArray(types) || types.length === 0) {
            console.warn("generateQuestion received invalid types:", types);
            return null;
        }

        const type = types[Math.floor(Math.random() * types.length)];
        if (!type) return null;

        let baseNumber, power, operation, prompt, correctAnswer, options = [];

        function getBase(typeStr) {
            if (typeStr.includes("Whole")) return Math.floor(Math.random() * 90 + 10);
            if (typeStr.includes("1dp")) return +(Math.random() * 9 + 1).toFixed(1);
            if (typeStr.includes("2dp")) return +(Math.random() * 9 + 1).toFixed(2);
            return 1;
        }

        baseNumber = getBase(type);
        operation = type.includes("x") ? "×" : "÷";
        power = type.includes("100") ? 100 : 10;
        
        let result = operation === '×' ? baseNumber * power : baseNumber / power;
        result = parseFloat(result.toPrecision(15));

        const missing = ["a", "b", "c"][Math.floor(Math.random() * 3)];

        if (missing === "a") {
            correctAnswer = baseNumber;
            prompt = `? ${operation} ${power} = ${result}`;
            options = generateDistractors(correctAnswer);
        } else if (missing === "b") {
            correctAnswer = power;
            prompt = `${baseNumber} ${operation} ? = ${result}`;
            options = generatePowerDistractors(correctAnswer);
        } else {
            correctAnswer = result;
            prompt = `${baseNumber} ${operation} ${power} = ?`;
            options = generateDistractors(correctAnswer);
        }

        const correctIndex = Math.floor(Math.random() * 4);
        options.splice(correctIndex, 0, correctAnswer);

        return {
            prompt,
            options: options.map(o => o.toString()),
            correct: correctIndex
        };
    } catch (error) {
        console.error("Error during generateQuestion:", error);
        return null; // Ensure function returns null on error
    }
}

function generateDistractors(correct) {
    const distractors = new Set();
    let attempts = 0;

    while (distractors.size < 3 && attempts < 20) {
        let distractor;
        const rand = Math.random();
        if (rand < 0.5) {
            distractor = correct * (Math.random() > 0.5 ? 10 : 0.1);
        } else {
            distractor = correct + (Math.random() > 0.5 ? 1 : -1);
        }

        distractor = parseFloat(distractor.toPrecision(4));

        if (distractor !== correct && distractor > 0 && !isNaN(distractor)) {
            distractors.add(distractor);
        }
        attempts++;
    }
    return Array.from(distractors);
}

function generatePowerDistractors(correct) {
    const powers = [0.01, 0.1, 10, 100, 1000];
    return shuffleArray(powers.filter(p => p !== correct)).slice(0, 3);
}

function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function updateScore(newScore) {
    if (!teamName || !gameCode) return;
    const scoreRef = ref(db, `games/${gameCode}/teams/${teamName}/score`);
    set(scoreRef, newScore);
}

function endGame() {
    clearInterval(timerInterval);
    document.getElementById('question-container').classList.add('hidden');
    document.getElementById('luck-boxes').classList.add('hidden');
    
    const results = document.getElementById('final-results');
    results.classList.remove('hidden');

    const leaderboardRef = ref(db, `games/${gameCode}/teams`);
    onValue(leaderboardRef, (snapshot) => {
        const data = snapshot.val();
        const sorted = Object.entries(data || {}).sort((a, b) => b[1].score - a[1].score);
        results.innerHTML = `<h2>Game Over!</h2><p>Final Score: ${score}</p><h3>Leaderboard</h3><ol>${sorted.map(([name, info]) => `<li>${name}: ${info.score}</li>`).join('')}</ol>`;
    }, { onlyOnce: true });
}
