class DuckHunt {
  constructor(container) {
    this.container = container;
    this.canvas = null;
    this.ctx = null;
    this.gameState = 'menu'; // menu, playing, paused, gameOver
    
    // Game stats
    this.score = 0;
    this.round = 0;
    this.level = 1;
    this.ammo = 3;
    this.ducksHit = 0;
    this.ducksMissed = 0;
    this.totalDucksInRound = 0;
    this.ducksHitThisRound = 0;
    
    // Game configuration
    this.maxRoundsPerLevel = 10;
    this.maxMisses = 5;
    this.missesRemaining = this.maxMisses;
    
    // Canvas dimensions
    this.canvasWidth = 600;
    this.canvasHeight = 400;
    
    // Game objects
    this.ducks = [];
    this.particles = [];
    this.muzzleFlash = null;
    
    // Animation
    this.animationFrameId = null;
    this.lastFrameTime = 0;
    
    // Event listeners
    this.handleClick = this.handleClick.bind(this);
    this.handleTouchEnd = this.handleTouchEnd.bind(this);
    this.gameLoop = this.gameLoop.bind(this);
    
    this.init();
  }
  
  init() {
    // Create canvas
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'duck-hunt-game-canvas game-canvas';
    this.canvas.width = this.canvasWidth;
    this.canvas.height = this.canvasHeight;
    this.ctx = this.canvas.getContext('2d');
    
    // Create UI container
    this.uiContainer = document.createElement('div');
    this.uiContainer.className = 'duck-hunt-ui';
    
    this.scoreDisplay = document.createElement('div');
    this.scoreDisplay.className = 'duck-hunt-score';
    this.scoreDisplay.textContent = 'Score: 0';
    
    this.roundDisplay = document.createElement('div');
    this.roundDisplay.className = 'duck-hunt-round';
    this.roundDisplay.textContent = 'Round: 0/10';
    
    this.ammoDisplay = document.createElement('div');
    this.ammoDisplay.className = 'duck-hunt-ammo';
    this.ammoDisplay.textContent = 'Ammo: 3';
    
    this.statsDisplay = document.createElement('div');
    this.statsDisplay.className = 'duck-hunt-stats';
    this.statsDisplay.textContent = 'Hit: 0 | Missed: 0';
    
    this.gameOverScreen = document.createElement('div');
    this.gameOverScreen.className = 'duck-hunt-game-over';
    this.gameOverScreen.style.display = 'none';
    
    this.uiContainer.appendChild(this.scoreDisplay);
    this.uiContainer.appendChild(this.roundDisplay);
    this.uiContainer.appendChild(this.ammoDisplay);
    this.uiContainer.appendChild(this.statsDisplay);
    this.uiContainer.appendChild(this.gameOverScreen);
    
    this.container.appendChild(this.canvas);
    this.container.appendChild(this.uiContainer);
    
    // Add event listeners
    this.canvas.addEventListener('click', this.handleClick);
    this.canvas.addEventListener('touchend', this.handleTouchEnd);
    
    // Draw initial screen
    this.drawBackground();
    this.drawMenu();
  }
  
  start() {
    this.reset();
    this.gameState = 'playing';
    this.gameOverScreen.style.display = 'none';
    this.nextRound();
    this.animate();
  }
  
