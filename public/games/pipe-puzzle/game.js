/**
 * Pipe Puzzle – connect pipes from source to drain.
 * Fully self-contained, no external dependencies.
 */
class PipePuzzle {
  /* ─── Pipe definitions ─── */
  // Each type lists the base openings (before rotation).
  // Directions: 0 = up, 1 = right, 2 = down, 3 = left
  static TYPES = {
    straight: [1, 3],       // horizontal
    corner:   [0, 1],       // L-shape (up + right)
    tee:      [0, 1, 2],    // T-junction (up + right + down)
    cross:    [0, 1, 2, 3], // cross (all four)
  };

  static DIR_DELTA = [
    { dr: -1, dc: 0 }, // 0 = up
    { dr: 0, dc: 1 },  // 1 = right
    { dr: 0, dc: -1 }, // 3 = left
    { dr: 1, dc: 0 },  // 2 = down  — reordered below
  ];

  static OPPOSITE = { 0: 2, 1: 3, 2: 0, 3: 1 };

  static DELTA = [
    { dr: -1, dc: 0 }, // 0 up
    { dr: 0, dc: 1 },  // 1 right
    { dr: 1, dc: 0 },  // 2 down
    { dr: 0, dc: -1 }, // 3 left
  ];

  static ARM_CLASS = ['up', 'right', 'down', 'left'];

  /* ─── Constructor ─── */
  constructor(container) {
    this._container = container;
    this._root = null;
    this._grid = [];        // 2-D array of cell data
    this._rows = 0;
    this._cols = 0;
    this._score = 0;
    this._elapsed = 0;      // seconds
    this._timerRef = null;
    this._paused = false;
    this._won = false;
    this._gridSize = 6;     // default 6x6
    this._listeners = [];   // for cleanup
    this._boundClick = null;
    this._sourceRow = 0;
    this._drainRow = 0;

    this._buildUI();
  }

  /* ─── Public API ─── */
  start() {
    this._won = false;
    this._paused = false;
    this._score = 0;
    this._elapsed = 0;
    this._clearTimer();
    this._generate(this._gridSize, this._gridSize);
    this._render();
    this._startTimer();
    this._updateHUD();
    this._removeOverlays();
  }

  pause() {
    if (this._won || this._paused) return;
    this._paused = true;
    this._clearTimer();
    this._showPaused();
  }

  resume() {
    if (this._won || !this._paused) return;
    this._paused = false;
    this._removeOverlays();
    this._startTimer();
  }

  destroy() {
    this._clearTimer();
    this._listeners.forEach(({ el, ev, fn }) => el.removeEventListener(ev, fn));
    this._listeners = [];
    if (this._root && this._root.parentNode) {
      this._root.parentNode.removeChild(this._root);
    }
    this._root = null;
    this._grid = [];
  }

  getScore() {
    return this._score;
  }

  /* ─── UI skeleton ─── */
  _buildUI() {
    const root = document.createElement('div');
    root.className = 'pipe-puzzle-container';
    this._root = root;

    // Header
    const header = document.createElement('div');
    header.className = 'pipe-puzzle-header';

    // Timer
    this._timerEl = this._makeStat('Time', '0:00');
    // Score
    this._scoreEl = this._makeStat('Score', '0');
    // Moves
    this._movesEl = this._makeStat('Moves', '0');
    this._moves = 0;

    // Size selector
    const sizeSelect = document.createElement('select');
    sizeSelect.className = 'pipe-puzzle-size-select';
    [4, 6, 8].forEach(s => {
      const o = document.createElement('option');
      o.value = s;
      o.textContent = `${s}×${s}`;
      if (s === this._gridSize) o.selected = true;
      sizeSelect.appendChild(o);
    });
    this._on(sizeSelect, 'change', () => {
      this._gridSize = parseInt(sizeSelect.value, 10);
      this.start();
    });

    // New game button
    const newBtn = document.createElement('button');
    newBtn.className = 'pipe-puzzle-btn';
    newBtn.textContent = 'New Game';
    this._on(newBtn, 'click', () => this.start());

    const controls = document.createElement('div');
    controls.className = 'pipe-puzzle-controls';
    controls.append(sizeSelect, newBtn);

    header.append(this._timerEl.wrapper, this._scoreEl.wrapper, this._movesEl.wrapper, controls);
    root.appendChild(header);

    // Board wrapper (position: relative for overlays)
    const boardWrap = document.createElement('div');
    boardWrap.style.position = 'relative';
    boardWrap.style.display = 'inline-block';
    this._boardWrap = boardWrap;

    const board = document.createElement('div');
    board.className = 'pipe-puzzle-board';
    this._boardEl = board;
    boardWrap.appendChild(board);
    root.appendChild(boardWrap);

    this._container.appendChild(root);
  }

