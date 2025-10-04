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
