class RobotEscape {
  constructor(container) {
    this.container = container;
    this.canvas = null;
    this.ctx = null;
    this.gameState = 'menu'; // menu, playing, paused, levelComplete, gameComplete, gameOver
    this.currentLevel = 0;
    this.lives = 3;
    this.score = 0;
    this.coins = 0;
    this.enemiesKilled = 0;

    // Game objects
    this.player = null;
    this.platforms = [];
    this.enemies = [];
    this.projectiles = [];
    this.collectibles = [];
    this.hazards = [];
    this.door = null;

    // Input handling
    this.keys = {};
    this.mouse = { x: 0, y: 0 };
    this.touchControls = {
      left: false,
      right: false,
      jump: false,
      shoot: false,
    };

    // Physics constants
    this.GRAVITY = 0.6;
    this.TERMINAL_VELOCITY = 12;

    // Animation frame ID
    this.animationFrameId = null;
    this.mobileUI = null;

    this.init();
  }

  init() {
    // Create canvas
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'robot-escape-game-canvas game-canvas';
    this.canvas.width = 700;
    this.canvas.height = 400;
    this.ctx = this.canvas.getContext('2d');

    // Create UI container
    const uiContainer = document.createElement('div');
    uiContainer.className = 'robot-escape-ui-container';

    const statsDiv = document.createElement('div');
    statsDiv.className = 'robot-escape-stats';
    statsDiv.innerHTML = `
      <div class="robot-escape-stat"><span class="robot-escape-label">Level:</span> <span class="robot-escape-level">1</span></div>
      <div class="robot-escape-stat"><span class="robot-escape-label">Keys:</span> <span class="robot-escape-keys">0/0</span></div>
      <div class="robot-escape-stat"><span class="robot-escape-label">Lives:</span> <span class="robot-escape-lives">3</span></div>
      <div class="robot-escape-stat"><span class="robot-escape-label">Score:</span> <span class="robot-escape-score">0</span></div>
    `;

    uiContainer.appendChild(statsDiv);

    // Create mobile controls
    this.mobileUI = document.createElement('div');
    this.mobileUI.className = 'robot-escape-mobile-controls';
    this.mobileUI.innerHTML = `
      <div class="robot-escape-dpad">
        <button class="robot-escape-btn-up" data-action="up">↑</button>
        <div class="robot-escape-dpad-row">
          <button class="robot-escape-btn-left" data-action="left">←</button>
          <button class="robot-escape-btn-down" data-action="down">↓</button>
          <button class="robot-escape-btn-right" data-action="right">→</button>
        </div>
      </div>
      <div class="robot-escape-action-buttons">
        <button class="robot-escape-btn-action robot-escape-btn-jump" data-action="jump">JUMP</button>
        <button class="robot-escape-btn-action robot-escape-btn-shoot" data-action="shoot">SHOOT</button>
      </div>
    `;

    this.container.appendChild(this.canvas);
    this.container.appendChild(uiContainer);
    this.container.appendChild(this.mobileUI);

    // Event listeners (stored as bound references for proper cleanup)
    this._handleKeyDown = (e) => this.handleKeyDown(e);
    this._handleKeyUp = (e) => this.handleKeyUp(e);
    this._handleTouchStart = (e) => this.handleTouchStart(e);
    this._handleTouchEnd = (e) => this.handleTouchEnd(e);
    this._handleMouseDown = (e) => this.handleMouseDown(e);
    this._handleMouseUp = (e) => this.handleMouseUp(e);

    window.addEventListener('keydown', this._handleKeyDown);
    window.addEventListener('keyup', this._handleKeyUp);
    this.mobileUI.addEventListener('touchstart', this._handleTouchStart);
    this.mobileUI.addEventListener('touchend', this._handleTouchEnd);
    this.mobileUI.addEventListener('mousedown', this._handleMouseDown);
    this.mobileUI.addEventListener('mouseup', this._handleMouseUp);
  }

  handleKeyDown(e) {
    this.keys[e.key] = true;
    if (e.key === ' ') e.preventDefault();
  }

  handleKeyUp(e) {
    this.keys[e.key] = false;
  }

