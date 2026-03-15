class MazeRunner {
  constructor(container) {
    this._container = container;
    this._destroyed = false;
    this._paused = false;
    this._running = false;
    this._score = 0;
    this._timerInterval = null;
    this._elapsed = 0;
    this._animFrame = null;
    this._fogEnabled = false;
    this._fogRadius = 3;

    // Maze state
    this._cols = 10;
    this._rows = 10;
    this._cellSize = 0;
    this._grid = [];
    this._playerX = 0;
    this._playerY = 0;
    this._visited = new Set();
    this._won = false;

    // Bound handlers (for cleanup)
    this._boundKeyDown = this._handleKeyDown.bind(this);
    this._boundResize = this._handleResize.bind(this);

    this._buildDOM();
    this._attachListeners();
    this._showOverlay('Maze Runner', 'Navigate from top-left to bottom-right', null, 'Start');
  }

  /* ───── DOM construction ───── */

  _buildDOM() {
    this._root = document.createElement('div');
    this._root.className = 'maze-runner-container';

    // Header
    const header = document.createElement('div');
    header.className = 'maze-runner-header';

    // Stats
    const stats = document.createElement('div');
    stats.className = 'maze-runner-stats';
    stats.innerHTML =
      '<div class="maze-runner-stat"><span class="maze-runner-stat-label">Time</span>' +
      '<span class="maze-runner-stat-value" data-mr="time">0:00</span></div>' +
      '<div class="maze-runner-stat"><span class="maze-runner-stat-label">Moves</span>' +
      '<span class="maze-runner-stat-value" data-mr="moves">0</span></div>' +
      '<div class="maze-runner-stat"><span class="maze-runner-stat-label">Score</span>' +
      '<span class="maze-runner-stat-value" data-mr="score">0</span></div>';
    header.appendChild(stats);

    // Controls
    const controls = document.createElement('div');
    controls.className = 'maze-runner-controls';

    this._sizeSelect = document.createElement('select');
    this._sizeSelect.className = 'maze-runner-select';
    [['10', 'Small (10×10)'], ['15', 'Medium (15×15)'], ['20', 'Large (20×20)']].forEach(([v, t]) => {
      const o = document.createElement('option');
      o.value = v;
      o.textContent = t;
      this._sizeSelect.appendChild(o);
    });
    controls.appendChild(this._sizeSelect);

    this._fogBtn = document.createElement('button');
    this._fogBtn.className = 'maze-runner-btn';
    this._fogBtn.textContent = 'Fog';
    this._fogBtn.addEventListener('click', () => this._toggleFog());
    controls.appendChild(this._fogBtn);

    this._newGameBtn = document.createElement('button');
    this._newGameBtn.className = 'maze-runner-btn';
    this._newGameBtn.textContent = 'New Game';
    this._newGameBtn.addEventListener('click', () => this.start());
    controls.appendChild(this._newGameBtn);

    header.appendChild(controls);
    this._root.appendChild(header);

    // Canvas wrapper
    this._canvasWrap = document.createElement('div');
    this._canvasWrap.className = 'maze-runner-canvas-wrap';

    this._canvas = document.createElement('canvas');
    this._canvas.classList.add('game-canvas');
    this._canvasWrap.appendChild(this._canvas);
    this._ctx = this._canvas.getContext('2d');

    this._root.appendChild(this._canvasWrap);

    // Mobile D-Pad
    this._dpad = document.createElement('div');
    this._dpad.className = 'maze-runner-mobile-dpad';
    const dirs = [
      ['', ''], ['↑', 'up'], ['', ''],
      ['←', 'left'], ['', ''], ['→', 'right'],
      ['', ''], ['↓', 'down'], ['', '']
    ];
    dirs.forEach(([label, dir]) => {
      const btn = document.createElement('button');
      if (!dir) {
        btn.className = 'maze-runner-dpad-btn maze-runner-dpad-blank';
      } else {
        btn.className = 'maze-runner-dpad-btn';
        btn.textContent = label;
        btn.addEventListener('click', () => this._movePlayer(dir));
      }
      this._dpad.appendChild(btn);
    });
    this._root.appendChild(this._dpad);

    // Footer
    const footer = document.createElement('div');
    footer.className = 'maze-runner-footer';
    footer.textContent = 'Arrow keys or WASD to move';
    this._root.appendChild(footer);

    // Cache stat elements
    this._elTime = this._root.querySelector('[data-mr="time"]');
    this._elMoves = this._root.querySelector('[data-mr="moves"]');
    this._elScore = this._root.querySelector('[data-mr="score"]');

    this._container.appendChild(this._root);
  }

  /* ───── Overlay ───── */

  _showOverlay(title, sub, scoreLine, btnText) {
    this._removeOverlay();
    const ov = document.createElement('div');
    ov.className = 'maze-runner-overlay';
    ov.innerHTML =
      '<div class="maze-runner-overlay-title">' + this._esc(title) + '</div>' +
      '<div class="maze-runner-overlay-sub">' + this._esc(sub) + '</div>' +
      (scoreLine ? '<div class="maze-runner-overlay-score">' + this._esc(scoreLine) + '</div>' : '');
    const btn = document.createElement('button');
    btn.className = 'maze-runner-btn';
    btn.textContent = btnText;
    btn.addEventListener('click', () => this.start());
    ov.appendChild(btn);
    this._canvasWrap.appendChild(ov);
  }

  _removeOverlay() {
    const ov = this._canvasWrap.querySelector('.maze-runner-overlay');
    if (ov) ov.remove();
  }

  _esc(s) {
    const d = document.createElement('span');
    d.textContent = s;
    return d.innerHTML;
  }

  /* ───── Event listeners ───── */

  _attachListeners() {
    document.addEventListener('keydown', this._boundKeyDown);
    window.addEventListener('resize', this._boundResize);
  }

  _handleKeyDown(e) {
    if (this._destroyed || this._paused || !this._running || this._won) return;
    const map = {
      ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
      w: 'up', W: 'up', s: 'down', S: 'down', a: 'left', A: 'left', d: 'right', D: 'right'
    };
    const dir = map[e.key];
    if (dir) {
      e.preventDefault();
      this._movePlayer(dir);
    }
  }

  _handleResize() {
    if (this._destroyed) return;
    this._sizeCanvas();
    this._render();
  }

  /* ───── Fog toggle ───── */

  _toggleFog() {
    this._fogEnabled = !this._fogEnabled;
    this._fogBtn.classList.toggle('maze-runner-btn-active', this._fogEnabled);
    this._render();
  }

  /* ───── Maze generation (recursive backtracking) ───── */

  _generateMaze() {
    const cols = this._cols;
    const rows = this._rows;
    // Each cell: { top, right, bottom, left } walls (true = wall present)
    this._grid = [];
    for (let y = 0; y < rows; y++) {
      const row = [];
      for (let x = 0; x < cols; x++) {
        row.push({ top: true, right: true, bottom: true, left: true, visited: false });
      }
      this._grid.push(row);
    }

    const stack = [];
    const start = this._grid[0][0];
    start.visited = true;
    stack.push([0, 0]);

    while (stack.length > 0) {
      const [cx, cy] = stack[stack.length - 1];
      const neighbors = [];
      if (cy > 0 && !this._grid[cy - 1][cx].visited) neighbors.push([cx, cy - 1, 'top']);
      if (cx < cols - 1 && !this._grid[cy][cx + 1].visited) neighbors.push([cx + 1, cy, 'right']);
      if (cy < rows - 1 && !this._grid[cy + 1][cx].visited) neighbors.push([cx, cy + 1, 'bottom']);
      if (cx > 0 && !this._grid[cy][cx - 1].visited) neighbors.push([cx - 1, cy, 'left']);

      if (neighbors.length === 0) {
        stack.pop();
      } else {
        const [nx, ny, dir] = neighbors[Math.floor(Math.random() * neighbors.length)];
        const opposite = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' };
        this._grid[cy][cx][dir] = false;
        this._grid[ny][nx][opposite[dir]] = false;
        this._grid[ny][nx].visited = true;
        stack.push([nx, ny]);
      }
    }
  }

  /* ───── Player movement ───── */

  _movePlayer(dir) {
    if (!this._running || this._paused || this._won) return;
    const cell = this._grid[this._playerY][this._playerX];
    let nx = this._playerX;
    let ny = this._playerY;

    if (dir === 'up' && !cell.top) ny--;
    else if (dir === 'down' && !cell.bottom) ny++;
    else if (dir === 'left' && !cell.left) nx--;
    else if (dir === 'right' && !cell.right) nx++;
    else return; // wall

    if (nx === this._playerX && ny === this._playerY) return;

    this._playerX = nx;
    this._playerY = ny;
    this._moves++;
    this._visited.add(ny + ',' + nx);
    this._elMoves.textContent = this._moves;

    // Check win
    if (nx === this._cols - 1 && ny === this._rows - 1) {
      this._win();
    }

    this._render();
  }

  _win() {
    this._won = true;
    this._running = false;
    clearInterval(this._timerInterval);
    this._timerInterval = null;

    this._calculateScore();
    this._elScore.textContent = this._score;

    setTimeout(() => {
      this._showOverlay(
        '🎉 You Escaped!',
        'Time: ' + this._formatTime(this._elapsed) + '  •  Moves: ' + this._moves,
        'Score: ' + this._score,
        'Play Again'
      );
    }, 150);
  }

  _calculateScore() {
    const totalCells = this._cols * this._rows;
    const optimal = this._cols + this._rows - 2;
    const moveEfficiency = Math.max(0, 1 - (this._moves - optimal) / (totalCells * 2));
    const timeBonus = Math.max(0, 1 - this._elapsed / (totalCells * 3));
    const sizeMultiplier = totalCells / 100;
    const fogBonus = this._fogEnabled ? 1.5 : 1;

    this._score = Math.round((moveEfficiency * 500 + timeBonus * 500) * sizeMultiplier * fogBonus);
    if (this._score < 0) this._score = 0;
  }

  /* ───── Timer ───── */

  _startTimer() {
    this._elapsed = 0;
    this._updateTimeDisplay();
    this._timerInterval = setInterval(() => {
      if (!this._paused) {
        this._elapsed++;
        this._updateTimeDisplay();
      }
    }, 1000);
  }

  _updateTimeDisplay() {
    this._elTime.textContent = this._formatTime(this._elapsed);
  }

  _formatTime(s) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m + ':' + (sec < 10 ? '0' : '') + sec;
  }

  /* ───── Canvas sizing ───── */

  _sizeCanvas() {
    const maxW = Math.min(this._container.clientWidth - 20, 600);
    const maxH = Math.min(window.innerHeight - 200, 600);
    const maxDim = Math.min(maxW, maxH);
    this._cellSize = Math.floor(maxDim / Math.max(this._cols, this._rows));
    const w = this._cellSize * this._cols;
    const h = this._cellSize * this._rows;
    const dpr = window.devicePixelRatio || 1;
    this._canvas.width = w * dpr;
    this._canvas.height = h * dpr;
    this._canvas.style.width = w + 'px';
    this._canvas.style.height = h + 'px';
    this._ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  /* ───── Rendering ───── */

  _render() {
    if (this._destroyed) return;
    const ctx = this._ctx;
    const cs = this._cellSize;
    const cols = this._cols;
    const rows = this._rows;

    ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);

    // Background
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, cols * cs, rows * cs);

    // Determine visible cells when fog is enabled
    let visibleSet = null;
    if (this._fogEnabled && this._running && !this._won) {
      visibleSet = new Set();
      const r = this._fogRadius;
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          const vx = this._playerX + dx;
          const vy = this._playerY + dy;
          if (vx >= 0 && vx < cols && vy >= 0 && vy < rows) {
            if (Math.abs(dx) + Math.abs(dy) <= r + 1) {
              visibleSet.add(vy + ',' + vx);
            }
          }
        }
      }
    }

    // Draw cells
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const key = y + ',' + x;
        const isVisible = !visibleSet || visibleSet.has(key);
        const wasVisited = this._visited.has(key);

        if (!isVisible && !wasVisited) {
          // Fog — dark
          ctx.fillStyle = '#0d0d1a';
          ctx.fillRect(x * cs, y * cs, cs, cs);
          continue;
        }

        const alpha = isVisible ? 1 : 0.35;
        ctx.globalAlpha = alpha;

        // Cell floor
        if (x === cols - 1 && y === rows - 1) {
          ctx.fillStyle = '#2d6a4f';
        } else if (wasVisited) {
          ctx.fillStyle = '#222244';
        } else {
          ctx.fillStyle = '#16213e';
        }
        ctx.fillRect(x * cs, y * cs, cs, cs);

        // Breadcrumb
        if (wasVisited && !(x === this._playerX && y === this._playerY)) {
          ctx.fillStyle = '#3a3a6a';
          const dotR = Math.max(2, cs * 0.12);
          ctx.beginPath();
          ctx.arc(x * cs + cs / 2, y * cs + cs / 2, dotR, 0, Math.PI * 2);
          ctx.fill();
        }

        // Walls
        const cell = this._grid[y][x];
        ctx.strokeStyle = '#5c6bc0';
        ctx.lineWidth = 2;
        const x0 = x * cs;
        const y0 = y * cs;

        if (cell.top) { ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0 + cs, y0); ctx.stroke(); }
        if (cell.right) { ctx.beginPath(); ctx.moveTo(x0 + cs, y0); ctx.lineTo(x0 + cs, y0 + cs); ctx.stroke(); }
        if (cell.bottom) { ctx.beginPath(); ctx.moveTo(x0, y0 + cs); ctx.lineTo(x0 + cs, y0 + cs); ctx.stroke(); }
        if (cell.left) { ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0, y0 + cs); ctx.stroke(); }

        ctx.globalAlpha = 1;
      }
    }

    // Exit marker
    const exKey = (rows - 1) + ',' + (cols - 1);
    if (!visibleSet || visibleSet.has(exKey) || this._visited.has(exKey)) {
      ctx.fillStyle = '#52b788';
      ctx.font = 'bold ' + Math.floor(cs * 0.5) + 'px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('★', (cols - 1) * cs + cs / 2, (rows - 1) * cs + cs / 2);
    }

    // Start marker
    const stKey = '0,0';
    if (!visibleSet || visibleSet.has(stKey) || this._visited.has(stKey)) {
      ctx.fillStyle = '#e07a5f';
      ctx.font = 'bold ' + Math.floor(cs * 0.35) + 'px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('S', cs / 2, cs / 2);
    }

    // Player
    if (this._running || this._won) {
      const px = this._playerX * cs + cs * 0.2;
      const py = this._playerY * cs + cs * 0.2;
      const ps = cs * 0.6;
      ctx.fillStyle = '#ffd369';
      ctx.shadowColor = '#ffd369';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.roundRect(px, py, ps, ps, ps * 0.2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  /* ───── Public API ───── */

  start() {
    if (this._destroyed) return;

    // Read selected size
    const size = parseInt(this._sizeSelect.value, 10) || 10;
    this._cols = size;
    this._rows = size;

    // Reset state
    this._won = false;
    this._running = true;
    this._paused = false;
    this._moves = 0;
    this._score = 0;
    this._playerX = 0;
    this._playerY = 0;
    this._visited = new Set();
    this._visited.add('0,0');

    this._elMoves.textContent = '0';
    this._elScore.textContent = '0';

    // Clear previous timer
    if (this._timerInterval) {
      clearInterval(this._timerInterval);
      this._timerInterval = null;
    }

    this._removeOverlay();
    this._generateMaze();
    this._sizeCanvas();
    this._render();
    this._startTimer();
  }

  pause() {
    if (this._destroyed || !this._running || this._won) return;
    this._paused = true;
    this._showOverlay('Paused', 'Game is paused', null, 'Resume');
    // Override overlay button to resume instead of restart
    const btn = this._canvasWrap.querySelector('.maze-runner-overlay .maze-runner-btn');
    if (btn) {
      btn.textContent = 'Resume';
      btn.onclick = () => this.resume();
    }
  }

  resume() {
    if (this._destroyed || !this._paused) return;
    this._paused = false;
    this._removeOverlay();
    this._render();
  }

  destroy() {
    this._destroyed = true;
    this._running = false;
    this._paused = false;

    if (this._timerInterval) {
      clearInterval(this._timerInterval);
      this._timerInterval = null;
    }

    if (this._animFrame) {
      cancelAnimationFrame(this._animFrame);
      this._animFrame = null;
    }

    document.removeEventListener('keydown', this._boundKeyDown);
    window.removeEventListener('resize', this._boundResize);

    if (this._root && this._root.parentNode) {
      this._root.parentNode.removeChild(this._root);
    }
    this._root = null;
    this._canvas = null;
    this._ctx = null;
  }

  getScore() {
    return this._score;
  }
}

window.MazeRunner = MazeRunner;
