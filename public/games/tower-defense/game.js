/* ============================================================
   Tower Defense – fully self-contained, canvas-based game
   ============================================================ */
class TowerDefense {
  /* ── constants ── */
  static CELL = 40;
  static COLS = 20;
  static ROWS = 13;           // 600 - HUD(44) - panel(80) ≈ 476 → 11.9 rows → use 13 rows, canvas 600
  static HUD_H = 44;
  static PANEL_H = 80;
  static W = TowerDefense.COLS * TowerDefense.CELL;   // 800
  static H = TowerDefense.ROWS * TowerDefense.CELL + TowerDefense.HUD_H + TowerDefense.PANEL_H; // 600

  static TOWER_TYPES = {
    basic:  { label: 'Basic',  cost: 50,  color: '#00cec9', range: 3, damage: 8,  rate: 500,  splash: 0,   slow: 0   },
    cannon: { label: 'Cannon', cost: 100, color: '#e17055', range: 2.5, damage: 25, rate: 1200, splash: 1,   slow: 0   },
    sniper: { label: 'Sniper', cost: 80,  color: '#a29bfe', range: 5, damage: 35, rate: 1800, splash: 0,   slow: 0   },
    freeze: { label: 'Freeze', cost: 75,  color: '#81ecec', range: 2.5, damage: 4,  rate: 800,  splash: 0.8, slow: 0.5 },
  };

  /* ────────────────── path definition (grid coords) ────────────────── */
  static PATH = [
    [0,2],[1,2],[2,2],[3,2],[4,2],[5,2],[6,2],[7,2],
    [7,3],[7,4],[7,5],
    [6,5],[5,5],[4,5],[3,5],[2,5],
    [2,6],[2,7],[2,8],
    [3,8],[4,8],[5,8],[6,8],[7,8],[8,8],[9,8],[10,8],
    [10,7],[10,6],[10,5],[10,4],[10,3],[10,2],[10,1],
    [11,1],[12,1],[13,1],[14,1],[15,1],
    [15,2],[15,3],[15,4],[15,5],
    [14,5],[13,5],[12,5],
    [12,6],[12,7],[12,8],[12,9],[12,10],
    [13,10],[14,10],[15,10],[16,10],[17,10],
    [17,9],[17,8],[17,7],[17,6],[17,5],[17,4],[17,3],
    [18,3],[19,3],
  ];

  /* ──────────────────────── constructor ──────────────────────── */
  constructor(container) {
    this._container = container;
    this._listeners = [];
    this._intervals = [];
    this._rafs = [];
    this._running = false;
    this._paused = false;
    this._gameOver = false;

    this._buildDOM();
    this._initState();
    this._draw();
  }

  /* ──────────────────────── public API ──────────────────────── */
  start()   { this._initState(); this._gameOver = false; this._hideGameOver(); this._updateHUD(); this._running = true; this._paused = false; this._loop(); }
  pause()   { this._paused = true; }
  resume()  { if (!this._gameOver) { this._paused = false; this._loop(); } }
  getScore(){ return this._score; }

  destroy() {
    this._running = false;
    this._paused = true;
    this._rafs.forEach(id => cancelAnimationFrame(id));
    this._intervals.forEach(id => clearInterval(id));
    this._listeners.forEach(([el, ev, fn]) => el.removeEventListener(ev, fn));
    this._rafs = [];
    this._intervals = [];
    this._listeners = [];
    if (this._wrapper && this._wrapper.parentNode) this._wrapper.parentNode.removeChild(this._wrapper);
  }