  handleTouchStart(e) {
    const touch = e.touches[0];
    const target = document.elementFromPoint(touch.clientX, touch.clientY);
    this.handleButtonPress(target);
  }

  handleTouchEnd(e) {
    this.touchControls = { left: false, right: false, jump: false, shoot: false };
  }

  handleMouseDown(e) {
    this.handleButtonPress(e.target);
  }

  handleMouseUp(e) {
    this.touchControls = { left: false, right: false, jump: false, shoot: false };
  }

  handleButtonPress(target) {
    const action = target.dataset?.action;
    if (!action) return;
    if (action === 'left') this.touchControls.left = true;
    if (action === 'right') this.touchControls.right = true;
    if (action === 'up' || action === 'jump') this.touchControls.jump = true;
    if (action === 'shoot') this.touchControls.shoot = true;
  }

  start() {
    this.currentLevel = 0;
    this.lives = 3;
    this.score = 0;
    this.coins = 0;
    this.enemiesKilled = 0;
    this.loadLevel(0);
    this.gameState = 'playing';
    this.animate();
  }

  loadLevel(levelIndex) {
    this.currentLevel = levelIndex;
    this.platforms = [];
    this.enemies = [];
    this.projectiles = [];
    this.collectibles = [];
    this.hazards = [];

    const levels = [
      this.createLevel1(),
      this.createLevel2(),
      this.createLevel3(),
    ];

    const levelData = levels[levelIndex];
    this.platforms = levelData.platforms;
    this.enemies = levelData.enemies;
    this.collectibles = levelData.collectibles;
    this.hazards = levelData.hazards;
    this.door = levelData.door;

    // Create player
    this.player = {
      x: 50,
      y: 200,
      width: 20,
      height: 30,
      velocityX: 0,
      velocityY: 0,
      onGround: false,
      direction: 1, // 1 = right, -1 = left
      jumpPower: 0,
      canJump: true,
      alive: true,
    };

    this.updateUI();
  }

  createLevel1() {
    // Tutorial level - simple platforms
    return {
      platforms: [
        { x: 0, y: 380, width: 700, height: 20, fixed: true }, // ground
        { x: 150, y: 320, width: 150, height: 15 },
        { x: 400, y: 260, width: 150, height: 15 },
        { x: 100, y: 200, width: 120, height: 15 },
        { x: 550, y: 280, width: 130, height: 15 },
      ],
      enemies: [
        { x: 150, y: 285, width: 20, height: 20, direction: 1, speed: 2, minX: 150, maxX: 300 },
        { x: 400, y: 225, width: 20, height: 20, direction: -1, speed: 1.5, minX: 350, maxX: 550 },
      ],
      collectibles: [
        { x: 220, y: 280, type: 'key', collected: false },
        { x: 470, y: 220, type: 'key', collected: false },
        { x: 180, y: 150, type: 'coin', collected: false },
        { x: 620, y: 240, type: 'coin', collected: false },
      ],
      hazards: [
        { x: 320, y: 360, width: 40, height: 20 },
        { x: 650, y: 350, width: 50, height: 30 },
      ],
      door: { x: 650, y: 330, width: 40, height: 50, opened: false },
    };
  }

  createLevel2() {
    // Mid-level - more challenge
    return {
      platforms: [
        { x: 0, y: 380, width: 700, height: 20, fixed: true }, // ground
        { x: 0, y: 320, width: 100, height: 15 },
        { x: 150, y: 280, width: 100, height: 15 },
        { x: 320, y: 240, width: 120, height: 15 },
        { x: 520, y: 280, width: 100, height: 15 },
        { x: 580, y: 200, width: 80, height: 15 },
        { x: 300, y: 140, width: 100, height: 15 },
      ],
      enemies: [
        { x: 50, y: 285, width: 20, height: 20, direction: 1, speed: 2, minX: 0, maxX: 100 },
        { x: 200, y: 245, width: 20, height: 20, direction: -1, speed: 2.5, minX: 150, maxX: 250 },
        { x: 400, y: 205, width: 20, height: 20, direction: 1, speed: 2, minX: 320, maxX: 440 },
        { x: 550, y: 245, width: 20, height: 20, direction: -1, speed: 1.8, minX: 520, maxX: 620 },
      ],
      collectibles: [
        { x: 60, y: 270, type: 'key', collected: false },
        { x: 220, y: 230, type: 'key', collected: false },
        { x: 360, y: 100, type: 'key', collected: false },
        { x: 120, y: 340, type: 'coin', collected: false },
        { x: 400, y: 190, type: 'coin', collected: false },
        { x: 620, y: 240, type: 'coin', collected: false },
      ],
      hazards: [
        { x: 100, y: 360, width: 50, height: 20 },
        { x: 280, y: 310, width: 40, height: 20 },
        { x: 460, y: 300, width: 60, height: 20 },
      ],
      door: { x: 630, y: 330, width: 40, height: 50, opened: false },
    };
  }

