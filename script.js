let allowedTypes = []; // ✅ Global scope

import {
  collection,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  serverTimestamp
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
let countdownInterval = null;

// Host starts game
document.getElementById('start-game-btn').addEventListener('click', async () => {
  const gameCode = localStorage.getItem('currentGameCode');
  const gameDuration = parseInt(document.getElementById('time-select').value);
  const gameEndsAt = Date.now() + gameDuration * 1000;

  // ✅ Collect selected question types
  const selectedTypes = Array.from(document.querySelectorAll('input[type="checkbox"]:checked'))
    .map(cb => cb.value);

  await setDoc(doc(db, "games", gameCode), {
    gameStarted: true,
    gameEndsAt: gameEndsAt,
    questionTypes: selectedTypes
  }, { merge: true });

  startCountdown(gameDuration);
  activateLiveLeaderboard(gameCode);
});


// Joiner joins game

document.getElementById('login-btn').addEventListener('click', async () => {
  const gameCode = document.getElementById('game-code').value.trim();
  const teamName = document.getElementById('team-name').value.trim();

  if (gameCode && teamName && !teamsJoined.includes(teamName)) {
    teamsJoined.push(teamName);

    try {
      const gameDocRef = doc(db, "games", gameCode);
      const teamDocRef = doc(collection(gameDocRef, "teams"), teamName);

      await setDoc(teamDocRef, {
        name: teamName,
        joinedAt: serverTimestamp()
      });

      // ✅ Show waiting screen
      const waitingContainer = document.createElement('div');
      waitingContainer.className = "max-w-xl mx-auto bg-white shadow-lg rounded-xl p-6 space-y-4 text-center";
      waitingContainer.innerHTML = `
        <h2 class="text-2xl font-bold text-[#1B9AAA]">Team: ${teamName}</h2>
        <p class="text-xl mt-4">✅ Joined game <strong>${gameCode}</strong></p>
        <p class="text-lg text-gray-700 mt-2">⏳ Waiting for the game to start...</p>
      `;
      document.getElementById('login-screen').innerHTML = '';
      document.getElementById('login-screen').appendChild(waitingContainer);

      // ✅ Listen for game start and load question types
      
      onSnapshot(gameDocRef, (docSnap) => {
        if (docSnap.exists() && docSnap.data().gameStarted) {
         allowedTypes = docSnap.data().questionTypes || [];
          loadNextQuestion(); // ✅ Only after allowedTypes is set

          const endTime = docSnap.data().gameEndsAt;
          const remaining = Math.floor((endTime - Date.now()) / 1000);

          document.getElementById('login-screen').classList.add('hidden');
          document.getElementById('game-screen').classList.remove('hidden');
          document.getElementById('team-display').textContent = `Team: ${teamName}`;
          teamScore = 0;
          correctCount = 0;
          totalQuestions = 0;
          updateScore();

          // ✅ Now safe to start game
          loadNextQuestion();
          startCountdown(remaining);
        }
      });

    } catch (error) {
      console.error("Error joining game:", error);
    }
  }
});


// Countdown timer
function startCountdown(seconds) {
  let remaining = seconds;
  const countdownDisplay = document.getElementById('host-countdown');

  countdownInterval = setInterval(() => {
    remaining--;

    // ✅ Update host countdown if visible
    if (countdownDisplay) {
      const mins = Math.floor(remaining / 60);
      const secs = remaining % 60;
      countdownDisplay.textContent = `⏳ Game ends in ${mins}:${secs.toString().padStart(2, '0')}`;
    }

    if (remaining <= 0) {
      clearInterval(countdownInterval);
      endGame();
    }
  }, 1000);
}


function activateLiveLeaderboard(gameCode) {
  const teamsRef = collection(db, "games", gameCode, "teams");
  onSnapshot(teamsRef, (snapshot) => {
    const liveList = document.getElementById('live-leaderboard');
    if (!liveList) return;

    liveList.innerHTML = '';
    snapshot.forEach(doc => {
      const data = doc.data();
      const li = document.createElement('li');
      li.innerHTML = `<strong>${data.name}</strong>: ${data.score || 0} pts, ${data.accuracy || 0}% (${data.correct || 0}/${data.total || 0})`;
      liveList.appendChild(li);
    });
  });
}

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

  loadNextQuestion();
}

function updateScore() {
  scoreDisplay.textContent = `Score: ${teamScore}`;
}

