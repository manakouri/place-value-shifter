function showJoinScreen() {
  document.getElementById('initial-screen').classList.add('hidden');
  document.getElementById('login-screen').classList.remove('hidden');
  document.getElementById('create-game-screen').classList.add('hidden');
  document.getElementById('game-screen').classList.add('hidden');
}

function showCreateScreen() {
  document.getElementById('initial-screen').classList.add('hidden');
  document.getElementById('create-game-screen').classList.remove('hidden');
  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('game-screen').classList.add('hidden');
  generateGameCode();
}

function generateGameCode() {
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();
  document.getElementById('generated-game-code').textContent = code;
}

function showInitialScreen() {
  document.getElementById('initial-screen').classList.remove('hidden');
  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('create-game-screen').classList.add('hidden');
  document.getElementById('game-screen').classList.add('hidden');
}

// Attach to window for global access
window.showJoinScreen = showJoinScreen;
window.showCreateScreen = showCreateScreen;
window.showInitialScreen = showInitialScreen;

const questionText = document.getElementById('question-text');
const answerContainer = document.getElementById('answer-options');
const scoreDisplay = document.getElementById('score-display');
const finalLeaderboard = document.getElementById('final-leaderboard');
const finalLeaderboardList = document.getElementById('final-leaderboard-list');

let teamScore = 0;
let correctCount = 0;
let totalQuestions = 0;
let teamsJoined = [];
let gameStarted = false;

document.getElementById('start-game-btn').addEventListener('click', () => {
  gameStarted = true;
  document.getElementById('create-game-screen').classList.add('hidden');
  document.getElementById('game-screen').classList.remove('hidden');
  teamScore = 0;
  correctCount = 0;
  totalQuestions = 0;
  updateScore();
  loadNextQuestion();
});

document.getElementById('login-btn').addEventListener('click', () => {
  const gameCode = document.getElementById('game-code').value.trim();
  const teamName = document.getElementById('team-name').value.trim();

  if (gameCode && teamName) {
    if (!teamsJoined.includes(teamName)) {
      teamsJoined.push(teamName);
      const teamList = document.getElementById('team-list');
      const li = document.createElement('li');
      li.textContent = teamName;
      teamList.appendChild(li);
    }

    document.getElementById('login-screen').innerHTML = `
      <h2 class="text-2xl font-bold text-[#1B9AAA]">Team: ${teamName}</h2>
      <p class="text-xl mt-4">✅ Joined game <strong>${gameCode}</strong></p>
      <p class="text-lg text-gray-700 mt-2">⏳ Waiting for the game to start...</p>
    `;

    const checkStartInterval = setInterval(() => {
      if (gameStarted) {
        clearInterval(checkStartInterval);
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('game-screen').classList.remove('hidden');
        document.getElementById('team-display').textContent = `Team: ${teamName}`;
        teamScore = 0;
        correctCount = 0;
        totalQuestions = 0;
        updateScore();
        loadNextQuestion();
      }
    }, 1000);
  }
});

function loadNextQuestion() {
  const { question, correctAnswer, options } = generateQuestion();

  questionText.textContent = question;
  answerContainer.innerHTML = '';

  setTimeout(() => {
    options.forEach(ans => {
      const btn = document.createElement('button
