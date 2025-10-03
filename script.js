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

function startGame() {
  const duration = document.getElementById('game-duration').value;
  const selectedTypes = Array.from(document.querySelectorAll('#create-game-screen input[type="checkbox"]:checked'))
    .map(cb => cb.value);

  console.log("Game Duration:", duration);
  console.log("Question Types:", selectedTypes);

  // You can store these in localStorage or pass to multiplayer logic
  alert("Game started! You can now switch to the game screen.");
  document.getElementById('create-game-screen').classList.add('hidden');
  document.getElementById('game-screen').classList.remove('hidden');
}

let teamScore = 0;
let correctCount = 0;
let totalQuestions = 0;
let correctStreak = 0;

function handleAnswer(isCorrect) {
  totalQuestions++;
  if (isCorrect) {
    correctCount++;
    correctStreak++;
    teamScore += 10;

    if (correctStreak >= getRandomStreakTrigger()) {
      correctStreak = 0;
      showSecretBox();
      return;
    }
  } else {
    correctStreak = 0;
  }

  updateLeaderboard();
  loadNextQuestion();
}

function getRandomStreakTrigger() {
  return Math.floor(Math.random() * 4) + 2; // Between 2–5
}

function showSecretBox() {
  const boxRewards = ['+10 Points', 'Double Score', 'Triple Score', 'Halve Score'];
  const boxEffects = [
    () => teamScore += 10,
    () => teamScore *= 2,
    () => teamScore *= 3,
    () => teamScore = Math.floor(teamScore / 2)
  ];

  const boxContainer = document.createElement('div');
  boxContainer.className = "grid grid-cols-1 md:grid-cols-3 gap-4 mt-6";

  boxRewards.forEach((label, index) => {
    const btn = document.createElement('button');
    btn.textContent = "❓ Mystery Box";
    btn.className = "bg-yellow-300 text-black font-bold py-4 rounded-xl text-xl";
    btn.onclick = () => {
      boxEffects[index]();
      alert(`You opened: ${label}`);
      boxContainer.remove();
      updateLeaderboard();
      loadNextQuestion();
    };
    boxContainer.appendChild(btn);
  });

  answerContainer.innerHTML = '';
  questionText.textContent = "🎁 Choose a Mystery Box!";
  answerContainer.appendChild(boxContainer);
}

function updateLeaderboard() {
  const leaderboardList = document.getElementById('leaderboard-list');
  leaderboardList.innerHTML = `
    <li><strong>Your Team</strong>: ${teamScore} points (${correctCount}/${totalQuestions} correct)</li>
  `;
}
