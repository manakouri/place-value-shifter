import {
  collection,
  doc,
  setDoc,
  onSnapshot,
  serverTimestamp,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";

const db = window.db;

// Screen toggling
function showJoinScreen() {
  document.getElementById('initial-screen').classList.add('hidden');
  document.getElementById('login-screen').classList.remove('hidden');
  document.getElementById('create-game-screen').classList.add('hidden');
  document.getElementById('game-screen').classList.add('hidden');
  document.getElementById('final-leaderboard').classList.add('hidden');
}

function showCreateScreen() {
  document.getElementById('initial-screen').classList.add('hidden');
  document.getElementById('create-game-screen').classList.remove('hidden');
  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('game-screen').classList.add('hidden');
  document.getElementById('final-leaderboard').classList.add('hidden');

  generateGameCode();
  const gameCode = localStorage.getItem('currentGameCode');

  const gamesCollectionRef = collection(db, "games");
  const gameDocRef = doc(gamesCollectionRef, gameCode);
  const teamsCollectionRef = collection(gameDocRef, "teams");

  onSnapshot(teamsCollectionRef, (snapshot) => {
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

// Game state
const questionText = document.getElementById('question-text');
const answerContainer = document.getElementById('answer-options');
const scoreDisplay = document.getElementById('score-display');
const finalLeaderboard = document.getElementById('final-leaderboard');
const finalLeaderboardList = document.getElementById('final-leaderboard-list');

let teamScore = 0;
let correctCount = 0;
let totalQuestions = 0;
let teamsJoined = [];

// Start game button
document.getElementById('start-game-btn').addEventListener('click', async () => {
  const gameCode = localStorage.getItem('currentGameCode');

  await setDoc(doc(db, "games", gameCode), {
    gameStarted: true
  }, { merge: true });

  document.getElementById('create-game-screen').classList.add('hidden');
  document.getElementById('game-screen').classList.remove('hidden');
  teamScore = 0;
  correctCount = 0;
  totalQuestions = 0;
  updateScore();
  loadNextQuestion();
});

// Join game button
document.getElementById('login-btn').addEventListener('click', async () => {
  const gameCode = document.getElementById('game-code').value.trim();
  const teamName = document.getElementById('team-name').value.trim();

  if (gameCode && teamName && !teamsJoined.includes(teamName)) {
    teamsJoined.push(teamName);

    try {
      const gamesCollectionRef = collection(db, "games");
      const gameDocRef = doc(gamesCollectionRef, gameCode);
      const teamsSubCollectionRef = collection(gameDocRef, "teams");
      const teamDocRef = doc(teamsSubCollectionRef, teamName);

      await setDoc(teamDocRef, {
        name: teamName,
        joinedAt: serverTimestamp()
      });

      const teamList = document.getElementById('team-list');
      if (teamList) {
        const li = document.createElement('li');
        li.textContent = teamName;
        teamList.appendChild(li);
      }
    } catch (error) {
      console.error("Error writing team to Firestore:", error);
    }

    // Show waiting screen
    document.getElementById('login-screen').innerHTML = `
      <div class="max-w-xl mx-auto bg-white shadow-lg rounded-xl p-6 space-y-4 text-center">
        <h2 class="text-2xl font-bold text-[#1B9AAA]">Team: ${teamName}</h2>
        <p class="text-xl mt-4">✅ Joined game <strong>${gameCode}</strong></p>
        <p class="text-lg text-gray-700 mt-2">⏳ Waiting for the game to start...</p>
      </div>
    `;

    // Listen for game start
    onSnapshot(doc(db, "games", gameCode), (docSnap) => {
  if (docSnap.exists() && docSnap.data().gameStarted) {
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

// Question logic
function loadNextQuestion() {
  const { question, correctAnswer, options } = generateQuestion();
  questionText.textContent = question;
  answerContainer.innerHTML = '';

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
  if (selectedTypes.length === 0) {
    return { question: "No question types selected.", correctAnswer: "", options: [] };
  }

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
