/**
 * Breakout Game
 * A classic brick-breaking arcade game
 */
class Breakout {
  constructor(container) {
    this.container = container;
    this.canvas = null;
    this.ctx = null;
    this.animationFrameId = null;
    this.lastFrameTime = 0;

    // Game state
    this.state = 'idle'; // idle, playing, paused, gameOver
    this.score = 0;
    this.lives = 3;
    this.level = 1;
    this.bricks = [];

    // Game physics
    this.ballSpeedMultiplier = 1;
    this.baseSpeed = 5;

    // Paddle
    this.paddle = {
      x: 0,
      y: 0,
      width: 80,
      height: 12,
      speed: 7,
    };

    // Ball
    this.ball = {
      x: 0,
      y: 0,
      radius: 6,
      vx: 0,
      vy: 0,
    };

    // Input tracking
    this.keys = {};
    this.mouseX = 0;
    this.touchX = 0;

    // Bind methods
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleTouchStart = this.handleTouchStart.bind(this);
    this.handleTouchMove = this.handleTouchMove.bind(this);
    this.gameLoop = this.gameLoop.bind(this);
  }

  init() {
    // Create canvas
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'breakout-game-canvas game-canvas';
    this.canvas.width = 600;
    this.canvas.height = 600;
    this.container.appendChild(this.canvas);

    this.ctx = this.canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = true;

    // Create game over overlay
    this.createGameOverOverlay();

    // Initialize positions
    this.paddle.x = this.canvas.width / 2 - this.paddle.width / 2;
    this.paddle.y = this.canvas.height - 30;

    // Add event listeners
    document.addEventListener('keydown', this.handleKeyDown);
    document.addEventListener('keyup', this.handleKeyUp);
    this.canvas.addEventListener('mousemove', this.handleMouseMove);
    this.canvas.addEventListener('touchstart', this.handleTouchStart);
    this.canvas.addEventListener('touchmove', this.handleTouchMove);

    // Initialize game
    this.createBricks();
    this.resetBall();
  }

  createGameOverOverlay() {
    this.overlay = document.createElement('div');
    this.overlay.className = 'breakout-game-over-overlay';
    this.overlay.innerHTML = `
      <div class="breakout-game-over-content">
        <h2 class="breakout-game-over-title">Game Over</h2>
        <div class="breakout-game-over-score">Final Score: <span id="breakout-final-score">0</span></div>
        <button class="breakout-play-again-btn">Play Again</button>
      </div>
    `;
    this.overlay.style.display = 'none';
    this.container.appendChild(this.overlay);

    this.overlay
      .querySelector('.breakout-play-again-btn')
      .addEventListener('click', () => this.start());
  }

  createBricks() {
    this.bricks = [];

    // Brick configuration: multiple rows with different colors and point values
    const brickConfigs = [
      { color: '#FF6B6B', points: 70 }, // Red
      { color: '#FF6B6B', points: 70 }, // Red
      { color: '#FFA726', points: 60 }, // Orange
      { color: '#FFA726', points: 60 }, // Orange
      { color: '#FFD93D', points: 50 }, // Yellow
      { color: '#FFD93D', points: 50 }, // Yellow
      { color: '#6BCB77', points: 40 }, // Green
    ];

    const brickWidth = 75;
    const brickHeight = 14;
    const brickPaddingX = 8;
    const brickPaddingY = 6;
    const offsetX = 8;
    const offsetY = 20;

    // Calculate how many bricks fit per row
    const bricksPerRow = Math.floor(
      (this.canvas.width - offsetX * 2) / (brickWidth + brickPaddingX)
    );

    brickConfigs.forEach((config, rowIndex) => {
      for (let col = 0; col < bricksPerRow; col++) {
        const brick = {
          x: offsetX + col * (brickWidth + brickPaddingX),
          y: offsetY + rowIndex * (brickHeight + brickPaddingY),
          width: brickWidth,
          height: brickHeight,
          color: config.color,
          points: config.points,
          visible: true,
        };
        this.bricks.push(brick);
      }
    });
  }

