/**
 * Lights Out — A classic puzzle game.
 * Toggle lights and their neighbours to turn every light OFF.
 */
class LightsOut {
  /* ------------------------------------------------------------------ */
  /*  Construction                                                       */
  /* ------------------------------------------------------------------ */
  constructor(container) {
    this.container = container;
    this.size = 5;
    this.grid = [];
    this.moves = 0;
    this.paused = false;
    this.won = false;
    this._listeners = [];       // track every listener for cleanup
    this._animTimers = [];      // track animation timers
    this._els = {};             // named DOM references

    this._buildUI();
    this.start();
  }

  /* ------------------------------------------------------------------ */
  /*  Public API                                                         */
  /* ------------------------------------------------------------------ */

  start(size) {
    if (size) this.size = size;
    this.moves = 0;
    this.paused = false;
    this.won = false;
    this._clearAnimTimers();
    this._removeOverlays();
    this._updateDifficultyButtons();
    this._generateSolvablePuzzle();
    this._renderBoard();
    this._updateHUD();
    this._setMessage('Turn all the lights off!');
  }

  pause() {
    if (this.paused || this.won) return;
    this.paused = true;
    this._showPauseOverlay();
  }

  resume() {
    if (!this.paused) return;
    this.paused = false;
    this._removePauseOverlay();
  }

  destroy() {
    this._clearAnimTimers();
    this._listeners.forEach(([el, evt, fn]) => el.removeEventListener(evt, fn));
    this._listeners.length = 0;
    while (this.container.firstChild) {
      this.container.removeChild(this.container.firstChild);
    }
    this._els = {};
    this.grid = [];
  }

  getScore() {
    if (!this.won) return 0;
    const base = this.size * this.size * 200;
    const penalty = this.moves * 15;
    return Math.max(0, base - penalty);
  }

  /* ------------------------------------------------------------------ */
  /*  UI Construction                                                    */
  /* ------------------------------------------------------------------ */

  _buildUI() {
    const root = this._el('div', 'lights-out-container');
    this._els.root = root;

    // Header stats
    const header = this._el('div', 'lights-out-header');
    this._els.movesLabel = this._el('div', 'lights-out-stat');
    this._els.lightsLabel = this._el('div', 'lights-out-stat');
    header.append(this._els.movesLabel, this._els.lightsLabel);

    // Difficulty + restart controls
    const controls = this._el('div', 'lights-out-controls');
    const sizes = [
      { label: 'Easy 3×3', size: 3 },
      { label: 'Medium 5×5', size: 5 },
      { label: 'Hard 7×7', size: 7 },
    ];
    this._els.diffBtns = [];
    sizes.forEach(({ label, size }) => {
      const btn = this._el('button', 'lights-out-btn');
      btn.textContent = label;
      btn.dataset.size = size;
      this._listen(btn, 'click', () => this.start(size));
      controls.appendChild(btn);
      this._els.diffBtns.push(btn);
    });

    const restart = this._el('button', 'lights-out-btn lights-out-restart');
    restart.textContent = '↻ Restart';
    this._listen(restart, 'click', () => this.start());
    controls.appendChild(restart);

    // Board wrapper (needed for overlay positioning)
    this._els.boardWrapper = this._el('div', 'lights-out-board-wrapper');
    this._els.board = this._el('div', 'lights-out-board');
    this._els.boardWrapper.appendChild(this._els.board);

    // Message area
    this._els.message = this._el('div', 'lights-out-message');

    root.append(header, controls, this._els.boardWrapper, this._els.message);
    this.container.appendChild(root);
  }

  /* ------------------------------------------------------------------ */
  /*  Puzzle generation — always solvable                                */
  /* ------------------------------------------------------------------ */

