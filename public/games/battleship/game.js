/* ================================================================
   Battleship — fully self-contained game class
   ================================================================ */

class Battleship {
  /* ── Ship definitions ── */
  static SHIPS = [
    { name: 'Carrier',    size: 5 },
    { name: 'Battleship', size: 4 },
    { name: 'Destroyer',  size: 3 },
    { name: 'Submarine',  size: 3 },
    { name: 'Patrol Boat',size: 2 },
  ];

  static BOARD = 10;

  constructor(container) {
    this._container = container;
    this._root = null;
    this._listeners = [];      // {el, evt, fn} for cleanup
    this._timers = [];
    this._score = 0;
    this._paused = false;
    this._phase = 'idle';      // idle | placing | battle | over
    this.start();
  }

  /* ────────────────────────── public API ────────────────────────── */

  start() {
    this._cleanup();
    this._score = 0;
    this._paused = false;
    this._phase = 'placing';

    // boards: 0 = empty, 'S' = ship, 'H' = hit, 'M' = miss
    this._playerBoard  = this._emptyBoard();
    this._enemyBoard   = this._emptyBoard();
    this._playerShips  = [];   // [{cells:[[r,c],...], hits:0, sunk:false, name, size}]
    this._enemyShips   = [];
    this._placingIndex = 0;
    this._horizontal   = true;
    this._playerSunk   = 0;
    this._enemySunk    = 0;

    // AI hunt state
    this._aiHits = [];
    this._aiQueue = [];

    this._placeEnemyShips();
    this._render();
  }

  pause() {
    if (this._phase !== 'battle' || this._paused) return;
    this._paused = true;
    this._showOverlay('Paused', '', 'Resume', () => this.resume());
  }

  resume() {
    if (!this._paused) return;
    this._paused = false;
    this._hideOverlay();
  }

  destroy() {
    this._cleanup();
    if (this._root && this._root.parentNode) {
      this._root.parentNode.removeChild(this._root);
    }
    this._root = null;
  }

  getScore() {
    return this._score;
  }

  /* ────────────────────────── internal helpers ────────────────────── */

  _emptyBoard() {
    return Array.from({ length: Battleship.BOARD }, () =>
      Array(Battleship.BOARD).fill(0)
    );
  }

  _cleanup() {
    for (const { el, evt, fn } of this._listeners) el.removeEventListener(evt, fn);
    this._listeners = [];
    for (const id of this._timers) clearTimeout(id);
    this._timers = [];
  }

  _on(el, evt, fn) {
    el.addEventListener(evt, fn);
    this._listeners.push({ el, evt, fn });
  }

  _later(fn, ms) {
    const id = setTimeout(fn, ms);
    this._timers.push(id);
    return id;
  }

  /* ────────────────────────── rendering ────────────────────────── */

  _render() {
    if (this._root) {
      if (this._root.parentNode) this._root.parentNode.removeChild(this._root);
    }

    const root = document.createElement('div');
    root.className = 'battleship-container';
    this._root = root;

    // Title
    const title = document.createElement('div');
    title.className = 'battleship-title';
    title.textContent = 'Battleship';
    root.appendChild(title);

    // Status
    this._statusEl = document.createElement('div');
    this._statusEl.className = 'battleship-status';
    root.appendChild(this._statusEl);

    // Ship list (placement tokens)
    this._shipListEl = document.createElement('div');
    this._shipListEl.className = 'battleship-ship-list';
    root.appendChild(this._shipListEl);

    // Controls
    const controls = document.createElement('div');
    controls.className = 'battleship-controls';

    this._rotateBtn = this._btn('Rotate (R)', () => this._toggleRotation());
    this._randomBtn = this._btn('Random', () => this._randomPlace());
    this._resetBtn  = this._btn('Reset', () => this.start());

    controls.append(this._rotateBtn, this._randomBtn, this._resetBtn);
    root.appendChild(controls);

    // Boards
    const boards = document.createElement('div');
    boards.className = 'battleship-boards';

    const pw = document.createElement('div');
    pw.className = 'battleship-board-wrapper';
    const pl = document.createElement('div');
    pl.className = 'battleship-board-label';
    pl.textContent = 'Your Fleet';
    this._playerGrid = this._createGrid(false);
    pw.append(pl, this._playerGrid);

    const ew = document.createElement('div');
    ew.className = 'battleship-board-wrapper';
    const el2 = document.createElement('div');
    el2.className = 'battleship-board-label';
    el2.textContent = 'Enemy Waters';
    this._enemyGrid = this._createGrid(true);
    ew.append(el2, this._enemyGrid);

    boards.append(pw, ew);
    root.appendChild(boards);

    // Scoreboard
    this._scoreboardEl = document.createElement('div');
    this._scoreboardEl.className = 'battleship-scoreboard';
    root.appendChild(this._scoreboardEl);

    // Overlay holder
    this._overlayEl = null;

    this._container.appendChild(root);

    // Keyboard for rotate
    this._onKey = (e) => {
      if (e.key === 'r' || e.key === 'R') this._toggleRotation();
    };
    this._on(document, 'keydown', this._onKey);

    this._updateUI();
  }