  resetBall() {
    this.ball.x = this.paddle.x + this.paddle.width / 2;
    this.ball.y = this.paddle.y - this.ball.radius - 10;

    // Random initial direction
    const angle = (Math.random() - 0.5) * Math.PI * 0.6 + Math.PI / 2;
    const speed = this.baseSpeed * this.ballSpeedMultiplier;
    this.ball.vx = Math.cos(angle) * speed;
    this.ball.vy = -Math.abs(Math.sin(angle) * speed);
  }

  start() {
    this.score = 0;
    this.lives = 3;
    this.level = 1;
    this.ballSpeedMultiplier = 1;
    this.createBricks();
    this.resetBall();
    this.state = 'playing';
    this.overlay.style.display = 'none';

    // Start animation loop
    this.lastFrameTime = Date.now();
    this.animationFrameId = requestAnimationFrame(this.gameLoop);
  }

  pause() {
    if (this.state === 'playing') {
      this.state = 'paused';
    }
  }

  resume() {
    if (this.state === 'paused') {
      this.state = 'playing';
      this.lastFrameTime = Date.now();
      this.animationFrameId = requestAnimationFrame(this.gameLoop);
    }
  }

  destroy() {
    // Cancel animation frame
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }

    // Remove event listeners
    document.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('keyup', this.handleKeyUp);
    if (this.canvas) {
      this.canvas.removeEventListener('mousemove', this.handleMouseMove);
      this.canvas.removeEventListener('touchstart', this.handleTouchStart);
      this.canvas.removeEventListener('touchmove', this.handleTouchMove);
    }

    // Remove DOM elements
    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
    if (this.overlay && this.overlay.parentNode) {
      this.overlay.parentNode.removeChild(this.overlay);
    }

