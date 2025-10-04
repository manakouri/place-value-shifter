const questionText = document.getElementById('question-text');
const answerContainer = document.getElementById('answer-options');
const scoreDisplay = document.getElementById('score-display');

let teamScore = 0;
let correctCount = 0;
let totalQuestions = 0;

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
  }, 5000); // 5-second delay
}

function handleAnswer(isCorrect) {
  totalQuestions++;
  if (isCorrect) {
    correctCount++;
    teamScore += 10;
  }

  updateScore();
  updateLeaderboard();
  loadNextQuestion();
}

function updateScore() {
  scoreDisplay.textContent = `Score: ${teamScore}`;
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
  const unknownPosition = Math.floor(Math.random() * 3);

  let base, result, question, correctAnswer;

  if (chosen.type === 'whole') {
    base = Math.floor(Math.random() * 90 + 10); // 10–99
  } else {
    const whole = Math.floor(Math.random() * 9 + 1); // 1–9
    const decimal = Math.floor(Math.random() * 9 + 1); // 1–9
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

    // Clean up leading zeros
    if (variant.startsWith('00')) {
      variant = variant.replace(/^0+/, '0');
    }

    if (!variations.has(variant)) {
      variations.add(variant);
    }
  }

  return Array.from(variations).sort(() => Math.random() - 0.5);
}
