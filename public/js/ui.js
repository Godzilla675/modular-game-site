/* ===== UI Utilities ===== */
/* Search, filters, modals, toasts, card rendering */

const UI = (() => {
  let allGames = [];
  let currentCategory = 'all';
  let showingFavorites = false;

  function init(games) {
    allGames = games;
    renderGrid(games);
    updateGameCount(games.length);
    renderRecents();
    bindSearch();
    bindCategories();
    bindSoundToggle();
    bindFavoritesToggle();
    bindModal();
    updateSoundIcon();
  }

  // Card HTML
  function gameCardHTML(game) {
    const isFav = Storage.isFavorite(game.id);
    const highScore = Storage.getHighScore(game.id);
    const catColors = {
      arcade: 'var(--cat-arcade)', puzzle: 'var(--cat-puzzle)', card: 'var(--cat-card)',
      board: 'var(--cat-board)', action: 'var(--cat-action)', platformer: 'var(--cat-platformer)',
      word: 'var(--cat-word)', casual: 'var(--cat-casual)'
    };
    return `
      <a href="#/game/${game.id}" class="game-card" style="--card-accent: ${catColors[game.category] || 'var(--text-accent)'}">
        <button class="game-card-fav ${isFav ? 'active' : ''}" data-fav="${game.id}" onclick="event.preventDefault();event.stopPropagation();UI.toggleFav('${game.id}',this)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
        </button>
        <div class="game-card-emoji">${game.thumbnail}</div>
        <div class="game-card-title">${game.title}</div>
        <div class="game-card-desc">${game.description}</div>
        <div class="game-card-footer">
          <span class="cat-badge" data-cat="${game.category}">${game.category}</span>
          ${highScore > 0 ? `<span class="game-card-score">Best: ${highScore.toLocaleString()}</span>` : ''}
        </div>
      </a>`;
  }

  function renderGrid(games) {
    const grid = document.getElementById('games-grid');
    const noResults = document.getElementById('no-results');
    if (games.length === 0) {
      grid.innerHTML = '';
      noResults.classList.remove('hidden');
    } else {
      noResults.classList.add('hidden');
      grid.innerHTML = games.map(g => gameCardHTML(g)).join('');
    }
  }

  function updateGameCount(count) {
    document.getElementById('game-count').textContent = `${count} game${count !== 1 ? 's' : ''}`;
  }

  function filterAndRender() {
    let games = allGames;
    const query = document.getElementById('search-input').value.toLowerCase().trim();

    if (showingFavorites) {
      const favs = Storage.getFavorites();
      games = games.filter(g => favs.includes(g.id));
    }

    if (currentCategory !== 'all') {
      games = games.filter(g => g.category === currentCategory);
    }

    if (query) {
      games = games.filter(g =>
        g.title.toLowerCase().includes(query) ||
        g.description.toLowerCase().includes(query) ||
        g.category.toLowerCase().includes(query) ||
        (g.tags && g.tags.some(t => t.toLowerCase().includes(query)))
      );
    }

    renderGrid(games);
    updateGameCount(games.length);

    const titleEl = document.getElementById('grid-title');
    if (showingFavorites) {
      titleEl.textContent = 'Favorites';
    } else if (currentCategory === 'all') {
      titleEl.textContent = 'All Games';
    } else {
      titleEl.textContent = currentCategory.charAt(0).toUpperCase() + currentCategory.slice(1) + ' Games';
    }
  }

  // Recents
  function renderRecents() {
    const recentIds = Storage.getRecents();
    const container = document.getElementById('recently-played');
    const grid = document.getElementById('recent-grid');
    if (recentIds.length === 0) {
      container.classList.add('hidden');
      return;
    }
    container.classList.remove('hidden');
    const recentGames = recentIds.map(id => allGames.find(g => g.id === id)).filter(Boolean);
    grid.innerHTML = recentGames.map(g => gameCardHTML(g)).join('');
  }

  // Search
  function bindSearch() {
    const input = document.getElementById('search-input');
    const results = document.getElementById('search-results');
    let debounce;

    input.addEventListener('input', () => {
      clearTimeout(debounce);
      debounce = setTimeout(() => {
        const q = input.value.toLowerCase().trim();
        if (q.length < 2) {
          results.classList.add('hidden');
          filterAndRender();
          return;
        }
        const matches = allGames.filter(g =>
          g.title.toLowerCase().includes(q) ||
          g.description.toLowerCase().includes(q) ||
          (g.tags && g.tags.some(t => t.toLowerCase().includes(q)))
        ).slice(0, 6);

        if (matches.length > 0) {
          results.innerHTML = matches.map(g => `
            <a href="#/game/${g.id}" class="search-result-item">
              <span class="search-result-emoji">${g.thumbnail}</span>
              <div class="search-result-info">
                <div class="search-result-title">${g.title}</div>
                <div class="search-result-cat">${g.category}</div>
              </div>
            </a>
          `).join('');
          results.classList.remove('hidden');
        } else {
          results.classList.add('hidden');
        }
        filterAndRender();
      }, 200);
    });

    input.addEventListener('focus', () => {
      if (input.value.length >= 2) {
        input.dispatchEvent(new Event('input'));
      }
    });

    document.addEventListener('click', e => {
      if (!e.target.closest('.search-wrapper')) {
        results.classList.add('hidden');
      }
    });
  }

  // Categories
  function bindCategories() {
    document.querySelectorAll('.cat-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.cat-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentCategory = tab.dataset.category;
        showingFavorites = false;
        document.getElementById('favorites-toggle').classList.remove('active');
        filterAndRender();
        Sound.play('click');
      });
    });
  }

  // Sound
  function bindSoundToggle() {
    document.getElementById('sound-toggle').addEventListener('click', () => {
      const on = Sound.toggle();
      updateSoundIcon();
      if (on) Sound.play('click');
    });
  }

  function updateSoundIcon() {
    const on = Sound.isEnabled();
    document.getElementById('sound-on-icon').classList.toggle('hidden', !on);
    document.getElementById('sound-off-icon').classList.toggle('hidden', on);
  }

  // Favorites
  function bindFavoritesToggle() {
    document.getElementById('favorites-toggle').addEventListener('click', () => {
      showingFavorites = !showingFavorites;
      document.getElementById('favorites-toggle').classList.toggle('active', showingFavorites);
      if (showingFavorites) {
        document.querySelectorAll('.cat-tab').forEach(t => t.classList.remove('active'));
      } else {
        document.querySelector('.cat-tab[data-category="all"]').classList.add('active');
        currentCategory = 'all';
      }
      filterAndRender();
      Sound.play('click');
    });
  }

  function toggleFav(gameId, btn) {
    const added = Storage.toggleFavorite(gameId);
    btn.classList.toggle('active', added);
    if (added) btn.querySelector('svg').style.fill = '#ef4444';
    else btn.querySelector('svg').style.fill = 'none';
    showToast(added ? 'Added to favorites ♥' : 'Removed from favorites');
    Sound.play('click');
    if (showingFavorites) filterAndRender();
  }

  // Modal
  function bindModal() {
    const overlay = document.getElementById('info-modal');
    overlay.addEventListener('click', e => {
      if (e.target === overlay) overlay.classList.add('hidden');
    });
    document.querySelector('.modal-close').addEventListener('click', () => {
      overlay.classList.add('hidden');
    });
  }

  function showGameInfo(game) {
    document.getElementById('modal-title').textContent = game.title;
    document.getElementById('modal-description').textContent = game.description;
    const controlsEl = document.getElementById('modal-controls');
    if (game.controls) {
      controlsEl.innerHTML = `
        <h3>Controls</h3>
        ${game.controls.desktop ? `<p>🖥 ${game.controls.desktop}</p>` : ''}
        ${game.controls.mobile ? `<p>📱 ${game.controls.mobile}</p>` : ''}
      `;
    } else {
      controlsEl.innerHTML = '';
    }
    document.getElementById('modal-difficulty').textContent = `Difficulty: ${game.difficulty || 'N/A'}`;
    document.getElementById('modal-players').textContent = `${game.minPlayers || 1} player`;
    document.getElementById('info-modal').classList.remove('hidden');
  }

  // Toast
  function showToast(message) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }

  // Game view setup
  function showGameView(game) {
    document.getElementById('game-view-emoji').textContent = game.thumbnail;
    document.getElementById('game-view-title').textContent = game.title;
    const catBadge = document.getElementById('game-view-category');
    catBadge.textContent = game.category;
    catBadge.setAttribute('data-cat', game.category);
    document.getElementById('high-score').textContent = Storage.getHighScore(game.id).toLocaleString();
    document.getElementById('current-score').textContent = '0';

    const favBtn = document.getElementById('game-fav-btn');
    const isFav = Storage.isFavorite(game.id);
    favBtn.classList.toggle('active', isFav);
    if (isFav) favBtn.querySelector('svg').style.fill = '#ef4444';
    else favBtn.querySelector('svg').style.fill = 'none';

    favBtn.onclick = () => {
      const added = Storage.toggleFavorite(game.id);
      favBtn.classList.toggle('active', added);
      favBtn.querySelector('svg').style.fill = added ? '#ef4444' : 'none';
      showToast(added ? 'Added to favorites ♥' : 'Removed from favorites');
      Sound.play('click');
    };

    document.getElementById('game-info-btn').onclick = () => showGameInfo(game);
  }

  function updateScore(score) {
    document.getElementById('current-score').textContent = score.toLocaleString();
  }

  function getGames() { return allGames; }

  return {
    init, renderGrid, filterAndRender, renderRecents,
    showGameView, showGameInfo, showToast, toggleFav,
    updateScore, getGames
  };
})();
