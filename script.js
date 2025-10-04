import {
  collection,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";

const db = window.db;

let allowedTypes = []; // ✅ Global scope

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
  countdownInterval = setInterval(() => {
    remaining--;
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

function generateQuestion() {
  const types = [
    { type: 'whole', factors: [10, 100], id: 'whole10' },
    { type: 'decimal', factors: [10, 100], id: 'decimal10' },
    { type: 'whole', factors: [1000], id: 'whole1000' },
    { type: 'decimal', factors: [1000], id: 'decimal1000' },
    { type: 'whole', factors: [0.1, 0.01], id: 'wholePoint1' },
    { type: 'decimal', factors: [0.1, 0.01], id: 'decimalPoint1' }
  ];

  const selectedTypes = types.filter(t => allowedTypes.includes(t.id));
  if (selectedTypes.length === 0) {
    return { question: "No question types selected.", correctAnswer: "", options: [] };
  }

  const chosen = selectedTypes[Math.floor(Math.random() * selectedTypes.length)];
  const digit1 = Math.floor(Math.random() * 9) + 1; // 1-9
  const digit2 = Math.floor(Math.random() * 9) + 1; // 1-9
  const digits = `${digit1}${digit2}`; // always two digits (could expand to three)
  // pick three unique place values from the chosen.places
  const places = chosen.places.slice();
  while (places.length < 3) places.push(places[0]); // in case there are fewer than 3
  const shuffledPlaces = places.sort(() => Math.random() - 0.5);
  const [placeA, placeB, placeC] = shuffledPlaces;

  // Helper to create a number string with decimal point at the right place
  function makeNumber(digs, decimalPlaces) {
    let n = digs;
    while (n.length < decimalPlaces + 1) n = "0" + n;
    const insertAt = n.length - decimalPlaces;
    return insertAt === n.length
      ? n
      : n.slice(0, insertAt) + "." + n.slice(insertAt);
  }

  // Format as number with up to three decimal places (removes floating point errors)
  function formatNumber(str) {
    return parseFloat(str).toFixed(3).replace(/\.?0+$/, "");
  }

  // Pick which slot is unknown
  const unknownPosition = Math.floor(Math.random() * 3);

  // Assign values
  const vals = [
    makeNumber(digits, placeA), // base
    makeNumber(digits, placeB), // factor/result
    makeNumber(digits, placeC)  // result/factor
  ].map(formatNumber);

  let question, correctAnswer;

  if (unknownPosition === 0) {
    question = `? × ${vals[1]} = ${vals[2]}`;
    correctAnswer = vals[0];
  } else if (unknownPosition === 1) {
    question = `${vals[0]} × ? = ${vals[2]}`;
    correctAnswer = vals[1];
  } else {
    question = `${vals[0]} × ${vals[1]} = ?`;
    correctAnswer = vals[2];
  }

  // Division variant, randomize whether it's multiply or divide
  if (Math.random() < 0.5) {
    // Division: a ÷ b = c
    if (unknownPosition === 0) {
      question = `? ÷ ${vals[1]} = ${vals[2]}`;
      correctAnswer = vals[0];
    } else if (unknownPosition === 1) {
      question = `${vals[0]} ÷ ? = ${vals[2]}`;
      correctAnswer = vals[1];
    } else {
      question = `${vals[0]} ÷ ${vals[1]} = ?`;
      correctAnswer = vals[2];
    }
  }

  const options = generatePlaceValueOptions(correctAnswer, digits);

  return { question, correctAnswer, options };
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
}