  createLevel3() {
    // Final level - hard
    return {
      platforms: [
        { x: 0, y: 380, width: 700, height: 20, fixed: true }, // ground
        { x: 0, y: 300, width: 80, height: 15 },
        { x: 120, y: 340, width: 60, height: 15 },
        { x: 220, y: 280, width: 100, height: 15 },
        { x: 380, y: 320, width: 80, height: 15 },
        { x: 500, y: 240, width: 100, height: 15 },
        { x: 200, y: 180, width: 120, height: 15 },
        { x: 450, y: 140, width: 100, height: 15 },
        { x: 620, y: 220, width: 80, height: 15 },
      ],
      enemies: [
        { x: 30, y: 265, width: 20, height: 20, direction: 1, speed: 2.5, minX: 0, maxX: 80 },
        { x: 240, y: 245, width: 20, height: 20, direction: -1, speed: 2, minX: 220, maxX: 320 },
        { x: 420, y: 285, width: 20, height: 20, direction: 1, speed: 3, minX: 380, maxX: 460 },
        { x: 530, y: 205, width: 20, height: 20, direction: -1, speed: 2.2, minX: 500, maxX: 600 },
        { x: 280, y: 145, width: 20, height: 20, direction: 1, speed: 2, minX: 200, maxX: 320 },
      ],
      collectibles: [
        { x: 40, y: 265, type: 'key', collected: false },
        { x: 260, y: 240, type: 'key', collected: false },
        { x: 530, y: 100, type: 'key', collected: false },
        { x: 150, y: 320, type: 'coin', collected: false },
        { x: 350, y: 290, type: 'coin', collected: false },
        { x: 270, y: 130, type: 'coin', collected: false },
        { x: 650, y: 180, type: 'coin', collected: false },
      ],
      hazards: [
        { x: 100, y: 360, width: 20, height: 20 },
        { x: 350, y: 350, width: 30, height: 20 },
        { x: 480, y: 310, width: 20, height: 20 },
        { x: 600, y: 370, width: 40, height: 20 },
      ],
      door: { x: 660, y: 330, width: 40, height: 50, opened: false },
    };
  }

