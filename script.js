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

function generateGameCode() {
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();
  document.getElementById('generated-game-code').textContent = code;
}

document.getElementById('start-game-btn').addEventListener('click', startGame);

function startGame() {
  document.getElementById('create-game-screen').classList.add('hidden');
  document.getElementById('game-screen').classList.remove('hidden');
  teamScore = 0;
  correctCount = 0;
  totalQuestions = 0;
  updateScore();
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
    loadNextQuestion();
  }
});

const questionText = document.getElementById('question-text');
const answerContainer = document.getElementById('answer-options');
const scoreDisplay = document.getElementById('score-display');
const finalLeaderboard = document.getElementById('final-leaderboard');
const finalLeaderboardList = document.getElementById('final-leaderboard-list');

let teamScore = 0;
let correctCount = 0;
let totalQuestions = 0;

function loadNextQuestion() {
  const { question, correctAnswer, options } = generateQuestion();

  questionText.textContent = question;
  answerContainer.innerHTML = '';

  setTimeout(() => {
    options.forEach(ans => {
      const btn = document.createElement('button');
      btn.textContent = ans;
      btn.className = "bg-[#1B9AAA] text-white font-bold py-4 rounded-xl text-xl";
      btn.onclick = () => {
        const isCorrect = ans === correctAnswer;
        handleAnswer(isCorrect);
      };
      answerContainer.appendChild(btn);
    });
  }, 5000);
}

function handleAnswer(isCorrect) {
  totalQuestions++;
  if (isCorrect) {
    correctCount++;
    teamScore += 10;
  }

  updateScore();

  if (totalQuestions >= 10) {
    endGame();
  } else {
    loadNextQuestion();
  }
}

function updateScore() {
  scoreDisplay.textContent = `Score: ${teamScore}`;
}

function endGame() {
  document.getElementById('game-screen').classList.add('hidden');
  document.getElementById('create-game-screen').classList.remove('hidden');
  finalLeaderboard.classList.remove('hidden');
  finalLeaderboardList.innerHTML = `
    <li><strong>Score:</strong> ${teamScore}</li>
    <li><strong>Correct Answers:</strong> ${correctCount}</li>
    <li><strong>Total Questions:</strong> ${totalQuestions}</li>
    <li><strong>Accuracy:</strong> ${Math.round((correctCount / totalQuestions) * 100)}%</li>
  `;
}

function generateQuestion()