  _btn(label, cb) {
    const b = document.createElement('button');
    b.className = 'battleship-btn';
    b.textContent = label;
    this._on(b, 'click', cb);
    return b;
  }

  _createGrid(isEnemy) {
    const grid = document.createElement('div');
    grid.className = 'battleship-grid' + (isEnemy ? ' battleship-opponent' : '');

    const cells = [];
    for (let r = 0; r < Battleship.BOARD; r++) {
      for (let c = 0; c < Battleship.BOARD; c++) {
        const cell = document.createElement('div');
        cell.className = 'battleship-cell';
        cell.dataset.r = r;
        cell.dataset.c = c;

        if (isEnemy) {
          this._on(cell, 'click', () => this._fireAt(r, c));
        } else {
          this._on(cell, 'click', () => this._placeShipAt(r, c));
          this._on(cell, 'mouseenter', () => this._previewShip(r, c));
          this._on(cell, 'mouseleave', () => this._clearPreview());
        }

        grid.appendChild(cell);
        cells.push(cell);
      }
    }
    if (isEnemy) this._enemyCells = cells;
    else this._playerCells = cells;
    return grid;
  }

  _cellAt(cells, r, c) {
    return cells[r * Battleship.BOARD + c];
  }

  /* ────────────────────────── UI update ────────────────────────── */

  _updateUI() {
    this._drawBoard(this._playerCells, this._playerBoard, false);
    this._drawBoard(this._enemyCells, this._enemyBoard, true);
    this._updateShipList();
    this._updateScoreboard();
    this._updateStatus();
    this._updateButtons();
  }

  _drawBoard(cells, board, hideShips) {
    for (let r = 0; r < Battleship.BOARD; r++) {
      for (let c = 0; c < Battleship.BOARD; c++) {
        const cell = this._cellAt(cells, r, c);
        const v = board[r][c];
        cell.className = 'battleship-cell';
        if (v === 'H') {
          // Check if part of a sunk ship
          const ships = hideShips ? this._enemyShips : this._playerShips;
          const ship = ships.find(s => s.cells.some(([sr, sc]) => sr === r && sc === c));
          if (ship && ship.sunk) {
            cell.classList.add('battleship-sunk');
          } else {
            cell.classList.add('battleship-hit');
          }
        } else if (v === 'M') {
          cell.classList.add('battleship-miss');
        } else if (v === 'S' && !hideShips) {
          cell.classList.add('battleship-ship');
        }
      }
    }
  }

  _updateShipList() {
    this._shipListEl.innerHTML = '';
    Battleship.SHIPS.forEach((ship, i) => {
      const token = document.createElement('div');
      token.className = 'battleship-ship-token';
      if (i === this._placingIndex && this._phase === 'placing') token.classList.add('battleship-active');
      if (i < this._placingIndex || this._phase !== 'placing') token.classList.add('battleship-placed');
      for (let s = 0; s < ship.size; s++) {
        const block = document.createElement('div');
        block.className = 'battleship-ship-block';
        token.appendChild(block);
      }
      this._shipListEl.appendChild(token);
    });
  }

  _updateScoreboard() {
    this._scoreboardEl.innerHTML = '';
    const add = (label, sunk, total) => {
      const g = document.createElement('div');
      g.className = 'battleship-score-group';
      g.innerHTML = `<div>${label}</div><div><strong>${sunk}</strong> / ${total} sunk</div>`;
      this._scoreboardEl.appendChild(g);
    };
    add('Enemy Ships', this._enemySunk, Battleship.SHIPS.length);
    add('Your Ships', this._playerSunk, Battleship.SHIPS.length);
  }

