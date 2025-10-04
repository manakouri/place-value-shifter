function showJoinScreen() {
  document.getElementById('initial-screen').classList.add('hidden');
  document.getElementById('login-screen').classList.remove('hidden');
}

function showCreateScreen() {
  document.getElementById('initial-screen').classList.add('hidden');
  document.getElementById('create-game-screen').classList.remove('hidden');
  generateGameCode();
}

function generateGameCode() {
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();
  document.getElementById('generated-game-code').textContent = code;
}

function toggleLeaderboard() {
  document.getElementById('leaderboard').classList.toggle('hidden');
}

document.getElementById('start-game-btn')?.addEventListener('click', startGame);

function startGame() {
  document.getElementById('create-game-screen').classList.add('hidden');
  document.getElementById('game-screen').classList.remove('hidden');
  teamScore = 0;
  correctCount = 0;
  totalQuestions = 0;
  updateScore();
  updateLeaderboard();
  loadNextQuestion();
}

document.getElementById('login-btn').addEventListener('click', () => {
  const gameCode = document.getElementById('game-code').value.trim();
  const teamName = document.getElementById('team-name').value.trim();

  if (gameCode && teamName) {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');
    document.getElementById('team-display').textContent = `Team: ${teamName}`;
    teamScore = 0;
    correctCount = 0;
    totalQuestions = 0;
    updateScore();
    updateLeaderboard();
    loadNextQuestion();
  }
});

const questionText = document.getElementById('question-text');
const answerContainer = document.getElementById('answer-options');
const scoreDisplay = document.getElementById('score-display');

let teamScore = 0;
let correctCount = 0;
let totalQuestions = 0;

function loadNextQuestion() {
  const { question, correctAnswer, options } = generateQuestion();

  questionText.textContent = question
