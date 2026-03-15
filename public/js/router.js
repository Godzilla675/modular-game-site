/* ===== Hash Router ===== */
/* Simple hash-based routing: #/ (home), #/game/:id, #/category/:cat */

const Router = (() => {
  let onNavigate = null;

  function init(callback) {
    onNavigate = callback;
    window.addEventListener('hashchange', handleRoute);
    handleRoute();
  }

  function handleRoute() {
    const hash = window.location.hash || '#/';
    const parts = hash.replace('#/', '').split('/').filter(Boolean);

    if (parts[0] === 'game' && parts[1]) {
      onNavigate({ view: 'game', gameId: parts[1] });
    } else if (parts[0] === 'category' && parts[1]) {
      onNavigate({ view: 'home', category: parts[1] });
    } else {
      onNavigate({ view: 'home' });
    }
  }

  function navigate(path) {
    window.location.hash = path;
  }

  return { init, navigate };
})();
