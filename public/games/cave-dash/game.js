class CaveDash {
  constructor(container) {
    this.container = container;
    this.canvas = null;
    this.ctx = null;
    this.gameState = 'idle'; // idle, playing, paused, gameOver
    this.score = 0;
    this.distanceTraveled = 0;
    this.gemsCollected = 0;

    // Game objects
    this.player = null;
    this.cave = null;
    this.particles = [];
    this.gems = [];
    this.collectedGems = new Set();

    // Game parameters
    this.gameSpeed = 4;
    this.maxGameSpeed = 8;
    this.speedIncreaseRate = 0.0005;
    this.gravity = 0.5;
    this.playerForce = -12;

    // Input
    this.isFlying = false;
    this.keyDown = false;

    // Animation
    this.animationFrameId = null;
    this.lastFrameTime = 0;

    // Setup
    this.setupCanvas();
    this.setupEventListeners();
  }

  setupCanvas() {
    // Create canvas element
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'cave-dash-game-canvas game-canvas';
    this.canvas.width = 700;
    this.canvas.height = 400;

    this.ctx = this.canvas.getContext('2d');
    this.container.appendChild(this.canvas);

    // Create overlay container for game over screen
    this.overlayContainer = document.createElement('div');
    this.overlayContainer.className = 'cave-dash-overlay-container';
    this.container.appendChild(this.overlayContainer);
  }

  setupEventListeners() {
    // Keyboard controls
    this.keyDownHandler = (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        if (this.gameState === 'idle') {
          this.start();
        }
        this.isFlying = true;
      }
    };

    this.keyUpHandler = (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        this.isFlying = false;
      }
    };

    // Mouse/Touch controls
    this.mouseDownHandler = () => {
      if (this.gameState === 'idle') {
        this.start();
      }
      this.isFlying = true;
    };

    this.mouseUpHandler = () => {
      this.isFlying = false;
    };

    this.touchStartHandler = (e) => {
      e.preventDefault();
      if (this.gameState === 'idle') {
        this.start();
      }
      this.isFlying = true;
    };

    this.touchEndHandler = (e) => {
      e.preventDefault();
      this.isFlying = false;
    };

    document.addEventListener('keydown', this.keyDownHandler);
    document.addEventListener('keyup', this.keyUpHandler);
    this.canvas.addEventListener('mousedown', this.mouseDownHandler);
    this.canvas.addEventListener('mouseup', this.mouseUpHandler);
    this.canvas.addEventListener('touchstart', this.touchStartHandler, { passive: false });
    this.canvas.addEventListener('touchend', this.touchEndHandler, { passive: false });
  }

  start() {
    if (this.gameState === 'playing') return;

    this.gameState = 'playing';
    this.score = 0;
    this.distanceTraveled = 0;
    this.gemsCollected = 0;
    this.gameSpeed = 4;
    this.particles = [];
    this.gems = [];
    this.collectedGems.clear();
    this.isFlying = false;

    // Initialize player
    this.player = {
      x: 100,
      y: 200,
      width: 20,
      height: 20,
      velocityY: 0,
      trail: []
    };

    // Initialize cave
    this.cave = {
      segments: [],
      nextSegmentX: 0
    };

    // Generate initial cave segments
    for (let i = 0; i < 50; i++) {
      this.generateCaveSegment();
    }

    // Hide overlay if it exists
    this.overlayContainer.innerHTML = '';

    // Start game loop
    this.lastFrameTime = Date.now();
    this.animationFrameId = requestAnimationFrame(() => this.gameLoop());
  }

  pause() {
    if (this.gameState === 'playing') {
      this.gameState = 'paused';
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  resume() {
    if (this.gameState === 'paused') {
      this.gameState = 'playing';
      this.lastFrameTime = Date.now();
      this.animationFrameId = requestAnimationFrame(() => this.gameLoop());
    }
  }

  destroy() {
    // Remove event listeners
    document.removeEventListener('keydown', this.keyDownHandler);
    document.removeEventListener('keyup', this.keyUpHandler);
    this.canvas.removeEventListener('mousedown', this.mouseDownHandler);
    this.canvas.removeEventListener('mouseup', this.mouseUpHandler);
    this.canvas.removeEventListener('touchstart', this.touchStartHandler);
    this.canvas.removeEventListener('touchend', this.touchEndHandler);

    // Cancel animation frame
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }

    // Remove DOM elements
    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
    if (this.overlayContainer && this.overlayContainer.parentNode) {
      this.overlayContainer.parentNode.removeChild(this.overlayContainer);
    }

    this.gameState = 'idle';
  }

  getScore() {
    return this.score;
  }

  generateCaveSegment() {
    const segmentWidth = 40;
    const lastSegment = this.cave.segments[this.cave.segments.length - 1];
    const x = lastSegment ? lastSegment.x + segmentWidth : 0;

    let gapCenter, gapWidth;

    if (!lastSegment) {
      // First segment
      gapCenter = 200;
      gapWidth = 120;
    } else {
      // Smoothly transition gap position and width
      const targetGapWidth = Math.max(80, 200 - this.distanceTraveled * 0.05);
      const gapWidthChange = (targetGapWidth - lastSegment.gapWidth) * 0.3;
      gapWidth = lastSegment.gapWidth + gapWidthChange;

      // Move gap center randomly but smoothly
      const maxGapMove = Math.min(20, 40 + this.distanceTraveled * 0.01);
      const gapCenterOffset = (Math.random() - 0.5) * maxGapMove;
      gapCenter = Math.max(gapWidth / 2 + 20, Math.min(400 - gapWidth / 2 - 20, lastSegment.gapCenter + gapCenterOffset));
    }

    const segment = {
      x: x,
      gapCenter: gapCenter,
      gapWidth: gapWidth,
      topHeight: gapCenter - gapWidth / 2,
      bottomStart: gapCenter + gapWidth / 2,
      hasPassed: false
    };

    this.cave.segments.push(segment);

    // Generate gems in this segment
    if (Math.random() < 0.3) {
      const gemX = x + segmentWidth * (0.3 + Math.random() * 0.4);
      const gemY = gapCenter + (Math.random() - 0.5) * (gapWidth - 60);
      const gemId = `gem_${x}_${gemY}`;
      if (!this.collectedGems.has(gemId)) {
        this.gems.push({
          id: gemId,
          x: gemX,
          y: gemY,
          radius: 8,
          rotation: Math.random() * Math.PI * 2
        });
      }
    }
  }

  update(deltaTime) {
    // Update game speed
    this.gameSpeed = Math.min(this.maxGameSpeed, this.gameSpeed + this.speedIncreaseRate);

    // Update player physics
    if (this.isFlying) {
      this.player.velocityY = this.playerForce;
    } else {
      this.player.velocityY += this.gravity;
    }

    this.player.y += this.player.velocityY;

    // Move player forward
    this.player.x += this.gameSpeed;

    // Store trail
    this.player.trail.push({
      x: this.player.x,
      y: this.player.y,
      alpha: 1
    });

    if (this.player.trail.length > 30) {
      this.player.trail.shift();
    }

    // Update particles
    this.particles = this.particles.filter(p => {
      p.x += p.velocityX;
      p.y += p.velocityY;
      p.alpha -= p.decay;
      p.velocityY += 0.2; // gravity on particles
      return p.alpha > 0;
    });

    // Generate particles behind player
    if (Math.random() < 0.7) {
      this.particles.push({
        x: this.player.x - 5,
        y: this.player.y + (Math.random() - 0.5) * 15,
        velocityX: -1 - Math.random() * 1,
        velocityY: (Math.random() - 0.5) * 2,
        alpha: 0.6,
        decay: 0.02,
        size: 2 + Math.random() * 2
      });
    }

    // Update cave - remove old segments, add new ones
    while (this.cave.segments.length > 0 && this.cave.segments[0].x < this.player.x - 100) {
      this.cave.segments.shift();
    }

    while (this.cave.segments.length > 0 && this.cave.segments[this.cave.segments.length - 1].x < this.player.x + 400) {
      this.generateCaveSegment();
    }

    // Update distance and score
    const oldDistance = this.distanceTraveled;
    this.distanceTraveled = this.player.x;
    this.score = Math.floor(this.distanceTraveled + this.gemsCollected * 10);

    // Check gem collection
    this.gems = this.gems.filter(gem => {
      const dist = Math.hypot(gem.x - this.player.x, gem.y - this.player.y);
      if (dist < this.player.width + gem.radius) {
        this.collectedGems.add(gem.id);
        this.gemsCollected++;
        // Create collection particles
        for (let i = 0; i < 15; i++) {
          const angle = (i / 15) * Math.PI * 2;
          this.particles.push({
            x: gem.x,
            y: gem.y,
            velocityX: Math.cos(angle) * 3,
            velocityY: Math.sin(angle) * 3,
            alpha: 1,
            decay: 0.03,
            size: 3
          });
        }
        return false; // Remove gem
      }
      return true;
    });

    // Update gem rotation
    for (let gem of this.gems) {
      gem.rotation += 0.05;
    }

    // Check collisions with cave
    const nextSegment = this.cave.segments.find(s => s.x + 40 > this.player.x - 20 && s.x < this.player.x + 20);
    if (nextSegment) {
      const playerTop = this.player.y - this.player.height / 2;
      const playerBottom = this.player.y + this.player.height / 2;

      if (playerTop < nextSegment.topHeight || playerBottom > nextSegment.bottomStart) {
        this.endGame();
      }
    }

    // Out of bounds check
    if (this.player.y < 0 || this.player.y > 400) {
      this.endGame();
    }
  }

  endGame() {
    this.gameState = 'gameOver';
    cancelAnimationFrame(this.animationFrameId);
    this.showGameOverScreen();
  }

  showGameOverScreen() {
    const overlay = document.createElement('div');
    overlay.className = 'cave-dash-game-over-overlay';

    const content = document.createElement('div');
    content.className = 'cave-dash-game-over-content';

    const title = document.createElement('h2');
    title.className = 'cave-dash-game-over-title';
    title.textContent = 'CRASHED!';

    const scoreDisplay = document.createElement('div');
    scoreDisplay.className = 'cave-dash-game-over-score';
    scoreDisplay.innerHTML = `
      <div class="cave-dash-score-label">Final Score</div>
      <div class="cave-dash-score-value">${this.score}</div>
      <div class="cave-dash-score-breakdown">
        <div>Distance: ${Math.floor(this.distanceTraveled)}</div>
        <div>Gems: ${this.gemsCollected} × 10 = ${this.gemsCollected * 10}</div>
      </div>
    `;

    const button = document.createElement('button');
    button.className = 'cave-dash-play-again-button';
    button.textContent = 'Play Again';
    button.addEventListener('click', () => {
      this.overlayContainer.innerHTML = '';
      this.start();
    });

    content.appendChild(title);
    content.appendChild(scoreDisplay);
    content.appendChild(button);
    overlay.appendChild(content);
    this.overlayContainer.appendChild(overlay);
  }

  draw() {
    // Clear canvas with dark background
    this.ctx.fillStyle = '#0a0a0a';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw cave
    this.drawCave();

    // Draw gems
    this.drawGems();

    // Draw particles
    this.drawParticles();

    // Draw player trail
    this.drawPlayerTrail();

    // Draw player with glow
    this.drawPlayer();

    // Draw score
    this.drawScore();
  }

  drawCave() {
    const cameraX = Math.max(0, this.player.x - 150);

    this.ctx.fillStyle = '#1a1a1a';

    // Draw top and bottom walls
    for (let segment of this.cave.segments) {
      if (segment.x < cameraX - 50 || segment.x > cameraX + 750) continue;

      const screenX = segment.x - cameraX;
      const segmentWidth = 40;

      // Top wall (stalactites)
      this.ctx.fillRect(screenX, 0, segmentWidth, segment.topHeight);
      // Add stalactite texture
      this.ctx.strokeStyle = '#0f0f0f';
      this.ctx.lineWidth = 1;
      this.ctx.beginPath();
      this.ctx.moveTo(screenX, segment.topHeight);
      this.ctx.lineTo(screenX + segmentWidth / 2, segment.topHeight + 10);
      this.ctx.lineTo(screenX + segmentWidth, segment.topHeight);
      this.ctx.stroke();

      // Bottom wall (stalagmites)
      this.ctx.fillRect(screenX, segment.bottomStart, segmentWidth, 400 - segment.bottomStart);
      // Add stalagmite texture
      this.ctx.beginPath();
      this.ctx.moveTo(screenX, segment.bottomStart);
      this.ctx.lineTo(screenX + segmentWidth / 2, segment.bottomStart - 10);
      this.ctx.lineTo(screenX + segmentWidth, segment.bottomStart);
      this.ctx.stroke();
    }

    // Draw grid pattern for cave depth
    this.ctx.strokeStyle = 'rgba(50, 50, 50, 0.3)';
    this.ctx.lineWidth = 1;
    for (let i = 0; i < 20; i++) {
      const lineX = Math.floor((this.player.x - 150) / 40) * 40 + i * 40 - cameraX;
      this.ctx.beginPath();
      this.ctx.moveTo(lineX, 0);
      this.ctx.lineTo(lineX, this.canvas.height);
      this.ctx.stroke();
    }
  }

  drawGems() {
    const cameraX = Math.max(0, this.player.x - 150);

    for (let gem of this.gems) {
      const screenX = gem.x - cameraX;
      const screenY = gem.y;

      if (screenX < -20 || screenX > this.canvas.width + 20) continue;

      // Gem glow
      const gradient = this.ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, gem.radius * 2);
      gradient.addColorStop(0, 'rgba(100, 200, 255, 0.4)');
      gradient.addColorStop(1, 'rgba(100, 200, 255, 0)');
      this.ctx.fillStyle = gradient;
      this.ctx.fillRect(screenX - gem.radius * 2, screenY - gem.radius * 2, gem.radius * 4, gem.radius * 4);

      // Gem shape (diamond)
      this.ctx.save();
      this.ctx.translate(screenX, screenY);
      this.ctx.rotate(gem.rotation);

      this.ctx.fillStyle = '#64c8ff';
      this.ctx.beginPath();
      this.ctx.moveTo(0, -gem.radius);
      this.ctx.lineTo(gem.radius, 0);
      this.ctx.lineTo(0, gem.radius);
      this.ctx.lineTo(-gem.radius, 0);
      this.ctx.closePath();
      this.ctx.fill();

      this.ctx.strokeStyle = '#ffffff';
      this.ctx.lineWidth = 1;
      this.ctx.stroke();

      this.ctx.restore();
    }
  }

  drawParticles() {
    const cameraX = Math.max(0, this.player.x - 150);

    for (let particle of this.particles) {
      const screenX = particle.x - cameraX;
      const screenY = particle.y;

      if (screenX < -50 || screenX > this.canvas.width + 50) continue;

      this.ctx.fillStyle = `rgba(100, 200, 255, ${particle.alpha})`;
      this.ctx.beginPath();
      this.ctx.arc(screenX, screenY, particle.size, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  drawPlayerTrail() {
    const cameraX = Math.max(0, this.player.x - 150);

    this.ctx.lineWidth = 2;
    for (let i = 0; i < this.player.trail.length - 1; i++) {
      const point = this.player.trail[i];
      const nextPoint = this.player.trail[i + 1];
      const progress = i / this.player.trail.length;

      this.ctx.strokeStyle = `rgba(100, 200, 255, ${point.alpha * (1 - progress) * 0.3})`;

      this.ctx.beginPath();
      this.ctx.moveTo(point.x - cameraX, point.y);
      this.ctx.lineTo(nextPoint.x - cameraX, nextPoint.y);
      this.ctx.stroke();
    }
  }

  drawPlayer() {
    const cameraX = Math.max(0, this.player.x - 150);
    const screenX = this.player.x - cameraX;
    const screenY = this.player.y;

    // Player glow
    const glowGradient = this.ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, 40);
    glowGradient.addColorStop(0, 'rgba(100, 200, 255, 0.2)');
    glowGradient.addColorStop(1, 'rgba(100, 200, 255, 0)');
    this.ctx.fillStyle = glowGradient;
    this.ctx.fillRect(screenX - 40, screenY - 40, 80, 80);

    // Player body
    this.ctx.fillStyle = '#64c8ff';
    this.ctx.beginPath();
    this.ctx.arc(screenX, screenY, this.player.width / 2, 0, Math.PI * 2);
    this.ctx.fill();

    // Player outline
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();

    // Player direction indicator
    const directionLength = 12;
    const directionX = screenX + Math.cos(this.player.velocityY * 0.05) * directionLength;
    const directionY = screenY - this.player.width / 2;
    this.ctx.fillStyle = '#ffffff';
    this.ctx.beginPath();
    this.ctx.moveTo(screenX - 4, directionY);
    this.ctx.lineTo(directionX, directionY - 6);
    this.ctx.lineTo(screenX + 4, directionY);
    this.ctx.closePath();
    this.ctx.fill();
  }

  drawScore() {
    this.ctx.font = 'bold 24px Arial';
    this.ctx.fillStyle = 'rgba(100, 200, 255, 0.8)';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`Score: ${this.score}`, 20, 40);

    this.ctx.font = 'bold 16px Arial';
    this.ctx.fillText(`Gems: ${this.gemsCollected}`, 20, 65);
    this.ctx.fillText(`Speed: ${(this.gameSpeed / this.maxGameSpeed * 100).toFixed(0)}%`, 20, 85);

    if (this.gameState === 'paused') {
      this.ctx.font = 'bold 32px Arial';
      this.ctx.fillStyle = 'rgba(100, 200, 255, 0.9)';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('PAUSED', this.canvas.width / 2, this.canvas.height / 2);
    }
  }

  gameLoop() {
    if (this.gameState === 'playing') {
      this.update(16); // Assume ~60fps
      this.draw();
      this.animationFrameId = requestAnimationFrame(() => this.gameLoop());
    }
  }
}

// Export the class
window.CaveDash = CaveDash;
