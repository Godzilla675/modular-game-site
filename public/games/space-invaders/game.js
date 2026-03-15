class SpaceInvaders {
  constructor(container) {
    this.container = container;
    this.canvas = null;
    this.ctx = null;
    this.gameState = 'loading'; // loading, playing, paused, gameOver
    this.score = 0;
    this.lives = 3;
    this.wave = 1;
    
    // Game dimensions
    this.width = 600;
    this.height = 700;
    
    // Player
    this.player = {
      x: 275,
      y: 650,
      width: 40,
      height: 30,
      speed: 5,
      vx: 0
    };
    
    // Projectiles
    this.playerProjectiles = [];
    this.alienProjectiles = [];
    
    // Aliens
    this.aliens = [];
    this.alienGridStartX = 40;
    this.alienGridStartY = 30;
    this.alienGridSpacingX = 48;
    this.alienGridSpacingY = 50;
    this.alienDirection = 1; // 1 for right, -1 for left
    this.alienSpeed = 1;
    this.alienNextShootTime = 0;
    this.alienShootInterval = 1000; // ms between alien shots
    
    // Shields
    this.shields = [];
    this.createShields();
    
    // UFO
    this.ufo = null;
    this.ufoSpawnTimer = 0;
    this.ufoSpawnInterval = 10000; // Random spawn every 10 seconds
    
    // Input
    this.keys = {};
    this.touchControls = {
      leftPressed: false,
      rightPressed: false,
      firePressed: false
    };
    
    // Timing
    this.gameLoopId = null;
    this.lastTime = 0;
    
    // Event listeners
    this.boundKeyDown = this.handleKeyDown.bind(this);
    this.boundKeyUp = this.handleKeyUp.bind(this);
    this.boundTouchStart = this.handleTouchStart.bind(this);
    this.boundTouchEnd = this.handleTouchEnd.bind(this);
  }
  
  init() {
    // Create canvas
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.canvas.className = 'space-invaders-game-canvas game-canvas';
    this.container.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');
    
    // Create control buttons for mobile
    this.createControls();
    
    // Setup event listeners
    window.addEventListener('keydown', this.boundKeyDown);
    window.addEventListener('keyup', this.boundKeyUp);
    
    this.gameState = 'loaded';
  }
  
  createControls() {
    const controlsDiv = document.createElement('div');
    controlsDiv.className = 'space-invaders-controls';
    
    const leftBtn = document.createElement('button');
    leftBtn.className = 'space-invaders-btn space-invaders-btn-left';
    leftBtn.textContent = '←';
    leftBtn.addEventListener('pointerdown', () => { this.touchControls.leftPressed = true; });
    leftBtn.addEventListener('pointerup', () => { this.touchControls.leftPressed = false; });
    leftBtn.addEventListener('pointerleave', () => { this.touchControls.leftPressed = false; });
    
    const rightBtn = document.createElement('button');
    rightBtn.className = 'space-invaders-btn space-invaders-btn-right';
    rightBtn.textContent = '→';
    rightBtn.addEventListener('pointerdown', () => { this.touchControls.rightPressed = true; });
    rightBtn.addEventListener('pointerup', () => { this.touchControls.rightPressed = false; });
    rightBtn.addEventListener('pointerleave', () => { this.touchControls.rightPressed = false; });
    
    const fireBtn = document.createElement('button');
    fireBtn.className = 'space-invaders-btn space-invaders-btn-fire';
    fireBtn.textContent = '◆ FIRE';
    fireBtn.addEventListener('pointerdown', () => { this.touchControls.firePressed = true; });
    fireBtn.addEventListener('pointerup', () => { this.touchControls.firePressed = false; });
    fireBtn.addEventListener('pointerleave', () => { this.touchControls.firePressed = false; });
    
    controlsDiv.appendChild(leftBtn);
    controlsDiv.appendChild(rightBtn);
    controlsDiv.appendChild(fireBtn);
    
    this.container.appendChild(controlsDiv);
    this.controlsDiv = controlsDiv;
  }
  
  handleKeyDown(e) {
    this.keys[e.key] = true;
    
    if (e.key === ' ') {
      e.preventDefault();
    }
    
    if (e.key === 'p' || e.key === 'P') {
      if (this.gameState === 'playing') {
        this.pause();
      } else if (this.gameState === 'paused') {
        this.resume();
      }
    }
  }
  
  handleKeyUp(e) {
    this.keys[e.key] = false;
  }
  
  handleTouchStart(e) {
    // Reserved for future touch implementation
  }
  
  handleTouchEnd(e) {
    // Reserved for future touch implementation
  }
  
  createShields() {
    const shieldConfigs = [
      { x: 100 },
      { x: 220 },
      { x: 340 },
      { x: 460 }
    ];
    
    this.shields = shieldConfigs.map(config => {
      const blocks = [];
      for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 5; col++) {
          blocks.push({
            x: config.x + col * 8,
            y: 550 + row * 8,
            width: 7,
            height: 7,
            active: true
          });
        }
      }
      return { blocks };
    });
  }
  
  createAliens() {
    this.aliens = [];
    const rows = 5;
    const cols = 11;
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = this.alienGridStartX + col * this.alienGridSpacingX;
        const y = this.alienGridStartY + row * this.alienGridSpacingY;
        
        // Score based on row (bottom to top: 10, 20, 30, 40, 50)
        const scoreValue = (rows - row) * 10;
        
        this.aliens.push({
          x,
          y,
          width: 30,
          height: 20,
          vx: this.alienSpeed * this.alienDirection,
          score: scoreValue
        });
      }
    }
  }
  
  start() {
    // Cancel any existing game loop before starting a new one
    if (this.gameLoopId) {
      cancelAnimationFrame(this.gameLoopId);
      this.gameLoopId = null;
    }
    if (!this.canvas) {
      this.init();
    }
    this.score = 0;
    this.lives = 3;
    this.wave = 1;
    this.alienSpeed = 1;
    this.alienDirection = 1;
    this.playerProjectiles = [];
    this.alienProjectiles = [];
    this.ufo = null;
    this.ufoSpawnTimer = 0;
    this.player.x = this.width / 2 - this.player.width / 2;
    this.createAliens();
    this.createShields();
    this.gameState = 'playing';
    this.lastTime = Date.now();
    this.startGameLoop();
  }
  
  pause() {
    if (this.gameState === 'playing') {
      this.gameState = 'paused';
    }
  }
  
  resume() {
    if (this.gameState === 'paused') {
      this.gameState = 'playing';
      this.lastTime = Date.now();
    }
  }
  
  startGameLoop() {
    const loop = () => {
      const now = Date.now();
      const dt = Math.min((now - this.lastTime) / 1000, 0.016); // Cap at 60fps
      this.lastTime = now;
      
      if (this.gameState === 'playing') {
        this.update(dt);
      }
      
      this.draw();
      
      this.gameLoopId = requestAnimationFrame(loop);
    };
    this.gameLoopId = requestAnimationFrame(loop);
  }
  
  update(dt) {
    // Update player position
    const moveLeft = this.keys['ArrowLeft'] || this.keys['a'] || this.keys['A'] || this.touchControls.leftPressed;
    const moveRight = this.keys['ArrowRight'] || this.keys['d'] || this.keys['D'] || this.touchControls.rightPressed;
    const shoot = this.keys[' '] || this.touchControls.firePressed;
    
    if (moveLeft && this.player.x > 0) {
      this.player.x -= this.player.speed;
    }
    if (moveRight && this.player.x + this.player.width < this.width) {
      this.player.x += this.player.speed;
    }
    
    // Player shoot
    if (shoot && this.playerProjectiles.length === 0) {
      this.playerProjectiles.push({
        x: this.player.x + this.player.width / 2 - 2,
        y: this.player.y,
        width: 4,
        height: 12,
        vy: -300
      });
      this.keys[' '] = false;
      this.touchControls.firePressed = false;
    }
    
    // Update player projectiles
    for (let i = this.playerProjectiles.length - 1; i >= 0; i--) {
      const proj = this.playerProjectiles[i];
      proj.y += proj.vy * dt;
      
      if (proj.y < 0) {
        this.playerProjectiles.splice(i, 1);
      }
    }
    
    // Update aliens
    let alienHitEdge = false;
    let lowestAlienY = 0;
    
    for (let alien of this.aliens) {
      alien.x += alien.vx * dt;
      lowestAlienY = Math.max(lowestAlienY, alien.y);
      
      if ((alien.x < 0 && alien.vx < 0) || (alien.x + alien.width > this.width && alien.vx > 0)) {
        alienHitEdge = true;
      }
    }
    
    // Change alien direction if hit edge
    if (alienHitEdge) {
      this.alienDirection *= -1;
      for (let alien of this.aliens) {
        alien.y += 20;
        alien.vx = this.alienSpeed * this.alienDirection;
      }
    }
    
    // Check if aliens reached bottom
    if (lowestAlienY + 20 >= this.player.y) {
      this.lives = 0;
      this.endGame();
      return;
    }
    
    // Alien shooting
    this.alienNextShootTime -= dt * 1000;
    if (this.alienNextShootTime < 0 && this.aliens.length > 0) {
      const randomAlien = this.aliens[Math.floor(Math.random() * this.aliens.length)];
      this.alienProjectiles.push({
        x: randomAlien.x + randomAlien.width / 2 - 2,
        y: randomAlien.y + randomAlien.height,
        width: 4,
        height: 12,
        vy: 150
      });
      this.alienNextShootTime = this.alienShootInterval / 1000;
    }
    
    // Update alien projectiles
    for (let i = this.alienProjectiles.length - 1; i >= 0; i--) {
      const proj = this.alienProjectiles[i];
      proj.y += proj.vy * dt;
      
      if (proj.y > this.height) {
        this.alienProjectiles.splice(i, 1);
      }
    }
    
    // UFO spawning and movement
    this.ufoSpawnTimer += dt * 1000;
    if (this.ufoSpawnTimer > this.ufoSpawnInterval && !this.ufo) {
      this.ufo = {
        x: -30,
        y: 40,
        width: 40,
        height: 20,
        vx: 80,
        score: 50 + Math.floor(Math.random() * 3) * 100 // 50, 150, or 250
      };
      this.ufoSpawnTimer = 0;
      this.ufoSpawnInterval = 5000 + Math.random() * 10000; // Random next spawn
    }
    
    if (this.ufo) {
      this.ufo.x += this.ufo.vx * dt;
      if (this.ufo.x > this.width + 30) {
        this.ufo = null;
      }
    }
    
    // Collision detection: player projectiles vs aliens
    for (let i = this.playerProjectiles.length - 1; i >= 0; i--) {
      const proj = this.playerProjectiles[i];
      
      for (let j = this.aliens.length - 1; j >= 0; j--) {
        const alien = this.aliens[j];
        
        if (this.isColliding(proj, alien)) {
          this.score += alien.score;
          this.playerProjectiles.splice(i, 1);
          this.aliens.splice(j, 1);
          
          // Increase alien speed
          this.alienSpeed = 1 + (55 - this.aliens.length) * 0.05;
          
          break;
        }
      }
    }
    
    // Collision detection: player projectiles vs UFO
    if (this.ufo) {
      for (let i = this.playerProjectiles.length - 1; i >= 0; i--) {
        const proj = this.playerProjectiles[i];
        
        if (this.isColliding(proj, this.ufo)) {
          this.score += this.ufo.score;
          this.playerProjectiles.splice(i, 1);
          this.ufo = null;
          break;
        }
      }
    }
    
    // Collision detection: player projectiles vs shields
    for (let i = this.playerProjectiles.length - 1; i >= 0; i--) {
      const proj = this.playerProjectiles[i];
      
      for (let shield of this.shields) {
        for (let j = shield.blocks.length - 1; j >= 0; j--) {
          const block = shield.blocks[j];
          if (block.active && this.isColliding(proj, block)) {
            block.active = false;
            this.playerProjectiles.splice(i, 1);
            break;
          }
        }
        if (i >= this.playerProjectiles.length) break;
      }
    }
    
    // Collision detection: alien projectiles vs shields
    for (let i = this.alienProjectiles.length - 1; i >= 0; i--) {
      const proj = this.alienProjectiles[i];
      
      for (let shield of this.shields) {
        for (let j = shield.blocks.length - 1; j >= 0; j--) {
          const block = shield.blocks[j];
          if (block.active && this.isColliding(proj, block)) {
            block.active = false;
            this.alienProjectiles.splice(i, 1);
            break;
          }
        }
        if (i >= this.alienProjectiles.length) break;
      }
    }
    
    // Collision detection: alien projectiles vs player
    for (let i = this.alienProjectiles.length - 1; i >= 0; i--) {
      const proj = this.alienProjectiles[i];
      
      if (this.isColliding(proj, this.player)) {
        this.lives--;
        this.alienProjectiles.splice(i, 1);
        
        if (this.lives <= 0) {
          this.endGame();
        } else {
          this.resetPlayerPosition();
        }
        break;
      }
    }
    
    // Wave progression
    if (this.aliens.length === 0) {
      this.wave++;
      this.alienSpeed = 1 + this.wave * 0.3;
      this.createAliens();
      this.createShields();
      this.alienDirection = 1;
    }
  }
  
  isColliding(a, b) {
    return a.x < b.x + b.width &&
           a.x + a.width > b.x &&
           a.y < b.y + b.height &&
           a.y + a.height > b.y;
  }
  
  resetPlayerPosition() {
    this.player.x = this.width / 2 - this.player.width / 2;
    this.alienProjectiles = [];
  }
  
  endGame() {
    this.gameState = 'gameOver';
  }
  
  draw() {
    // Clear canvas with dark background
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, this.width, this.height);
    
    // Draw grid pattern
    this.ctx.strokeStyle = 'rgba(0, 255, 0, 0.03)';
    this.ctx.lineWidth = 1;
    for (let i = 0; i < this.height; i += 20) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, i);
      this.ctx.lineTo(this.width, i);
      this.ctx.stroke();
    }
    
    // Draw player
    this.drawPlayer();
    
    // Draw aliens
    this.drawAliens();
    
    // Draw UFO
    if (this.ufo) {
      this.drawUFO();
    }
    
    // Draw shields
    this.drawShields();
    
    // Draw projectiles
    this.drawProjectiles();
    
    // Draw HUD
    this.drawHUD();
    
    // Draw game over overlay
    if (this.gameState === 'gameOver') {
      this.drawGameOver();
    }
    
    // Draw paused overlay
    if (this.gameState === 'paused') {
      this.drawPaused();
    }
  }
  
  drawPlayer() {
    this.ctx.fillStyle = '#0f0';
    
    // Ship body (triangle)
    const x = this.player.x;
    const y = this.player.y;
    const w = this.player.width;
    const h = this.player.height;
    
    this.ctx.beginPath();
    this.ctx.moveTo(x + w / 2, y); // Top point
    this.ctx.lineTo(x + w, y + h); // Bottom right
    this.ctx.lineTo(x, y + h); // Bottom left
    this.ctx.closePath();
    this.ctx.fill();
    
    // Outline
    this.ctx.strokeStyle = '#0f0';
    this.ctx.lineWidth = 1;
    this.ctx.stroke();
  }
  
  drawAliens() {
    for (let alien of this.aliens) {
      this.ctx.fillStyle = '#0f0';
      
      // Simple alien sprite (rectangle with eyes)
      this.ctx.fillRect(alien.x, alien.y, alien.width, alien.height);
      
      // Eyes
      this.ctx.fillStyle = '#000';
      this.ctx.fillRect(alien.x + 6, alien.y + 4, 5, 5);
      this.ctx.fillRect(alien.x + 19, alien.y + 4, 5, 5);
      
      // Outline
      this.ctx.strokeStyle = '#0f0';
      this.ctx.lineWidth = 1;
      this.ctx.strokeRect(alien.x, alien.y, alien.width, alien.height);
    }
  }
  
  drawUFO() {
    const ufo = this.ufo;
    this.ctx.fillStyle = '#0f0';
    
    // UFO body
    this.ctx.beginPath();
    this.ctx.ellipse(ufo.x + ufo.width / 2, ufo.y + ufo.height / 3, ufo.width / 2, ufo.height / 4, 0, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Outline
    this.ctx.strokeStyle = '#0f0';
    this.ctx.lineWidth = 1;
    this.ctx.stroke();
    
    // Windows
    this.ctx.fillStyle = '#000';
    this.ctx.beginPath();
    this.ctx.arc(ufo.x + ufo.width / 4, ufo.y + ufo.height / 3, 3, 0, Math.PI * 2);
    this.ctx.fill();
    
    this.ctx.beginPath();
    this.ctx.arc(ufo.x + ufo.width * 3 / 4, ufo.y + ufo.height / 3, 3, 0, Math.PI * 2);
    this.ctx.fill();
  }
  
  drawShields() {
    for (let shield of this.shields) {
      for (let block of shield.blocks) {
        if (block.active) {
          this.ctx.fillStyle = '#0f0';
          this.ctx.fillRect(block.x, block.y, block.width, block.height);
        }
      }
    }
  }
  
  drawProjectiles() {
    // Player projectiles
    this.ctx.fillStyle = '#0f0';
    for (let proj of this.playerProjectiles) {
      this.ctx.fillRect(proj.x, proj.y, proj.width, proj.height);
    }
    
    // Alien projectiles
    this.ctx.fillStyle = '#f00';
    for (let proj of this.alienProjectiles) {
      this.ctx.fillRect(proj.x, proj.y, proj.width, proj.height);
    }
  }
  
  drawHUD() {
    this.ctx.fillStyle = '#0f0';
    this.ctx.font = 'bold 14px Arial';
    this.ctx.textAlign = 'left';
    
    this.ctx.fillText(`SCORE: ${this.score}`, 10, 20);
    this.ctx.fillText(`LIVES: ${this.lives}`, 10, 40);
    this.ctx.fillText(`WAVE: ${this.wave}`, this.width - 120, 20);
  }
  
  drawGameOver() {
    // Semi-transparent overlay
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(0, 0, this.width, this.height);
    
    // Game Over text
    this.ctx.fillStyle = '#0f0';
    this.ctx.font = 'bold 48px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('GAME OVER', this.width / 2, this.height / 2 - 60);
    
    // Final score
    this.ctx.font = 'bold 24px Arial';
    this.ctx.fillText(`FINAL SCORE: ${this.score}`, this.width / 2, this.height / 2 + 20);
    this.ctx.fillText(`WAVE: ${this.wave}`, this.width / 2, this.height / 2 + 60);
    
    // Instructions
    this.ctx.font = '16px Arial';
    this.ctx.fillText('Press SPACE or click to play again', this.width / 2, this.height / 2 + 120);
    
    // Handle restart
    if (this.keys[' ']) {
      this.keys[' '] = false;
      this.start();
    }
  }
  
  drawPaused() {
    // Semi-transparent overlay
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    this.ctx.fillRect(0, 0, this.width, this.height);
    
    // Paused text
    this.ctx.fillStyle = '#0f0';
    this.ctx.font = 'bold 48px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('PAUSED', this.width / 2, this.height / 2);
    
    this.ctx.font = '16px Arial';
    this.ctx.fillText('Press P to resume', this.width / 2, this.height / 2 + 60);
  }
  
  getScore() {
    return this.score;
  }
  
  destroy() {
    // Remove event listeners
    window.removeEventListener('keydown', this.boundKeyDown);
    window.removeEventListener('keyup', this.boundKeyUp);
    
    // Cancel game loop
    if (this.gameLoopId) {
      cancelAnimationFrame(this.gameLoopId);
    }
    
    // Remove DOM elements
    if (this.canvas) {
      this.canvas.remove();
    }
    if (this.controlsDiv) {
      this.controlsDiv.remove();
    }
    
    // Clear references
    this.gameState = 'destroyed';
  }
}

// Export the class
window.SpaceInvaders = SpaceInvaders;
