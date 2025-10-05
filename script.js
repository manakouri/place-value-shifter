const screens = document.querySelectorAll('.screen');
const gameCodeSpan = document.getElementById('game-code');
const teamList = document.getElementById('team-list');
const leaderboard = document.getElementById('leaderboard');
const questionTypesDiv = document.getElementById('question-types');
const joinBtn = document.getElementById('join-btn');
const startGameBtn = document.getElementById('start-game-btn');
const createTimer = document.getElementById('create-timer');
const gameTimer = document.getElementById('game-timer');
const questionContainer = document.getElementById('question-container');
const luckBoxes = document.getElementById('luck-boxes');
const finalResults = document.getElementById('final-results');
const teamScore = document.getElementById('team-score');
const practiceContainer = document.getElementById('practice-container');

let gameCode = '';
let teams = [];
let score = 0;
let correctStreak = 0;
let timerInterval;
let gameDuration = 0;
let selectedTypes = [];

function showScreen(id) {
  screens.forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  if (id === 'create-game') setupCreateGame();
  if (id === 'practice-mode') setupPracticeOptions();
}

function setupCreateGame() {
  gameCode = Math.floor(1000000 + Math.random() * 9000000).toString();
  gameCodeSpan.textContent = gameCode;
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
  renderPlaceValueTable();
}

function joinGame() {
  const code = document.getElementById('join-code').value;
  const name = document.getElementById('team-name').value;
  if (!code || !name) return alert("Enter both fields");
  // TODO: Firebase write team name to game code
  teams.push(name);
  teamList.innerHTML = teams.map(t => `<li>${t}</li>`).join('');
  if (teams.length > 0) startGameBtn.disabled = false;
}

function startGame() {
  selectedTypes = Array.from(document.querySelectorAll('#question-types input:checked')).map(cb => cb.value);
  gameDuration = parseInt(document.getElementById('game-length').value) * 60;
  showScreen('game-screen');
  startTimer(gameDuration, gameTimer, endGame);
  nextQuestion();
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
  questionContainer.innerHTML = `<p>${q.prompt}</p>` + q.options.map((opt, i) =>
    `<button onclick="checkAnswer(${i}, ${q.correct})">${opt}</button>`).join('');
}

function checkAnswer(index, correctIndex) {
  if (index === correctIndex) {
    score++;
    correctStreak++;
    teamScore.textContent = score;
    if (correctStreak >= 2 && correctStreak <= 5) showLuckBoxes();
    else nextQuestion();
  } else {
    correctStreak = 0;
    nextQuestion();
  }
}

function showLuckBoxes() {
  luckBoxes.classList.remove('hidden');
  luckBoxes.innerHTML = ['Double', 'Triple', 'Halve'].map((label, i) =>
    `<button onclick="applyLuck('${label}')">${label}
