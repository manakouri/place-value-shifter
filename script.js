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

// Global variables
let gameCode = '';
let teams = [];
let score = 0;
let correctStreak = 0;
let gameDuration = 0;
let selectedTypes = [];
let timerInterval;
let teamName = "";
let gameHasStarted = false; // FIX: Flag to prevent the game from restarting on score updates.

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
        "2dp x 10", "2dp x 100", "2dp ÷ 10", "2dp ÷ 100" // FIX: Added "2dp ÷ 100" to the list for completeness.
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
    console.log("Host started game with code:", gameCode);
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


    // Host stays on create screen
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
        // FIX: Check the gameHasStarted flag. This entire block will now only run ONCE.
        if (data?.started && !gameHasStarted) {
            gameHas