  /* ──────────────────────── DOM build ──────────────────────── */
  _buildDOM() {
    const C = TowerDefense;

    /* wrapper */
    const w = this._wrapper = document.createElement('div');
    w.className = 'tower-defense-wrapper';
    w.style.width  = C.W + 'px';
    w.style.height = C.H + 'px';

    /* canvas */
    const cvs = this._canvas = document.createElement('canvas');
    cvs.className = 'game-canvas';
    cvs.width  = C.W;
    cvs.height = C.H;
    w.appendChild(cvs);
    this._ctx = cvs.getContext('2d');

    /* HUD */
    const hud = this._hud = document.createElement('div');
    hud.className = 'tower-defense-hud';
    hud.innerHTML = `
      <span class="tower-defense-hud-item tower-defense-hud-gold"><span class="icon">💰</span><span class="val" data-hud="gold">200</span></span>
      <span class="tower-defense-hud-item tower-defense-hud-lives"><span class="icon">❤️</span><span class="val" data-hud="lives">20</span></span>
      <span class="tower-defense-hud-item tower-defense-hud-wave"><span class="icon">🌊</span><span class="val" data-hud="wave">0</span></span>
      <span class="tower-defense-hud-item tower-defense-hud-score"><span class="icon">⭐</span><span class="val" data-hud="score">0</span></span>
    `;
    const btn = this._startBtn = document.createElement('button');
    btn.className = 'tower-defense-start-btn';
    btn.textContent = 'Start Wave';
    hud.appendChild(btn);
    w.appendChild(hud);

    /* tower selection panel */
    const panel = this._panel = document.createElement('div');
    panel.className = 'tower-defense-panel';
    for (const [key, t] of Object.entries(C.TOWER_TYPES)) {
      const b = document.createElement('button');
      b.className = 'tower-defense-tower-btn';
      b.dataset.tower = key;
      b.innerHTML = `<span class="label" style="color:${t.color}">${t.label}</span><span class="cost">💰 ${t.cost}</span>`;
      panel.appendChild(b);
    }
    w.appendChild(panel);

    this._container.appendChild(w);

    /* events */
    this._on(btn, 'click', () => this._sendWave());
    this._on(panel, 'click', (e) => {
      const tb = e.target.closest('.tower-defense-tower-btn');
      if (!tb) return;
      this._selectTower(tb.dataset.tower);
    });
    this._on(cvs, 'click', (e) => this._onCanvasClick(e));
    this._on(cvs, 'mousemove', (e) => this._onCanvasMove(e));
  }

  _on(el, ev, fn) { el.addEventListener(ev, fn); this._listeners.push([el, ev, fn]); }

  /* ──────────────────────── state init ──────────────────────── */
  _initState() {
    this._gold = 200;
    this._lives = 20;
    this._wave = 0;
    this._score = 0;
    this._enemies = [];
    this._towers = [];
    this._projectiles = [];
    this._particles = [];
    this._selectedTower = null;
    this._waveActive = false;
    this._spawnQueue = [];
    this._hoverCell = null;
    this._lastTime = 0;

    /* build occupancy grid */
    const C = TowerDefense;
    this._grid = Array.from({ length: C.ROWS }, () => Array(C.COLS).fill(0));
    /* mark path cells as 1 */
    C.PATH.forEach(([c, r]) => { if (r < C.ROWS && c < C.COLS) this._grid[r][c] = 1; });

    if (this._startBtn) { this._startBtn.disabled = false; this._startBtn.textContent = 'Start Wave'; }
  }

  /* ──────────────────────── HUD ──────────────────────── */
  _updateHUD() {
    const q = (k) => this._hud.querySelector(`[data-hud="${k}"]`);
    q('gold').textContent  = this._gold;
    q('lives').textContent = this._lives;
    q('wave').textContent  = this._wave;
    q('score').textContent = this._score;

    /* update panel affordability */
    const C = TowerDefense;
    this._panel.querySelectorAll('.tower-defense-tower-btn').forEach(b => {
      const t = C.TOWER_TYPES[b.dataset.tower];
      b.classList.toggle('disabled', this._gold < t.cost);
    });
  }

  /* ──────────────────────── tower selection ──────────────────────── */
  _selectTower(key) {
    if (this._selectedTower === key) { this._selectedTower = null; }
    else { this._selectedTower = key; }
    this._panel.querySelectorAll('.tower-defense-tower-btn').forEach(b => {
      b.classList.toggle('selected', b.dataset.tower === this._selectedTower);
    });
  }

  /* ──────────────────────── canvas interactions ──────────────────────── */
  _canvasToGrid(e) {
    const C = TowerDefense;
    const rect = this._canvas.getBoundingClientRect();
    const sx = C.W / rect.width;
    const sy = C.H / rect.height;
    const px = (e.clientX - rect.left) * sx;
    const py = (e.clientY - rect.top)  * sy;
    const col = Math.floor(px / C.CELL);
    const row = Math.floor((py - C.HUD_H) / C.CELL);
    return { col, row, px, py };
  }