  update() {
    if (this.gameState !== 'playing') return;

    // Get input
    const moveLeft = this.keys['ArrowLeft'] || this.keys['a'] || this.touchControls.left;
    const moveRight = this.keys['ArrowRight'] || this.keys['d'] || this.touchControls.right;
    const jump = this.keys['ArrowUp'] || this.keys['w'] || this.keys[' '] || this.touchControls.jump;
    const shoot = this.keys[' '] || this.touchControls.shoot;

    // Update player
    if (this.player.alive) {
      // Horizontal movement
      this.player.velocityX = 0;
      if (moveLeft) {
        this.player.velocityX = -5;
        this.player.direction = -1;
      }
      if (moveRight) {
        this.player.velocityX = 5;
        this.player.direction = 1;
      }

      // Jump
      if (jump && this.player.canJump && this.player.onGround) {
        this.player.jumpPower = Math.min(this.player.jumpPower + 0.3, 12);
        this.player.velocityY = -this.player.jumpPower;
        this.player.onGround = false;
      } else if (!jump) {
        this.player.jumpPower = 0;
        this.player.canJump = false;
      }

      // Gravity
      if (!this.player.onGround) {
        this.player.velocityY += this.GRAVITY;
        if (this.player.velocityY > this.TERMINAL_VELOCITY) {
          this.player.velocityY = this.TERMINAL_VELOCITY;
        }
      } else {
        this.player.velocityY = 0;
      }

      // Apply velocity
      this.player.x += this.player.velocityX;
      this.player.y += this.player.velocityY;

      // Boundary check
      if (this.player.x < 0) this.player.x = 0;
      if (this.player.x + this.player.width > 700) this.player.x = 700 - this.player.width;

      // Platform collision
      this.player.onGround = false;
      this.platforms.forEach((platform) => {
        if (
          this.player.x + this.player.width > platform.x &&
          this.player.x < platform.x + platform.width &&
          this.player.y + this.player.height >= platform.y &&
          this.player.y + this.player.height <= platform.y + platform.height + 10 &&
          this.player.velocityY >= 0
        ) {
          this.player.y = platform.y - this.player.height;
          this.player.velocityY = 0;
          this.player.onGround = true;
          this.player.canJump = true;
        }
      });

      // Falling off screen
      if (this.player.y > 400) {
        this.loseLife();
      }

      // Shoot
      if (shoot) {
        this.createProjectile();
        this.keys[' '] = false;
        this.touchControls.shoot = false;
      }
    }

    // Update enemies
    this.enemies.forEach((enemy) => {
      enemy.x += enemy.direction * enemy.speed;
      if (enemy.x <= enemy.minX || enemy.x >= enemy.maxX) {
        enemy.direction *= -1;
      }
    });

    // Update projectiles
    this.projectiles = this.projectiles.filter((proj) => {
      proj.x += proj.velocityX;
      proj.y += proj.velocityY;
      proj.velocityY += this.GRAVITY;
      return proj.x > -50 && proj.x < 750 && proj.y < 400;
    });

    // Projectile-enemy collision
    this.projectiles.forEach((proj) => {
      this.enemies.forEach((enemy, index) => {
        if (
          proj.x < enemy.x + enemy.width &&
          proj.x + proj.width > enemy.x &&
          proj.y < enemy.y + enemy.height &&
          proj.y + proj.height > enemy.y
        ) {
          this.enemies.splice(index, 1);
          proj.active = false;
          this.enemiesKilled++;
          this.score += 25;
        }
      });
    });

    // Player-enemy collision
    this.enemies.forEach((enemy) => {
      if (
        this.player.x + this.player.width > enemy.x &&
        this.player.x < enemy.x + enemy.width &&
        this.player.y + this.player.height > enemy.y &&
        this.player.y < enemy.y + enemy.height
      ) {
        // Check if jumping on enemy
        if (this.player.velocityY > 0 && this.player.y + this.player.height - this.player.velocityY <= enemy.y) {
          // Jump on enemy
          this.enemies.splice(this.enemies.indexOf(enemy), 1);
          this.player.velocityY = -8;
          this.enemiesKilled++;
          this.score += 25;
        } else {
          this.loseLife();
        }
      }
    });

    // Hazard collision
    this.hazards.forEach((hazard) => {
      if (
        this.player.x + this.player.width > hazard.x &&
        this.player.x < hazard.x + hazard.width &&
        this.player.y + this.player.height > hazard.y &&
        this.player.y < hazard.y + hazard.height
      ) {
        this.loseLife();
      }
    });

    // Collectible pickup
    this.collectibles = this.collectibles.filter((item) => {
      if (
        this.player.x + this.player.width > item.x &&
        this.player.x < item.x + 20 &&
        this.player.y + this.player.height > item.y &&
        this.player.y < item.y + 20
      ) {
        if (item.type === 'key') {
          item.collected = true;
        } else if (item.type === 'coin') {
          this.coins++;
          this.score += 10;
          return false; // remove coin
        }
      }
      return !item.collected || item.type !== 'key';
    });

    // Check level completion
    const keysCollected = this.collectibles.filter((item) => item.type === 'key' && item.collected).length;
    const keysNeeded = this.collectibles.filter((item) => item.type === 'key').length;

    if (keysCollected === keysNeeded && keysNeeded > 0) {
      this.door.opened = true;
    }

    // Door collision
    if (
      this.door.opened &&
      this.player.x + this.player.width > this.door.x &&
      this.player.x < this.door.x + this.door.width &&
      this.player.y + this.player.height > this.door.y &&
      this.player.y < this.door.y + this.door.height
    ) {
      this.completeLevel();
    }

    this.updateUI();
  }