  pause() {
    if (this.gameState === 'playing') {
      this.gameState = 'paused';
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
      }
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
    if (this._roundEndTimeout) {
      clearTimeout(this._roundEndTimeout);
      this._roundEndTimeout = null;
    }
    if (this._spawnTimeout) {
      clearTimeout(this._spawnTimeout);
      this._spawnTimeout = null;
    }
    this.canvas.removeEventListener('click', this.handleClick);
    this.canvas.removeEventListener('touchend', this.handleTouchEnd);
    this.ducks = [];
    this.particles = [];
    if (this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
    if (this.uiContainer.parentNode) {
      this.uiContainer.parentNode.removeChild(this.uiContainer);
    }
  }
  
  getScore() {
    return this.score;
  }
  
  reset() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this._roundEndTimeout) {
      clearTimeout(this._roundEndTimeout);
      this._roundEndTimeout = null;
    }
    if (this._spawnTimeout) {
      clearTimeout(this._spawnTimeout);
      this._spawnTimeout = null;
    }
    this.score = 0;
    this.round = 0;
    this.level = 1;
    this.ducks = [];
    this.particles = [];
    this.muzzleFlash = null;
    this.missesRemaining = this.maxMisses;
    this.ducksHit = 0;
    this.ducksMissed = 0;
    this._ducksSpawned = false;
    this.updateUI();
  }
  
  nextRound() {
    this.round++;
    
    // Check level completion
    if (this.round > this.maxRoundsPerLevel) {
      this.level++;
      this.round = 1;
    }
    
    this.ammo = 3;
    this.ducksHitThisRound = 0;
    this.totalDucksInRound = Math.min(1 + Math.floor((this.level - 1) / 2), 3);
    
    // Spawn ducks with slight delay
    this._ducksSpawned = false;
    this._spawnTimeout = setTimeout(() => {
      this._spawnTimeout = null;
      if (this.gameState === 'playing') {
        this.spawnDucks(this.totalDucksInRound);
        this._ducksSpawned = true;
      }
    }, 500);
    
    this.updateUI();
  }
  
  spawnDucks(count) {
    const speedMultiplier = 1 + (this.level - 1) * 0.15;
    
    for (let i = 0; i < count; i++) {
      const duck = {
        x: Math.random() > 0.5 ? -30 : this.canvasWidth + 30,
        y: 50 + Math.random() * 150,
        vx: (Math.random() > 0.5 ? 1 : -1) * (2 + Math.random() * 1.5) * speedMultiplier,
        vy: (Math.random() - 0.5) * 1.5,
        width: 30,
        height: 25,
        hit: false,
        hitTime: 0,
        angle: 0,
        waveOffset: Math.random() * Math.PI * 2,
        waveAmplitude: 2 + Math.random() * 2
      };
      
      // Ensure ducks move toward center
      if (duck.x < this.canvasWidth / 2) {
        duck.vx = Math.abs(duck.vx);
      } else {
        duck.vx = -Math.abs(duck.vx);
      }
      
      this.ducks.push(duck);
    }
  }
  
  handleClick(e) {
    if (this.gameState !== 'playing') return;
    
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    this.shoot(x, y);
  }
  
  handleTouchEnd(e) {
    if (this.gameState !== 'playing') return;
    
    const rect = this.canvas.getBoundingClientRect();
    const touch = e.changedTouches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    this.shoot(x, y);
  }
  
  shoot(x, y) {
    if (this.ammo <= 0) return;
    
    this.ammo--;
    
    // Create muzzle flash
    this.muzzleFlash = { time: 0, duration: 100, x, y };
    
    // Check for hits
    let hitAny = false;
    for (let duck of this.ducks) {
      if (!duck.hit && this.checkCollision(x, y, duck)) {
        duck.hit = true;
        duck.hitTime = 0;
        this.ducksHit++;
        this.ducksHitThisRound++;
        this.score += 10;
        hitAny = true;
        this.createParticles(duck.x + duck.width / 2, duck.y + duck.height / 2);
      }
    }
    
    if (!hitAny && this.ammo === 0) {
      this.missesRemaining--;
      for (let duck of this.ducks) {
        if (!duck.hit) {
          this.ducksMissed++;
        }
      }
    }
    
    // If all ducks in this round are hit, advance immediately
    const allDucksHit = this.ducks.length > 0 && this.ducks.every(d => d.hit);
    if (allDucksHit && !this._roundEndTimeout) {
      this._roundEndTimeout = setTimeout(() => {
        this._roundEndTimeout = null;
        if (this.gameState === 'playing') {
          this.score += 25; // Perfect round bonus
          this.ducks = [];
          this.nextRound();
        }
      }, 800);
      this.updateUI();
      return;
    }
    
    // Check if round is over (out of ammo)
    if (this.ammo === 0 && !this._roundEndTimeout) {
      this._roundEndTimeout = setTimeout(() => {
        this._roundEndTimeout = null;
        if (this.gameState === 'playing') {
          if (this.ducksHitThisRound === this.totalDucksInRound && this.ducksHitThisRound > 0) {
            this.score += 25;
          }
          
          if (this.missesRemaining <= 0) {
            this.endGame();
          } else {
            this.ducks = [];
            this.nextRound();
          }
        }
      }, 800);
    }
    
    this.updateUI();
  }
  
  checkCollision(x, y, duck) {
    return x > duck.x && x < duck.x + duck.width &&
           y > duck.y && y < duck.y + duck.height;
  }
  
  createParticles(x, y) {
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8;
      const speed = 2 + Math.random() * 3;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        size: 3 + Math.random() * 3
      });
    }
  }
  
  endGame() {
    this.gameState = 'gameOver';
    this.showGameOverScreen();
  }
  
  showGameOverScreen() {
    const finalScore = this.score;
    const finalLevel = this.level;
    const finalRound = Math.min(this.round, this.maxRoundsPerLevel);
    
    this.gameOverScreen.innerHTML = `
      <div class="duck-hunt-game-over-content">
        <h2>Game Over!</h2>
        <p>Level: ${finalLevel}</p>
        <p>Final Score: ${finalScore}</p>
        <p>Ducks Hit: ${this.ducksHit}</p>
        <p>Ducks Missed: ${this.ducksMissed}</p>
        <button class="duck-hunt-restart-btn">Play Again</button>
      </div>
    `;
    this.gameOverScreen.style.display = 'flex';
    
    const btn = this.gameOverScreen.querySelector('.duck-hunt-restart-btn');
    btn.addEventListener('click', () => {
      this.gameOverScreen.style.display = 'none';
      this.start();
    });
  }
  
  updateUI() {
    this.scoreDisplay.textContent = `Score: ${this.score}`;
    this.roundDisplay.textContent = `Round: ${Math.min(this.round, this.maxRoundsPerLevel)}/${this.maxRoundsPerLevel} (Level ${this.level})`;
    this.ammoDisplay.textContent = `Ammo: ${this.ammo}`;
    this.statsDisplay.textContent = `Hit: ${this.ducksHit} | Missed: ${this.ducksMissed} | Lives: ${this.missesRemaining}`;
  }
  
  update(deltaTime) {
    // Update ducks
    for (let duck of this.ducks) {
      if (duck.hit) {
        duck.hitTime += deltaTime;
        duck.vy += 0.15; // Gravity
        duck.x += duck.vx;
        duck.y += duck.vy;
      } else {
        // Wave motion
        duck.waveOffset += 0.05;
        duck.y += Math.sin(duck.waveOffset) * 0.3;
        duck.x += duck.vx;
        
        // Rotation based on direction
        duck.angle = duck.vx > 0 ? 0 : Math.PI;
      }
    }
    
    // Remove off-screen ducks (count escaped unhit ducks as missed)
    this.ducks = this.ducks.filter(duck => {
      const offScreen = duck.x > this.canvasWidth + 50 || duck.x < -50 || duck.y > this.canvasHeight + 50;
      if (offScreen) {
        if (!duck.hit) {
          this.ducksMissed++;
        }
        return false;
      }
      return true;
    });
    
    // If all ducks are gone and some were spawned, advance round
    if (this.ducks.length === 0 && this._ducksSpawned && !this._roundEndTimeout) {
      this._roundEndTimeout = setTimeout(() => {
        this._roundEndTimeout = null;
        if (this.gameState === 'playing') {
          if (this.ducksHitThisRound === this.totalDucksInRound && this.ducksHitThisRound > 0) {
            this.score += 25;
          }
          if (this.missesRemaining <= 0) {
            this.endGame();
          } else {
            this.nextRound();
          }
        }
      }, 500);
    }
    
    // Update particles
    this.particles = this.particles.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.1; // Gravity
      p.life -= 0.02;
      return p.life > 0;
    });
    
    // Update muzzle flash
    if (this.muzzleFlash) {
      this.muzzleFlash.time += deltaTime;
      if (this.muzzleFlash.time > this.muzzleFlash.duration) {
        this.muzzleFlash = null;
      }
    }
  }
  
  draw() {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
    
    // Draw background
    this.drawBackground();
    
    // Draw ducks
    for (let duck of this.ducks) {
      this.drawDuck(duck);
    }
    
    // Draw particles
    for (let p of this.particles) {
      this.ctx.fillStyle = `rgba(255, 100, 0, ${p.life})`;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();
    }
    
    // Draw muzzle flash
    if (this.muzzleFlash) {
      const opacity = 1 - (this.muzzleFlash.time / this.muzzleFlash.duration);
      this.ctx.fillStyle = `rgba(255, 200, 0, ${opacity * 0.7})`;
      this.ctx.beginPath();
      this.ctx.arc(this.muzzleFlash.x, this.muzzleFlash.y, 20 * opacity, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.fillStyle = `rgba(255, 255, 100, ${opacity * 0.5})`;
      this.ctx.beginPath();
      this.ctx.arc(this.muzzleFlash.x, this.muzzleFlash.y, 10 * opacity, 0, Math.PI * 2);
      this.ctx.fill();
    }
    
    // Draw crosshair (for visual feedback)
    const mousePos = this.getMousePos();
    if (mousePos) {
      this.drawCrosshair(mousePos.x, mousePos.y);
    }
  }
  
  drawBackground() {
    // Sky
    const skyGradient = this.ctx.createLinearGradient(0, 0, 0, this.canvasHeight * 0.7);
    skyGradient.addColorStop(0, '#87CEEB');
    skyGradient.addColorStop(1, '#E0F6FF');
    this.ctx.fillStyle = skyGradient;
    this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight * 0.7);
    
    // Grass
    this.ctx.fillStyle = '#2D5016';
    this.ctx.fillRect(0, this.canvasHeight * 0.7, this.canvasWidth, this.canvasHeight * 0.3);
    
    // Grass details
    this.ctx.fillStyle = '#3A6B1F';
    for (let i = 0; i < 20; i++) {
      const x = (i * this.canvasWidth / 20) + (this.canvas.width % 20);
      const y = this.canvasHeight * 0.7 + Math.sin(i * 0.5) * 10;
      this.ctx.fillRect(x, y, 3, 20);
    }
    
    // Bushes
    this.drawBush(100, this.canvasHeight * 0.65);
    this.drawBush(400, this.canvasHeight * 0.65);
    this.drawBush(250, this.canvasHeight * 0.72);
  }
  
  drawBush(x, y) {
    this.ctx.fillStyle = '#1B4D0E';
    this.ctx.beginPath();
    this.ctx.ellipse(x, y, 40, 35, 0, 0, Math.PI * 2);
    this.ctx.fill();
    
    this.ctx.fillStyle = '#2D7F1B';
    this.ctx.beginPath();
    this.ctx.ellipse(x - 25, y - 15, 20, 25, -0.3, 0, Math.PI * 2);
    this.ctx.fill();
    
    this.ctx.beginPath();
    this.ctx.ellipse(x + 25, y - 15, 20, 25, 0.3, 0, Math.PI * 2);
    this.ctx.fill();
  }
  
  drawDuck(duck) {
    this.ctx.save();
    this.ctx.translate(duck.x + duck.width / 2, duck.y + duck.height / 2);
    
    if (duck.hit) {
      this.ctx.rotate(Math.PI / 2);
      this.ctx.globalAlpha = Math.max(0, 1 - (duck.hitTime / 500));
    } else {
      this.ctx.rotate(duck.angle);
    }
    
    this.ctx.translate(-(duck.width / 2), -(duck.height / 2));
    
    // Body
    this.ctx.fillStyle = '#8B4513';
    this.ctx.beginPath();
    this.ctx.ellipse(duck.width / 2, duck.height / 2 + 3, duck.width * 0.45, duck.height * 0.45, 0, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Head
    this.ctx.fillStyle = '#654321';
    this.ctx.beginPath();
    this.ctx.arc(duck.width - 8, duck.height / 2 - 2, 6, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Eye
    this.ctx.fillStyle = '#FFF';
    this.ctx.beginPath();
    this.ctx.arc(duck.width - 5, duck.height / 2 - 4, 2, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Eye pupil
    this.ctx.fillStyle = '#000';
    this.ctx.beginPath();
    this.ctx.arc(duck.width - 4.5, duck.height / 2 - 3.5, 1, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Beak
    this.ctx.fillStyle = '#FFA500';
    this.ctx.beginPath();
    this.ctx.moveTo(duck.width - 2, duck.height / 2);
    this.ctx.lineTo(duck.width + 3, duck.height / 2 - 1);
    this.ctx.lineTo(duck.width - 2, duck.height / 2 + 1);
    this.ctx.closePath();
    this.ctx.fill();
    
    // Wing
    this.ctx.fillStyle = '#704214';
    this.ctx.beginPath();
    this.ctx.ellipse(duck.width / 2 + 2, duck.height / 2 + 4, 8, 5, -0.3, 0, Math.PI * 2);
    this.ctx.fill();
    
    this.ctx.restore();
  }
  
  drawCrosshair(x, y) {
    const size = 15;
    const lineWidth = 2;
    
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    this.ctx.lineWidth = lineWidth;
    this.ctx.lineCap = 'round';
    
    // Horizontal line
    this.ctx.beginPath();
    this.ctx.moveTo(x - size, y);
    this.ctx.lineTo(x + size, y);
    this.ctx.stroke();
    
    // Vertical line
    this.ctx.beginPath();
    this.ctx.moveTo(x, y - size);
    this.ctx.lineTo(x, y + size);
    this.ctx.stroke();
    
    // Center circle
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.arc(x, y, 5, 0, Math.PI * 2);
    this.ctx.stroke();
  }
  
  drawMenu() {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
    
    this.ctx.fillStyle = '#FFF';
    this.ctx.font = 'bold 36px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('DUCK HUNT', this.canvasWidth / 2, this.canvasHeight / 2 - 40);
    
    this.ctx.font = '18px Arial';
    this.ctx.fillText('Click anywhere to start', this.canvasWidth / 2, this.canvasHeight / 2 + 20);
  }
  
  getMousePos() {
    // This is simplified - in a real scenario, track mouse position
    return null;
  }
  
  animate() {
    const now = performance.now();
    const deltaTime = this.lastFrameTime ? now - this.lastFrameTime : 16;
    this.lastFrameTime = now;
    
    if (this.gameState === 'playing') {
      this.update(deltaTime);
      this.draw();
      this.animationFrameId = requestAnimationFrame(this.gameLoop);
    }
  }
  
  gameLoop() {
    this.animate();
  }
}

window.DuckHunt = DuckHunt;
