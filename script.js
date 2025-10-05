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
    "2dp x 10", "2dp x 100", "2dp ÷ 10"
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
  selectedTypes = Array.from(document.querySelectorAll('#question-types input:checked')).map(cb => cb.value);
  gameDuration = parseInt(document.getElementById('game-length').value) * 60;

  update(ref(db, `games/${gameCode}`), {
  started: true,
  types: selectedTypes,
  duration: gameDuration,
  startTime: Date.now()
});


  // ✅ Host stays on create screen
  startTimer(gameDuration, document.getElementById('create-timer'), () => {
    document.getElementById('create-timer').textContent = "Game Over";
  });
}

function renderPlaceValueTable() {
  const tableDivs = document.querySelectorAll('#place-value-table');
  tableDivs.forEach(div => {
    div.innerHTML = `
      <table style="margin: 0 auto;">
        <tr><th>Thousands</th><th>Hundreds</th><th>Tens</th><th>Ones</th><th>Decimal</th><th>Tenths</th><th>Hundredths</th></tr>
        <tr><td>1000</td><td>100</td><td>10</td><td>1</td><td>.</td><td>0.1</td><td>0.01</td></tr>
      </table>
    `;
  });
}

function listenForGameStart(code) {
  const gameRef = ref(db, `games/${code}`);
  onSnapshot(gameRef, snapshot => {
    const data = snapshot.data();
    if (data?.started) {
      selectedTypes = data.types;
      gameDuration = data.duration;
      gameCode = code;

      showScreen('game-screen'); // ✅ move from waiting to game
      renderPlaceValueTable();   // ✅ show table only here
      startTimer(gameDuration, document.getElementById('game-timer'), endGame);
      nextQuestion();
    }
  });
}

function startTimer(duration, display, callback) {
  let time = duration;
  timerInterval = setInterval(() => {
    const min = Math.floor(time / 60);
    const sec = time % 60;
    display.textContent = `${min}:${sec < 10 ? '0' + sec : sec}`;
    if (--time < 0) {
      clearInterval(timerInterval);
      callback();
    }
  }, 1000);
}

function nextQuestion() {
  const q = generateQuestion(selectedTypes);
  const container = document.getElementById('question-container');
  container.innerHTML = `<p>${q.prompt}</p>` + q.options.map((opt, i) =>
    `<button onclick="checkAnswer(${i}, ${q.correct})">${opt}</button>`).join('');
}

function checkAnswer(index, correctIndex) {
  if (index === correctIndex) {
    score++;
    correctStreak++;
    document.getElementById('team-score').textContent = score;
    updateScore(score);
    if (correctStreak >= 2 && correctStreak <= 5) showLuckBoxes();
    else nextQuestion();
  } else {
    correctStreak = 0;
    nextQuestion();
  }
}

function showLuckBoxes() {
  const luckBoxes = document.getElementById('luck-boxes');
  luckBoxes.classList.remove('hidden');
  luckBoxes.innerHTML = `
    <p>Choose a secret box:</p>
    <button onclick="applyLuck('Double')">Double</button>
    <button onclick="applyLuck('Triple')">Triple</button>
    <button onclick="applyLuck('Halve')">Halve</button>
  `;
}

function applyLuck(type) {
  if (type === 'Double') score *= 2;
  if (type === 'Triple') score *= 3;
  if (type === 'Halve') score = Math.floor(score / 2);
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
  selectedTypes = ["Whole x 10", "1dp ÷ 10"]; // Default fallback
  nextPracticeQuestion();
}

function nextPracticeQuestion() {
  const q = generateQuestion(selectedTypes);
  const container = document.getElementById('practice-container');
  container.innerHTML = `<p>${q.prompt}</p>` + q.options.map((opt, i) =>
    `<button onclick="checkPracticeAnswer(${i}, ${q.correct}, '${q.prompt}', ${JSON.stringify(q.options)})">${opt}</button>`).join('');
}