  createProjectile() {
    this.projectiles.push({
      x: this.player.x + (this.player.direction > 0 ? this.player.width : 0),
      y: this.player.y + 10,
      width: 6,
      height: 6,
      velocityX: this.player.direction * 8,
      velocityY: -2,
      active: true,
    });
  }

  loseLife() {
    this.lives--;
    if (this.lives <= 0) {
      this.gameState = 'gameOver';
      this.player.alive = false;
    } else {
      this.loadLevel(this.currentLevel);
    }
  }

  completeLevel() {
    this.score += 100;
    if (this.currentLevel === 2) {
      this.gameState = 'gameComplete';
    } else {
      this.currentLevel++;
      this.loadLevel(this.currentLevel);
    }
  }

  updateUI() {
    const keysCollected = this.collectibles.filter((item) => item.type === 'key' && item.collected).length;
    const keysNeeded = this.collectibles.filter((item) => item.type === 'key').length;

    const levelSpan = this.container.querySelector('.robot-escape-level');
    const keysSpan = this.container.querySelector('.robot-escape-keys');
    const livesSpan = this.container.querySelector('.robot-escape-lives');
    const scoreSpan = this.container.querySelector('.robot-escape-score');

    if (levelSpan) levelSpan.textContent = this.currentLevel + 1;
    if (keysSpan) keysSpan.textContent = `${keysCollected}/${keysNeeded}`;
    if (livesSpan) livesSpan.textContent = this.lives;
    if (scoreSpan) scoreSpan.textContent = this.score;
  }

