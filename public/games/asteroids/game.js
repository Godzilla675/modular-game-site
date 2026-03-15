class Asteroids {
  constructor(container) {
    this.container = container;
    this.canvas = null;
    this.ctx = null;
    this.gameWidth = 600;
    this.gameHeight = 600;

    // Game state
    this.score = 0;
    this.lives = 3;
    this.wave = 1;
    this.gameOver = false;
    this.paused = false;
    this.invulnerable = false;
    this.invulnerableTime = 0;

    // Game objects
    this.ship = null;
    this.bullets = [];
    this.asteroids = [];
    this.particles = [];

    // Input
    this.keys = {};
    this.mobileControls = {};

    // Animation frame
    this.gameLoopId = null;
    this.lastTime = Date.now();

    this.init();
  }

  init() {
    // Create canvas
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'asteroids-game-canvas game-canvas';
    this.canvas.width = this.gameWidth;
    this.canvas.height = this.gameHeight;
    this.ctx = this.canvas.getContext('2d');

    // Create container for game UI
    const gameContainer = document.createElement('div');
    gameContainer.className = 'asteroids-container';
    gameContainer.appendChild(this.canvas);

    // Create game over overlay
    this.gameOverOverlay = document.createElement('div');
    this.gameOverOverlay.className = 'asteroids-game-over';
    this.gameOverOverlay.innerHTML = `
      <div class="asteroids-game-over-content">
        <h2>GAME OVER</h2>
        <p class="asteroids-final-score">Score: <span id="asteroids-score">0</span></p>
        <button class="asteroids-play-btn">PLAY AGAIN</button>
      </div>
    `;
    this.gameOverOverlay.style.display = 'none';
    gameContainer.appendChild(this.gameOverOverlay);

    // Create mobile controls
    const controls = document.createElement('div');
    controls.className = 'asteroids-mobile-controls';
    controls.innerHTML = `
      <button class="asteroids-btn asteroids-btn-rotate-left" data-action="rotate-left">←</button>
      <button class="asteroids-btn asteroids-btn-thrust" data-action="thrust">↑</button>
      <button class="asteroids-btn asteroids-btn-rotate-right" data-action="rotate-right">→</button>
      <button class="asteroids-btn asteroids-btn-shoot" data-action="shoot">SHOOT</button>
    `;
    gameContainer.appendChild(controls);

    // Create info display
    const info = document.createElement('div');
    info.className = 'asteroids-info';
    info.innerHTML = `
      <div class="asteroids-score-display">Score: <span id="asteroids-score-text">0</span></div>
      <div class="asteroids-lives-display">Lives: <span id="asteroids-lives-text">3</span></div>
      <div class="asteroids-wave-display">Wave: <span id="asteroids-wave-text">1</span></div>
    `;
    gameContainer.appendChild(info);

    this.container.appendChild(gameContainer);

    // Setup event listeners
    this.setupEventListeners();

    // Initialize ship
    this.ship = {
      x: this.gameWidth / 2,
      y: this.gameHeight / 2,
      vx: 0,
      vy: 0,
      angle: 0,
      radius: 12,
      rotationSpeed: 300,
      thrustPower: 0.5,
      thrusting: false,
      maxVelocity: 6
    };
  }

  setupEventListeners() {
    // Keyboard controls (store bound handlers for cleanup in destroy())
    this.handleKeyDown = (e) => {
      this.keys[e.key] = true;
      if (e.key === ' ') {
        e.preventDefault();
        this.shoot();
      }
    };
    this.handleKeyUp = (e) => {
      this.keys[e.key] = false;
    };
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);

    // Mobile touch controls
    const buttons = this.container.querySelectorAll('.asteroids-btn');
    buttons.forEach((btn) => {
      btn.addEventListener('mousedown', (e) => {
        const action = btn.dataset.action;
        this.mobileControls[action] = true;
        e.preventDefault();
      });

      btn.addEventListener('mouseup', (e) => {
        const action = btn.dataset.action;
        this.mobileControls[action] = false;
        e.preventDefault();
      });

      btn.addEventListener('touchstart', (e) => {
        const action = btn.dataset.action;
        this.mobileControls[action] = true;
        e.preventDefault();
      });

      btn.addEventListener('touchend', (e) => {
        const action = btn.dataset.action;
        this.mobileControls[action] = false;
        e.preventDefault();
      });
    });

    // Game over button
    const playAgainBtn = this.container.querySelector('.asteroids-play-btn');
    playAgainBtn.addEventListener('click', () => {
      this.start();
    });
  }

  start() {
    this.score = 0;
    this.lives = 3;
    this.wave = 1;
    this.gameOver = false;
    this.paused = false;
    this.bullets = [];
    this.particles = [];
    this.gameOverOverlay.style.display = 'none';

    // Reset ship
    this.ship.x = this.gameWidth / 2;
    this.ship.y = this.gameHeight / 2;
    this.ship.vx = 0;
    this.ship.vy = 0;
    this.ship.angle = 0;

    // Spawn initial asteroids
    this.spawnWave();

    // Start game loop
    this.gameLoopId = requestAnimationFrame(() => this.gameLoop());
  }

  pause() {
    this.paused = true;
  }

  resume() {
    this.paused = false;
  }

  destroy() {
    if (this.gameLoopId) {
      cancelAnimationFrame(this.gameLoopId);
    }
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    if (this.container) {
      this.container.innerHTML = '';
    }
  }

  getScore() {
    return this.score;
  }

  gameLoop() {
    const currentTime = Date.now();
    const deltaTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;

    // Limit delta time to avoid large jumps
    const dt = Math.min(deltaTime, 0.016);

    if (!this.paused && !this.gameOver) {
      this.update(dt);
    }

    this.render();

    this.gameLoopId = requestAnimationFrame(() => this.gameLoop());
  }

  update(dt) {
    // Handle input
    this.handleInput(dt);

    // Update ship
    this.updateShip(dt);

    // Update bullets
    this.updateBullets(dt);

    // Update asteroids
    this.updateAsteroids(dt);

    // Update particles
    this.updateParticles(dt);

    // Update invulnerability
    if (this.invulnerable) {
      this.invulnerableTime -= dt;
      if (this.invulnerableTime <= 0) {
        this.invulnerable = false;
      }
    }

    // Check collisions
    this.checkCollisions();

    // Check if all asteroids destroyed
    if (this.asteroids.length === 0) {
      this.spawnWave();
    }

    // Update UI
    this.updateUI();
  }

  handleInput(dt) {
    const ship = this.ship;

    // Rotation
    if (this.keys['ArrowLeft'] || this.mobileControls['rotate-left']) {
      ship.angle -= ship.rotationSpeed * dt;
    }
    if (this.keys['ArrowRight'] || this.mobileControls['rotate-right']) {
      ship.angle += ship.rotationSpeed * dt;
    }

    // Thrust
    if (this.keys['ArrowUp'] || this.mobileControls['thrust']) {
      ship.thrusting = true;
      const rad = ship.angle * (Math.PI / 180);
      ship.vx += Math.cos(rad) * ship.thrustPower;
      ship.vy += Math.sin(rad) * ship.thrustPower;

      // Limit velocity
      const speed = Math.sqrt(ship.vx ** 2 + ship.vy ** 2);
      if (speed > ship.maxVelocity) {
        ship.vx = (ship.vx / speed) * ship.maxVelocity;
        ship.vy = (ship.vy / speed) * ship.maxVelocity;
      }
    } else {
      ship.thrusting = false;
    }

    // Shoot
    if (this.mobileControls['shoot']) {
      this.mobileControls['shoot'] = false; // One shot per touch
      this.shoot();
    }
  }

  shoot() {
    if (this.gameOver || this.paused) return;

    const ship = this.ship;
    const rad = ship.angle * (Math.PI / 180);

    const bullet = {
      x: ship.x + Math.cos(rad) * ship.radius,
      y: ship.y + Math.sin(rad) * ship.radius,
      vx: Math.cos(rad) * 7 + ship.vx,
      vy: Math.sin(rad) * 7 + ship.vy,
      life: 1
    };

    this.bullets.push(bullet);
  }

  updateShip(dt) {
    const ship = this.ship;

    // Friction
    ship.vx *= 0.99;
    ship.vy *= 0.99;

    // Move
    ship.x += ship.vx;
    ship.y += ship.vy;

    // Wrap edges
    if (ship.x < 0) ship.x = this.gameWidth;
    if (ship.x > this.gameWidth) ship.x = 0;
    if (ship.y < 0) ship.y = this.gameHeight;
    if (ship.y > this.gameHeight) ship.y = 0;
  }

  updateBullets(dt) {
    this.bullets = this.bullets.filter((bullet) => {
      bullet.x += bullet.vx;
      bullet.y += bullet.vy;
      bullet.life -= dt;

      // Wrap edges
      if (bullet.x < 0) bullet.x = this.gameWidth;
      if (bullet.x > this.gameWidth) bullet.x = 0;
      if (bullet.y < 0) bullet.y = this.gameHeight;
      if (bullet.y > this.gameHeight) bullet.y = 0;

      return bullet.life > 0;
    });
  }

  updateAsteroids(dt) {
    this.asteroids.forEach((asteroid) => {
      asteroid.x += asteroid.vx;
      asteroid.y += asteroid.vy;
      asteroid.rotation += asteroid.rotationSpeed;

      // Wrap edges
      if (asteroid.x < 0) asteroid.x = this.gameWidth;
      if (asteroid.x > this.gameWidth) asteroid.x = 0;
      if (asteroid.y < 0) asteroid.y = this.gameHeight;
      if (asteroid.y > this.gameHeight) asteroid.y = 0;
    });
  }

  updateParticles(dt) {
    this.particles = this.particles.filter((particle) => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.life -= dt;
      particle.vx *= 0.98;
      particle.vy *= 0.98;

      return particle.life > 0;
    });
  }

  checkCollisions() {
    // Bullet-asteroid collisions
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i];
      for (let j = this.asteroids.length - 1; j >= 0; j--) {
        const asteroid = this.asteroids[j];

        const dx = bullet.x - asteroid.x;
        const dy = bullet.y - asteroid.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < asteroid.radius) {
          // Hit!
          this.bullets.splice(i, 1);
          this.destroyAsteroid(j);
          break;
        }
      }
    }

    // Ship-asteroid collisions
    if (!this.invulnerable) {
      for (let i = this.asteroids.length - 1; i >= 0; i--) {
        const asteroid = this.asteroids[i];
        const dx = this.ship.x - asteroid.x;
        const dy = this.ship.y - asteroid.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < this.ship.radius + asteroid.radius) {
          // Ship hit!
          this.shipHit();
          break;
        }
      }
    }
  }

  destroyAsteroid(index) {
    const asteroid = this.asteroids[index];

    // Create particles
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8;
      const speed = 2 + Math.random() * 2;
      this.particles.push({
        x: asteroid.x,
        y: asteroid.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.5
      });
    }

    // Add score
    if (asteroid.size === 0) {
      this.score += 25;
    } else if (asteroid.size === 1) {
      this.score += 50;
    } else {
      this.score += 100;
    }

    // Split asteroid
    if (asteroid.size < 2) {
      const newSize = asteroid.size + 1;
      for (let i = 0; i < 2; i++) {
        this.asteroids.push(this.createAsteroid(asteroid.x, asteroid.y, newSize));
      }
    }

    this.asteroids.splice(index, 1);
  }

  shipHit() {
    this.lives--;

    if (this.lives <= 0) {
      this.endGame();
    } else {
      this.respawnShip();
    }
  }

  respawnShip() {
    this.ship.x = this.gameWidth / 2;
    this.ship.y = this.gameHeight / 2;
    this.ship.vx = 0;
    this.ship.vy = 0;
    this.invulnerable = true;
    this.invulnerableTime = 2;
  }

  endGame() {
    this.gameOver = true;
    this.gameOverOverlay.style.display = 'flex';
    this.container.querySelector('#asteroids-score').textContent = this.score;
  }

  spawnWave() {
    this.wave++;
    this.asteroids = [];

    const asteroidCount = 3 + Math.floor((this.wave - 1) * 0.5);

    for (let i = 0; i < asteroidCount; i++) {
      let x, y;
      // Spawn away from ship
      do {
        x = Math.random() * this.gameWidth;
        y = Math.random() * this.gameHeight;
      } while (
        Math.abs(x - this.ship.x) < 100 &&
        Math.abs(y - this.ship.y) < 100
      );

      this.asteroids.push(this.createAsteroid(x, y, 0));
    }
  }

  createAsteroid(x, y, size) {
    const speeds = [1.5, 2, 2.5];
    const radii = [20, 14, 8];

    return {
      x: x,
      y: y,
      vx: (Math.random() - 0.5) * speeds[size],
      vy: (Math.random() - 0.5) * speeds[size],
      radius: radii[size],
      size: size,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.1
    };
  }

  updateUI() {
    this.container.querySelector('#asteroids-score-text').textContent = this.score;
    this.container.querySelector('#asteroids-lives-text').textContent = this.lives;
    this.container.querySelector('#asteroids-wave-text').textContent = this.wave;
  }

  render() {
    // Clear canvas
    this.ctx.fillStyle = '#0a0a0a';
    this.ctx.fillRect(0, 0, this.gameWidth, this.gameHeight);

    // Draw grid (optional, for style)
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    this.ctx.lineWidth = 0.5;
    const gridSize = 50;
    for (let x = 0; x < this.gameWidth; x += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.gameHeight);
      this.ctx.stroke();
    }
    for (let y = 0; y < this.gameHeight; y += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.gameWidth, y);
      this.ctx.stroke();
    }

    // Draw ship
    this.renderShip();

    // Draw bullets
    this.renderBullets();

    // Draw asteroids
    this.renderAsteroids();

    // Draw particles
    this.renderParticles();

    // Draw invulnerability flash
    if (this.invulnerable && Math.sin(Date.now() * 0.01) > 0) {
      this.ctx.strokeStyle = 'rgba(0, 255, 0, 0.3)';
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.arc(
        this.ship.x,
        this.ship.y,
        this.ship.radius + 5,
        0,
        Math.PI * 2
      );
      this.ctx.stroke();
    }
  }

  renderShip() {
    const ship = this.ship;
    const rad = ship.angle * (Math.PI / 180);

    this.ctx.save();
    this.ctx.translate(ship.x, ship.y);
    this.ctx.rotate(rad);

    // Ship body (triangle)
    this.ctx.strokeStyle = '#00ff00';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(ship.radius, 0);
    this.ctx.lineTo(-ship.radius, -ship.radius);
    this.ctx.lineTo(-ship.radius * 0.5, 0);
    this.ctx.lineTo(-ship.radius, ship.radius);
    this.ctx.closePath();
    this.ctx.stroke();

    // Thrust flame
    if (ship.thrusting) {
      this.ctx.strokeStyle = '#ff6600';
      this.ctx.lineWidth = 1.5;
      this.ctx.beginPath();
      this.ctx.moveTo(-ship.radius, -ship.radius * 0.4);
      this.ctx.lineTo(-ship.radius * 2.5, 0);
      this.ctx.lineTo(-ship.radius, ship.radius * 0.4);
      this.ctx.stroke();
    }

    this.ctx.restore();
  }

  renderBullets() {
    this.ctx.fillStyle = '#ffff00';
    this.bullets.forEach((bullet) => {
      this.ctx.beginPath();
      this.ctx.arc(bullet.x, bullet.y, 2, 0, Math.PI * 2);
      this.ctx.fill();
    });
  }

  renderAsteroids() {
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 2;

    this.asteroids.forEach((asteroid) => {
      this.ctx.save();
      this.ctx.translate(asteroid.x, asteroid.y);
      this.ctx.rotate(asteroid.rotation);

      // Draw jagged asteroid shape
      const points = 8 + asteroid.size * 2;
      this.ctx.beginPath();

      for (let i = 0; i < points; i++) {
        const angle = (Math.PI * 2 * i) / points;
        const variance = 0.7 + Math.random() * 0.3;
        const r = asteroid.radius * variance;
        const x = Math.cos(angle) * r;
        const y = Math.sin(angle) * r;

        if (i === 0) {
          this.ctx.moveTo(x, y);
        } else {
          this.ctx.lineTo(x, y);
        }
      }

      this.ctx.closePath();
      this.ctx.stroke();

      this.ctx.restore();
    });
  }

  renderParticles() {
    this.ctx.fillStyle = '#ffffff';

    this.particles.forEach((particle) => {
      this.ctx.globalAlpha = particle.life;
      this.ctx.fillRect(particle.x - 1, particle.y - 1, 2, 2);
    });

    this.ctx.globalAlpha = 1;
  }
}

window.Asteroids = Asteroids;