  _updateStatus() {
    const msgs = {
      placing: `Place your ${Battleship.SHIPS[this._placingIndex]?.name ?? 'ships'} (${Battleship.SHIPS[this._placingIndex]?.size ?? ''}). Press R to rotate.`,
      battle: 'Click enemy grid to fire!',
      over: '',
    };
    this._statusEl.textContent = msgs[this._phase] || '';
  }

  _updateButtons() {
    const placing = this._phase === 'placing';
    this._rotateBtn.disabled = !placing;
    this._randomBtn.disabled = !placing;
  }

  /* ────────────────────────── ship placement ────────────────────── */

  _toggleRotation() {
    if (this._phase !== 'placing') return;
    this._horizontal = !this._horizontal;
    this._rotateBtn.textContent = this._horizontal ? 'Rotate (R) →' : 'Rotate (R) ↓';
  }

  _shipCells(r, c, size, horiz) {
    const cells = [];
    for (let i = 0; i < size; i++) {
      const nr = horiz ? r : r + i;
      const nc = horiz ? c + i : c;
      if (nr >= Battleship.BOARD || nc >= Battleship.BOARD) return null;
      cells.push([nr, nc]);
    }
    return cells;
  }

  _canPlace(board, cells) {
    if (!cells) return false;
    return cells.every(([r, c]) => board[r][c] === 0);
  }

  _previewShip(r, c) {
    if (this._phase !== 'placing') return;
    this._clearPreview();
    const ship = Battleship.SHIPS[this._placingIndex];
    if (!ship) return;
    const cells = this._shipCells(r, c, ship.size, this._horizontal);
    const valid = this._canPlace(this._playerBoard, cells);
    if (cells) {
      cells.forEach(([pr, pc]) => {
        if (pr < Battleship.BOARD && pc < Battleship.BOARD) {
          const el = this._cellAt(this._playerCells, pr, pc);
          el.classList.add(valid ? 'battleship-preview' : 'battleship-preview-invalid');
        }
      });
    }
  }

  _clearPreview() {
    this._playerCells.forEach(c => {
      c.classList.remove('battleship-preview', 'battleship-preview-invalid');
    });
  }

  _placeShipAt(r, c) {
    if (this._phase !== 'placing') return;
    const ship = Battleship.SHIPS[this._placingIndex];
    if (!ship) return;
    const cells = this._shipCells(r, c, ship.size, this._horizontal);
    if (!this._canPlace(this._playerBoard, cells)) return;

    cells.forEach(([sr, sc]) => { this._playerBoard[sr][sc] = 'S'; });
    this._playerShips.push({ name: ship.name, size: ship.size, cells, hits: 0, sunk: false });
    this._placingIndex++;

    if (this._placingIndex >= Battleship.SHIPS.length) {
      this._phase = 'battle';
    }
    this._updateUI();
  }

  _randomPlace() {
    if (this._phase !== 'placing') return;
    // Reset player board
    this._playerBoard = this._emptyBoard();
    this._playerShips = [];
    this._placingIndex = 0;

    this._placeShipsRandomly(this._playerBoard, this._playerShips);
    this._placingIndex = Battleship.SHIPS.length;
    this._phase = 'battle';
    this._updateUI();
  }

  _placeEnemyShips() {
    this._placeShipsRandomly(this._enemyBoard, this._enemyShips);
  }

  _placeShipsRandomly(board, shipList) {
    for (const ship of Battleship.SHIPS) {
      let placed = false;
      while (!placed) {
        const horiz = Math.random() < 0.5;
        const r = Math.floor(Math.random() * Battleship.BOARD);
        const c = Math.floor(Math.random() * Battleship.BOARD);
        const cells = this._shipCells(r, c, ship.size, horiz);
        if (this._canPlace(board, cells)) {
          cells.forEach(([sr, sc]) => { board[sr][sc] = 'S'; });
          shipList.push({ name: ship.name, size: ship.size, cells, hits: 0, sunk: false });
          placed = true;
        }
      }
    }
  }

  /* ────────────────────────── battle ────────────────────────── */

