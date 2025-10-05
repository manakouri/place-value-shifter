const screens = document.querySelectorAll('.screen');
function showScreen(id) {
  screens.forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  if (id === 'create-game') setupCreateGame();
  if (id === 'practice-mode') setupPracticeOptions();
}
const gameCodeSpan = document.getElementById('game-code');
const questionTypesDiv = document.getElementById('question-types');
const teamList = document.getElementById('team-list');
const startGameBtn = document.getElementById('start-game-btn');

let gameCode = '';
let teams = [];

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
let gameDuration = 0;
let selectedTypes = [];
let timerInterval;

function startGame() {
  selectedTypes = Array.from(document.querySelectorAll('#question-types input:checked')).map(cb => cb.value);
  gameDuration = parseInt(document.getElementById('game-length').value) * 60;
  showScreen('game-screen');
  startTimer(gameDuration, document.getElementById('game-timer'), endGame);
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
let score = 0;
let correctStreak = 0;

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
  luckBoxes.innerHTML = ['Double', 'Triple', 'Halve'].map(label =>
    `<button onclick="applyLuck('${label}')">${label}</button>`).join('');
}

function applyLuck(type) {
  if (type === 'Double') score *= 2;
  if (type === 'Triple') score *= 3;
  if (type === 'Halve') score = Math.floor(score / 2);
  document.getElementById('team-score').textContent = score;
  document.getElementById('luck-boxes').classList.add('hidden');
  nextQuestion();
}
function endGame() {
  const results = document.getElementById('final-results');
  results.classList.remove('hidden');
  results.innerHTML = `<p>Final Score: ${score}</p><p>Accuracy: ${Math.round((score / (score + 3)) * 100)}%</p>`;
}
function renderPlaceValueTable() {
  const container = document.getElementById('place-value-table');
  container.innerHTML = `
    <table>
      <tr><th>Thousands</th><th>Hundreds</th><th>Tens</th><th>Ones</th><th>0.1</th><th>0.01</th></tr>
      <tr><td>1000</td><td>100</td><td>10</td><td>1</td><td>0.1</td><td>0.01</td></tr>
    </table>
  `;
}
function setupPracticeOptions() {
  practiceContainer.innerHTML = '';
  renderPlaceValueTable();
}

function startChallenge() {
  score = 0;
  correctStreak = 0;
  startTimer(180, document.getElementById('game-timer'), () => {
    practiceContainer.innerHTML = `<p>Challenge Over! Score: ${score}</p>`;
  });
  nextPracticeQuestion();
}

function startPractice() {
  selectedTypes = ["Whole x 10", "1dp ÷ 10"]; // Example default
  nextPracticeQuestion();
}

function nextPracticeQuestion() {
  const q = generateQuestion(selectedTypes);
  practiceContainer.innerHTML = `<p>${q.prompt}</p>` + q.options.map((opt, i) =>
    `<button onclick="checkPracticeAnswer(${i}, ${q.correct}, '${q.prompt}', ${JSON.stringify(q.options)})">${opt}</button>`).join('');
}

function checkPracticeAnswer(index, correctIndex, prompt, options) {
  if (index === correctIndex) {
    practiceContainer.innerHTML = `<p>Correct!</p>`;
    setTimeout(nextPracticeQuestion, 1000);
  } else {
    practiceContainer.innerHTML = `<p>Try again: ${prompt}</p>` + options.map((opt, i) =>
      `<button onclick="checkPracticeAnswer(${i}, ${correctIndex}, '${prompt}', ${JSON.stringify(options)})">${opt}</button>`).join('');
  }
}
