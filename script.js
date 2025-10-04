// Show the join game screen
function showJoinScreen() {
  document.getElementById('initial-screen').classList.add('hidden');
  document.getElementById('login-screen').classList.remove('hidden');
  document.getElementById('create-game-screen').classList.add('hidden');
  document.getElementById('game-screen').classList.add('hidden');
}

// Show the create game screen
function showCreateScreen() {
  document.getElementById('initial-screen').classList.add('hidden');
  document.getElementById('create-game-screen').classList.remove('hidden');
  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('game-screen').classList.add('hidden');
}

// If you want to go back to the initial screen, you can use this:
function showInitialScreen() {
  document.getElementById('initial-screen').classList.remove('hidden');
  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('create-game-screen').classList.add('hidden');
  document.getElementById('game-screen').classList.add('hidden');
}

// Attach functions to window for global access
window.showJoinScreen = showJoinScreen;
window.showCreateScreen = showCreateScreen;
window.showInitialScreen = showInitialScreen;
