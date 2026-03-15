class Galaga {
  constructor(container) {
    this.container = container;
    this.canvas = null;
    this.ctx = null;
    this.gameRunning = false;
    this.gamePaused = false;
    this.gameOver = false;
    
    // Game state
    this.score = 0;
    this.lives = 3;
    this.wave = 1;
    this.enemies = [];
    this.bullets = [];
    this.enemyBullets = [];
    this.explosions = [];
    
    // Player
    this.player = {
      x: 250,
      y: 560,
      width: 30,
      height: 30,
      speed: 5,
      dx: 0,
      bullets: 0,
      maxBullets: 2
    };
    
    // Game dimensions
    this.width = 500;
    this.height = 600;
    
    // Starfield
    this.stars = [];
    
    // Formation control
    this.formationX = 0;
    this.formationY = 100;
    this.formationSpeed = 1;
    this.formationDirection = 1;
    this.formationSway = 0;
    this.swaySpeed = 0.03;
    this.divingEnemies = new Set();
    
    // Timing
    this.lastDiveTime = 0;
    this.diveInterval = 3000;
    this.enemyBulletTime = 0;
    this.enemyBulletInterval = 500;
    this.waveStartTime = 0;
    
    this.init();
  }

  init() {
    // Create canvas
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.canvas.className = 'galaga-game-canvas';
    this.ctx = this.canvas.getContext('2d');
    
    // Create UI container
    this.uiContainer = document.createElement('div');
    this.uiContainer.className = 'galaga-ui';
    
    // Score display
    this.scoreDisplay = document.createElement('div');
    this.scoreDisplay.className = 'galaga-score';
    this.scoreDisplay.textContent = `Score: 0`;
    
    // Lives display
    this.livesDisplay = document.createElement('div');
    this.livesDisplay.className = 'galaga-lives';
    this.livesDisplay.textContent = `Lives: 3`;
    
    // Wave display
    this.waveDisplay = document.createElement('div');
    this.waveDisplay.className = 'galaga-wave';
    this.waveDisplay.textContent = `Wave: 1`;
    
    this.uiContainer.appendChild(this.scoreDisplay);
    this.uiContainer.appendChild(this.livesDisplay);
    this.uiContainer.appendChild(this.waveDisplay);
    
    // Mobile controls container
    this.controlsContainer = document.createElement('div');
    this.controlsContainer.className = 'galaga-controls';
    
    // Left button
    const leftBtn = document.createElement('button');
    leftBtn.className = 'galaga-btn galaga-btn-left';
    leftBtn.innerHTML = '◀';
    leftBtn.addEventListener('mousedown', () => this.player.dx = -this.player.speed);
    leftBtn.addEventListener('mouseup', () => this.player.dx = 0);
    leftBtn.addEventListener('touchstart', (e) => { e.preventDefault(); this.player.dx = -this.player.speed; });
    leftBtn.addEventListener('touchend', () => this.player.dx = 0);
    
    // Right button
    const rightBtn = document.createElement('button');
    rightBtn.className = 'galaga-btn galaga-btn-right';
    rightBtn.innerHTML = '▶';
    rightBtn.addEventListener('mousedown', () => this.player.dx = this.player.speed);
    rightBtn.addEventListener('mouseup', () => this.player.dx = 0);
    rightBtn.addEventListener('touchstart', (e) => { e.preventDefault(); this.player.dx = this.player.speed; });
    rightBtn.addEventListener('touchend', () => this.player.dx = 0);
    
    // Fire button
    const fireBtn = document.createElement('button');
    fireBtn.className = 'galaga-btn galaga-btn-fire';
    fireBtn.innerHTML = '🔥';
    fireBtn.addEventListener('click', () => this.playerFire());
    fireBtn.addEventListener('touchstart', (e) => { e.preventDefault(); this.playerFire(); });
    
    this.controlsContainer.appendChild(leftBtn);
    this.controlsContainer.appendChild(rightBtn);
    this.controlsContainer.appendChild(fireBtn);
    
    // Game over overlay
    this.gameOverOverlay = document.createElement('div');
    this.gameOverOverlay.className = 'galaga-game-over';
    this.gameOverOverlay.style.display = 'none';
    
    const gameOverContent = document.createElement('div');
    gameOverContent.className = 'galaga-game-over-content';
    
    const gameOverTitle = document.createElement('h2');
    gameOverTitle.textContent = 'GAME OVER';
    
    const finalScore = document.createElement('p');
    finalScore.className = 'galaga-final-score';
    finalScore.textContent = `Final Score: 0`;
    
    const restartBtn = document.createElement('button');
    restartBtn.className = 'galaga-restart-btn';
    restartBtn.textContent = 'Restart';
    restartBtn.addEventListener('click', () => this.start());
    
    gameOverContent.appendChild(gameOverTitle);
    gameOverContent.appendChild(finalScore);
    gameOverContent.appendChild(restartBtn);
    this.gameOverOverlay.appendChild(gameOverContent);
    this.finalScoreEl = finalScore;
    
    // Pause display
    this.pauseOverlay = document.createElement('div');
    this.pauseOverlay.className = 'galaga-pause';
    this.pauseOverlay.style.display = 'none';
    this.pauseOverlay.innerHTML = '<p>PAUSED</p>';
    
    // Add to container
    this.container.innerHTML = '';
    this.container.appendChild(this.canvas);
    this.container.appendChild(this.uiContainer);
    this.container.appendChild(this.controlsContainer);
    this.container.appendChild(this.gameOverOverlay);
    this.container.appendChild(this.pauseOverlay);
    
    // Initialize starfield
    this.initStarfield();
    
    // Event listeners
    this.setupKeyboardControls();
  }

  initStarfield() {
    this.stars = [];
    for (let i = 0; i < 100; i++) {
      this.stars.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        radius: Math.random() * 1.5,
        speed: Math.random() * 0.5 + 0.2
      });
    }
  }

  setupKeyboardControls() {
    this.keyState = {};
    
    document.addEventListener('keydown', (e) => {
      this.keyState[e.key.toLowerCase()] = true;
      
      if (e.key === ' ') {
        e.preventDefault();
        this.playerFire();
      }
      
      if (e.key === 'p' || e.key === 'P') {
        if (this.gameRunning && !this.gameOver) {
          if (this.gamePaused) this.resume();
          else this.pause();
        }
      }
    });
    
    document.addEventListener('keyup', (e) => {
      this.keyState[e.key.toLowerCase()] = false;
    });
  }

  start() {
    this.score = 0;
    this.lives = 3;
    this.wave = 1;
    this.enemies = [];
    this.bullets = [];
    this.enemyBullets = [];
    this.explosions = [];
    this.gameRunning = true;
    this.gamePaused = false;
    this.gameOver = false;
    this.player.bullets = 0;
    this.player.x = 250;
    
    this.gameOverOverlay.style.display = 'none';
    this.pauseOverlay.style.display = 'none';
    
    this.initStarfield();
    this.spawnWave();
    this.updateUI();
    this.gameLoop();
  }

  spawnWave() {
    this.enemies = [];
    this.formationX = 0;
    this.formationY = 100;
    this.formationDirection = 1;
    this.waveStartTime = Date.now();
    
    // Spawn enemy formation (4-5 rows x 6 columns)
    const rows = 4 + Math.floor(this.wave / 3);
    const cols = 6;
    const spacing = 60;
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const isBoss = row === 0 && col === 2 || col === 3; // Boss enemies in front row
        this.enemies.push({
          x: col * spacing + 50,
          y: row * spacing + this.formationY,
          baseX: col * spacing + 50,
          baseY: row * spacing + this.formationY,
          width: 30,
          height: 30,
          speed: 2,
          health: isBoss ? 2 : 1,
          maxHealth: isBoss ? 2 : 1,
          isBoss: isBoss,
          divingTarget: null,
          divingProgress: 0,
          isDiving: false
        });
      }
    }
  }

  playerFire() {
    if (this.player.bullets < this.player.maxBullets && this.gameRunning && !this.gamePaused) {
      this.bullets.push({
        x: this.player.x + this.player.width / 2 - 2,
        y: this.player.y,
        width: 4,
        height: 15,
        speed: 7
      });
      this.player.bullets++;
    }
  }

  gameLoop() {
    if (!this.gameRunning) return;
    
    if (!this.gamePaused) {
      this.update();
    }
    
    this.render();
    requestAnimationFrame(() => this.gameLoop());
  }

  update() {
    // Update player
    this.player.x += this.keyState['arrowleft'] ? -this.player.speed : 0;
    this.player.x += this.keyState['arrowright'] ? this.player.speed : 0;
    this.player.x = Math.max(0, Math.min(this.width - this.player.width, this.player.x));
    
    // Update starfield
    this.stars.forEach(star => {
      star.y += star.speed;
      if (star.y > this.height) {
        star.y = 0;
        star.x = Math.random() * this.width;
      }
    });
    
    // Update formation sway
    this.formationSway += this.swaySpeed;
    const swayAmount = Math.sin(this.formationSway) * 15;
    
    // Update enemies in formation
    this.enemies.forEach((enemy, idx) => {
      if (!enemy.isDiving) {
        // Formation movement
        enemy.x = enemy.baseX + this.formationX + swayAmount;
        enemy.y = enemy.baseY + this.formationY;
        
        // Boundary bounce
        if (this.formationX > 100 || this.formationX < -100) {
          this.formationDirection *= -1;
          this.formationY += 40;
        }
      }
    });
    
    // Move formation
    this.formationX += this.formationDirection * this.formationSpeed;
    
    // Initiate enemy dives
    if (Date.now() - this.lastDiveTime > this.diveInterval) {
      if (this.enemies.length > 0) {
        const randomIdx = Math.floor(Math.random() * this.enemies.length);
        const divingEnemy = this.enemies[randomIdx];
        
        if (!divingEnemy.isDiving && !this.divingEnemies.has(randomIdx)) {
          divingEnemy.isDiving = true;
          divingEnemy.divingTarget = randomIdx;
          divingEnemy.divingProgress = 0;
          this.divingEnemies.add(randomIdx);
          this.lastDiveTime = Date.now();
        }
      }
    }
    
    // Update diving enemies
    this.enemies.forEach((enemy, idx) => {
      if (enemy.isDiving) {
        enemy.divingProgress += 0.02;
        
        if (enemy.divingProgress >= 1) {
          enemy.isDiving = false;
          this.divingEnemies.delete(idx);
        } else {
          // Curved diving path
          const startX = enemy.baseX;
          const startY = enemy.baseY;
          const endX = this.player.x + this.player.width / 2;
          const endY = this.height + 50;
          
          // Bezier curve for diving path
          const controlX = (startX + endX) / 2 + Math.sin(enemy.divingProgress * Math.PI) * 80;
          const controlY = startY / 2;
          
          const t = enemy.divingProgress;
          enemy.x = (1-t)*(1-t)*startX + 2*(1-t)*t*controlX + t*t*endX;
          enemy.y = (1-t)*(1-t)*startY + 2*(1-t)*t*controlY + t*t*endY;
        }
      }
    });
    
    // Update bullets
    this.bullets.forEach((bullet, idx) => {
      bullet.y -= bullet.speed;
      
      // Remove if off screen
      if (bullet.y < 0) {
        this.bullets.splice(idx, 1);
        this.player.bullets--;
      }
    });
    
    // Enemy fire
    if (Date.now() - this.enemyBulletTime > this.enemyBulletInterval) {
      const divingEnemiesList = this.enemies.filter(e => e.isDiving && e.divingProgress > 0.3 && e.divingProgress < 0.8);
      if (divingEnemiesList.length > 0) {
        const shooter = divingEnemiesList[Math.floor(Math.random() * divingEnemiesList.length)];
        this.enemyBullets.push({
          x: shooter.x + shooter.width / 2 - 2,
          y: shooter.y + shooter.height,
          width: 4,
          height: 10,
          speed: 4
        });
      }
      this.enemyBulletTime = Date.now();
    }
    
    // Update enemy bullets
    this.enemyBullets.forEach((bullet, idx) => {
      bullet.y += bullet.speed;
      if (bullet.y > this.height) {
        this.enemyBullets.splice(idx, 1);
      }
    });
    
    // Collision detection: player bullets vs enemies
    this.bullets.forEach((bullet, bIdx) => {
      this.enemies.forEach((enemy, eIdx) => {
        if (this.isColliding(bullet, enemy)) {
          enemy.health--;
          this.explosions.push({
            x: enemy.x + enemy.width / 2,
            y: enemy.y + enemy.height / 2,
            life: 15,
            maxLife: 15
          });
          
          if (enemy.health <= 0) {
            // Score based on enemy type and whether diving
            if (enemy.isDiving) {
              this.score += 150;
            } else if (enemy.isBoss) {
              this.score += 200;
            } else {
              this.score += 50 + Math.floor(Math.random() * 50);
            }
            
            this.enemies.splice(eIdx, 1);
            if (this.divingEnemies.has(eIdx)) {
              this.divingEnemies.delete(eIdx);
            }
          }
          
          // Remove bullet
          this.bullets.splice(bIdx, 1);
          this.player.bullets--;
        }
      });
    });
    
    // Collision detection: enemy bullets vs player
    this.enemyBullets.forEach((bullet, idx) => {
      if (this.isColliding(bullet, this.player)) {
        this.lives--;
        this.enemyBullets.splice(idx, 1);
        this.explosions.push({
          x: this.player.x + this.player.width / 2,
          y: this.player.y + this.player.height / 2,
          life: 20,
          maxLife: 20
        });
        
        if (this.lives <= 0) {
          this.gameOver = true;
          this.gameRunning = false;
        }
      }
    });
    
    // Update explosions
    this.explosions.forEach((exp, idx) => {
      exp.life--;
      if (exp.life <= 0) {
        this.explosions.splice(idx, 1);
      }
    });
    
    // Wave complete
    if (this.enemies.length === 0 && this.gameRunning && !this.gameOver) {
      this.wave++;
      this.spawnWave();
    }
    
    this.updateUI();
  }

  isColliding(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
  }

  render() {
    // Clear canvas
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, this.width, this.height);
    
    // Draw starfield
    this.ctx.fillStyle = '#fff';
    this.stars.forEach(star => {
      this.ctx.beginPath();
      this.ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      this.ctx.fill();
    });
    
    // Draw enemies
    this.enemies.forEach(enemy => {
      if (enemy.isBoss) {
        // Boss appearance changes based on health
        this.ctx.fillStyle = enemy.health === 2 ? '#ff0000' : '#ff6600';
        this.ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
        
        // Boss outline
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(enemy.x, enemy.y, enemy.width, enemy.height);
        
        // Boss eyes
        this.ctx.fillStyle = '#fff';
        this.ctx.fillRect(enemy.x + 5, enemy.y + 5, 6, 6);
        this.ctx.fillRect(enemy.x + 19, enemy.y + 5, 6, 6);
      } else {
        // Regular enemy
        this.ctx.fillStyle = '#00ff00';
        this.ctx.beginPath();
        this.ctx.moveTo(enemy.x + enemy.width / 2, enemy.y);
        this.ctx.lineTo(enemy.x + enemy.width, enemy.y + enemy.height);
        this.ctx.lineTo(enemy.x, enemy.y + enemy.height);
        this.ctx.closePath();
        this.ctx.fill();
      }
    });
    
    // Draw player
    this.ctx.fillStyle = '#00ffff';
    this.ctx.beginPath();
    this.ctx.moveTo(this.player.x + this.player.width / 2, this.player.y);
    this.ctx.lineTo(this.player.x + this.player.width, this.player.y + this.player.height);
    this.ctx.lineTo(this.player.x, this.player.y + this.player.height);
    this.ctx.closePath();
    this.ctx.fill();
    
    // Draw bullets
    this.ctx.fillStyle = '#ffff00';
    this.bullets.forEach(bullet => {
      this.ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    });
    
    // Draw enemy bullets
    this.ctx.fillStyle = '#ff00ff';
    this.enemyBullets.forEach(bullet => {
      this.ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    });
    
    // Draw explosions
    this.explosions.forEach(exp => {
      const alpha = exp.life / exp.maxLife;
      this.ctx.globalAlpha = alpha;
      this.ctx.fillStyle = '#ff6600';
      this.ctx.beginPath();
      this.ctx.arc(exp.x, exp.y, 15 * (1 - alpha), 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.globalAlpha = 1;
    });
    
    // Draw game over
    if (this.gameOver) {
      this.gameOverOverlay.style.display = 'flex';
      this.finalScoreEl.textContent = `Final Score: ${this.score}`;
    }
  }

  updateUI() {
    this.scoreDisplay.textContent = `Score: ${this.score}`;
    this.livesDisplay.textContent = `Lives: ${this.lives}`;
    this.waveDisplay.textContent = `Wave: ${this.wave}`;
  }

  pause() {
    if (this.gameRunning && !this.gameOver) {
      this.gamePaused = true;
      this.pauseOverlay.style.display = 'flex';
    }
  }

  resume() {
    if (this.gameRunning && this.gamePaused) {
      this.gamePaused = false;
      this.pauseOverlay.style.display = 'none';
    }
  }

  destroy() {
    this.gameRunning = false;
    document.removeEventListener('keydown', null);
    document.removeEventListener('keyup', null);
    if (this.container) {
      this.container.innerHTML = '';
    }
  }

  getScore() {
    return this.score;
  }
}

window.Galaga = Galaga;