  _onCanvasMove(e) {
    const { col, row } = this._canvasToGrid(e);
    const C = TowerDefense;
    if (row >= 0 && row < C.ROWS && col >= 0 && col < C.COLS) {
      this._hoverCell = { col, row };
    } else {
      this._hoverCell = null;
    }
  }

  _onCanvasClick(e) {
    if (this._gameOver) return;
    const { col, row } = this._canvasToGrid(e);
    const C = TowerDefense;
    if (row < 0 || row >= C.ROWS || col < 0 || col >= C.COLS) return;
    if (!this._selectedTower) return;
    const tType = C.TOWER_TYPES[this._selectedTower];
    if (this._gold < tType.cost) return;
    if (this._grid[row][col] !== 0) return; // occupied or path

    this._gold -= tType.cost;
    this._grid[row][col] = 2; // tower placed
    this._towers.push({
      col, row,
      type: this._selectedTower,
      ...tType,
      lastShot: 0,
    });
    this._updateHUD();
  }

  /* ──────────────────────── waves ──────────────────────── */
  _sendWave() {
    if (this._waveActive || this._gameOver) return;
    this._wave++;
    this._waveActive = true;
    this._startBtn.disabled = true;
    this._startBtn.textContent = 'Wave in progress…';

    const count = 6 + this._wave * 2;
    const hpBase = 30 + this._wave * 20;
    const speedBase = 1 + Math.min(this._wave * 0.08, 1.2);
    this._spawnQueue = [];
    for (let i = 0; i < count; i++) {
      const isBoss = (i === count - 1 && this._wave % 3 === 0);
      this._spawnQueue.push({
        hp: isBoss ? hpBase * 3 : hpBase,
        maxHp: isBoss ? hpBase * 3 : hpBase,
        speed: isBoss ? speedBase * 0.6 : speedBase,
        reward: isBoss ? 30 : 10,
        isBoss,
        delay: i * 600,
      });
    }
    this._waveStartTime = performance.now();
    this._updateHUD();
  }

  /* ──────────────────────── game loop ──────────────────────── */
  _loop() {
    if (!this._running || this._paused) return;
    const raf = requestAnimationFrame((t) => {
      const dt = this._lastTime ? (t - this._lastTime) : 16;
      this._lastTime = t;
      this._update(dt, t);
      this._draw();
      this._loop();
    });
    this._rafs.push(raf);
  }

  /* ──────────────────────── update ──────────────────────── */
  _update(dt, now) {
    const C = TowerDefense;

    /* spawn enemies from queue */
    if (this._spawnQueue.length) {
      const elapsed = now - this._waveStartTime;
      while (this._spawnQueue.length && this._spawnQueue[0].delay <= elapsed) {
        const e = this._spawnQueue.shift();
        const start = C.PATH[0];
        this._enemies.push({
          x: start[0] * C.CELL + C.CELL / 2,
          y: start[1] * C.CELL + C.CELL / 2 + C.HUD_H,
          pathIdx: 0,
          hp: e.hp,
          maxHp: e.maxHp,
          speed: e.speed,
          reward: e.reward,
          isBoss: e.isBoss,
          slowTimer: 0,
          slowFactor: 1,
        });
      }
    }

    /* move enemies */
    for (let i = this._enemies.length - 1; i >= 0; i--) {
      const en = this._enemies[i];

      /* slow decay */
      if (en.slowTimer > 0) {
        en.slowTimer -= dt;
        if (en.slowTimer <= 0) en.slowFactor = 1;
      }

      const nextIdx = en.pathIdx + 1;
      if (nextIdx >= C.PATH.length) {
        this._enemies.splice(i, 1);
        this._lives--;
        if (this._lives <= 0) { this._lives = 0; this._endGame(); }
        this._updateHUD();
        continue;
      }
      const tx = C.PATH[nextIdx][0] * C.CELL + C.CELL / 2;
      const ty = C.PATH[nextIdx][1] * C.CELL + C.CELL / 2 + C.HUD_H;
      const dx = tx - en.x;
      const dy = ty - en.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const move = en.speed * en.slowFactor * (dt / 16);
      if (dist <= move) {
        en.x = tx; en.y = ty; en.pathIdx = nextIdx;
      } else {
        en.x += (dx / dist) * move;
        en.y += (dy / dist) * move;
      }
    }

    /* tower shooting */
    for (const tw of this._towers) {
      if (now - tw.lastShot < tw.rate) continue;
      const cx = tw.col * C.CELL + C.CELL / 2;
      const cy = tw.row * C.CELL + C.CELL / 2 + C.HUD_H;
      const rangePx = tw.range * C.CELL;
      let target = null;
      let bestProgress = -1;
      for (const en of this._enemies) {
        const d = Math.hypot(en.x - cx, en.y - cy);
        if (d <= rangePx && en.pathIdx > bestProgress) {
          bestProgress = en.pathIdx;
          target = en;
        }
      }
      if (target) {
        tw.lastShot = now;
        this._projectiles.push({
          x: cx, y: cy,
          tx: target.x, ty: target.y,
          target,
          damage: tw.damage,
          splash: tw.splash,
          slow: tw.slow,
          color: tw.color,
          speed: 6,
        });
      }
    }

    /* move projectiles */
    for (let i = this._projectiles.length - 1; i >= 0; i--) {
      const p = this._projectiles[i];
      /* update target position */
      if (this._enemies.includes(p.target)) {
        p.tx = p.target.x;
        p.ty = p.target.y;
      }
      const dx = p.tx - p.x;
      const dy = p.ty - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= p.speed * 2) {
        /* hit */
        this._projectiles.splice(i, 1);
        this._hitEnemy(p);
      } else {
        p.x += (dx / dist) * p.speed * (dt / 16);
        p.y += (dy / dist) * p.speed * (dt / 16);
      }
    }