    this.canvas = null;
    this.ctx = null;
    this.state = 'idle';
  }

  getScore() {
    return this.score;
  }

  handleKeyDown(e) {
    this.keys[e.key.toLowerCase()] = true;
  }

  handleKeyUp(e) {
    this.keys[e.key.toLowerCase()] = false;
  }

  handleMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    this.mouseX = e.clientX - rect.left;
  }

  handleTouchStart(e) {
    const rect = this.canvas.getBoundingClientRect();
    this.touchX = e.touches[0].clientX - rect.left;
  }

  handleTouchMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    this.touchX = e.touches[0].clientX - rect.left;
  }

  updatePaddlePosition() {
    // Keyboard input
    if (this.keys['arrowleft'] || this.keys['a']) {
      this.paddle.x -= this.paddle.speed;
    }
    if (this.keys['arrowright'] || this.keys['d']) {
      this.paddle.x += this.paddle.speed;
    }

    // Mouse input
    if (this.mouseX > 0) {
      const targetX = this.mouseX - this.paddle.width / 2;
      const diff = targetX - this.paddle.x;
      this.paddle.x += diff * 0.2; // Smooth movement
    }

    // Touch input
    if (this.touchX > 0) {
      const targetX = this.touchX - this.paddle.width / 2;
      const diff = targetX - this.paddle.x;
      this.paddle.x += diff * 0.2; // Smooth movement
    }

    // Boundary check
    this.paddle.x = Math.max(
      0,
      Math.min(this.paddle.x, this.canvas.width - this.paddle.width)
    );
  }

  updateBall() {
    this.ball.x += this.ball.vx;
    this.ball.y += this.ball.vy;

    // Wall collisions
    if (this.ball.x - this.ball.radius <= 0) {
      this.ball.x = this.ball.radius;
      this.ball.vx = -this.ball.vx;
      this.playSoundEffect('bounce');
    }
    if (this.ball.x + this.ball.radius >= this.canvas.width) {
      this.ball.x = this.canvas.width - this.ball.radius;
      this.ball.vx = -this.ball.vx;
      this.playSoundEffect('bounce');
    }
    if (this.ball.y - this.ball.radius <= 0) {
      this.ball.y = this.ball.radius;
      this.ball.vy = -this.ball.vy;
      this.playSoundEffect('bounce');
    }

    // Check if ball fell below paddle
    if (this.ball.y - this.ball.radius > this.canvas.height) {
      this.lives--;
      if (this.lives <= 0) {
        this.endGame();
      } else {
        this.resetBall();
        this.playSoundEffect('loseLife');
      }
      return;
    }

    // Paddle collision
    this.checkPaddleCollision();

    // Brick collisions
    this.checkBrickCollisions();

    // Check for level complete
    if (this.bricks.every((brick) => !brick.visible)) {
      this.levelComplete();
    }
  }

  checkPaddleCollision() {
    const paddle = this.paddle;
    const ball = this.ball;

    if (
      ball.x + ball.radius > paddle.x &&
      ball.x - ball.radius < paddle.x + paddle.width &&
      ball.y + ball.radius > paddle.y &&
      ball.y - ball.radius < paddle.y + paddle.height
    ) {
      // Ball is colliding with paddle
      ball.y = paddle.y - ball.radius;

      // Calculate angle based on where it hits the paddle
      const hitPos = (ball.x - paddle.x) / paddle.width; // 0 to 1
      const angle = (hitPos - 0.5) * Math.PI * 0.75; // Max 67.5 degrees from center

      const speed = Math.sqrt(ball.vx ** 2 + ball.vy ** 2);
      ball.vx = Math.sin(angle) * speed;
      ball.vy = -Math.abs(Math.cos(angle) * speed);

      this.playSoundEffect('paddleHit');
    }
  }

  checkBrickCollisions() {
    for (let brick of this.bricks) {
      if (!brick.visible) continue;

      const ball = this.ball;

      if (
        ball.x + ball.radius > brick.x &&
        ball.x - ball.radius < brick.x + brick.width &&
        ball.y + ball.radius > brick.y &&
        ball.y - ball.radius < brick.y + brick.height
      ) {
        // Collision detected
        brick.visible = false;
        this.score += brick.points;

        // Determine collision side
        const overlapLeft = ball.x + ball.radius - brick.x;
        const overlapRight = brick.x + brick.width - (ball.x - ball.radius);
        const overlapTop = ball.y + ball.radius - brick.y;
        const overlapBottom = brick.y + brick.height - (ball.y - ball.radius);

        const minOverlap = Math.min(
          overlapLeft,
          overlapRight,
          overlapTop,
          overlapBottom
        );

        if (minOverlap === overlapTop || minOverlap === overlapBottom) {
          this.ball.vy = -this.ball.vy;
        } else {
          this.ball.vx = -this.ball.vx;
        }

        // Increase ball speed slightly
        const speed = Math.sqrt(this.ball.vx ** 2 + this.ball.vy ** 2);
        const increase = 1.005;
        this.ball.vx *= increase;
        this.ball.vy *= increase;

        this.playSoundEffect('brickHit');
        break; // Only check one brick per frame
      }
    }
  }

  levelComplete() {
    this.level++;
    this.ballSpeedMultiplier += 0.1;
    this.createBricks();
    this.resetBall();
    this.playSoundEffect('levelUp');
  }

  endGame() {
    this.state = 'gameOver';
    document.getElementById('breakout-final-score').textContent = this.score;
    this.overlay.style.display = 'flex';
  }

  playSoundEffect(type) {
    // Visual feedback with canvas animation instead of audio
    // This is a simple visual indicator that a sound would play
  }

  render() {
    const canvas = this.canvas;
    const ctx = this.ctx;

    // Clear canvas with gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(1, '#16213e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw bricks
    this.renderBricks();

    // Draw paddle
    this.renderPaddle();

    // Draw ball
    this.renderBall();

    // Draw HUD
    this.renderHUD();
  }

  renderBricks() {
    const ctx = this.ctx;

    for (let brick of this.bricks) {
      if (!brick.visible) continue;

      // Draw brick with rounded corners
      const borderRadius = 4;
      ctx.fillStyle = brick.color;

      ctx.beginPath();
      ctx.moveTo(brick.x + borderRadius, brick.y);
      ctx.lineTo(brick.x + brick.width - borderRadius, brick.y);
      ctx.quadraticCurveTo(
        brick.x + brick.width,
        brick.y,
        brick.x + brick.width,
        brick.y + borderRadius
      );
      ctx.lineTo(brick.x + brick.width, brick.y + brick.height - borderRadius);
      ctx.quadraticCurveTo(
        brick.x + brick.width,
        brick.y + brick.height,
        brick.x + brick.width - borderRadius,
        brick.y + brick.height
      );
      ctx.lineTo(brick.x + borderRadius, brick.y + brick.height);
      ctx.quadraticCurveTo(
        brick.x,
        brick.y + brick.height,
        brick.x,
        brick.y + brick.height - borderRadius
      );
      ctx.lineTo(brick.x, brick.y + borderRadius);
      ctx.quadraticCurveTo(brick.x, brick.y, brick.x + borderRadius, brick.y);
      ctx.closePath();
      ctx.fill();

      // Add shine/highlight
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  renderPaddle() {
    const ctx = this.ctx;
    const paddle = this.paddle;

    // Gradient paddle
    const gradient = ctx.createLinearGradient(
      paddle.x,
      paddle.y,
      paddle.x,
      paddle.y + paddle.height
    );
    gradient.addColorStop(0, '#4A90E2');
    gradient.addColorStop(1, '#2E5C8A');
    ctx.fillStyle = gradient;

    ctx.beginPath();
    ctx.moveTo(paddle.x + 6, paddle.y);
    ctx.lineTo(paddle.x + paddle.width - 6, paddle.y);
    ctx.quadraticCurveTo(
      paddle.x + paddle.width,
      paddle.y,
      paddle.x + paddle.width,
      paddle.y + 6
    );
    ctx.lineTo(paddle.x + paddle.width, paddle.y + paddle.height - 6);
    ctx.quadraticCurveTo(
      paddle.x + paddle.width,
      paddle.y + paddle.height,
      paddle.x + paddle.width - 6,
      paddle.y + paddle.height
    );
    ctx.lineTo(paddle.x + 6, paddle.y + paddle.height);
    ctx.quadraticCurveTo(
      paddle.x,
      paddle.y + paddle.height,
      paddle.x,
      paddle.y + paddle.height - 6
    );
    ctx.lineTo(paddle.x, paddle.y + 6);
    ctx.quadraticCurveTo(paddle.x, paddle.y, paddle.x + 6, paddle.y);
    ctx.closePath();
    ctx.fill();

    // Highlight
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  renderBall() {
    const ctx = this.ctx;
    const ball = this.ball;

    // Glowing effect
    const glowGradient = ctx.createRadialGradient(
      ball.x,
      ball.y,
      0,
      ball.x,
      ball.y,
      ball.radius * 2.5
    );
    glowGradient.addColorStop(0, 'rgba(255, 200, 87, 0.6)');
    glowGradient.addColorStop(1, 'rgba(255, 200, 87, 0)');
    ctx.fillStyle = glowGradient;
    ctx.fillRect(
      ball.x - ball.radius * 2.5,
      ball.y - ball.radius * 2.5,
      ball.radius * 5,
      ball.radius * 5
    );

    // Main ball
    const ballGradient = ctx.createRadialGradient(
      ball.x - 2,
      ball.y - 2,
      0,
      ball.x,
      ball.y,
      ball.radius
    );
    ballGradient.addColorStop(0, '#FFC857');
    ballGradient.addColorStop(1, '#FF9500');
    ctx.fillStyle = ballGradient;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();

    // Highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.arc(ball.x - 2, ball.y - 2, ball.radius / 2, 0, Math.PI * 2);
    ctx.fill();
  }

  renderHUD() {
    const ctx = this.ctx;

    ctx.font = 'bold 16px Arial';
    ctx.fillStyle = '#FFFFFF';

    // Score
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${this.score}`, 20, 30);

    // Lives
    ctx.textAlign = 'right';
    ctx.fillText(`Lives: ${this.lives}`, this.canvas.width - 20, 30);

    // Level
    ctx.textAlign = 'center';
    ctx.fillText(`Level: ${this.level}`, this.canvas.width / 2, 30);

    // Pause indicator
    if (this.state === 'paused') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('PAUSED', this.canvas.width / 2, this.canvas.height / 2);
    }
  }

  gameLoop() {
    const now = Date.now();
    const deltaTime = (now - this.lastFrameTime) / 1000;
    this.lastFrameTime = now;

    if (this.state === 'playing') {
      this.updatePaddlePosition();
      this.updateBall();
    }

    this.render();

    if (this.state !== 'gameOver') {
      this.animationFrameId = requestAnimationFrame(this.gameLoop);
    }
  }
}

// Export for use in HTML
window.Breakout = Breakout;
