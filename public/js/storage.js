/* ===== Storage Manager ===== */
/* Handles all localStorage: high scores, favorites, recents, settings */

const Storage = (() => {
  const KEYS = {
    HIGH_SCORES: 'arcade_highscores',
    FAVORITES: 'arcade_favorites',
    RECENTS: 'arcade_recents',
    SETTINGS: 'arcade_settings'
  };

  const MAX_RECENTS = 10;

  function _get(key, fallback) {
    try {
      const val = localStorage.getItem(key);
      return val ? JSON.parse(val) : fallback;
    } catch { return fallback; }
  }

  function _set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  }

  // High Scores
  function getHighScore(gameId) {
    const scores = _get(KEYS.HIGH_SCORES, {});
    return scores[gameId] || 0;
  }

  function setHighScore(gameId, score) {
    const scores = _get(KEYS.HIGH_SCORES, {});
    if (score > (scores[gameId] || 0)) {
      scores[gameId] = score;
      _set(KEYS.HIGH_SCORES, scores);
      return true; // new high score
    }
    return false;
  }

  function getAllHighScores() {
    return _get(KEYS.HIGH_SCORES, {});
  }

  // Favorites
  function getFavorites() {
    return _get(KEYS.FAVORITES, []);
  }

  function isFavorite(gameId) {
    return getFavorites().includes(gameId);
  }

  function toggleFavorite(gameId) {
    const favs = getFavorites();
    const idx = favs.indexOf(gameId);
    if (idx === -1) {
      favs.push(gameId);
    } else {
      favs.splice(idx, 1);
    }
    _set(KEYS.FAVORITES, favs);
    return idx === -1; // true if added
  }

  // Recently Played
  function getRecents() {
    return _get(KEYS.RECENTS, []);
  }

  function addRecent(gameId) {
    let recents = getRecents().filter(id => id !== gameId);
    recents.unshift(gameId);
    if (recents.length > MAX_RECENTS) recents = recents.slice(0, MAX_RECENTS);
    _set(KEYS.RECENTS, recents);
  }

  // Settings
  function getSettings() {
    return _get(KEYS.SETTINGS, { sound: true });
  }

  function updateSettings(partial) {
    const settings = getSettings();
    Object.assign(settings, partial);
    _set(KEYS.SETTINGS, settings);
    return settings;
  }

  return {
    getHighScore, setHighScore, getAllHighScores,
    getFavorites, isFavorite, toggleFavorite,
    getRecents, addRecent,
    getSettings, updateSettings
  };
})();
