document.getElementById('login-btn').addEventListener('click', () => {
  const gameCode = document.getElementById('game-code').value.trim();
  const teamName = document.getElementById('team-name').value.trim();

  if (gameCode && teamName) {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');
    document.getElementById('team-display').textContent = `Team: ${teamName}`;

    // Sample question
    const question = "What is 3 × 10?";
    const answers = ["30", "3", "300", "0.3"];
    document.getElementById('question-text').textContent = question;

    const answerContainer = document.getElementById('answer-options');
    answerContainer.innerHTML = '';
    answers.forEach(ans => {
      const btn = document.createElement('button');
      btn.textContent = ans;
      btn.className = "bg-[#3A0CA3] text-white font-bold py-4 rounded-xl text-xl";
      answerContainer.appendChild(btn);
    });
  }
});

document.getElementById('toggle-leaderboard').addEventListener('click', () => {
  const lb = document.getElementById('leaderboard');
  lb.classList.toggle('hidden');
});