function checkPracticeAnswer(index, correctIndex, prompt, options) {
  const container = document.getElementById('practice-container');
  if (index === correctIndex) {
    container.innerHTML = `<p>Correct!</p>`;
    setTimeout(nextPracticeQuestion, 1000);
  } else {
    container.innerHTML = `<p>Try again: ${prompt}</p>` + options.map((opt, i) =>
      `<button onclick="checkPracticeAnswer(${i}, ${correctIndex}, '${prompt}', ${JSON.stringify(options)})">${opt}</button>`).join('');
  }
}

function generateQuestion(selectedTypes) {
  const type = selectedTypes[Math.floor(Math.random() * selectedTypes.length)];
  let baseNumber, power, operation, prompt, correctAnswer, options = [];

  function getBase(type) {
    if (type.includes("Whole")) return Math.floor(Math.random() * 90 + 10); // 10–99
    if (type.includes("1dp")) return +(Math.random() * 9 + 1).toFixed(1); // 1.0–9.9
    if (type.includes("2dp")) return +(Math.random() * 9 + 1).toFixed(2); // 1.00–9.99
  }

  baseNumber = getBase(type);
  if (type.includes("x")) {
    operation = "×";
    power = type.includes("100") ? 100 : 10;
    const result = +(baseNumber * power).toFixed(2);
    const missing = ["a", "b", "c"][Math.floor(Math.random() * 3)];
    if (missing === "a") {
      correctAnswer = baseNumber;
      prompt = `? ${operation} ${power} = ${result}`;
      options = generateDistractors(correctAnswer, baseNumber);
    } else if (missing === "b") {
      correctAnswer = power;
      prompt = `${baseNumber} ${operation} ? = ${result}`;
      options = generatePowerDistractors(correctAnswer);
    } else {
      correctAnswer = result;
      prompt = `${baseNumber} ${operation} ${power} = ?`;
      options = generateDistractors(correctAnswer, baseNumber);
    }
  } else {
    operation = "÷";
    power = type.includes("100") ? 100 : 10;
    const result = +(baseNumber / power).toFixed(2);
    const missing = ["a", "b", "c"][Math.floor(Math.random() * 3)];
    if (missing === "a") {
      correctAnswer = baseNumber;
      prompt = `? ${operation} ${power} = ${result}`;
      options = generateDistractors(correctAnswer, baseNumber);
    } else if (missing === "b") {
      correctAnswer = power;
      prompt = `${baseNumber} ${operation} ? = ${result}`;
      options = generatePowerDistractors(correctAnswer);
    } else {
      correctAnswer = result;
      prompt = `${baseNumber} ${operation} ${power} = ?`;
      options = generateDistractors(correctAnswer, baseNumber);
    }
  }

  const correctIndex = Math.floor(Math.random() * 4);
  options.splice(correctIndex, 0, correctAnswer);

  return {
    prompt,
    options: options.map(o => o.toString()),
    correct: correctIndex
  };
}

function generateDistractors(correct, base) {
  const digits = base.toString().replace('.', '').split('');
  const distractors = new Set();
  while (distractors.size < 3) {
    const shuffled = shuffleArray([...digits]).join('');
    const val = parseFloat(shuffled);
    if (val !== correct) distractors.add(val);
  }
  return Array.from(distractors);
}

function generatePowerDistractors(correct) {
  const powers = [0.01, 0.1, 10, 100, 1000];
  return powers.filter(p => p !== correct).slice(0, 3);
}

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function updateScore(newScore) {
  const code = gameCode;
  const name = document.getElementById('team-name')?.value || "Practice";
  const scoreRef = ref(db, `games/${code}/teams/${name}/score`);
  set(scoreRef, newScore);
}

function endGame() {
  const results = document.getElementById('final-results');
  results.classList.remove('hidden');
  const attempted = score + 3; // rough estimate for demo
  const accuracy = Math.round((score / attempted) * 100);
  results.innerHTML = `<p>Final Score: ${score}</p><p>Accuracy: ${accuracy}%</p>`;
}
