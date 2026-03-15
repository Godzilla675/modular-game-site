/* ===== Game Loader ===== */
/* Dynamically loads/unloads games, manages lifecycle */

const GameLoader = (() => {
  let currentGame = null;
  let currentGameId = null;
  let scoreInterval = null;

  async function load(gameId, container) {
    unload();

    try {
      // Load game CSS
      const cssLink = document.createElement('link');
      cssLink.rel = 'stylesheet';
      cssLink.href = `/games/${gameId}/style.css`;
      cssLink.id = `game-css-${gameId}`;
      document.head.appendChild(cssLink);

      // Load game JS
      await loadScript(`/games/${gameId}/game.js`);

      // Find the game class on window
      const className = gameIdToClassName(gameId);
      const GameClass = window[className];

      if (!GameClass) {
        throw new Error(`Game class "${className}" not found. Make sure game.js sets window.${className}`);
      }

      container.innerHTML = '';
      currentGame = new GameClass(container);
      currentGameId = gameId;

      if (typeof currentGame.start === 'function') {
        currentGame.start();
      }

      Storage.addRecent(gameId);
      Sound.play('start');

      // Poll score
      scoreInterval = setInterval(() => {
        if (currentGame && typeof currentGame.getScore === 'function') {
          const score = currentGame.getScore();
          UI.updateScore(score);
          const isNew = Storage.setHighScore(gameId, score);
          if (isNew) {
            document.getElementById('high-score').textContent = score.toLocaleString();
          }
        }
      }, 500);

    } catch (err) {
      container.innerHTML = `
        <div style="text-align:center;padding:60px 20px;color:var(--text-secondary);">
          <div style="font-size:48px;margin-bottom:16px;">😵</div>
          <h3 style="margin-bottom:8px;color:var(--text-primary);">Failed to load game</h3>
          <p>${err.message}</p>
        </div>`;
      console.error('Game load error:', err);
    }
  }

  function unload() {
    if (scoreInterval) {
      clearInterval(scoreInterval);
      scoreInterval = null;
    }
    if (currentGame) {
      // Save final score
      if (typeof currentGame.getScore === 'function') {
        const finalScore = currentGame.getScore();
        Storage.setHighScore(currentGameId, finalScore);
      }
      if (typeof currentGame.destroy === 'function') {
        currentGame.destroy();
      }
      currentGame = null;
    }
    if (currentGameId) {
      const css = document.getElementById(`game-css-${currentGameId}`);
      if (css) css.remove();
      const script = document.getElementById(`game-script-${currentGameId}`);
      if (script) script.remove();
      currentGameId = null;
    }
  }

  function restart() {
    if (currentGame) {
      if (typeof currentGame.destroy === 'function') currentGame.destroy();
      const container = document.getElementById('game-container');
      container.innerHTML = '';
      const className = gameIdToClassName(currentGameId);
      const GameClass = window[className];
      if (GameClass) {
        currentGame = new GameClass(container);
        currentGame.start();
        UI.updateScore(0);
        Sound.play('start');
      }
    }
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${src}"]`);
      if (existing) { resolve(); return; }
      const s = document.createElement('script');
      s.src = src;
      s.id = `game-script-${currentGameId}`;
      s.onload = resolve;
      s.onerror = () => reject(new Error(`Failed to load script: ${src}`));
      document.body.appendChild(s);
    });
  }

  // Maps game IDs that don't follow the standard PascalCase convention
  const CLASS_NAME_OVERRIDES = {
    '2048': 'Game2048'
  };

  function gameIdToClassName(id) {
    if (CLASS_NAME_OVERRIDES[id]) return CLASS_NAME_OVERRIDES[id];
    return id.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
  }

  function getCurrent() { return currentGame; }
  function getCurrentId() { return currentGameId; }

  return { load, unload, restart, getCurrent, getCurrentId };
})();
