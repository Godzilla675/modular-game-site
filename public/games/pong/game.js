class Pong {
  constructor(container) {
    this.container = container;
    this.animationId = null;
    this.gameLoop = null;
    this.state = 'idle'; // idle | playing | paused | ended
    this.boundKeyDown = this._onKeyDown.bind(this);
    this.boundKeyUp = this._onKeyUp.bind(this);

    // Game constants
    this.WIDTH = 800;
    this.HEIGHT = 480;
    this.PADDLE_WIDTH = 12;
    this.PADDLE_HEIGHT = 80;
    this.BALL_SIZE = 10;
    this.PADDLE_SPEED = 6;
    this.BALL_BASE_SPEED = 5;
    this.WIN_SCORE = 10;
    this.AI_REACTION_SPEED = 0.06;

    // Scores
    this.playerScore = 0;
    this.aiScore = 0;

    // Input state
    this.keys = {};

    this._buildDOM();
    this._initGameObjects();
    this._showOverlay('PONG', 'Classic arcade pong', 'START');
  }

  _buildDOM() {
    this.wrapper = document.createElement('div');
    this.wrapper.classList.add('pong-container');
    this.wrapper.style.position = 'relative';

    this.canvas = document.createElement('canvas');
    this.canvas.classList.add('pong-canvas', 'game-canvas');
    this.canvas.width = this.WIDTH;
    this.canvas.height = this.HEIGHT;
    this.ctx = this.canvas.getContext('2d');

    this.wrapper.appendChild(this.canvas);
    this.container.appendChild(this.wrapper);
  }

  _initGameObjects() {
    this.player = {
      x: 20,
      y: this.HEIGHT / 2 - this.PADDLE_HEIGHT / 2,
      w: this.PADDLE_WIDTH,
      h: this.PADDLE_HEIGHT,
      dy: 0
    };

    this.ai = {
      x: this.WIDTH - 20 - this.PADDLE_WIDTH,
      y: this.HEIGHT / 2 - this.PADDLE_HEIGHT / 2,
      w: this.PADDLE_WIDTH,
      h: this.PADDLE_HEIGHT,
      targetY: this.HEIGHT / 2
    };

    this._resetBall();
    this.rallyCount = 0;
  }

  _resetBall(direction) {
    this.ball = {
      x: this.WIDTH / 2,
      y: this.HEIGHT / 2,
      size: this.BALL_SIZE,
      speed: this.BALL_BASE_SPEED,
      dx: (direction || (Math.random() > 0.5 ? 1 : -1)) * this.BALL_BASE_SPEED,
      dy: (Math.random() * 2 - 1) * this.BALL_BASE_SPEED * 0.5
    };
    this.rallyCount = 0;
  }

  _showOverlay(title, message, buttonText) {
    this._removeOverlay();

    this.overlay = document.createElement('div');
    this.overlay.classList.add('pong-overlay');

    const titleEl = document.createElement('div');
    titleEl.classList.add('pong-title');
    titleEl.textContent = title;

    const msgEl = document.createElement('div');
    msgEl.classList.add('pong-message');
    msgEl.textContent = message;

    const btn = document.createElement('button');
    btn.classList.add('pong-btn');
    btn.textContent = buttonText;
    this.boundOverlayClick = () => this.start();
    btn.addEventListener('click', this.boundOverlayClick);
    this.overlayBtn = btn;

    this.overlay.appendChild(titleEl);
    this.overlay.appendChild(msgEl);
    this.overlay.appendChild(btn);
    this.wrapper.appendChild(this.overlay);
  }

  _removeOverlay() {
    if (this.overlay) {
      if (this.overlayBtn && this.boundOverlayClick) {
        this.overlayBtn.removeEventListener('click', this.boundOverlayClick);
      }
      this.overlay.remove();
      this.overlay = null;
      this.overlayBtn = null;
      this.boundOverlayClick = null;
    }
  }

  start() {
    this._removeOverlay();
    this.playerScore = 0;
    this.aiScore = 0;
    this._initGameObjects();
    this.keys = {};
    this.state = 'playing';

    document.removeEventListener('keydown', this.boundKeyDown);
    document.removeEventListener('keyup', this.boundKeyUp);
    document.addEventListener('keydown', this.boundKeyDown);
    document.addEventListener('keyup', this.boundKeyUp);

    if (this.animationId) cancelAnimationFrame(this.animationId);
    this._tick();
  }

  pause() {
    if (this.state === 'playing') {
      this.state = 'paused';
      if (this.animationId) {
        cancelAnimationFrame(this.animationId);
        this.animationId = null;
      }
    }
  }

  resume() {
    if (this.state === 'paused') {
      this.state = 'playing';
      this._tick();
    }
  }

  destroy() {
    this.state = 'idle';
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    document.removeEventListener('keydown', this.boundKeyDown);
    document.removeEventListener('keyup', this.boundKeyUp);
    this._removeOverlay();
    if (this.wrapper && this.wrapper.parentNode) {
      this.wrapper.parentNode.removeChild(this.wrapper);
    }
    this.canvas = null;
    this.ctx = null;
    this.wrapper = null;
  }

  getScore() {
    return this.playerScore;
  }

  // --- Input ---

  _onKeyDown(e) {
    const key = e.key;
    if (['ArrowUp', 'ArrowDown', 'w', 's', 'W', 'S'].includes(key)) {
      e.preventDefault();
      this.keys[key] = true;
    }
  }

  _onKeyUp(e) {
    const key = e.key;
    if (['ArrowUp', 'ArrowDown', 'w', 's', 'W', 'S'].includes(key)) {
      this.keys[key] = false;
    }
  }

  // --- Game Loop ---

  _tick() {
    if (this.state !== 'playing') return;
    this._update();
    this._draw();
    this.animationId = requestAnimationFrame(() => this._tick());
  }

  _update() {
    // Player movement
    const up = this.keys['ArrowUp'] || this.keys['w'] || this.keys['W'];
    const down = this.keys['ArrowDown'] || this.keys['s'] || this.keys['S'];
    if (up) this.player.y -= this.PADDLE_SPEED;
    if (down) this.player.y += this.PADDLE_SPEED;
    this.player.y = Math.max(0, Math.min(this.HEIGHT - this.player.h, this.player.y));

    // AI movement — imperfect tracking with slight delay and error
    this._updateAI();

    // Ball movement
    this.ball.x += this.ball.dx;
    this.ball.y += this.ball.dy;

    // Top / bottom wall bounce
    if (this.ball.y - this.ball.size / 2 <= 0) {
      this.ball.y = this.ball.size / 2;
      this.ball.dy = Math.abs(this.ball.dy);
    }
    if (this.ball.y + this.ball.size / 2 >= this.HEIGHT) {
      this.ball.y = this.HEIGHT - this.ball.size / 2;
      this.ball.dy = -Math.abs(this.ball.dy);
    }

    // Paddle collisions
    this._checkPaddleCollision(this.player);
    this._checkPaddleCollision(this.ai);

    // Scoring
    if (this.ball.x < 0) {
      this.aiScore++;
      this._onScore();
    } else if (this.ball.x > this.WIDTH) {
      this.playerScore++;
      this._onScore();
    }
  }

  _updateAI() {
    const ballCenter = this.ball.y;
    const paddleCenter = this.ai.y + this.ai.h / 2;

    // Add imperfection: AI reacts slowly and has a dead zone
    const diff = ballCenter - paddleCenter;
    const deadZone = 15;
    const reactionSpeed = this.AI_REACTION_SPEED + (this.aiScore * 0.004); // gets slightly better when behind

    if (this.ball.dx > 0) {
      // Ball coming toward AI — track it
      if (Math.abs(diff) > deadZone) {
        this.ai.targetY = this.ai.y + diff * reactionSpeed;
      }
    } else {
      // Ball going away — drift toward center
      const center = this.HEIGHT / 2 - this.ai.h / 2;
      this.ai.targetY += (center - this.ai.targetY) * 0.02;
    }

    this.ai.y += (this.ai.targetY - this.ai.y) * 0.12;
    this.ai.y = Math.max(0, Math.min(this.HEIGHT - this.ai.h, this.ai.y));
  }

  _checkPaddleCollision(paddle) {
    const bx = this.ball.x;
    const by = this.ball.y;
    const r = this.ball.size / 2;

    const px = paddle.x;
    const py = paddle.y;
    const pw = paddle.w;
    const ph = paddle.h;

    if (
      bx + r > px &&
      bx - r < px + pw &&
      by + r > py &&
      by - r < py + ph
    ) {
      this.rallyCount++;

      // Determine bounce direction based on which paddle
      if (paddle === this.player) {
        this.ball.x = px + pw + r;
        this.ball.dx = Math.abs(this.ball.dx);
      } else {
        this.ball.x = px - r;
        this.ball.dx = -Math.abs(this.ball.dx);
      }

      // Angle based on where ball hits the paddle
      const hitPos = (by - (py + ph / 2)) / (ph / 2); // -1 to 1
      const maxAngle = Math.PI / 4;
      const angle = hitPos * maxAngle;

      // Speed increases slightly each rally
      const speedIncrease = 1 + this.rallyCount * 0.02;
      const newSpeed = Math.min(this.BALL_BASE_SPEED * speedIncrease, 14);

      this.ball.dx = (this.ball.dx > 0 ? 1 : -1) * newSpeed * Math.cos(angle);
      this.ball.dy = newSpeed * Math.sin(angle);
    }
  }

  _onScore() {
    if (this.playerScore >= this.WIN_SCORE) {
      this._endGame('YOU WIN!');
    } else if (this.aiScore >= this.WIN_SCORE) {
      this._endGame('AI WINS');
    } else {
      // Serve toward the loser
      const dir = this.ball.x < 0 ? -1 : 1;
      this._resetBall(dir);
    }
  }

  _endGame(msg) {
    this.state = 'ended';
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    document.removeEventListener('keydown', this.boundKeyDown);
    document.removeEventListener('keyup', this.boundKeyUp);
    this._draw();
    this._showOverlay(msg, `${this.playerScore} — ${this.aiScore}`, 'PLAY AGAIN');
  }

  // --- Rendering ---

  _draw() {
    const ctx = this.ctx;
    if (!ctx) return;

    // Background
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, this.WIDTH, this.HEIGHT);

    // Center dashed line
    ctx.setLineDash([10, 10]);
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.2)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(this.WIDTH / 2, 0);
    ctx.lineTo(this.WIDTH / 2, this.HEIGHT);
    ctx.stroke();
    ctx.setLineDash([]);

    // Scores
    ctx.fillStyle = 'rgba(0, 255, 255, 0.3)';
    ctx.font = '64px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(this.playerScore, this.WIDTH / 4, 70);
    ctx.fillText(this.aiScore, (this.WIDTH / 4) * 3, 70);

    // Paddles — neon glow effect
    this._drawPaddle(this.player, '#0ff');
    this._drawPaddle(this.ai, '#f0f');

    // Ball
    this._drawBall();
  }

  _drawPaddle(paddle, color) {
    const ctx = this.ctx;
    ctx.shadowColor = color;
    ctx.shadowBlur = 15;
    ctx.fillStyle = color;
    ctx.fillRect(paddle.x, paddle.y, paddle.w, paddle.h);
    ctx.shadowBlur = 0;
  }

  _drawBall() {
    const ctx = this.ctx;
    ctx.shadowColor = '#fff';
    ctx.shadowBlur = 20;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(this.ball.x, this.ball.y, this.ball.size / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }
}

window.Pong = Pong;
