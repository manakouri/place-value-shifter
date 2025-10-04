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

  const gameCode = localStorage.getItem('currentGameCode');

  db.collection("games").doc(gameCode).collection("teams")
    .onSnapshot(snapshot => {
      const teamList = document.getElementById('team-list');
      teamList.innerHTML = '';
      snapshot.forEach(doc => {
        const li = document.createElement('li');
        li.textContent = doc.data().name;
        teamList.appendChild(li);
      });
    });
}

function generateGameCode() {
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();
  document.getElementById('generated-game-code').textContent = code;
  localStorage.setItem('currentGameCode', code);
}

window.showJoinScreen = showJoinScreen;
window.showCreateScreen = showCreateScreen;

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

      db.collection("games").doc(gameCode).collection("teams").doc(teamName).set({
        name: teamName,
        joinedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
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
      const btn = document.createElement('button');
      btn.textContent = ans;
      btn.className = "bg-cyan-600 text-white font-bold py-4 px-6 rounded-xl text-xl hover:bg-cyan-700 transition";
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
  const unknownPosition = Math.floor(Math.random() * 3);

  let base, result, question, correctAnswer;

  if (chosen.type === 'whole') {
    base = Math.floor(Math.random() * 90 + 10);
  } else {
    const whole = Math.floor(Math.random() * 9 + 1);
    const decimal = Math.floor(Math.random() * 9 + 1);
    base = parseFloat(`${whole}.${decimal}`);
  }

  if (isMultiply) {
    result = base * factor;
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
    result = base / factor;
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

  const options = generatePlaceValueOptions(correctAnswer);
  return { question, correctAnswer, options };
}

function generatePlaceValueOptions(correct) {
  const digits = correct.replace('.', '').split('');
  const variations = new Set();
  variations.add(correct);

  while (variations.size < 4) {
    const shuffled = digits.slice().sort(() => Math.random() - 0.5);
    const decimalIndex = Math.floor(Math.random() * (shuffled.length - 1)) + 1;
    shuffled.splice(decimalIndex, 0, '.');
    let variant = shuffled.join('');

    if (variant.startsWith('00')) {
      variant = variant.replace(/^0+/, '0');
    }

    if (!variations.has(variant)) {
      variations.add(variant);
    }
  }

  return Array.from(variations).sort(() => Math.random() - 0.5);
}