  _generateSolvablePuzzle() {
    const n = this.size;
    // Start from all OFF, apply random toggles → guaranteed solvable
    this.grid = Array.from({ length: n }, () => Array(n).fill(false));

    // Number of random presses scales with grid size
    const presses = Math.floor(n * n * 0.55) + Math.floor(Math.random() * n);
    const pressed = new Set();

    while (pressed.size < presses) {
      const r = Math.floor(Math.random() * n);
      const c = Math.floor(Math.random() * n);
      const key = `${r},${c}`;
      if (pressed.has(key)) continue;
      pressed.add(key);
      this._applyToggle(r, c);
    }

    // If we accidentally ended up with all lights off, retry
    if (this._countOn() === 0) {
      this._generateSolvablePuzzle();
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Core game logic                                                    */
  /* ------------------------------------------------------------------ */

  _applyToggle(row, col) {
    const n = this.size;
    const targets = [[row, col], [row - 1, col], [row + 1, col], [row, col - 1], [row, col + 1]];
    targets.forEach(([r, c]) => {
      if (r >= 0 && r < n && c >= 0 && c < n) {
        this.grid[r][c] = !this.grid[r][c];
      }
    });
  }

  _handleCellClick(row, col) {
    if (this.paused || this.won) return;
    this._applyToggle(row, col);
    this.moves++;
    this._syncBoardClasses();
    this._updateHUD();

    if (this._countOn() === 0) {
      this.won = true;
      this._playWinAnimation();
    }
  }

  _countOn() {
    let count = 0;
    for (const row of this.grid) for (const v of row) if (v) count++;
    return count;
  }

  /* ------------------------------------------------------------------ */
  /*  Rendering                                                          */
  /* ------------------------------------------------------------------ */

  _renderBoard() {
    const board = this._els.board;
    // Remove old cell listeners before clearing
    board.innerHTML = '';
    board.className = 'lights-out-board';
    board.classList.add(`lights-out-size-${this.size}`);
    board.style.gridTemplateColumns = `repeat(${this.size}, 1fr)`;

    this._els.cells = [];

    for (let r = 0; r < this.size; r++) {
      this._els.cells[r] = [];
      for (let c = 0; c < this.size; c++) {
        const cell = this._el('div', 'lights-out-cell');
        if (this.grid[r][c]) cell.classList.add('lights-out-on');
        this._listen(cell, 'click', () => this._handleCellClick(r, c));
        board.appendChild(cell);
        this._els.cells[r][c] = cell;
      }
    }
  }

  _syncBoardClasses() {
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        this._els.cells[r][c].classList.toggle('lights-out-on', this.grid[r][c]);
      }
    }
  }

  _updateHUD() {
    this._els.movesLabel.innerHTML = `Moves: <span>${this.moves}</span>`;
    this._els.lightsLabel.innerHTML = `Lights on: <span>${this._countOn()}</span>`;
  }

  _updateDifficultyButtons() {
    this._els.diffBtns.forEach(btn => {
      btn.classList.toggle('active', Number(btn.dataset.size) === this.size);
    });
  }

  _setMessage(text) {
    this._els.message.textContent = text;
  }

  /* ------------------------------------------------------------------ */
  /*  Overlays                                                           */
  /* ------------------------------------------------------------------ */

  _showPauseOverlay() {
    if (this._els.pauseOverlay) return;
    const ov = this._el('div', 'lights-out-paused-overlay');
    const txt = this._el('div', 'lights-out-paused-text');
    txt.textContent = 'Paused';
    ov.appendChild(txt);
    this._els.pauseOverlay = ov;
    this._els.boardWrapper.appendChild(ov);
  }

  _removePauseOverlay() {
    if (this._els.pauseOverlay) {
      this._els.pauseOverlay.remove();
      this._els.pauseOverlay = null;
    }
  }

  _removeOverlays() {
    this._removePauseOverlay();
    if (this._els.winOverlay) {
      this._els.winOverlay.remove();
      this._els.winOverlay = null;
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Win animation                                                      */
  /* ------------------------------------------------------------------ */

  _playWinAnimation() {
    const n = this.size;
    const center = Math.floor(n / 2);
    let maxDist = 0;

    // Cascade pop from center outward
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        const dist = Math.abs(r - center) + Math.abs(c - center);
        if (dist > maxDist) maxDist = dist;
        const delay = dist * 80;
        const tid = setTimeout(() => {
          const cell = this._els.cells[r][c];
          cell.classList.add('lights-out-win-anim');
        }, delay);
        this._animTimers.push(tid);
      }
    }

    // Show win overlay after cascade finishes
    const overlayDelay = (maxDist * 80) + 600;
    const tid = setTimeout(() => this._showWinOverlay(), overlayDelay);
    this._animTimers.push(tid);
  }

  _showWinOverlay() {
    const ov = this._el('div', 'lights-out-win-overlay');

    const title = this._el('div', 'lights-out-win-title');
    title.textContent = 'Lights Out!';

    const detail = this._el('div', 'lights-out-win-detail');
    detail.textContent = `Solved ${this.size}×${this.size} in ${this.moves} move${this.moves !== 1 ? 's' : ''}`;

    const scoreEl = this._el('div', 'lights-out-win-score');
    scoreEl.textContent = `Score: ${this.getScore()}`;

    const btn = this._el('button', 'lights-out-btn');
    btn.textContent = 'Play Again';
    this._listen(btn, 'click', () => this.start());

    ov.append(title, detail, scoreEl, btn);
    this._els.winOverlay = ov;
    this._els.boardWrapper.appendChild(ov);
  }

  /* ------------------------------------------------------------------ */
  /*  Helpers                                                            */
  /* ------------------------------------------------------------------ */

  _el(tag, className) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    return el;
  }

  _listen(el, evt, fn) {
    el.addEventListener(evt, fn);
    this._listeners.push([el, evt, fn]);
  }

  _clearAnimTimers() {
    this._animTimers.forEach(id => clearTimeout(id));
    this._animTimers.length = 0;
  }
}

window.LightsOut = LightsOut;
