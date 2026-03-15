class AsteroidBlaster {
  constructor(container) {
    this.container = container;
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'asteroid-blaster-game-canvas game-canvas';
    this.canvas.width = 600;
    this.canvas.height = 600;
    this.ctx = this.canvas.getContext('2d');
    
    this.container.appendChild(this.canvas);
    this.container.style.position = 'relative';
    
    // Game state
    this.score = 0;
    this.lives = 3;
    this.wave = 1;
    this.isPaused = false;
    this.isGameOver = false;
    
    // Game objects
    this.ship = null;
    this.asteroids = [];
    this.bullets = [];
    this.particles = [];
    this.powerUps = [];
    
    // Input handling
    this.keys = {};
    this.touch = { x: 0, y: 0, active: false };
    this.virtualJoystick = null;
    
    // Mobile UI
    this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Game timings
    this.gameTime = 0;
    this.lastPowerUpWave = 0;
    this.asteroidSpawnRate = 0.98;
    
    this.setupEventListeners();
    this.createMobileUI();
    
    this.animationId = null;
  }
  
  setupEventListeners() {
    this.keyDownHandler = (e) => {
      this.keys[e.key.toLowerCase()] = true;
      if (e.key === ' ') {
        e.preventDefault();
        this.handleShoot();
      }
    };
    
    this.keyUpHandler = (e) => {
      this.keys[e.key.toLowerCase()] = false;
    };
    
    // Touch controls for mobile
    this.touchStartHandler = (e) => {
      const touch = e.touches[0];
      const rect = this.canvas.getBoundingClientRect();
      this.touch.x = touch.clientX - rect.left;
      this.touch.y = touch.clientY - rect.top;
      this.touch.active = true;
      
      // Check if fire button pressed
      if (this.fireButton && this.fireButton.contains(e.target)) {
        e.preventDefault();
      }
    };
    
    this.touchEndHandler = () => {
      this.touch.active = false;
    };
    
    window.addEventListener('keydown', this.keyDownHandler);
    window.addEventListener('keyup', this.keyUpHandler);
    this.canvas.addEventListener('touchstart', this.touchStartHandler);
    this.canvas.addEventListener('touchend', this.touchEndHandler);
  }
  
  createMobileUI() {
    if (!this.isMobile) return;
    
    // Create mobile control overlay
    const mobileControls = document.createElement('div');
    mobileControls.className = 'asteroid-blaster-mobile-controls';
    
    // Virtual joystick
    const joystick = document.createElement('div');
    joystick.className = 'asteroid-blaster-joystick';
    const joystickKnob = document.createElement('div');
    joystickKnob.className = 'asteroid-blaster-joystick-knob';
    joystick.appendChild(joystickKnob);
    this.virtualJoystick = { element: joystick, knob: joystickKnob, x: 0, y: 0 };
    
    // Fire button
    this.fireButton = document.createElement('button');
    this.fireButton.className = 'asteroid-blaster-fire-btn';
    this.fireButton.textContent = 'FIRE';
    this.fireButton.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.handleShoot();
    });
    
    mobileControls.appendChild(joystick);
    mobileControls.appendChild(this.fireButton);
    this.container.appendChild(mobileControls);
  }
  
  handleShoot() {
    if (!this.ship || this.isPaused || this.isGameOver) return;
    
    const bulletCount = this.ship.spreadShot ? 3 : 1;
    
    if (bulletCount === 3) {
      // Spread shot - 3 bullets at different angles
      for (let i = -1; i <= 1; i++) {
        const angle = this.ship.angle + (i * Math.PI / 6);
        const speed = 5;
        this.bullets.push({
          x: this.ship.x,
          y: this.ship.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 120
        });
      }
    } else {
      // Normal shot
      const speed = 5;
      this.bullets.push({
        x: this.ship.x,
        y: this.ship.y,
        vx: Math.cos(this.ship.angle) * speed,
        vy: Math.sin(this.ship.angle) * speed,
        life: 120
      });
    }
    
    // Rapid fire cooldown
    if (!this.ship.rapidFire) {
      this.ship.canShoot = false;
      setTimeout(() => {
        if (this.ship) this.ship.canShoot = true;
      }, 200);
    } else {
      this.ship.canShoot = false;
      setTimeout(() => {
        if (this.ship) this.ship.canShoot = true;
      }, 50);
    }
  }
  
  start() {
    this.score = 0;
    this.lives = 3;
    this.wave = 1;
    this.gameTime = 0;
    this.isPaused = false;
    this.isGameOver = false;
    this.lastPowerUpWave = 0;
    this.asteroidSpawnRate = 0.98;
    
    this.ship = this.createShip();
    this.asteroids = [];
    this.bullets = [];
    this.particles = [];
    this.powerUps = [];
    
    this.spawnWaveAsteroids();
    this.gameLoop();
  }
  
  pause() {
    this.isPaused = true;
  }
  
  resume() {
    this.isPaused = false;
    if (!this.isGameOver) {
      this.gameLoop();
    }
  }
  
  destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    
    window.removeEventListener('keydown', this.keyDownHandler);
    window.removeEventListener('keyup', this.keyUpHandler);
    this.canvas.removeEventListener('touchstart', this.touchStartHandler);
    this.canvas.removeEventListener('touchend', this.touchEndHandler);
    
    this.container.innerHTML = '';
  }
  
  getScore() {
    return this.score;
  }
  
  createShip() {
    return {
      x: 300,
      y: 300,
      angle: 0,
      vx: 0,
      vy: 0,
      speed: 0.3,
      friction: 0.99,
      radius: 15,
      canShoot: true,
      invulnerable: 180,
      shield: false,
      shieldDuration: 0,
      rapidFire: false,
      rapidFireDuration: 0,
      spreadShot: false,
      spreadShotDuration: 0
    };
  }
  
  spawnWaveAsteroids() {
    const asteroidCount = 3 + this.wave;
    for (let i = 0; i < asteroidCount; i++) {
      const angle = (Math.PI * 2 * i) / asteroidCount;
      const distance = 100;
      const x = 300 + Math.cos(angle) * distance;
      const y = 300 + Math.sin(angle) * distance;
      this.asteroids.push(this.createAsteroid(x, y, 2));
    }
  }
  
  createAsteroid(x, y, size) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1 + (3 - size) * 0.5;
    const points = 8 + size * 2;

    // Pre-compute vertex offsets so the shape doesn't flicker each frame
    const vertices = [];
    for (let i = 0; i < points; i++) {
      vertices.push(0.7 + Math.random() * 0.3);
    }

    return {
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.1,
      radius: size * 15,
      vertices
    };
  }
  
  spawnPowerUp(x, y) {
    const types = ['rapidFire', 'shield', 'spreadShot'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    this.powerUps.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 1,
      vy: (Math.random() - 0.5) * 1 - 2,
      type,
      life: 300,
      rotation: 0,
      rotationSpeed: 0.05
    });
  }
  
  createParticles(x, y, count, color) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const speed = 2 + Math.random() * 2;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        life: 30,
        maxLife: 30,
        size: 2 + Math.random() * 2
      });
    }
  }
  
  gameLoop() {
    if (this.isPaused) {
      this.animationId = requestAnimationFrame(() => this.gameLoop());
      return;
    }
    
    if (this.isGameOver) {
      this.renderGameOver();
      return;
    }
    
    this.update();
    this.render();
    
    this.animationId = requestAnimationFrame(() => this.gameLoop());
  }
  
  update() {
    this.gameTime++;
    
    // Update ship
    if (this.ship) {
      if (this.keys['arrowleft'] || this.keys['a']) {
        this.ship.angle -= 0.15;
      }
      if (this.keys['arrowright'] || this.keys['d']) {
        this.ship.angle += 0.15;
      }
      if (this.keys['arrowup'] || this.keys['w']) {
        this.ship.vx += Math.cos(this.ship.angle) * this.ship.speed;
        this.ship.vy += Math.sin(this.ship.angle) * this.ship.speed;
      }
      
      // Mobile joystick control
      if (this.touch.active && this.virtualJoystick) {
        const joystickX = 70;
        const joystickY = this.canvas.height - 70;
        const dx = this.touch.x - joystickX;
        const dy = this.touch.y - joystickY;
        const distance = Math.hypot(dx, dy);
        
        if (distance > 5) {
          const angle = Math.atan2(dy, dx);
          this.ship.angle = angle;
          if (distance > 30) {
            this.ship.vx += Math.cos(angle) * this.ship.speed;
            this.ship.vy += Math.sin(angle) * this.ship.speed;
          }
        }
      }
      
      // Apply friction
      this.ship.vx *= this.ship.friction;
      this.ship.vy *= this.ship.friction;
      
      // Update position
      this.ship.x += this.ship.vx;
      this.ship.y += this.ship.vy;
      
      // Wrap around screen
      if (this.ship.x < 0) this.ship.x += this.canvas.width;
      if (this.ship.x > this.canvas.width) this.ship.x -= this.canvas.width;
      if (this.ship.y < 0) this.ship.y += this.canvas.height;
      if (this.ship.y > this.canvas.height) this.ship.y -= this.canvas.height;
      
      // Update invulnerability
      if (this.ship.invulnerable > 0) {
        this.ship.invulnerable--;
      }
      
      // Update power-up durations
      if (this.ship.shieldDuration > 0) {
        this.ship.shieldDuration--;
        if (this.ship.shieldDuration === 0) {
          this.ship.shield = false;
        }
      }
      if (this.ship.rapidFireDuration > 0) {
        this.ship.rapidFireDuration--;
        if (this.ship.rapidFireDuration === 0) {
          this.ship.rapidFire = false;
        }
      }
      if (this.ship.spreadShotDuration > 0) {
        this.ship.spreadShotDuration--;
        if (this.ship.spreadShotDuration === 0) {
          this.ship.spreadShot = false;
        }
      }
    }
    
    // Update bullets
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      this.bullets[i].x += this.bullets[i].vx;
      this.bullets[i].y += this.bullets[i].vy;
      this.bullets[i].life--;
      
      if (this.bullets[i].life <= 0) {
        this.bullets.splice(i, 1);
      }
    }
    
    // Update asteroids
    for (let i = 0; i < this.asteroids.length; i++) {
      const ast = this.asteroids[i];
      ast.x += ast.vx;
      ast.y += ast.vy;
      ast.rotation += ast.rotationSpeed;
      
      // Wrap around screen
      if (ast.x < -30) ast.x += this.canvas.width + 60;
      if (ast.x > this.canvas.width + 30) ast.x -= this.canvas.width + 60;
      if (ast.y < -30) ast.y += this.canvas.height + 60;
      if (ast.y > this.canvas.height + 30) ast.y -= this.canvas.height + 60;
    }
    
    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.95;
      p.vy *= 0.95;
      p.life--;
      
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
    
    // Update power-ups
    for (let i = this.powerUps.length - 1; i >= 0; i--) {
      const pu = this.powerUps[i];
      pu.x += pu.vx;
      pu.y += pu.vy;
      pu.vy += 0.1; // Gravity
      pu.rotation += pu.rotationSpeed;
      pu.life--;
      
      if (pu.life <= 0 || pu.y > this.canvas.height + 30) {
        this.powerUps.splice(i, 1);
      }
    }
    
    // Collision detection: bullets vs asteroids
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i];
      for (let j = this.asteroids.length - 1; j >= 0; j--) {
        const ast = this.asteroids[j];
        const dx = bullet.x - ast.x;
        const dy = bullet.y - ast.y;
        const distance = Math.hypot(dx, dy);
        
        if (distance < ast.radius + 2) {
          // Hit!
          this.createParticles(ast.x, ast.y, 12, this.getAsteroidColor(ast.size));
          
          // Award points
          const scoreValues = { 2: 10, 1: 20, 0: 30 };
          this.score += scoreValues[ast.size] || 10;
          
          // Split asteroid
          if (ast.size > 0) {
            for (let k = 0; k < 2; k++) {
              this.asteroids.push(this.createAsteroid(
                ast.x + (Math.random() - 0.5) * 20,
                ast.y + (Math.random() - 0.5) * 20,
                ast.size - 1
              ));
            }
          } else {
            // Small asteroid destroyed, maybe spawn power-up
            if (Math.random() < 0.1) {
              this.spawnPowerUp(ast.x, ast.y);
            }
          }
          
          // Remove asteroid and bullet
          this.asteroids.splice(j, 1);
          this.bullets.splice(i, 1);
          break;
        }
      }
    }
    
    // Collision detection: ship vs asteroids
    if (this.ship && this.ship.invulnerable <= 0) {
      for (let i = this.asteroids.length - 1; i >= 0; i--) {
        const ast = this.asteroids[i];
        const dx = this.ship.x - ast.x;
        const dy = this.ship.y - ast.y;
        const distance = Math.hypot(dx, dy);
        
        if (distance < this.ship.radius + ast.radius) {
          if (this.ship.shield) {
            // Shield blocks it
            this.createParticles(ast.x, ast.y, 8, '#00ff00');
            this.asteroids.splice(i, 1);
            this.ship.shield = false;
            this.ship.shieldDuration = 0;
          } else {
            // Lose a life
            this.createParticles(this.ship.x, this.ship.y, 20, '#ff00ff');
            this.lives--;
            
            if (this.lives <= 0) {
              this.isGameOver = true;
            } else {
              this.ship = this.createShip();
            }
            break;
          }
        }
      }
    }
    
    // Collision detection: ship vs power-ups
    if (this.ship) {
      for (let i = this.powerUps.length - 1; i >= 0; i--) {
        const pu = this.powerUps[i];
        const dx = this.ship.x - pu.x;
        const dy = this.ship.y - pu.y;
        const distance = Math.hypot(dx, dy);
        
        if (distance < this.ship.radius + 10) {
          this.createParticles(pu.x, pu.y, 8, this.getPowerUpColor(pu.type));
          
          if (pu.type === 'shield') {
            this.ship.shield = true;
            this.ship.shieldDuration = 300;
          } else if (pu.type === 'rapidFire') {
            this.ship.rapidFire = true;
            this.ship.rapidFireDuration = 300;
          } else if (pu.type === 'spreadShot') {
            this.ship.spreadShot = true;
            this.ship.spreadShotDuration = 300;
          }
          
          this.powerUps.splice(i, 1);
        }
      }
    }
    
    // Check if all asteroids destroyed
    if (this.asteroids.length === 0 && !this.isGameOver) {
      this.wave++;
      this.spawnWaveAsteroids();
    }
  }
  
  render() {
    // Clear canvas
    this.ctx.fillStyle = '#000511';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw grid background
    this.ctx.strokeStyle = 'rgba(0, 255, 255, 0.05)';
    this.ctx.lineWidth = 1;
    for (let i = 0; i <= 10; i++) {
      this.ctx.beginPath();
      this.ctx.moveTo(i * 60, 0);
      this.ctx.lineTo(i * 60, this.canvas.height);
      this.ctx.stroke();
      
      this.ctx.beginPath();
      this.ctx.moveTo(0, i * 60);
      this.ctx.lineTo(this.canvas.width, i * 60);
      this.ctx.stroke();
    }
    
    // Draw particles
    for (const p of this.particles) {
      const alpha = p.life / p.maxLife;
      this.ctx.fillStyle = p.color.replace(')', `, ${alpha})`).replace('rgb', 'rgba');
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();
      
      // Glow
      this.ctx.strokeStyle = p.color.replace(')', `, ${alpha * 0.5})`).replace('rgb', 'rgba');
      this.ctx.lineWidth = 1;
      this.ctx.stroke();
    }
    
    // Draw asteroids
    for (const ast of this.asteroids) {
      this.drawAsteroid(ast);
    }
    
    // Draw power-ups
    for (const pu of this.powerUps) {
      this.drawPowerUp(pu);
    }
    
    // Draw bullets
    for (const bullet of this.bullets) {
      this.ctx.fillStyle = '#ffff00';
      this.ctx.beginPath();
      this.ctx.arc(bullet.x, bullet.y, 2, 0, Math.PI * 2);
      this.ctx.fill();
      
      // Glow
      this.ctx.strokeStyle = 'rgba(255, 255, 0, 0.5)';
      this.ctx.lineWidth = 1;
      this.ctx.beginPath();
      this.ctx.arc(bullet.x, bullet.y, 4, 0, Math.PI * 2);
      this.ctx.stroke();
    }
    
    // Draw ship
    if (this.ship) {
      this.drawShip(this.ship);
    }
    
    // Draw HUD
    this.drawHUD();
  }
  
  drawAsteroid(ast) {
    this.ctx.save();
    this.ctx.translate(ast.x, ast.y);
    this.ctx.rotate(ast.rotation);
    
    const color = this.getAsteroidColor(ast.size);
    
    // Draw asteroid as irregular polygon
    this.ctx.fillStyle = color;
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 2;
    
    this.ctx.beginPath();
    const points = ast.vertices.length;
    for (let i = 0; i < points; i++) {
      const angle = (Math.PI * 2 * i) / points;
      const r = ast.radius * ast.vertices[i];
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;
      if (i === 0) this.ctx.moveTo(x, y);
      else this.ctx.lineTo(x, y);
    }
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.stroke();
    
    // Glow
    this.ctx.strokeStyle = color.replace('rgb', 'rgba').replace(')', ', 0.5)');
    this.ctx.lineWidth = 3;
    this.ctx.stroke();
    
    this.ctx.restore();
  }
  
  drawShip(ship) {
    this.ctx.save();
    this.ctx.translate(ship.x, ship.y);
    this.ctx.rotate(ship.angle);
    
    // Blinking when invulnerable
    if (ship.invulnerable > 0 && Math.floor(ship.invulnerable / 10) % 2 === 0) {
      this.ctx.restore();
      return;
    }
    
    // Draw ship
    const shipColor = '#00ffff';
    this.ctx.fillStyle = shipColor;
    this.ctx.strokeStyle = shipColor;
    this.ctx.lineWidth = 2;
    
    this.ctx.beginPath();
    this.ctx.moveTo(ship.radius, 0);
    this.ctx.lineTo(-ship.radius, -ship.radius);
    this.ctx.lineTo(-ship.radius * 0.5, 0);
    this.ctx.lineTo(-ship.radius, ship.radius);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.stroke();
    
    // Glow
    this.ctx.strokeStyle = 'rgba(0, 255, 255, 0.5)';
    this.ctx.lineWidth = 4;
    this.ctx.stroke();
    
    // Thrust effect
    if (this.keys['arrowup'] || this.keys['w']) {
      this.ctx.fillStyle = 'rgba(255, 200, 0, 0.7)';
      this.ctx.beginPath();
      this.ctx.moveTo(-ship.radius * 0.3, -ship.radius * 0.7);
      this.ctx.lineTo(-ship.radius * 0.3, ship.radius * 0.7);
      this.ctx.lineTo(-ship.radius * 1.2, 0);
      this.ctx.closePath();
      this.ctx.fill();
    }
    
    // Shield effect
    if (ship.shield) {
      this.ctx.strokeStyle = 'rgba(0, 255, 0, 0.7)';
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.arc(0, 0, ship.radius + 10, 0, Math.PI * 2);
      this.ctx.stroke();
    }
    
    this.ctx.restore();
  }
  
  drawPowerUp(pu) {
    this.ctx.save();
    this.ctx.translate(pu.x, pu.y);
    this.ctx.rotate(pu.rotation);
    
    const color = this.getPowerUpColor(pu.type);
    
    // Draw star/diamond shape
    this.ctx.fillStyle = color;
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 2;
    
    this.ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      const angle = (Math.PI / 2) * i;
      const x = Math.cos(angle) * 12;
      const y = Math.sin(angle) * 12;
      if (i === 0) this.ctx.moveTo(x, y);
      else this.ctx.lineTo(x, y);
    }
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.stroke();
    
    // Glow
    this.ctx.strokeStyle = color.replace('rgb', 'rgba').replace(')', ', 0.5)');
    this.ctx.lineWidth = 4;
    this.ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      const angle = (Math.PI / 2) * i;
      const x = Math.cos(angle) * 12;
      const y = Math.sin(angle) * 12;
      if (i === 0) this.ctx.moveTo(x, y);
      else this.ctx.lineTo(x, y);
    }
    this.ctx.closePath();
    this.ctx.stroke();
    
    this.ctx.restore();
  }
  
  drawHUD() {
    this.ctx.fillStyle = 'rgba(0, 255, 255, 0.8)';
    this.ctx.font = 'bold 16px monospace';
    this.ctx.textAlign = 'left';
    
    this.ctx.fillText(`SCORE: ${this.score}`, 20, 30);
    this.ctx.fillText(`LIVES: ${this.lives}`, 20, 60);
    this.ctx.fillText(`WAVE: ${this.wave}`, 20, 90);
    
    // Power-up indicators
    let yOffset = 120;
    if (this.ship) {
      if (this.ship.shield) {
        this.ctx.fillStyle = 'rgba(0, 255, 0, 0.8)';
        this.ctx.fillText(`SHIELD: ${this.ship.shieldDuration}`, 20, yOffset);
        yOffset += 30;
      }
      if (this.ship.rapidFire) {
        this.ctx.fillStyle = 'rgba(255, 100, 0, 0.8)';
        this.ctx.fillText(`RAPID: ${this.ship.rapidFireDuration}`, 20, yOffset);
        yOffset += 30;
      }
      if (this.ship.spreadShot) {
        this.ctx.fillStyle = 'rgba(200, 100, 255, 0.8)';
        this.ctx.fillText(`SPREAD: ${this.ship.spreadShotDuration}`, 20, yOffset);
      }
    }
  }
  
  renderGameOver() {
    // Draw game state
    this.ctx.fillStyle = '#000511';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw particles and asteroids still
    for (const p of this.particles) {
      const alpha = p.life / p.maxLife;
      this.ctx.fillStyle = p.color.replace(')', `, ${alpha})`).replace('rgb', 'rgba');
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();
    }
    
    // Game Over overlay
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = '#ff00ff';
    this.ctx.font = 'bold 48px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 40);
    
    this.ctx.fillStyle = '#00ffff';
    this.ctx.font = 'bold 32px monospace';
    this.ctx.fillText(`FINAL SCORE: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2 + 30);
    
    this.ctx.fillStyle = 'rgba(0, 255, 255, 0.7)';
    this.ctx.font = 'bold 20px monospace';
    this.ctx.fillText('Press R to restart or refresh', this.canvas.width / 2, this.canvas.height / 2 + 80);
  }
  
  getAsteroidColor(size) {
    const colors = {
      2: 'rgb(0, 255, 150)',  // Cyan-green
      1: 'rgb(0, 200, 255)',  // Cyan
      0: 'rgb(255, 50, 150)'  // Magenta
    };
    return colors[size] || 'rgb(0, 255, 150)';
  }
  
  getPowerUpColor(type) {
    const colors = {
      shield: 'rgb(0, 255, 0)',        // Green
      rapidFire: 'rgb(255, 100, 0)',   // Orange
      spreadShot: 'rgb(200, 100, 255)' // Purple
    };
    return colors[type] || 'rgb(0, 255, 0)';
  }
}

// Export the class
window.AsteroidBlaster = AsteroidBlaster;