  _makeStat(label, initial) {
    const w = document.createElement('div');
    w.className = 'pipe-puzzle-stat';
    const span = document.createElement('span');
    span.textContent = initial;
    w.append(`${label}: `, span);
    return { wrapper: w, span };
  }

  /* ─── Puzzle generation ─── */
  _generate(rows, cols) {
    this._rows = rows;
    this._cols = cols;
    this._moves = 0;

    // Pick random source / drain rows
    this._sourceRow = Math.floor(Math.random() * rows);
    this._drainRow = Math.floor(Math.random() * rows);

    // 1) Build a solved path / spanning tree via randomised DFS
    const grid = Array.from({ length: rows }, (_, r) =>
      Array.from({ length: cols }, (_, c) => ({
        r, c,
        openings: new Set(), // set of directions (0-3) that connect
        type: null,
        rotation: 0,
        solved: 0,          // solved rotation (0)
      }))
    );

    const visited = Array.from({ length: rows }, () => Array(cols).fill(false));

    const dfs = (r, c) => {
      visited[r][c] = true;
      const dirs = [0, 1, 2, 3].sort(() => Math.random() - 0.5);
      for (const d of dirs) {
        const nr = r + PipePuzzle.DELTA[d].dr;
        const nc = c + PipePuzzle.DELTA[d].dc;
        if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
        if (visited[nr][nc]) continue;
        grid[r][c].openings.add(d);
        grid[nr][nc].openings.add(PipePuzzle.OPPOSITE[d]);
        dfs(nr, nc);
      }
    };

    // Start DFS from the source cell
    dfs(this._sourceRow, 0);

    // Source always opens left, drain always opens right
    grid[this._sourceRow][0].openings.add(3);           // left opening (into void = source marker)
    grid[this._drainRow][cols - 1].openings.add(1);     // right opening (drain)

    // Optionally add a few extra connections for variety (creates loops)
    const extraEdges = Math.floor(rows * cols * 0.12);
    for (let i = 0; i < extraEdges; i++) {
      const r = Math.floor(Math.random() * rows);
      const c = Math.floor(Math.random() * cols);
      const d = Math.floor(Math.random() * 4);
      const nr = r + PipePuzzle.DELTA[d].dr;
      const nc = c + PipePuzzle.DELTA[d].dc;
      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
      grid[r][c].openings.add(d);
      grid[nr][nc].openings.add(PipePuzzle.OPPOSITE[d]);
    }

    // 2) Classify each cell by its openings → pipe type
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cell = grid[r][c];
        const opens = [...cell.openings].sort();
        const count = opens.length;
        if (count === 4) {
          cell.type = 'cross';
          cell.solved = 0;
        } else if (count === 3) {
          cell.type = 'tee';
          // the missing direction determines rotation
          // base tee opens 0,1,2 → missing = 3
          const missing = [0, 1, 2, 3].find(d => !cell.openings.has(d));
          // rotations needed so that missing side aligns to 3 (left)
          cell.solved = (missing - 3 + 4) % 4;
        } else if (count === 2) {
          const [a, b] = opens;
          if ((a + 2) % 4 === b) {
            // straight
            cell.type = 'straight';
            cell.solved = a % 2 === 0 ? 0 : 1; // 0 = vertical, 1 = horizontal
          } else {
            // corner
            cell.type = 'corner';
            cell.solved = this._cornerRotation(a, b);
          }
        } else if (count === 1) {
          // dead-end — treat as straight with one useful end
          cell.type = 'straight';
          cell.solved = opens[0] % 2 === 0 ? 0 : 1;
        } else {
          cell.type = 'straight';
          cell.solved = 0;
        }
        cell.rotation = cell.solved;
      }
    }

    // 3) Randomise rotations so player must solve
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const spins = 1 + Math.floor(Math.random() * 3); // 1-3 extra 90° turns
        grid[r][c].rotation = (grid[r][c].rotation + spins) % 4;
      }
    }

    this._grid = grid;
  }

  _cornerRotation(a, b) {
    // base corner opens 0,1 (up, right)
    // We need rotation r such that rotating base by r gives openings {a, b}
    const pairs = [[0, 1], [1, 2], [2, 3], [3, 0]]; // rotation 0,1,2,3
    for (let r = 0; r < 4; r++) {
      const pa = pairs[r][0], pb = pairs[r][1];
      if ((pa === a && pb === b) || (pa === b && pb === a)) return r;
    }
    return 0;
  }

  /* ─── Rendering ─── */
  _render() {
    const { _rows: rows, _cols: cols } = this;
    this._boardEl.innerHTML = '';
    this._boardEl.style.gridTemplateColumns = `repeat(${cols}, 56px)`;
    this._boardEl.style.gridTemplateRows = `repeat(${rows}, 56px)`;
    this._cellEls = [];

    for (let r = 0; r < rows; r++) {
      this._cellEls[r] = [];
      for (let c = 0; c < cols; c++) {
        const cell = this._grid[r][c];
        const div = document.createElement('div');
        div.className = 'pipe-puzzle-cell';
        div.dataset.row = r;
        div.dataset.col = c;

        if (r === this._sourceRow && c === 0) div.classList.add('pipe-puzzle-source');
        if (r === this._drainRow && c === cols - 1) div.classList.add('pipe-puzzle-drain');

        this._renderPipe(div, cell);
        this._boardEl.appendChild(div);
        this._cellEls[r][c] = div;
      }
    }

    // Single delegated click on board
    if (this._boundClick) {
      this._boardEl.removeEventListener('click', this._boundClick);
      this._listeners = this._listeners.filter(l => l.fn !== this._boundClick);
    }
    this._boundClick = (e) => this._handleClick(e);
    this._on(this._boardEl, 'click', this._boundClick);

    this._checkFlow();
  }

  _renderPipe(div, cell) {
    // Remove old pipe children
    const old = div.querySelector('.pipe-puzzle-pipe');
    if (old) div.removeChild(old);

    const pipe = document.createElement('div');
    pipe.className = 'pipe-puzzle-pipe';

    // Compute actual openings after rotation
    const openings = this._getOpenings(cell);
    openings.forEach(d => {
      const arm = document.createElement('div');
      arm.className = `pipe-puzzle-arm pipe-puzzle-arm-${PipePuzzle.ARM_CLASS[d]}`;
      pipe.appendChild(arm);
    });

    div.appendChild(pipe);
  }

  _getOpenings(cell) {
    const base = PipePuzzle.TYPES[cell.type];
    const rot = cell.rotation;
    return base.map(d => (d + rot) % 4);
  }

  /* ─── Interaction ─── */
  _handleClick(e) {
    if (this._paused || this._won) return;
    const cellEl = e.target.closest('.pipe-puzzle-cell');
    if (!cellEl) return;
    const r = parseInt(cellEl.dataset.row, 10);
    const c = parseInt(cellEl.dataset.col, 10);
    const cell = this._grid[r][c];

    cell.rotation = (cell.rotation + 1) % 4;
    this._moves++;
    this._renderPipe(cellEl, cell);
    this._checkFlow();
    this._updateHUD();
  }

  /* ─── Flow check (BFS from source) ─── */
  _checkFlow() {
    const { _rows: rows, _cols: cols, _grid: grid } = this;

    // Clear filled state
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++)
        this._cellEls[r][c].classList.remove('pipe-puzzle-filled');

    // BFS from source
    const visited = Array.from({ length: rows }, () => Array(cols).fill(false));
    const queue = [[this._sourceRow, 0]];
    visited[this._sourceRow][0] = true;

    while (queue.length) {
      const [r, c] = queue.shift();
      this._cellEls[r][c].classList.add('pipe-puzzle-filled');
      const openings = this._getOpenings(grid[r][c]);

      for (const d of openings) {
        const nr = r + PipePuzzle.DELTA[d].dr;
        const nc = c + PipePuzzle.DELTA[d].dc;
        if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
        if (visited[nr][nc]) continue;
        const neighborOpenings = this._getOpenings(grid[nr][nc]);
        if (neighborOpenings.includes(PipePuzzle.OPPOSITE[d])) {
          visited[nr][nc] = true;
          queue.push([nr, nc]);
        }
      }
    }

    // Check win: drain cell must be filled AND its right opening is active
    const drainCell = grid[this._drainRow][cols - 1];
    const drainOpenings = this._getOpenings(drainCell);
    if (visited[this._drainRow][cols - 1] && drainOpenings.includes(1)) {
      // Also verify the source has its left opening
      const srcOpenings = this._getOpenings(grid[this._sourceRow][0]);
      if (srcOpenings.includes(3)) {
        this._onWin();
      }
    }
  }

  /* ─── Win ─── */
  _onWin() {
    this._won = true;
    this._clearTimer();
    this._computeScore();
    this._updateHUD();
    this._showWin();
  }

  _computeScore() {
    const base = this._rows * this._cols * 100;
    const timePenalty = this._elapsed * 2;
    const movePenalty = this._moves;
    this._score = Math.max(0, Math.round(base - timePenalty - movePenalty));
  }

  /* ─── Timer ─── */
  _startTimer() {
    this._clearTimer();
    this._timerRef = setInterval(() => {
      this._elapsed++;
      this._updateHUD();
    }, 1000);
  }

  _clearTimer() {
    if (this._timerRef) {
      clearInterval(this._timerRef);
      this._timerRef = null;
    }
  }

  _updateHUD() {
    const mins = Math.floor(this._elapsed / 60);
    const secs = this._elapsed % 60;
    this._timerEl.span.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
    this._scoreEl.span.textContent = String(this._score);
    this._movesEl.span.textContent = String(this._moves);
  }

  /* ─── Overlays ─── */
  _removeOverlays() {
    this._boardWrap.querySelectorAll('.pipe-puzzle-win, .pipe-puzzle-paused')
      .forEach(el => el.remove());
  }

  _showWin() {
    this._removeOverlays();
    const ov = document.createElement('div');
    ov.className = 'pipe-puzzle-win';
    ov.innerHTML = `
      <h2>🎉 Puzzle Solved!</h2>
      <p>Score: <strong>${this._score}</strong></p>
      <p>Time: ${Math.floor(this._elapsed / 60)}:${(this._elapsed % 60).toString().padStart(2, '0')}</p>
      <p>Moves: ${this._moves}</p>
    `;
    const btn = document.createElement('button');
    btn.className = 'pipe-puzzle-btn';
    btn.textContent = 'Play Again';
    btn.style.marginTop = '12px';
    this._on(btn, 'click', () => this.start());
    ov.appendChild(btn);
    this._boardWrap.appendChild(ov);
  }

  _showPaused() {
    this._removeOverlays();
    const ov = document.createElement('div');
    ov.className = 'pipe-puzzle-paused';
    ov.textContent = 'PAUSED';
    this._boardWrap.appendChild(ov);
  }

  /* ─── Helpers ─── */
  _on(el, ev, fn) {
    el.addEventListener(ev, fn);
    this._listeners.push({ el, ev, fn });
  }
}

window.PipePuzzle = PipePuzzle;
