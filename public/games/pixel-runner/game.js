class PixelRunner {
  constructor(container) {
    this.container = container;
    this.gameActive = false;
    this.gamePaused = false;

    // Game constants
    this.CANVAS_WIDTH = 700;
    this.CANVAS_HEIGHT = 250;
    this.GROUND_Y = 190;
    this.BASE_SPEED = 8;
    this.MAX_SPEED = 16;
    this.GRAVITY = 0.6;
    this.JUMP_STRENGTH = -12;

    // Game state
    this.score = 0;
    this.gameSpeed = this.BASE_SPEED;
    this.cycleCount = 0; // For day/night cycle

    // Player state
    this.player = {
      x: 50,
      y: this.GROUND_Y,
      width: 20,
      height: 20,
      velocityY: 0,
      jumping: false,
      ducking: false,
      jumpHeld: false,
    };

    // Game objects
    this.obstacles = [];
    this.coins = [];
    this.particles = [];

    // Spawn timers
    this.obstacleSpawnCounter = 0;
    this.coinSpawnCounter = 0;

    // Input handling
    this.keys = {};
    this.touchStartY = 0;
    this.touchStartX = 0;

    // Setup canvas
    this.setupCanvas();

    // Bind methods
    this.update = this.update.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    this.handleTouchStart = this.handleTouchStart.bind(this);
    this.handleTouchEnd = this.handleTouchEnd.bind(this);
    this.handleMouseClick = this.handleMouseClick.bind(this);
  }

  setupCanvas() {
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'pixel-runner-canvas game-canvas';
    this.canvas.width = this.CANVAS_WIDTH;
    this.canvas.height = this.CANVAS_HEIGHT;
    this.ctx = this.canvas.getContext('2d');

    this.container.appendChild(this.canvas);
  }

  start() {
    this.gameActive = true;
    this.gamePaused = false;
    this.score = 0;
    this.gameSpeed = this.BASE_SPEED;
    this.cycleCount = 0;
    this.player.y = this.GROUND_Y;
    this.player.velocityY = 0;
    this.player.jumping = false;
    this.player.ducking = false;
    this.player.jumpHeld = false;
    this.obstacles = [];
    this.coins = [];
    this.particles = [];
    this.obstacleSpawnCounter = 0;
    this.coinSpawnCounter = 0;

    this.attachEventListeners();
    this.animationFrameId = requestAnimationFrame(this.update);
  }

  attachEventListeners() {
    document.addEventListener('keydown', this.handleKeyDown);
    document.addEventListener('keyup', this.handleKeyUp);
    this.canvas.addEventListener('touchstart', this.handleTouchStart);
    this.canvas.addEventListener('touchend', this.handleTouchEnd);
    this.canvas.addEventListener('click', this.handleMouseClick);
  }

  detachEventListeners() {
    document.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('keyup', this.handleKeyUp);
    this.canvas.removeEventListener('touchstart', this.handleTouchStart);
    this.canvas.removeEventListener('touchend', this.handleTouchEnd);
    this.canvas.removeEventListener('click', this.handleMouseClick);
  }

  handleKeyDown(e) {
    const key = e.key.toLowerCase();
    this.keys[key] = true;

    // Jump on space or up arrow
    if ((key === ' ' || key === 'arrowup') && !this.player.jumping && !this.player.jumpHeld) {
      this.player.velocityY = this.JUMP_STRENGTH;
      this.player.jumping = true;
      this.player.jumpHeld = true;
      e.preventDefault();
    }

    // Duck on down arrow
    if (key === 'arrowdown' && !this.player.jumping) {
      this.player.ducking = true;
      e.preventDefault();
    }
  }

  handleKeyUp(e) {
    const key = e.key.toLowerCase();
    this.keys[key] = false;

    // Stop jump hold
    if (key === ' ' || key === 'arrowup') {
      this.player.jumpHeld = false;
    }

    // Stop duck
    if (key === 'arrowdown') {
      this.player.ducking = false;
    }
  }

  handleTouchStart(e) {
    const touch = e.touches[0];
    this.touchStartY = touch.clientY;
    this.touchStartX = touch.clientX;
  }

  handleTouchEnd(e) {
    if (!this.gameActive || this.gamePaused) return;

    const touch = e.changedTouches[0];
    const deltaY = touch.clientY - this.touchStartY;
    const deltaX = Math.abs(touch.clientX - this.touchStartX);

    // Swipe down = duck
    if (deltaY > 30 && !this.player.jumping) {
      this.player.ducking = true;
      setTimeout(() => {
        this.player.ducking = false;
      }, 300);
    }
    // Tap anywhere = jump
    else if (deltaY < 10 && deltaX < 10) {
      if (!this.player.jumping && !this.player.jumpHeld) {
        this.player.velocityY = this.JUMP_STRENGTH;
        this.player.jumping = true;
        this.player.jumpHeld = true;
      }
    }
  }

  handleMouseClick() {
    if (!this.gameActive || this.gamePaused) return;

    if (!this.player.jumping && !this.player.jumpHeld) {
      this.player.velocityY = this.JUMP_STRENGTH;
      this.player.jumping = true;
      this.player.jumpHeld = true;
    }
  }

  pause() {
    this.gamePaused = true;
  }

  resume() {
    this.gamePaused = false;
    this.animationFrameId = requestAnimationFrame(this.update);
  }

  update() {
    if (!this.gameActive) return;

    if (!this.gamePaused) {
      this.updatePlayerPhysics();
      this.updateObstacles();
      this.updateCoins();
      this.updateGameSpeed();
      this.checkCollisions();
      this.spawnObstacles();
      this.spawnCoins();
      this.updateParticles();
      this.score += 0.5; // Score increments based on distance (roughly per frame)
    }

    this.render();
    this.animationFrameId = requestAnimationFrame(this.update);
  }

  updatePlayerPhysics() {
    // Apply gravity
    if (this.player.y < this.GROUND_Y) {
      this.player.velocityY += this.GRAVITY;
    } else {
      this.player.y = this.GROUND_Y;
      this.player.velocityY = 0;
      this.player.jumping = false;
    }

    this.player.y += this.player.velocityY;

    // Allow higher jump if holding jump button and recently jumped
    if (this.player.jumpHeld && this.player.velocityY < -2 && this.keys[' '] || this.keys['arrowup']) {
      this.player.velocityY += 0.3; // Slight boost while holding
    }
  }

  updateObstacles() {
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obstacle = this.obstacles[i];
      obstacle.x -= this.gameSpeed;

      if (obstacle.x + obstacle.width < 0) {
        this.obstacles.splice(i, 1);
      }
    }
  }

  updateCoins() {
    for (let i = this.coins.length - 1; i >= 0; i--) {
      const coin = this.coins[i];
      coin.x -= this.gameSpeed;
      coin.rotation += 0.1;

      if (coin.x + 15 < 0) {
        this.coins.splice(i, 1);
      }
    }
  }

  updateGameSpeed() {
    // Increase speed gradually
    const speedIncrease = (this.score / 5000) * (this.MAX_SPEED - this.BASE_SPEED);
    this.gameSpeed = this.BASE_SPEED + Math.min(speedIncrease, this.MAX_SPEED - this.BASE_SPEED);

    // Update cycle count for day/night
    this.cycleCount = Math.floor(this.score / 500);
  }

  spawnObstacles() {
    this.obstacleSpawnCounter++;

    // Spawn rate decreases as game speeds up (harder!)
    const spawnRate = Math.max(40, 140 - (this.score / 1000) * 20);

    if (this.obstacleSpawnCounter > spawnRate) {
      this.obstacleSpawnCounter = 0;

      const type = Math.random();
      let obstacle;

      if (type < 0.4) {
        // Short cactus
        obstacle = {
          x: this.CANVAS_WIDTH,
          y: this.GROUND_Y,
          width: 15,
          height: 30,
          type: 'short-cactus',
        };
      } else if (type < 0.7) {
        // Tall cactus
        obstacle = {
          x: this.CANVAS_WIDTH,
          y: this.GROUND_Y - 15,
          width: 15,
          height: 45,
          type: 'tall-cactus',
        };
      } else {
        // Flying bird
        const birdY = Math.random() > 0.5 ? 140 : 110;
        obstacle = {
          x: this.CANVAS_WIDTH,
          y: birdY,
          width: 25,
          height: 18,
          type: 'bird',
          wingFrame: 0,
        };
      }

      this.obstacles.push(obstacle);
    }
  }

  spawnCoins() {
    this.coinSpawnCounter++;

    const coinSpawnRate = 200;

    if (this.coinSpawnCounter > coinSpawnRate) {
      this.coinSpawnCounter = 0;

      // Random height
      const coinY = 80 + Math.random() * 60;

      const coin = {
        x: this.CANVAS_WIDTH,
        y: coinY,
        width: 15,
        height: 15,
        rotation: 0,
        collected: false,
      };

      this.coins.push(coin);
    }
  }

  checkCollisions() {
    // Check obstacle collisions
    for (let obstacle of this.obstacles) {
      const playerLeft = this.player.x;
      const playerRight = this.player.x + this.player.width;
      const playerTop = this.player.y;
      const playerBottom = this.player.y + this.player.height;

      const obstacleLeft = obstacle.x;
      const obstacleRight = obstacle.x + obstacle.width;
      const obstacleTop = obstacle.y;
      const obstacleBottom = obstacle.y + obstacle.height;

      // Check if player can duck under flying bird
      if (obstacle.type === 'bird' && this.player.ducking) {
        if (playerRight > obstacleLeft && playerLeft < obstacleRight && playerBottom > obstacleTop) {
          continue; // Duck successful, no collision
        }
      }

      // Regular collision check
      if (
        playerRight > obstacleLeft &&
        playerLeft < obstacleRight &&
        playerBottom > obstacleTop &&
        playerTop < obstacleBottom
      ) {
        this.endGame();
        return;
      }
    }

    // Check coin collisions
    for (let coin of this.coins) {
      if (!coin.collected) {
        const coinLeft = coin.x;
        const coinRight = coin.x + coin.width;
        const coinTop = coin.y;
        const coinBottom = coin.y + coin.height;

        const playerLeft = this.player.x;
        const playerRight = this.player.x + this.player.width;
        const playerTop = this.player.y;
        const playerBottom = this.player.y + this.player.height;

        if (
          playerRight > coinLeft &&
          playerLeft < coinRight &&
          playerBottom > coinTop &&
          playerTop < coinBottom
        ) {
          coin.collected = true;
          this.score += 50;

          // Create particle effect
          for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 * i) / 8;
            this.particles.push({
              x: coin.x + coin.width / 2,
              y: coin.y + coin.height / 2,
              vx: Math.cos(angle) * 3,
              vy: Math.sin(angle) * 3,
              life: 30,
              color: '#FFD700',
            });
          }
        }
      }
    }
  }

  updateParticles() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.2; // Gravity on particles
      p.life--;

      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  endGame() {
    this.gameActive = false;
    this.detachEventListeners();
    this.showGameOver();
  }

  showGameOver() {
    const overlay = document.createElement('div');
    overlay.className = 'pixel-runner-game-over';
    overlay.innerHTML = `
      <div class="pixel-runner-game-over-content">
        <h2>Game Over</h2>
        <p class="pixel-runner-final-score">Score: ${Math.floor(this.score)}</p>
        <button class="pixel-runner-play-again">Play Again</button>
      </div>
    `;

    this.container.appendChild(overlay);

    const button = overlay.querySelector('.pixel-runner-play-again');
    button.addEventListener('click', () => {
      overlay.remove();
      this.start();
    });
  }

  render() {
    // Get background cycle (0-1 range, repeats every 500 points)
    const cyclePhase = (this.score % 500) / 500;

    // Day/night color interpolation
    let bgColor;
    if (cyclePhase < 0.5) {
      // Day phase
      const dayPhase = cyclePhase * 2;
      bgColor = this.interpolateColor(
        [135, 206, 235], // Light blue (day)
        [255, 165, 0], // Orange (sunset)
        dayPhase
      );
    } else {
      // Night phase
      const nightPhase = (cyclePhase - 0.5) * 2;
      bgColor = this.interpolateColor(
        [255, 165, 0], // Orange (sunset)
        [25, 25, 60], // Dark blue (night)
        nightPhase
      );
    }

    this.ctx.fillStyle = `rgb(${bgColor[0]}, ${bgColor[1]}, ${bgColor[2]})`;
    this.ctx.fillRect(0, 0, this.CANVAS_WIDTH, this.CANVAS_HEIGHT);

    // Draw parallax background
    this.drawParallaxBackground();

    // Draw ground
    this.drawGround();

    // Draw coins
    this.drawCoins();

    // Draw obstacles
    this.drawObstacles();

    // Draw particles
    this.drawParticles();

    // Draw player
    this.drawPlayer();

    // Draw score
    this.drawScore();
  }

  interpolateColor(color1, color2, t) {
    return [
      Math.round(color1[0] + (color2[0] - color1[0]) * t),
      Math.round(color1[1] + (color2[1] - color1[1]) * t),
      Math.round(color1[2] + (color2[2] - color1[2]) * t),
    ];
  }

  drawParallaxBackground() {
    const offset1 = (this.score * 0.3) % (this.CANVAS_WIDTH + 100);
    const offset2 = (this.score * 0.15) % (this.CANVAS_WIDTH + 150);

    // Far clouds
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    for (let i = -2; i < 3; i++) {
      const x = i * 250 - offset2;
      this.drawCloud(x, 30, 50);
    }

    // Mountains
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    for (let i = -1; i < 3; i++) {
      const x = i * 300 - offset1;
      this.drawMountain(x, 140, 80);
    }
  }

  drawCloud(x, y, size) {
    this.ctx.beginPath();
    this.ctx.arc(x, y, size, 0, Math.PI * 2);
    this.ctx.arc(x + size * 0.6, y, size * 0.8, 0, Math.PI * 2);
    this.ctx.arc(x + size * 1.2, y, size, 0, Math.PI * 2);
    this.ctx.fill();
  }

  drawMountain(x, y, size) {
    this.ctx.beginPath();
    this.ctx.moveTo(x, y);
    this.ctx.lineTo(x + size, y - size * 0.8);
    this.ctx.lineTo(x + size * 2, y);
    this.ctx.fill();
  }

  drawGround() {
    // Ground line
    this.ctx.strokeStyle = '#8B7355';
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.moveTo(0, this.GROUND_Y + this.player.height);
    this.ctx.lineTo(this.CANVAS_WIDTH, this.GROUND_Y + this.player.height);
    this.ctx.stroke();

    // Ground pattern (moving)
    const groundOffset = (this.score * 2) % 20;
    this.ctx.fillStyle = '#D2B48C';
    for (let i = 0; i < this.CANVAS_WIDTH / 20 + 2; i++) {
      const x = i * 20 - groundOffset;
      this.ctx.fillRect(x, this.GROUND_Y + this.player.height + 2, 10, 8);
    }
  }

  drawPlayer() {
    const x = this.player.x;
    const y = this.player.y;

    // Duck pose
    if (this.player.ducking) {
      // Ducking body
      this.ctx.fillStyle = '#FF6B6B';
      this.ctx.fillRect(x, y + 10, this.player.width, 10);

      // Head
      this.ctx.fillStyle = '#FFB366';
      this.ctx.fillRect(x + 3, y + 5, 8, 8);

      // Eye
      this.ctx.fillStyle = '#000';
      this.ctx.fillRect(x + 6, y + 6, 2, 2);
    } else {
      // Standing pose
      // Body
      this.ctx.fillStyle = '#FF6B6B';
      this.ctx.fillRect(x + 4, y + 8, 12, 12);

      // Head
      this.ctx.fillStyle = '#FFB366';
      this.ctx.fillRect(x + 3, y, 14, 8);

      // Eyes
      this.ctx.fillStyle = '#000';
      this.ctx.fillRect(x + 6, y + 2, 2, 2);
      this.ctx.fillRect(x + 12, y + 2, 2, 2);

      // Legs (animate)
      const legOffset = Math.sin(this.score * 0.1) * 2;
      this.ctx.fillStyle = '#FFB366';
      this.ctx.fillRect(x + 6, y + 20, 2, 5 + legOffset);
      this.ctx.fillRect(x + 12, y + 20, 2, 5 - legOffset);
    }
  }

  drawObstacles() {
    for (let obstacle of this.obstacles) {
      if (obstacle.type === 'short-cactus') {
        this.drawCactus(obstacle.x, obstacle.y, 15, 30);
      } else if (obstacle.type === 'tall-cactus') {
        this.drawCactus(obstacle.x, obstacle.y, 15, 45);
      } else if (obstacle.type === 'bird') {
        this.drawBird(obstacle.x, obstacle.y, obstacle);
      }
    }
  }

  drawCactus(x, y, width, height) {
    // Main stem
    this.ctx.fillStyle = '#228B22';
    this.ctx.fillRect(x + 5, y, 5, height);

    // Spikes
    this.ctx.fillStyle = '#32CD32';
    this.ctx.fillRect(x, y + 5, 5, 4);
    this.ctx.fillRect(x + width - 5, y + 15, 5, 4);
    this.ctx.fillRect(x, y + 25, 5, 4);
  }

  drawBird(x, y, obstacle) {
    this.ctx.fillStyle = '#FF9800';

    // Body
    this.ctx.beginPath();
    this.ctx.ellipse(x + 10, y + 9, 6, 5, 0, 0, Math.PI * 2);
    this.ctx.fill();

    // Head
    this.ctx.fillRect(x + 14, y + 6, 6, 6);

    // Eye
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(x + 17, y + 7, 2, 2);

    // Wings (flapping animation)
    obstacle.wingFrame = (obstacle.wingFrame + 1) % 10;
    const wingOffset = obstacle.wingFrame < 5 ? -3 : 3;

    this.ctx.fillStyle = '#FF9800';
    this.ctx.beginPath();
    this.ctx.moveTo(x + 10, y + 9);
    this.ctx.lineTo(x + 5, y + 6 + wingOffset);
    this.ctx.lineTo(x + 8, y + 12);
    this.ctx.fill();
  }

  drawCoins() {
    for (let coin of this.coins) {
      if (!coin.collected) {
        this.ctx.save();
        this.ctx.translate(coin.x + coin.width / 2, coin.y + coin.height / 2);
        this.ctx.rotate(coin.rotation);

        // Coin circle
        this.ctx.fillStyle = '#FFD700';
        this.ctx.fillRect(-coin.width / 2, -coin.height / 2, coin.width, coin.height);

        // Shine
        this.ctx.fillStyle = '#FFFF00';
        this.ctx.fillRect(-coin.width / 4, -coin.height / 4, coin.width / 2, coin.height / 2);

        this.ctx.restore();
      }
    }
  }

  drawParticles() {
    for (let p of this.particles) {
      this.ctx.fillStyle = p.color;
      const alpha = p.life / 30;
      this.ctx.globalAlpha = alpha;
      this.ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
      this.ctx.globalAlpha = 1;
    }
  }

  drawScore() {
    this.ctx.fillStyle = '#000';
    this.ctx.font = 'bold 20px Arial';
    this.ctx.fillText(`Score: ${Math.floor(this.score)}`, 10, 30);

    // Speed indicator
    this.ctx.font = '12px Arial';
    this.ctx.fillText(`Speed: ${this.gameSpeed.toFixed(1)}x`, 10, 48);
  }

  getScore() {
    return Math.floor(this.score);
  }

  destroy() {
    this.gameActive = false;
    this.gamePaused = false;

    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }

    this.detachEventListeners();

    // Remove canvas and overlays
    const gameOverOverlay = this.container.querySelector('.pixel-runner-game-over');
    if (gameOverOverlay) {
      gameOverOverlay.remove();
    }

    if (this.canvas && this.canvas.parentNode) {
      this.canvas.remove();
    }

    // Clear all state
    this.obstacles = [];
    this.coins = [];
    this.particles = [];
    this.keys = {};
  }
}

window.PixelRunner = PixelRunner;
