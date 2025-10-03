const questionText = document.getElementById('question-text');
const answerContainer = document.getElementById('answer-options');

document.getElementById('login-btn').addEventListener('click', () => {
  const gameCode = document.getElementById('game-code').value.trim();
  const teamName = document.getElementById('team-name').value.trim();

  if (gameCode && teamName) {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');
    document.getElementById('team-display').textContent = `Team: ${teamName}`;
    loadNextQuestion();
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
    options.forEach((ans, index) => {
      const btn = document.createElement('button');
      btn.textContent = ans;
      btn.className = "bg-[#3A0CA3] text-white font-bold py-4 rounded-xl text-xl";
      btn.onclick = () => {
        if (ans === correctAnswer) {
          alert("Correct!");
        } else {
          alert(`Incorrect. The correct answer was ${correctAnswer}`);
        }
        loadNextQuestion();
      };
      answerContainer.appendChild(btn);
    });
  }, 7000);
}

function generateQuestion() {
  const types = [
    { type: 'whole', factors: [10, 100, 1000] },
    { type: 'decimal', factors: [10, 100, 1000] },
    { type: 'whole', factors: [0.1, 0.01] },
    { type: 'decimal', factors: [0.1, 0.01] }
  ];

  const chosen = types[Math.floor(Math.random() * types.length)];
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