// End game and show leaderboard
async function endGame() {
  clearInterval(countdownInterval);
  document.getElementById('game-screen').classList.add('hidden');
  finalLeaderboard.classList.remove('hidden');

  const accuracy = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
  const gameCode = localStorage.getItem('currentGameCode');
  const teamName = document.getElementById('team-display').textContent.replace('Team: ', '');

  const teamDocRef = doc(db, "games", gameCode, "teams", teamName);
  await setDoc(teamDocRef, {
    score: teamScore,
    correct: correctCount,
    total: totalQuestions,
    accuracy: accuracy
  }, { merge: true });

  // Host view: show full leaderboard
  const teamsRef = collection(db, "games", gameCode, "teams");
  onSnapshot(teamsRef, (snapshot) => {
    finalLeaderboardList.innerHTML = '';
    snapshot.forEach(doc => {
      const data = doc.data();
      const li = document.createElement('li');
      li.innerHTML = `<strong>${data.name}</strong> — ${data.score} pts, ${data.accuracy}% accuracy (${data.correct}/${data.total})`;
      finalLeaderboardList.appendChild(li);
    });
  });
}

function formatNumber(num) {
  return parseFloat(num).toFixed(6).replace(/\.?0+$/, '');
}

function generateQuestion() {
  const powersOfTen = [10, 100, 1000, 0.1, 0.01];

  // Define all possible types
  const allTypes = [
    { id: 'whole10', digits: 2, factor: 10 },
    { id: 'whole100', digits: 2, factor: 100 },
    { id: 'whole1000', digits: 3, factor: 1000 },
    { id: 'decimal10', digits: 2, factor: 10 },
    { id: 'decimal100', digits: 2, factor: 100 },
    { id: 'decimal1000', digits: 3, factor: 1000 },
    { id: 'wholePoint1', digits: 2, factor: 0.1 },
    { id: 'decimalPoint1', digits: 2, factor: 0.1 },
    { id: 'decimalPoint01', digits: 2, factor: 0.01 }
  ];

  // Filter based on allowedTypes from Firestore
  const filteredTypes = allTypes.filter(t => allowedTypes.includes(t.id));
  if (filteredTypes.length === 0) {
    return { question: "No question types selected.", correctAnswer: "", options: [] };
  }

  // Pick a type and operation
  const chosen = filteredTypes[Math.floor(Math.random() * filteredTypes.length)];
  const digitLength = chosen.digits;
  const factor = chosen.factor;
  const isMultiply = Math.random() < 0.5;
  const unknownPosition = Math.floor(Math.random() * 3); // 0 = a, 1 = b, 2 = c

  // Generate digit string
  const digits = Array.from({ length: digitLength }, () => Math.floor(Math.random() * 9) + 1).join('');

  // Create base number with decimal point
  const decimalPlaces = Math.floor(Math.random() * (digitLength + 1));
  let baseStr = digits;
  if (decimalPlaces > 0) {
    baseStr = baseStr.padStart(decimalPlaces + 1, '0');
    baseStr = baseStr.slice(0, baseStr.length - decimalPlaces) + '.' + baseStr.slice(baseStr.length - decimalPlaces);
  }
  const base = parseFloat(baseStr);
  const result = isMultiply ? base * factor : base / factor;

  const formattedBase = formatNumber(base);
  const formattedFactor = formatNumber(factor);
  const formattedResult = formatNumber(result);

  let question = '';
  let correctAnswer = '';
  let options = [];

  if (unknownPosition === 0) {
    question = `? ${isMultiply ? '×' : '÷'} ${formattedFactor} = ${formattedResult}`;
    correctAnswer = formattedBase;
    options = generatePlaceValueOptions(correctAnswer, digits);
  } else if (unknownPosition === 1) {
    question = `${formattedBase} ${isMultiply ? '×' : '÷'} ? = ${formattedResult}`;
    correctAnswer = formattedFactor;
    options = generatePowerOfTenOptions(correctAnswer);
  } else {
    question = `${formattedBase} ${isMultiply ? '×' : '÷'} ${formattedFactor} = ?`;
    correctAnswer = formattedResult;
    options = generatePlaceValueOptions(correctAnswer, digits);
  }

  return { question, correctAnswer, options };
}


function generatePowerOfTenOptions(correct) {
  const allPowers = [10, 100, 1000, 0.1, 0.01];
  const variations = new Set();
  variations.add(formatNumber(correct));

  while (variations.size < 4) {
    const distractor = allPowers[Math.floor(Math.random() * allPowers.length)];
    variations.add(formatNumber(distractor));
  }

  return Array.from(variations).sort(() => Math.random() - 0.5);
}

// Improved options generator: only permutes decimal locations for the same digits
function generatePlaceValueOptions(correct, digits) {
  const options = new Set();
  for (let d = 0; d <= digits.length; d++) {
    const val = parseFloat(
      d === digits.length
        ? digits
        : digits.slice(0, digits.length - d) + "." + digits.slice(digits.length - d)
    )
      .toFixed(3)
      .replace(/\.?0+$/, "");
    options.add(val);
  }
  // Ensure the correct answer is in the set
  options.add(correct);
  // Shuffle and select 4 options
  return Array.from(options)
    .sort(() => Math.random() - 0.5)
    .slice(0, 4);
  while (variations.size < 4 && attempts < 20) {
  // generate variants
}

}