    /* particles */
    for (let i = this._particles.length - 1; i >= 0; i--) {
      const pt = this._particles[i];
      pt.life -= dt;
      pt.x += pt.vx * (dt / 16);
      pt.y += pt.vy * (dt / 16);
      pt.alpha = Math.max(0, pt.life / pt.maxLife);
      if (pt.life <= 0) this._particles.splice(i, 1);
    }

    /* check wave done */
    if (this._waveActive && this._spawnQueue.length === 0 && this._enemies.length === 0) {
      this._waveActive = false;
      this._gold += 20 + this._wave * 5; // wave clear bonus
      this._startBtn.disabled = false;
      this._startBtn.textContent = 'Start Wave';
      this._updateHUD();
    }
  }

  _hitEnemy(p) {
    const C = TowerDefense;
    if (p.splash > 0) {
      const splashPx = p.splash * C.CELL;
      for (const en of this._enemies) {
        const d = Math.hypot(en.x - p.tx, en.y - p.ty);
        if (d <= splashPx) {
          this._damageEnemy(en, p.damage * (1 - d / splashPx * 0.5), p.slow);
        }
      }
      this._spawnExplosion(p.tx, p.ty, p.color, 12);
    } else {
      if (this._enemies.includes(p.target)) {
        this._damageEnemy(p.target, p.damage, p.slow);
      }
      this._spawnExplosion(p.tx, p.ty, p.color, 5);
    }
  }

  _damageEnemy(en, dmg, slow) {
    en.hp -= dmg;
    if (slow > 0) {
      en.slowFactor = 1 - slow;
      en.slowTimer = 1500;
    }
    if (en.hp <= 0) {
      this._score += en.reward;
      this._gold += en.reward;
      this._spawnExplosion(en.x, en.y, '#ffeaa7', 10);
      const idx = this._enemies.indexOf(en);
      if (idx !== -1) this._enemies.splice(idx, 1);
      this._updateHUD();
    }
  }

  _spawnExplosion(x, y, color, count) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.5 + Math.random() * 2;
      this._particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 300 + Math.random() * 300,
        maxLife: 600,
        alpha: 1,
        color,
        size: 2 + Math.random() * 3,
      });
    }
  }

  /* ──────────────────────── drawing ──────────────────────── */
  _draw() {
    const C = TowerDefense;
    const ctx = this._ctx;
    ctx.clearRect(0, 0, C.W, C.H);

    /* background */
    ctx.fillStyle = '#2d3436';
    ctx.fillRect(0, 0, C.W, C.H);

    const offY = C.HUD_H;

    /* grid */
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    for (let r = 0; r <= C.ROWS; r++) {
      ctx.beginPath(); ctx.moveTo(0, r * C.CELL + offY); ctx.lineTo(C.W, r * C.CELL + offY); ctx.stroke();
    }
    for (let c = 0; c <= C.COLS; c++) {
      ctx.beginPath(); ctx.moveTo(c * C.CELL, offY); ctx.lineTo(c * C.CELL, C.ROWS * C.CELL + offY); ctx.stroke();
    }

    /* path */
    ctx.fillStyle = '#636e72';
    for (const [c, r] of C.PATH) {
      ctx.fillRect(c * C.CELL + 1, r * C.CELL + offY + 1, C.CELL - 2, C.CELL - 2);
    }

    /* path start & end markers */
    const start = C.PATH[0];
    const end = C.PATH[C.PATH.length - 1];
    ctx.fillStyle = '#55efc4';
    ctx.fillRect(start[0] * C.CELL + 4, start[1] * C.CELL + offY + 4, C.CELL - 8, C.CELL - 8);
    ctx.fillStyle = '#ff7675';
    ctx.fillRect(end[0] * C.CELL + 4, end[1] * C.CELL + offY + 4, C.CELL - 8, C.CELL - 8);

    /* towers */
    for (const tw of this._towers) {
      const tx = tw.col * C.CELL;
      const ty = tw.row * C.CELL + offY;
      ctx.fillStyle = tw.color;
      ctx.beginPath();
      ctx.arc(tx + C.CELL / 2, ty + C.CELL / 2, C.CELL / 2 - 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.beginPath();
      ctx.arc(tx + C.CELL / 2, ty + C.CELL / 2, C.CELL / 2 - 8, 0, Math.PI * 2);
      ctx.fill();
    }

    /* hover preview */
    if (this._hoverCell && this._selectedTower) {
      const { col, row } = this._hoverCell;
      if (row >= 0 && row < C.ROWS && col >= 0 && col < C.COLS) {
        const canPlace = this._grid[row][col] === 0;
        const tType = C.TOWER_TYPES[this._selectedTower];
        ctx.fillStyle = canPlace ? 'rgba(0,206,201,0.25)' : 'rgba(255,118,117,0.25)';
        ctx.fillRect(col * C.CELL, row * C.CELL + offY, C.CELL, C.CELL);
        /* range circle */
        if (canPlace) {
          ctx.strokeStyle = 'rgba(255,255,255,0.15)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(col * C.CELL + C.CELL / 2, row * C.CELL + offY + C.CELL / 2, tType.range * C.CELL, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
    }

    /* enemies */
    for (const en of this._enemies) {
      const radius = en.isBoss ? 14 : 9;
      /* body */
      ctx.fillStyle = en.isBoss ? '#d63031' : '#e17055';
      if (en.slowFactor < 1) ctx.fillStyle = '#74b9ff';
      ctx.beginPath();
      ctx.arc(en.x, en.y, radius, 0, Math.PI * 2);
      ctx.fill();
      /* hp bar */
      const bw = radius * 2 + 4;
      const bx = en.x - bw / 2;
      const by = en.y - radius - 6;
      ctx.fillStyle = '#2d3436';
      ctx.fillRect(bx, by, bw, 4);
      ctx.fillStyle = '#00b894';
      ctx.fillRect(bx, by, bw * (en.hp / en.maxHp), 4);
    }

    /* projectiles */
    for (const p of this._projectiles) {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    /* particles */
    for (const pt of this._particles) {
      ctx.globalAlpha = pt.alpha;
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    /* panel background on canvas */
    ctx.fillStyle = 'rgba(0,0,0,0.01)';
    ctx.fillRect(0, C.H - C.PANEL_H, C.W, C.PANEL_H);
  }

  /* ──────────────────────── game over ──────────────────────── */
  _endGame() {
    this._gameOver = true;
    this._running = false;
    this._updateHUD();

    const overlay = document.createElement('div');
    overlay.className = 'tower-defense-gameover';
    overlay.innerHTML = `<h2>Game Over</h2><p>Wave ${this._wave} — Score: ${this._score}</p>`;
    const btn = document.createElement('button');
    btn.textContent = 'Play Again';
    this._on(btn, 'click', () => { this.start(); });
    overlay.appendChild(btn);
    this._gameOverOverlay = overlay;
    this._wrapper.appendChild(overlay);
  }

  _hideGameOver() {
    if (this._gameOverOverlay && this._gameOverOverlay.parentNode) {
      this._gameOverOverlay.parentNode.removeChild(this._gameOverOverlay);
      this._gameOverOverlay = null;
    }
  }
}

window.TowerDefense = TowerDefense;
