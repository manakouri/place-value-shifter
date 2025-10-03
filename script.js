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