  render() {
    const ctx = this.ctx;
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Camera follow
    const cameraX = Math.max(0, Math.min(this.player.x - 200, 700 - this.canvas.width));

    ctx.save();
    ctx.translate(-cameraX, 0);

    // Draw platforms
    ctx.fillStyle = '#8B4513';
    this.platforms.forEach((platform) => {
      ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
      ctx.strokeStyle = '#654321';
      ctx.lineWidth = 2;
      ctx.strokeRect(platform.x, platform.y, platform.width, platform.height);
    });

    // Draw hazards (spikes)
    ctx.fillStyle = '#FF6347';
    this.hazards.forEach((hazard) => {
      ctx.fillRect(hazard.x, hazard.y, hazard.width, hazard.height);
      // Draw spike pattern
      ctx.strokeStyle = '#FF1744';
      ctx.lineWidth = 1;
      for (let i = 0; i < hazard.width; i += 8) {
        ctx.beginPath();
        ctx.moveTo(hazard.x + i, hazard.y + hazard.height);
        ctx.lineTo(hazard.x + i + 4, hazard.y);
        ctx.lineTo(hazard.x + i + 8, hazard.y + hazard.height);
        ctx.stroke();
      }
    });

    // Draw door
    if (this.door) {
      ctx.fillStyle = this.door.opened ? '#90EE90' : '#FFD700';
      ctx.fillRect(this.door.x, this.door.y, this.door.width, this.door.height);
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.strokeRect(this.door.x, this.door.y, this.door.width, this.door.height);
      ctx.fillStyle = '#000';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(this.door.opened ? 'EXIT' : 'DOOR', this.door.x + this.door.width / 2, this.door.y + this.door.height / 2 + 4);
    }

    // Draw collectibles
    this.collectibles.forEach((item) => {
      if (!item.collected) {
        if (item.type === 'key') {
          ctx.fillStyle = '#FFD700';
          ctx.fillRect(item.x, item.y, 20, 20);
          ctx.strokeStyle = '#FFA500';
          ctx.lineWidth = 2;
          ctx.strokeRect(item.x, item.y, 20, 20);
        } else if (item.type === 'coin') {
          ctx.fillStyle = '#FFD700';
          ctx.beginPath();
          ctx.arc(item.x + 10, item.y + 10, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#FFA500';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }
    });

    // Draw enemies
    ctx.fillStyle = '#FF6347';
    this.enemies.forEach((enemy) => {
      ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
      ctx.strokeStyle = '#FF1744';
      ctx.lineWidth = 2;
      ctx.strokeRect(enemy.x, enemy.y, enemy.width, enemy.height);
      // Draw eyes
      ctx.fillStyle = '#FFF';
      ctx.fillRect(enemy.x + 3, enemy.y + 3, 4, 4);
      ctx.fillRect(enemy.x + 13, enemy.y + 3, 4, 4);
      ctx.fillStyle = '#000';
      ctx.fillRect(enemy.x + 4, enemy.y + 4, 2, 2);
      ctx.fillRect(enemy.x + 14, enemy.y + 4, 2, 2);
    });

    // Draw projectiles
    ctx.fillStyle = '#FFD700';
    this.projectiles.forEach((proj) => {
      ctx.fillRect(proj.x, proj.y, proj.width, proj.height);
      ctx.strokeStyle = '#FFA500';
      ctx.lineWidth = 1;
      ctx.strokeRect(proj.x, proj.y, proj.width, proj.height);
    });

    // Draw player
    ctx.fillStyle = '#4169E1';
    ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
    ctx.strokeStyle = '#000080';
    ctx.lineWidth = 2;
    ctx.strokeRect(this.player.x, this.player.y, this.player.width, this.player.height);

    // Draw robot face
    ctx.fillStyle = '#FFF';
    ctx.fillRect(this.player.x + 4, this.player.y + 5, 4, 4);
    ctx.fillRect(this.player.x + 12, this.player.y + 5, 4, 4);
    ctx.fillStyle = '#000';
    ctx.fillRect(this.player.x + 5, this.player.y + 6, 2, 2);
    ctx.fillRect(this.player.x + 13, this.player.y + 6, 2, 2);

    // Mouth
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(this.player.x + 6, this.player.y + 14);
    ctx.lineTo(this.player.x + 14, this.player.y + 14);
    ctx.stroke();

    ctx.restore();

    // Draw UI overlay
    this.renderUI();
  }

  renderUI() {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(0, 0, this.canvas.width, 30);

    if (this.gameState === 'gameOver') {
      ctx.fillStyle = '#000';
      ctx.font = 'bold 32px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 20);
      ctx.font = '16px Arial';
      ctx.fillText('Press SPACE to restart or click START', this.canvas.width / 2, this.canvas.height / 2 + 20);
    }

    if (this.gameState === 'gameComplete') {
      ctx.fillStyle = '#000';
      ctx.font = 'bold 32px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('YOU WIN!', this.canvas.width / 2, this.canvas.height / 2 - 20);
      ctx.font = '16px Arial';
      ctx.fillText(`Final Score: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2 + 20);
      ctx.fillText('Press SPACE to play again or click START', this.canvas.width / 2, this.canvas.height / 2 + 50);
    }
  }

  animate() {
    this.update();
    this.render();

    if (this.gameState === 'playing' || this.gameState === 'levelComplete') {
      this.animationFrameId = requestAnimationFrame(() => this.animate());
    } else if (this.gameState === 'gameOver' || this.gameState === 'gameComplete') {
      if (this.keys[' ']) {
        this.start();
      } else {
        this.animationFrameId = requestAnimationFrame(() => this.animate());
      }
    }
  }

  pause() {
    if (this.gameState === 'playing') {
      this.gameState = 'paused';
    }
  }

  resume() {
    if (this.gameState === 'paused') {
      this.gameState = 'playing';
      this.animate();
    }
  }

  destroy() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.gameState = 'menu';
    window.removeEventListener('keydown', this._handleKeyDown);
    window.removeEventListener('keyup', this._handleKeyUp);
    if (this.mobileUI) {
      this.mobileUI.removeEventListener('touchstart', this._handleTouchStart);
      this.mobileUI.removeEventListener('touchend', this._handleTouchEnd);
      this.mobileUI.removeEventListener('mousedown', this._handleMouseDown);
      this.mobileUI.removeEventListener('mouseup', this._handleMouseUp);
    }
    if (this.container) {
      this.container.innerHTML = '';
    }
  }

  getScore() {
    return this.score;
  }
}

window.RobotEscape = RobotEscape;
