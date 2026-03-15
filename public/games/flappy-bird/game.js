class FlappyBird {
  constructor(container) {
    this.container = container;
    this.canvas = null;
    this.ctx = null;
    this.gameActive = false;
    this.gameOver = false;
    this.paused = false;
    this.score = 0;
    this.gameStarted = false;

    // Bird properties
    this.bird = {
      x: 50,
      y: 150,
      width: 30,
      height: 30,
      velocity: 0,
      rotation: 0,
    };

    // Physics
    this.gravity = 0.4;
    this.flapPower = -9;
    this.maxVelocity = 15;

    // Pipes
    this.pipes = [];
    this.pipeWidth = 60;
    this.pipeGap = 120;
    this.pipeSpacing = 160;
    this.minGapSize = 80;
    this.pipeSpeed = 4;
    this.nextPipeX = 300;

    // Ground
    this.groundHeight = 80;
    this.groundScrollX = 0;
    this.groundScrollSpeed = 3;

    // Background
    this.scrollX = 0;
    this.scrollSpeedSlow = 0.3;

    // Game dimensions
    this.width = 400;
    this.height = 600;
    this.skyColor = '#87CEEB';
    this.groundColor = '#90EE90';

    // Touch/click tracking
    this.inputHandler = this.handleInput.bind(this);

    // Animation frame ID
    this.animationFrameId = null;

    this.init();
  }

  init() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.canvas.className = 'flappy-bird-canvas';
    this.container.appendChild(this.canvas);

    this.ctx = this.canvas.getContext('2d');

    // Event listeners
    document.addEventListener('keydown', this.inputHandler);
    this.canvas.addEventListener('click', this.inputHandler);
    this.canvas.addEventListener('touchstart', this.inputHandler);

    this.reset();
  }

  reset() {
    this.bird.y = 150;
    this.bird.velocity = 0;
    this.bird.rotation = 0;
    this.pipes = [];
    this.groundScrollX = 0;
    this.scrollX = 0;
    this.score = 0;
    this.gameOver = false;
    this.gameStarted = false;
    this.paused = false;
    this.gameActive = false;
    this.nextPipeX = 300;
    this.pipeGap = 120;
  }

  handleInput(e) {
    if (e.code === 'Space' || e.type === 'click' || e.type === 'touchstart') {
      e.preventDefault();

      if (!this.gameStarted) {
        this.gameStarted = true;
        this.gameActive = true;
      }

      if (this.gameActive && !this.paused && !this.gameOver) {
        this.bird.velocity = this.flapPower;
      }

      if (this.gameOver) {
        this.reset();
      }
    }
  }

  start() {
    this.gameActive = true;
    this.paused = false;
    this.gameStarted = true;
    this.animate();
  }

  pause() {
    this.paused = true;
  }

  resume() {
    this.paused = false;
    this.animate();
  }

  destroy() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    document.removeEventListener('keydown', this.inputHandler);
    this.canvas.removeEventListener('click', this.inputHandler);
    this.canvas.removeEventListener('touchstart', this.inputHandler);
    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
  }

  getScore() {
    return this.score;
  }

  update() {
    if (!this.gameActive || this.paused) return;

    // Apply gravity
    this.bird.velocity += this.gravity;
    this.bird.velocity = Math.min(this.bird.velocity, this.maxVelocity);

    // Update bird position
    this.bird.y += this.bird.velocity;

    // Update bird rotation based on velocity
    this.bird.rotation = Math.min(Math.max(this.bird.velocity / 10, -1), 1) * 0.5;

    // Move pipes
    for (let i = this.pipes.length - 1; i >= 0; i--) {
      this.pipes[i].x -= this.pipeSpeed;

      // Remove off-screen pipes
      if (this.pipes[i].x + this.pipeWidth < 0) {
        this.pipes.splice(i, 1);
      } else if (!this.pipes[i].scored && this.pipes[i].x + this.pipeWidth < this.bird.x) {
        // Score when bird passes pipe
        this.pipes[i].scored = true;
        this.score++;
        
        // Gradually decrease gap size for difficulty ramp
        this.pipeGap = Math.max(this.minGapSize, this.pipeGap - 2);
      }
    }

    // Generate new pipes
    if (this.nextPipeX < this.width) {
      this.generatePipe();
      this.nextPipeX += this.pipeSpacing;
    }

    // Move ground
    this.groundScrollX -= this.groundScrollSpeed;
    this.groundScrollX %= 336; // Tile width for ground pattern

    // Move sky (parallax)
    this.scrollX -= this.scrollSpeedSlow;
    if (this.scrollX < -this.width) {
      this.scrollX = 0;
    }

    // Collision detection
    this.checkCollisions();
  }

  generatePipe() {
    const minY = 50;
    const maxY = this.height - this.groundHeight - this.pipeGap - 50;
    const topY = Math.random() * (maxY - minY) + minY;

    this.pipes.push({
      x: this.width,
      topY: topY,
      bottomY: topY + this.pipeGap,
      scored: false,
    });
  }

  checkCollisions() {
    // Ground collision
    if (this.bird.y + this.bird.height / 2 >= this.height - this.groundHeight) {
      this.endGame();
      return;
    }

    // Ceiling collision
    if (this.bird.y - this.bird.height / 2 <= 0) {
      this.endGame();
      return;
    }

    // Pipe collision
    for (let pipe of this.pipes) {
      // Check if bird is in pipe's x range
      if (
        this.bird.x + this.bird.width / 2 > pipe.x &&
        this.bird.x - this.bird.width / 2 < pipe.x + this.pipeWidth
      ) {
        // Check if bird collides with top or bottom pipe
        if (
          this.bird.y - this.bird.height / 2 < pipe.topY ||
          this.bird.y + this.bird.height / 2 > pipe.bottomY
        ) {
          this.endGame();
          return;
        }
      }
    }
  }

  endGame() {
    this.gameActive = false;
    this.gameOver = true;
  }

  getMedal() {
    if (this.score >= 40) return 'platinum';
    if (this.score >= 30) return 'gold';
    if (this.score >= 20) return 'silver';
    if (this.score >= 10) return 'bronze';
    return null;
  }

  drawBackground() {
    // Sky
    this.ctx.fillStyle = this.skyColor;
    this.ctx.fillRect(0, 0, this.width, this.height - this.groundHeight);

    // Clouds (parallax effect)
    this.drawClouds();

    // Ground
    this.ctx.fillStyle = this.groundColor;
    this.ctx.fillRect(0, this.height - this.groundHeight, this.width, this.groundHeight);

    // Ground pattern (repeating tiles for scrolling effect)
    this.ctx.strokeStyle = '#7CB342';
    this.ctx.lineWidth = 2;
    for (let i = -1; i < 3; i++) {
      const x = i * 168 + this.groundScrollX;
      this.ctx.beginPath();
      this.ctx.moveTo(x, this.height - this.groundHeight);
      this.ctx.lineTo(x + 168, this.height - this.groundHeight - 20);
      this.ctx.stroke();
    }
  }

  drawClouds() {
    const clouds = [
      { x: 50, y: 60, size: 1 },
      { x: 200, y: 100, size: 0.8 },
      { x: 350, y: 50, size: 0.6 },
    ];

    const cloudColor = 'rgba(255, 255, 255, 0.7)';
    this.ctx.fillStyle = cloudColor;

    for (let cloud of clouds) {
      const x = ((cloud.x + this.scrollX) % (this.width + 100)) - 50;
      const y = cloud.y;
      const size = cloud.size;

      // Simple cloud shape
      this.ctx.beginPath();
      this.ctx.arc(x, y, 15 * size, 0, Math.PI * 2);
      this.ctx.arc(x + 20 * size, y - 10 * size, 20 * size, 0, Math.PI * 2);
      this.ctx.arc(x + 40 * size, y, 15 * size, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  drawBird() {
    const x = this.bird.x;
    const y = this.bird.y;

    this.ctx.save();
    this.ctx.translate(x, y);
    this.ctx.rotate(this.bird.rotation);

    // Body (yellow)
    this.ctx.fillStyle = '#FFD700';
    this.ctx.beginPath();
    this.ctx.ellipse(0, 0, this.bird.width / 2, this.bird.height / 2.5, 0, 0, Math.PI * 2);
    this.ctx.fill();

    // Head (yellow)
    this.ctx.beginPath();
    this.ctx.arc(8, -5, this.bird.width / 3, 0, Math.PI * 2);
    this.ctx.fill();

    // Eye (white)
    this.ctx.fillStyle = 'white';
    this.ctx.beginPath();
    this.ctx.arc(12, -7, 4, 0, Math.PI * 2);
    this.ctx.fill();

    // Pupil (black)
    this.ctx.fillStyle = 'black';
    this.ctx.beginPath();
    this.ctx.arc(13, -7, 2, 0, Math.PI * 2);
    this.ctx.fill();

    // Wing
    this.ctx.fillStyle = 'rgba(255, 215, 0, 0.8)';
    this.ctx.beginPath();
    this.ctx.ellipse(-5, 0, 12, 8, -0.3, 0, Math.PI * 2);
    this.ctx.fill();

    // Beak (orange)
    this.ctx.fillStyle = '#FF8C00';
    this.ctx.beginPath();
    this.ctx.moveTo(10, -3);
    this.ctx.lineTo(18, -5);
    this.ctx.lineTo(10, -1);
    this.ctx.fill();

    this.ctx.restore();
  }

  drawPipes() {
    for (let pipe of this.pipes) {
      // Top pipe
      this.ctx.fillStyle = '#228B22';
      this.ctx.fillRect(pipe.x, 0, this.pipeWidth, pipe.topY);

      // Pipe cap (darker green)
      this.ctx.fillStyle = '#1a6b1a';
      this.ctx.fillRect(pipe.x - 2, pipe.topY - 10, this.pipeWidth + 4, 10);

      // Bottom pipe
      this.ctx.fillStyle = '#228B22';
      this.ctx.fillRect(pipe.x, pipe.bottomY, this.pipeWidth, this.height - this.groundHeight - pipe.bottomY);

      // Pipe cap
      this.ctx.fillStyle = '#1a6b1a';
      this.ctx.fillRect(pipe.x - 2, pipe.bottomY, this.pipeWidth + 4, 10);

      // Pipe pattern (vertical lines for wood effect)
      this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
      this.ctx.lineWidth = 2;
      for (let i = 0; i < this.pipeWidth; i += 15) {
        this.ctx.beginPath();
        this.ctx.moveTo(pipe.x + i, 0);
        this.ctx.lineTo(pipe.x + i, pipe.topY);
        this.ctx.stroke();

        this.ctx.beginPath();
        this.ctx.moveTo(pipe.x + i, pipe.bottomY);
        this.ctx.lineTo(pipe.x + i, this.height - this.groundHeight);
        this.ctx.stroke();
      }
    }
  }

  drawHUD() {
    // Score display
    this.ctx.fillStyle = 'white';
    this.ctx.font = 'bold 32px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.strokeStyle = 'black';
    this.ctx.lineWidth = 3;
    this.ctx.strokeText(this.score.toString(), this.width / 2, 50);
    this.ctx.fillText(this.score.toString(), this.width / 2, 50);
  }

  drawGetReady() {
    // Semi-transparent overlay
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Text
    this.ctx.fillStyle = 'white';
    this.ctx.font = 'bold 40px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.strokeStyle = 'black';
    this.ctx.lineWidth = 2;
    
    this.ctx.strokeText('GET READY', this.width / 2, this.height / 2 - 30);
    this.ctx.fillText('GET READY', this.width / 2, this.height / 2 - 30);

    this.ctx.font = '20px Arial';
    this.ctx.strokeText('Press Space / Click to Start', this.width / 2, this.height / 2 + 40);
    this.ctx.fillText('Press Space / Click to Start', this.width / 2, this.height / 2 + 40);
  }

  drawGameOver() {
    // Semi-transparent overlay
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Game Over box
    this.ctx.fillStyle = 'white';
    this.ctx.fillRect(this.width / 2 - 150, this.height / 2 - 150, 300, 300);

    // Game Over text
    this.ctx.fillStyle = '#333';
    this.ctx.font = 'bold 48px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('GAME OVER', this.width / 2, this.height / 2 - 100);

    // Score
    this.ctx.font = 'bold 32px Arial';
    this.ctx.fillText('Score: ' + this.score, this.width / 2, this.height / 2 - 20);

    // Medal
    const medal = this.getMedal();
    if (medal) {
      const medalColors = {
        bronze: '#CD7F32',
        silver: '#C0C0C0',
        gold: '#FFD700',
        platinum: '#E5E4E2',
      };
      this.ctx.fillStyle = medalColors[medal];
      this.ctx.beginPath();
      this.ctx.arc(this.width / 2, this.height / 2 + 40, 30, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.strokeStyle = '#333';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();

      this.ctx.fillStyle = '#333';
      this.ctx.font = '20px Arial';
      this.ctx.fillText(medal.toUpperCase(), this.width / 2, this.height / 2 + 100);
    }

    // Play Again text
    this.ctx.font = '18px Arial';
    this.ctx.fillStyle = '#666';
    this.ctx.fillText('Press Space / Click to Play Again', this.width / 2, this.height / 2 + 140);
  }

  draw() {
    this.drawBackground();
    this.drawPipes();
    this.drawBird();
    this.drawHUD();

    if (!this.gameStarted && !this.gameOver) {
      this.drawGetReady();
    }

    if (this.gameOver) {
      this.drawGameOver();
    }
  }

  animate() {
    if (!this.gameActive && !this.gameOver) return;

    this.update();
    this.draw();

    if (this.gameActive && !this.paused) {
      this.animationFrameId = requestAnimationFrame(() => this.animate());
    }
  }
}

window.FlappyBird = FlappyBird;
