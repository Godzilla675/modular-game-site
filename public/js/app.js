/* ===== App Controller ===== */
/* Main entry point — wires everything together */

const App = (() => {
  let games = [];

  async function init() {
    // Fetch game registry
    try {
      const res = await fetch('/games/registry.json');
      games = await res.json();
    } catch {
      games = [];
    }

    UI.init(games);

    // Wire up router
    Router.init(route => {
      const homeView = document.getElementById('view-home');
      const gameView = document.getElementById('view-game');

      if (route.view === 'game') {
        const game = games.find(g => g.id === route.gameId);
        if (!game) {
          Router.navigate('#/');
          return;
        }
        homeView.classList.remove('active');
        gameView.classList.add('active');
        UI.showGameView(game);
        GameLoader.load(game.id, document.getElementById('game-container'));
        document.title = `${game.title} — The Arcade`;
      } else {
        GameLoader.unload();
        gameView.classList.remove('active');
        homeView.classList.add('active');
        UI.renderRecents();
        document.title = 'The Arcade — Browser Games';

        if (route.category) {
          const tab = document.querySelector(`.cat-tab[data-category="${route.category}"]`);
          if (tab) tab.click();
        }
      }
    });

    // Restart button
    document.getElementById('game-restart-btn').addEventListener('click', () => {
      GameLoader.restart();
    });

    // Keyboard shortcut: Escape to go back
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && GameLoader.getCurrentId()) {
        Router.navigate('#/');
      }
    });
  }

  document.addEventListener('DOMContentLoaded', init);

  return { init };
})();
