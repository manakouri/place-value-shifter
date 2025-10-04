// Initial screen navigation
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

  alert("Game started! You can now switch to the game screen.");
  document.getElementById('create-game-screen').classList.add('hidden');
  document.getElementById('game-screen').classList.remove('hidden');
  loadNextQuestion();
}

// Game variables
const questionText = document.getElementById('question-text');
const answerContainer = document.getElementById('answer-options');

let teamScore = 0;
let correctCount = 0;
let totalQuestions = 0;
let correctStreak = 0;

document.getElementById('login-btn').addEventListener('click', () => {
  const gameCode = document.getElementById('game-code').value.trim();
  const teamName = document.getElementById('team-name').value.trim();

  if (gameCode && teamName) {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');
    document.getElementById('team-display').textContent = `Team: ${teamName}`;
    loadNextQuestion();
  } else {
    alert("Please enter both a game code and team name.");
  }
});

document.getElementById('toggle-leaderboard').addEventListener('click', () => {
  document.getElementById('leaderboard').classList.toggle('hidden');
});

function loadNextQuestion() {
  const { question, correctAnswer, options } = generateQuestion();

  questionText.textContent = question;
  answerContainer.innerHTML = '';

  // Wait 7 seconds before showing answer options
  setTimeout(() => {
    options.forEach(ans => {
      const btn = document.createElement('button');
      btn.textContent = ans;
      btn.className = "bg-[#3A0CA3] text-white font-bold py-4 rounded-xl text-xl";
      btn.onclick = () => {
        const isCorrect = ans === correctAnswer;
        handleAnswer(isCorrect);
      };
      answerContainer.appendChild(btn);
    });
  }, 7000);
}

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

function generateQuestion() {
  const types = [
    { type: 'whole', factors: [10, 100], id: 'whole10' },
    { type: 'decimal', factors: [10, 100], id: 'decimal10' },
    { type: 'whole', factors: [1000], id: 'whole1000' },
    { type: 'decimal', factors: [1000], id: 'decimal1000' },
    { type: 'whole', factors: [0.1, 0.01], id: 'wholePoint1' },
    { type: 'decimal', factors: [0.1, 0.01], id: 'decimalPoint1' }
  ];

  const selectedTypes = types.filter(t => document.querySelector(`input[value="${t.id}"]`)?.checked);
  const chosen = selectedTypes[Math.floor(Math.random() * selectedTypes.length)];
  const factor = chosen.factors[Math.floor(Math.random() * chosen.factors.length)];
  const isMultiply = Math.random() < 0.5;
  const unknownPosition = Math.floor(Math.random() * 3); // 0: result unknown, 1: factor unknown, 2: base unknown

  let base, result, question, correctAnswer;

  if (chosen.type === 'whole') {
    base = Math.floor(Math.random() * 90 + 10); // 10–99
  } else {
    base = parseFloat((Math.random() * 9 + 0.1).toFixed(2)); // 0.1–9.99
  }

  if (isMultiply) {
    result = parseFloat((base * factor).toFixed(2));
    if (unknownPosition === 0) {
      question = `${base} × ${factor} = ?`;
      correctAnswer = result.toString();
    } else if (unknownPosition === 1) {
      question = `${base} × ? = ${result}`;
      correctAnswer = factor.toString();
    } else {
      question = `? × ${factor} = ${result}`;
      correctAnswer = base.toString();
    }
  } else {
    result = parseFloat((base / factor).toFixed(2));
    if (unknownPosition === 0) {
      question = `${base} ÷ ${factor} = ?`;
      correctAnswer = result.toString();
    } else if (unknownPosition === 1) {
      question = `${base} ÷ ? = ${result}`;
      correctAnswer = factor.toString();
    } else {
      question = `? ÷ ${factor} = ${result}`;
      correctAnswer = base.toString();
    }
  }

  const options = generateOptions(correctAnswer);
  return { question, correctAnswer, options };
}

function generateOptions(correct) {
  const correctNum = parseFloat(correct);
  const options = new Set();
  options.add(correctNum);

  while (options.size < 4) {
    let variation = parseFloat((correctNum + (Math.random() * 10 - 5)).toFixed(2));
    if (variation !== correctNum) options.add(variation);
  }

  return Array.from(options).sort(() => Math.random() - 0.5).map(n => n.toString());
}