  _fireAt(r, c) {
    if (this._phase !== 'battle' || this._paused) return;
    const v = this._enemyBoard[r][c];
    if (v === 'H' || v === 'M') return; // already shot

    if (v === 'S') {
      this._enemyBoard[r][c] = 'H';
      this._score += 10;
      const ship = this._enemyShips.find(s => s.cells.some(([sr, sc]) => sr === r && sc === c));
      if (ship) {
        ship.hits++;
        if (ship.hits === ship.size) {
          ship.sunk = true;
          this._enemySunk++;
          this._score += 50;
        }
      }
    } else {
      this._enemyBoard[r][c] = 'M';
    }

    this._updateUI();

    if (this._enemySunk === Battleship.SHIPS.length) {
      this._phase = 'over';
      this._score += 200;
      this._updateUI();
      this._showOverlay('Victory!', `You sank all enemy ships! Score: ${this._score}`, 'Play Again', () => this.start());
      return;
    }

    // AI turn after short delay
    this._later(() => this._aiTurn(), 400);
  }

  /* ── AI opponent ── */

  _aiTurn() {
    if (this._phase !== 'battle' || this._paused) return;

    let r, c;

    // Use hunt queue if available
    while (this._aiQueue.length > 0) {
      const next = this._aiQueue.shift();
      r = next[0]; c = next[1];
      if (this._playerBoard[r][c] !== 'H' && this._playerBoard[r][c] !== 'M') {
        return this._aiShoot(r, c);
      }
    }

    // Random shot
    const open = [];
    for (let ir = 0; ir < Battleship.BOARD; ir++) {
      for (let ic = 0; ic < Battleship.BOARD; ic++) {
        const v = this._playerBoard[ir][ic];
        if (v !== 'H' && v !== 'M') open.push([ir, ic]);
      }
    }
    if (open.length === 0) return;
    const pick = open[Math.floor(Math.random() * open.length)];
    this._aiShoot(pick[0], pick[1]);
  }

  _aiShoot(r, c) {
    const v = this._playerBoard[r][c];
    if (v === 'S') {
      this._playerBoard[r][c] = 'H';
      this._aiHits.push([r, c]);

      // Enqueue adjacent cells for hunt mode
      const adj = [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]];
      for (const [ar, ac] of adj) {
        if (ar >= 0 && ar < Battleship.BOARD && ac >= 0 && ac < Battleship.BOARD) {
          const av = this._playerBoard[ar][ac];
          if (av !== 'H' && av !== 'M') {
            if (!this._aiQueue.some(([qr, qc]) => qr === ar && qc === ac)) {
              this._aiQueue.push([ar, ac]);
            }
          }
        }
      }

      const ship = this._playerShips.find(s => s.cells.some(([sr, sc]) => sr === r && sc === c));
      if (ship) {
        ship.hits++;
        if (ship.hits === ship.size) {
          ship.sunk = true;
          this._playerSunk++;
          // Remove sunk ship cells from queue (no longer useful)
          const sunkSet = new Set(ship.cells.map(([sr, sc]) => `${sr},${sc}`));
          this._aiQueue = this._aiQueue.filter(([qr, qc]) => !sunkSet.has(`${qr},${qc}`));
        }
      }
    } else {
      this._playerBoard[r][c] = 'M';
    }

    this._updateUI();

    if (this._playerSunk === Battleship.SHIPS.length) {
      this._phase = 'over';
      this._updateUI();
      this._showOverlay('Defeat', `The enemy sank your fleet! Score: ${this._score}`, 'Play Again', () => this.start());
    }
  }

  /* ────────────────────────── overlays ────────────────────────── */

  _showOverlay(title, msg, btnText, btnCb) {
    this._hideOverlay();
    const ov = document.createElement('div');
    ov.className = 'battleship-overlay';

    if (title) {
      const t = document.createElement('div');
      t.className = 'battleship-overlay-title';
      t.textContent = title;
      ov.appendChild(t);
    }
    if (msg) {
      const m = document.createElement('div');
      m.className = 'battleship-overlay-msg';
      m.textContent = msg;
      ov.appendChild(m);
    }
    if (btnText) {
      const b = this._btn(btnText, btnCb);
      ov.appendChild(b);
    }

    this._root.appendChild(ov);
    this._overlayEl = ov;
  }

  _hideOverlay() {
    if (this._overlayEl && this._overlayEl.parentNode) {
      this._overlayEl.parentNode.removeChild(this._overlayEl);
    }
    this._overlayEl = null;
  }
}

window.Battleship = Battleship;
