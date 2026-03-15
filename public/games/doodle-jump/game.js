class DoodleJump {
  constructor(container) {
    this.container = container;
    this.canvas = null;
    this.ctx = null;
    this.gameRunning = false;
    this.gamePaused = false;
    this.gameOver = false;

    // Game state
    this.score = 0;
    this.maxHeightReached = 0;
    this.cameraY = 0;

    // Player
    this.player = {
      x: 200,
      y: 500,
      width: 20,
      height: 24,
      velocityY: 0,
      velocityX: 0,
      direction: 1, // 1 = right, -1 = left
      onPlatform: false,
      bouncing: false,
    };

    // Input
    this.keys = {};
    this.touchControls = { left: false, right: false };

    // Game constants
    this.gravity = 0.4;
    this.jumpPower = 12;
    this.maxVelocityX = 8;
    this.playerAcceleration = 0.6;
    this.maxScore = 0;

    // Platforms and entities
    this.platforms = [];
    this.enemies = [];
    this.particles = [];
    this.powerUps = [];

    // Animation frame
    this.animationFrameId = null;
    this.lastFrameTime = 0;
    this.deltaTime = 0;

    // Initialization
    this.initDOM();
    this.setupEventListeners();
  }

  initDOM() {
    // Create wrapper
    this.wrapper = document.createElement('div');
    this.wrapper.className = 'doodle-jump-game-wrapper';

    // Create canvas
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'doodle-jump-canvas game-canvas';
    this.canvas.width = 400;
    this.canvas.height = 600;
    this.ctx = this.canvas.getContext('2d');

    // Create HUD
    this.hud = document.createElement('div');
    this.hud.className = 'doodle-jump-hud';
    this.scoreDisplay = document.createElement('div');
    this.scoreDisplay.className = 'doodle-jump-score-display';
    this.hud.appendChild(this.scoreDisplay);

    // Create game over overlay
    this.gameOverOverlay = document.createElement('div');
    this.gameOverOverlay.className = 'doodle-jump-game-over-overlay';
    this.gameOverOverlay.innerHTML = `
      <div class="doodle-jump-game-over-content">
        <h2 class="doodle-jump-game-over-title">Game Over!</h2>
        <div class="doodle-jump-score-label">Your Height</div>
        <div class="doodle-jump-score-value" id="final-score">0</div>
        <button class="doodle-jump-play-again-btn">Play Again</button>
      </div>
    `;

    // Create mobile controls (hidden by default)
    this.mobileControls = document.createElement('div');
    this.mobileControls.className = 'doodle-jump-mobile-controls';
    this.mobileControls.style.display = 'none';
    this.mobileControls.innerHTML = `
      <button class="doodle-jump-control-btn" data-direction="left">←</button>
      <button class="doodle-jump-control-btn" data-direction="right">→</button>
    `;

    this.wrapper.appendChild(this.canvas);
    this.wrapper.appendChild(this.hud);
    this.wrapper.appendChild(this.gameOverOverlay);
    this.wrapper.appendChild(this.mobileControls);
    this.container.appendChild(this.wrapper);

    // Setup mobile controls if touch device
    if (this.isTouchDevice()) {
      this.mobileControls.style.display = 'flex';
    }
  }

  isTouchDevice() {
    return (
      typeof window !== 'undefined' &&
      ('ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        navigator.msMaxTouchPoints > 0)
    );
  }

  setupEventListeners() {
    // Keyboard (stored as bound references for proper cleanup)
    this._handleKeyDown = (e) => {
      this.keys[e.key] = true;
      if (['ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
      }
    };

    this._handleKeyUp = (e) => {
      this.keys[e.key] = false;
    };

    window.addEventListener('keydown', this._handleKeyDown);
    window.addEventListener('keyup', this._handleKeyUp);

    // Mobile touch controls
    this.mobileControls.addEventListener('touchstart', (e) => {
      const btn = e.target.closest('.doodle-jump-control-btn');
      if (btn) {
        const direction = btn.dataset.direction;
        this.touchControls[direction] = true;
        btn.style.opacity = '0.8';
      }
    });

    this.mobileControls.addEventListener('touchend', (e) => {
      const btn = e.target.closest('.doodle-jump-control-btn');
      if (btn) {
        const direction = btn.dataset.direction;
        this.touchControls[direction] = false;
        btn.style.opacity = '1';
      }
    });

    // Mobile click controls
    this.mobileControls.addEventListener('click', (e) => {
      const btn = e.target.closest('.doodle-jump-control-btn');
      if (btn) {
        const direction = btn.dataset.direction;
        if (direction === 'left') {
          this.player.velocityX = -this.maxVelocityX;
          this.player.direction = -1;
        } else {
          this.player.velocityX = this.maxVelocityX;
          this.player.direction = 1;
        }
      }
    });

    // Game over button
    this.gameOverOverlay.querySelector('.doodle-jump-play-again-btn').addEventListener(
      'click',
      () => this.start()
    );
  }

  start() {
    this.gameRunning = true;
    this.gamePaused = false;
    this.gameOver = false;
    this.score = 0;
    this.maxHeightReached = 0;
    this.cameraY = 0;

    this.player = {
      x: 200,
      y: 500,
      width: 20,
      height: 24,
      velocityY: 0,
      velocityX: 0,
      direction: 1,
      onPlatform: false,
      bouncing: false,
    };

    this.platforms = [];
    this.enemies = [];
    this.particles = [];
    this.powerUps = [];

    this.gameOverOverlay.classList.remove('show');

    this.generateInitialPlatforms();
    this.gameLoop();
  }

  pause() {
    if (this.gameRunning && !this.gameOver) {
      this.gamePaused = true;
    }
  }

  resume() {
    if (this.gameRunning && this.gamePaused) {
      this.gamePaused = false;
      this.gameLoop();
    }
  }

  destroy() {
    this.gameRunning = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    window.removeEventListener('keydown', this._handleKeyDown);
    window.removeEventListener('keyup', this._handleKeyUp);
    if (this.wrapper && this.wrapper.parentNode) {
      this.wrapper.parentNode.removeChild(this.wrapper);
    }
  }

  getScore() {
    return this.maxHeightReached;
  }

  generateInitialPlatforms() {
    for (let i = 0; i < 10; i++) {
      const x = Math.random() * (400 - 60);
      const y = i * 70;
      this.addPlatform(x, y);
    }
  }

  addPlatform(x, y) {
    const rand = Math.random();
    let type = 'normal';
    if (rand > 0.85) type = 'spring';
    else if (rand > 0.6) type = 'moving';
    else if (rand > 0.4) type = 'breakable';

    const platform = {
      x,
      y,
      width: 60,
      height: 12,
      type,
      broken: false,
      moveDirection: Math.random() > 0.5 ? 1 : -1,
      moveSpeed: 2,
      bounced: false,
    };

    this.platforms.push(platform);

    // Randomly add enemies
    if (Math.random() > 0.75) {
      this.enemies.push({
        x: x + 20,
        y: y - 20,
        width: 16,
        height: 16,
        type: Math.random() > 0.5 ? 'red' : 'yellow',
      });
    }

    // Rarely add spring power-ups
    if (Math.random() > 0.95) {
      this.powerUps.push({
        x: x + 20,
        y: y - 30,
        width: 10,
        height: 14,
      });
    }
  }

  generateNewPlatforms() {
    const minY = Math.min(...this.platforms.map((p) => p.y));
    if (minY > 0) {
      for (let i = 0; i < 3; i++) {
        const x = Math.random() * (400 - 60);
        const y = minY - 70;
        this.addPlatform(x, y);
      }
    }
  }

  gameLoop = () => {
    const currentTime = performance.now();
    this.deltaTime = Math.min((currentTime - this.lastFrameTime) / 16, 2); // Cap deltaTime
    this.lastFrameTime = currentTime;

    if (!this.gamePaused && this.gameRunning && !this.gameOver) {
      this.update();
    }

    this.render();

    if (this.gameRunning) {
      this.animationFrameId = requestAnimationFrame(this.gameLoop);
    }
  };

  update() {
    // Handle input
    this.handleInput();

    // Update player
    this.updatePlayer();

    // Update platforms
    this.updatePlatforms();

    // Update enemies
    this.updateEnemies();

    // Update particles
    this.updateParticles();

    // Check collisions
    this.checkPlatformCollisions();
    this.checkEnemyCollisions();
    this.checkPowerUpCollisions();

    // Check game over (camera-relative: player fell below visible screen)
    if (this.player.y > this.cameraY + this.canvas.height + 200) {
      this.endGame();
    }

    // Update camera
    this.updateCamera();

    // Generate new platforms
    this.generateNewPlatforms();

    // Update score
    this.updateScore();
  }

  handleInput() {
    const leftPressed = this.keys['ArrowLeft'] || this.keys['a'] || this.keys['A'] || this.touchControls.left;
    const rightPressed = this.keys['ArrowRight'] || this.keys['d'] || this.keys['D'] || this.touchControls.right;

    if (leftPressed) {
      this.player.velocityX -= this.playerAcceleration;
      this.player.direction = -1;
      if (this.player.velocityX < -this.maxVelocityX) {
        this.player.velocityX = -this.maxVelocityX;
      }
    }

    if (rightPressed) {
      this.player.velocityX += this.playerAcceleration;
      this.player.direction = 1;
      if (this.player.velocityX > this.maxVelocityX) {
        this.player.velocityX = this.maxVelocityX;
      }
    }

    // Friction when no input
    if (!leftPressed && !rightPressed) {
      this.player.velocityX *= 0.85;
    }
  }

  updatePlayer() {
    // Apply gravity
    this.player.velocityY += this.gravity * this.deltaTime;

    // Update position
    this.player.x += this.player.velocityX * this.deltaTime;
    this.player.y += this.player.velocityY * this.deltaTime;

    // Wrap around screen
    if (this.player.x < -this.player.width / 2) {
      this.player.x = this.canvas.width + this.player.width / 2;
    }
    if (this.player.x > this.canvas.width + this.player.width / 2) {
      this.player.x = -this.player.width / 2;
    }

    this.player.onPlatform = false;
  }

  updatePlatforms() {
    this.platforms.forEach((platform) => {
      if (platform.type === 'moving' && !platform.broken) {
        platform.x += platform.moveSpeed * platform.moveDirection;
        if (platform.x < 0 || platform.x + platform.width > this.canvas.width) {
          platform.moveDirection *= -1;
        }
      }
    });

    // Remove platforms that are too far below
    this.platforms = this.platforms.filter((p) => p.y < this.cameraY + this.canvas.height + 200);
  }

  updateEnemies() {
    this.enemies = this.enemies.filter((e) => e.y < this.cameraY + this.canvas.height + 100);
  }

  updateParticles() {
    this.particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.2;
      p.life--;
    });

    this.particles = this.particles.filter((p) => p.life > 0);
  }

  checkPlatformCollisions() {
    this.platforms.forEach((platform) => {
      if (platform.broken) return;

      // Only collide if moving downward
      if (this.player.velocityY > 0) {
        const playerBottom = this.player.y + this.player.height / 2;
        const platformTop = platform.y;
        const platformBottom = platform.y + platform.height;

        if (
          playerBottom >= platformTop &&
          playerBottom <= platformBottom + 5 &&
          this.player.x + this.player.width / 2 > platform.x &&
          this.player.x - this.player.width / 2 < platform.x + platform.width
        ) {
          // Bounce!
          this.player.onPlatform = true;

          if (platform.type === 'spring') {
            this.player.velocityY = -this.jumpPower * 1.5;
            this.createParticles(this.player.x, this.player.y, 'yellow');
          } else if (platform.type === 'moving') {
            this.player.velocityY = -this.jumpPower;
            this.createParticles(this.player.x, this.player.y, 'blue');
          } else if (platform.type === 'breakable') {
            this.player.velocityY = -this.jumpPower;
            if (!platform.bounced) {
              platform.bounced = true;
              setTimeout(() => {
                platform.broken = true;
                this.createParticles(platform.x + platform.width / 2, platform.y, 'brown');
              }, 100);
            }
          } else {
            this.player.velocityY = -this.jumpPower;
            this.createParticles(this.player.x, this.player.y, 'green');
          }
        }
      }
    });
  }

  checkEnemyCollisions() {
    this.enemies.forEach((enemy) => {
      const dx = this.player.x - enemy.x;
      const dy = this.player.y - enemy.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < 20) {
        this.createParticles(this.player.x, this.player.y, 'red');
        this.endGame();
      }
    });
  }

  checkPowerUpCollisions() {
    this.powerUps = this.powerUps.filter((powerUp) => {
      const dx = this.player.x - powerUp.x;
      const dy = this.player.y - powerUp.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < 20) {
        this.createParticles(powerUp.x, powerUp.y, 'gold');
        this.player.velocityY = -this.jumpPower * 2;
        return false;
      }
      return true;
    });
  }

  updateCamera() {
    // Camera follows player, but only upward
    const targetY = this.player.y - this.canvas.height / 3;
    if (targetY < this.cameraY) {
      this.cameraY = targetY;
    }

    // Keep score based on height
    const heightReached = Math.max(0, Math.floor(-this.cameraY / 10) * 10);
    this.maxHeightReached = Math.max(this.maxHeightReached, heightReached);
  }

  updateScore() {
    this.score = this.maxHeightReached;
  }

  createParticles(x, y, color) {
    const particleCount = 8;
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const speed = 3 + Math.random() * 2;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        life: 20,
      });
    }
  }

  endGame() {
    this.gameRunning = false;
    this.gameOver = true;
    this.showGameOverScreen();
  }

  showGameOverScreen() {
    this.gameOverOverlay.querySelector('.doodle-jump-score-value').textContent = this.maxHeightReached;
    this.gameOverOverlay.classList.add('show');
  }

  render() {
    // Clear canvas
    this.ctx.fillStyle = 'rgba(135, 206, 235, 0.3)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw gradient background
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    gradient.addColorStop(0, '#87ceeb');
    gradient.addColorStop(1, '#e0f6ff');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw platforms
    this.renderPlatforms();

    // Draw power-ups
    this.renderPowerUps();

    // Draw enemies
    this.renderEnemies();

    // Draw particles
    this.renderParticles();

    // Draw player
    this.renderPlayer();

    // Update HUD
    this.scoreDisplay.textContent = this.score;
  }

  renderPlayer() {
    const screenX = this.player.x;
    const screenY = this.player.y - this.cameraY;

    // Draw player
    this.ctx.save();
    this.ctx.translate(screenX, screenY);

    // Scale based on direction
    if (this.player.direction === -1) {
      this.ctx.scale(-1, 1);
    }

    // Draw body
    this.ctx.fillStyle = '#ff6b6b';
    this.ctx.fillRect(-this.player.width / 2, -this.player.height / 2, this.player.width, this.player.height);

    // Draw eyes
    this.ctx.fillStyle = 'white';
    this.ctx.fillRect(-7, -6, 6, 6);
    this.ctx.fillRect(2, -6, 6, 6);

    // Draw pupils
    this.ctx.fillStyle = 'black';
    this.ctx.fillRect(-5, -5, 3, 3);
    this.ctx.fillRect(4, -5, 3, 3);

    // Draw mouth
    this.ctx.strokeStyle = 'black';
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.arc(0, 2, 3, 0, Math.PI);
    this.ctx.stroke();

    this.ctx.restore();
  }

  renderPlatforms() {
    this.platforms.forEach((platform) => {
      const screenY = platform.y - this.cameraY;

      if (screenY > -50 && screenY < this.canvas.height + 50) {
        // Draw platform
        if (platform.type === 'spring') {
          this.ctx.fillStyle = '#FFD700';
        } else if (platform.type === 'moving') {
          this.ctx.fillStyle = '#4A90E2';
        } else if (platform.type === 'breakable') {
          this.ctx.fillStyle = platform.broken ? 'transparent' : '#8B4513';
        } else {
          this.ctx.fillStyle = '#52C41A';
        }

        if (!platform.broken) {
          this.ctx.fillRect(platform.x, screenY, platform.width, platform.height);

          // Draw border
          this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
          this.ctx.lineWidth = 2;
          this.ctx.strokeRect(platform.x, screenY, platform.width, platform.height);

          // Draw pattern for spring
          if (platform.type === 'spring') {
            this.ctx.strokeStyle = 'rgba(200, 150, 0, 0.5)';
            this.ctx.lineWidth = 1;
            for (let i = 0; i < 3; i++) {
              this.ctx.beginPath();
              this.ctx.arc(platform.x + 10 + i * 20, screenY + platform.height / 2, 4, 0, Math.PI * 2);
              this.ctx.stroke();
            }
          }
        }
      }
    });
  }

  renderEnemies() {
    this.enemies.forEach((enemy) => {
      const screenY = enemy.y - this.cameraY;

      if (screenY > -30 && screenY < this.canvas.height + 30) {
        this.ctx.fillStyle = enemy.type === 'red' ? '#FF4444' : '#FFD700';
        this.ctx.beginPath();
        this.ctx.arc(enemy.x, screenY, enemy.width / 2, 0, Math.PI * 2);
        this.ctx.fill();

        // Draw eyes
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(enemy.x - 5, screenY - 3, 4, 4);
        this.ctx.fillRect(enemy.x + 2, screenY - 3, 4, 4);

        // Draw pupils
        this.ctx.fillStyle = 'black';
        this.ctx.fillRect(enemy.x - 4, screenY - 2, 2, 2);
        this.ctx.fillRect(enemy.x + 3, screenY - 2, 2, 2);

        // Draw mouth
        this.ctx.strokeStyle = 'black';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.arc(enemy.x, screenY + 2, 3, 0, Math.PI);
        this.ctx.stroke();
      }
    });
  }

  renderPowerUps() {
    this.powerUps.forEach((powerUp) => {
      const screenY = powerUp.y - this.cameraY;

      if (screenY > -30 && screenY < this.canvas.height + 30) {
        // Draw spring
        this.ctx.strokeStyle = '#FF6B6B';
        this.ctx.lineWidth = 2;

        // Draw coils
        for (let i = 0; i < 3; i++) {
          this.ctx.beginPath();
          this.ctx.arc(powerUp.x, screenY + i * 5, 4, 0, Math.PI * 2);
          this.ctx.stroke();
        }

        // Draw glow
        this.ctx.strokeStyle = 'rgba(255, 107, 107, 0.5)';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.arc(powerUp.x, screenY + 5, 10, 0, Math.PI * 2);
        this.ctx.stroke();
      }
    });
  }

  renderParticles() {
    this.particles.forEach((particle) => {
      const screenY = particle.y - this.cameraY;
      const alpha = particle.life / 20;

      this.ctx.fillStyle = particle.color;
      this.ctx.globalAlpha = alpha;
      this.ctx.fillRect(particle.x - 2, screenY - 2, 4, 4);
      this.ctx.globalAlpha = 1;
    });
  }
}

// Export to window
window.DoodleJump = DoodleJump;
