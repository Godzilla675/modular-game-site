class Snake {
  constructor(container) {
    this.container = container;
    this.canvas = null;
    this.ctx = null;
    this.gameRunning = false;
    this.gamePaused = false;
    this.gameOver = false;
    
    // Game state
    this.snake = [];
    this.food = null;
    this.direction = { x: 1, y: 0 };
    this.nextDirection = { x: 1, y: 0 };
    this.score = 0;
    this.foodCount = 0;
    this.speed = 8; // Initial speed (updates per second)
    this.baseSpeed = 8;
    
    // Game constants
    this.gridSize = 20;
    this.canvasSize = 400;
    this.gridCount = this.canvasSize / this.gridSize;
    
    // Touch/swipe detection
    this.touchStartX = 0;
    this.touchStartY = 0;
    
    // Animation loop
    this.frameCount = 0;
    this.gameLoopId = null;
    this.lastMoveTime = 0;
    
    // Color scheme
    this.colors = {
      background: '#0a0e27',
      snake: '#00ff41',
      snakeHead: '#00cc34',
      food: '#ff6b35',
      foodGlow: '#ff8555',
      wall: '#2a2f45',
      text: '#ffffff',
      gameOverBg: 'rgba(10, 14, 39, 0.9)',
      gameOverBorder: '#00ff41'
    };
    
    this.init();
  }
  
  init() {
    // Create canvas
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'snake-game-canvas game-canvas';
    this.canvas.width = this.canvasSize;
    this.canvas.height = this.canvasSize;
    this.container.appendChild(this.canvas);
    
    this.ctx = this.canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;
    
    // Bind event listeners
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleTouchStart = this.handleTouchStart.bind(this);
    this.handleTouchEnd = this.handleTouchEnd.bind(this);
    
    document.addEventListener('keydown', this.handleKeyDown);
    this.canvas.addEventListener('touchstart', this.handleTouchStart, false);
    this.canvas.addEventListener('touchend', this.handleTouchEnd, false);
  }
  
  start() {
    // Reset game state
    this.snake = [
      { x: Math.floor(this.gridCount / 2), y: Math.floor(this.gridCount / 2) }
    ];
    this.direction = { x: 1, y: 0 };
    this.nextDirection = { x: 1, y: 0 };
    this.score = 0;
    this.foodCount = 0;
    this.speed = this.baseSpeed;
    this.gameRunning = true;
    this.gamePaused = false;
    this.gameOver = false;
    this.frameCount = 0;
    this.lastMoveTime = 0;
    
    // Remove game over overlay if it exists
    const overlay = this.container.querySelector('.snake-game-over');
    if (overlay) {
      overlay.remove();
    }
    
    this.spawnFood();
    this.startGameLoop();
  }
  
  startGameLoop() {
    const gameLoop = () => {
      this.frameCount++;
      
      if (!this.gamePaused && this.gameRunning) {
        // Update game logic based on speed (updates per second)
        const now = Date.now();
        const timeSinceLastMove = now - this.lastMoveTime;
        const moveInterval = 1000 / this.speed;
        
        if (timeSinceLastMove >= moveInterval) {
          this.update();
          this.lastMoveTime = now;
        }
      }
      
      this.draw();
      
      if (this.gameRunning) {
        this.gameLoopId = requestAnimationFrame(gameLoop);
      }
    };
    
    this.gameLoopId = requestAnimationFrame(gameLoop);
  }
  
  update() {
    if (this.gameOver) {
      return;
    }
    
    // Update direction
    this.direction = { ...this.nextDirection };
    
    // Calculate new head position
    const head = this.snake[0];
    const newHead = {
      x: (head.x + this.direction.x + this.gridCount) % this.gridCount,
      y: (head.y + this.direction.y + this.gridCount) % this.gridCount
    };
    
    // Check wall collision (if not wrapping)
    // Actually, we're using wrapping, so walls are not a collision
    
    // Check self collision
    for (let segment of this.snake) {
      if (newHead.x === segment.x && newHead.y === segment.y) {
        this.endGame();
        return;
      }
    }
    
    // Add new head
    this.snake.unshift(newHead);
    
    // Check food collision
    if (newHead.x === this.food.x && newHead.y === this.food.y) {
      this.foodCount++;
      this.score = this.foodCount * 10;
      this.updateSpeed();
      this.spawnFood();
    } else {
      // Remove tail if no food eaten
      this.snake.pop();
    }
  }
  
  updateSpeed() {
    // Increase speed gradually as score increases
    // Speed increases every 5 foods eaten, capped at 20
    const speedIncrease = Math.floor(this.foodCount / 5);
    this.speed = Math.min(this.baseSpeed + speedIncrease, 20);
  }
  
  spawnFood() {
    let newFood;
    let isOnSnake = true;
    
    while (isOnSnake) {
      newFood = {
        x: Math.floor(Math.random() * this.gridCount),
        y: Math.floor(Math.random() * this.gridCount)
      };
      
      isOnSnake = this.snake.some(segment => 
        segment.x === newFood.x && segment.y === newFood.y
      );
    }
    
    this.food = newFood;
  }
  
  draw() {
    // Clear canvas
    this.ctx.fillStyle = this.colors.background;
    this.ctx.fillRect(0, 0, this.canvasSize, this.canvasSize);
    
    // Draw grid lines (optional, subtle)
    this.ctx.strokeStyle = 'rgba(42, 47, 69, 0.3)';
    this.ctx.lineWidth = 0.5;
    for (let i = 0; i <= this.gridCount; i++) {
      const pos = i * this.gridSize;
      this.ctx.beginPath();
      this.ctx.moveTo(pos, 0);
      this.ctx.lineTo(pos, this.canvasSize);
      this.ctx.stroke();
      
      this.ctx.beginPath();
      this.ctx.moveTo(0, pos);
      this.ctx.lineTo(this.canvasSize, pos);
      this.ctx.stroke();
    }
    
    // Draw snake
    for (let i = 0; i < this.snake.length; i++) {
      const segment = this.snake[i];
      const x = segment.x * this.gridSize;
      const y = segment.y * this.gridSize;
      
      if (i === 0) {
        // Draw head with glow effect
        this.ctx.shadowColor = this.colors.snakeHead;
        this.ctx.shadowBlur = 8;
        this.ctx.fillStyle = this.colors.snakeHead;
        this.ctx.fillRect(x + 1, y + 1, this.gridSize - 2, this.gridSize - 2);
        this.ctx.shadowColor = 'transparent';
      } else {
        // Draw body
        const brightness = Math.max(0.6, 1 - (i / this.snake.length) * 0.4);
        this.ctx.fillStyle = this.colors.snake;
        this.ctx.globalAlpha = brightness;
        this.ctx.fillRect(x + 1, y + 1, this.gridSize - 2, this.gridSize - 2);
        this.ctx.globalAlpha = 1;
      }
    }
    
    // Draw food with animation
    const foodX = this.food.x * this.gridSize;
    const foodY = this.food.y * this.gridSize;
    const pulse = Math.sin(this.frameCount * 0.1) * 0.3 + 0.7;
    
    this.ctx.shadowColor = this.colors.foodGlow;
    this.ctx.shadowBlur = 10 * pulse;
    this.ctx.fillStyle = this.colors.food;
    this.ctx.beginPath();
    this.ctx.arc(
      foodX + this.gridSize / 2,
      foodY + this.gridSize / 2,
      (this.gridSize / 2 - 2) * pulse,
      0,
      Math.PI * 2
    );
    this.ctx.fill();
    this.ctx.shadowColor = 'transparent';
    
    // Draw score
    this.ctx.fillStyle = this.colors.text;
    this.ctx.font = 'bold 16px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`Score: ${this.score}`, 10, 25);
    
    // Draw speed indicator
    this.ctx.font = 'bold 12px Arial';
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    this.ctx.fillText(`Speed: ${this.speed}`, 10, 45);
  }
  
  endGame() {
    this.gameRunning = false;
    this.gameOver = true;
    this.showGameOverOverlay();
  }
  
  showGameOverOverlay() {
    const overlay = document.createElement('div');
    overlay.className = 'snake-game-over';
    
    overlay.innerHTML = `
      <div class="snake-game-over-content">
        <h2 class="snake-game-over-title">Game Over!</h2>
        <div class="snake-score-display">
          <p class="snake-score-label">Final Score</p>
          <p class="snake-score-value">${this.score}</p>
          <p class="snake-food-eaten">${this.foodCount} food${this.foodCount !== 1 ? 's' : ''} eaten</p>
        </div>
        <button class="snake-play-again-btn">Play Again</button>
      </div>
    `;
    
    this.container.appendChild(overlay);
    
    const button = overlay.querySelector('.snake-play-again-btn');
    button.addEventListener('click', () => {
      overlay.remove();
      this.start();
    });
  }
  
  handleKeyDown(e) {
    if (!this.gameRunning || this.gameOver) {
      return;
    }
    
    const key = e.key.toUpperCase();
    const directions = {
      'ARROWUP': { x: 0, y: -1 },
      'W': { x: 0, y: -1 },
      'ARROWDOWN': { x: 0, y: 1 },
      'S': { x: 0, y: 1 },
      'ARROWLEFT': { x: -1, y: 0 },
      'A': { x: -1, y: 0 },
      'ARROWRIGHT': { x: 1, y: 0 },
      'D': { x: 1, y: 0 }
    };
    
    if (directions[key]) {
      e.preventDefault();
      const newDir = directions[key];
      
      // Prevent reversing into yourself
      if (this.direction.x === -newDir.x && this.direction.y === -newDir.y) {
        return;
      }
      
      this.nextDirection = newDir;
    }
    
    // Pause with Space
    if (key === ' ') {
      e.preventDefault();
      if (this.gamePaused) {
        this.resume();
      } else {
        this.pause();
      }
    }
  }
  
  handleTouchStart(e) {
    this.touchStartX = e.touches[0].clientX;
    this.touchStartY = e.touches[0].clientY;
  }
  
  handleTouchEnd(e) {
    if (!this.gameRunning || this.gameOver) {
      return;
    }
    
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    
    const deltaX = touchEndX - this.touchStartX;
    const deltaY = touchEndY - this.touchStartY;
    
    // Minimum swipe distance
    const minSwipeDistance = 30;
    
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Horizontal swipe
      if (Math.abs(deltaX) > minSwipeDistance) {
        const newDir = deltaX > 0 ? { x: 1, y: 0 } : { x: -1, y: 0 };
        
        // Prevent reversing into yourself
        if (this.direction.x === -newDir.x && this.direction.y === -newDir.y) {
          return;
        }
        
        this.nextDirection = newDir;
      }
    } else {
      // Vertical swipe
      if (Math.abs(deltaY) > minSwipeDistance) {
        const newDir = deltaY > 0 ? { x: 0, y: 1 } : { x: 0, y: -1 };
        
        // Prevent reversing into yourself
        if (this.direction.x === -newDir.x && this.direction.y === -newDir.y) {
          return;
        }
        
        this.nextDirection = newDir;
      }
    }
  }
  
  pause() {
    if (this.gameRunning && !this.gamePaused) {
      this.gamePaused = true;
      this.showPauseOverlay();
    }
  }
  
  showPauseOverlay() {
    if (this.container.querySelector('.snake-pause-overlay')) {
      return;
    }
    
    const overlay = document.createElement('div');
    overlay.className = 'snake-pause-overlay';
    overlay.innerHTML = `
      <div class="snake-pause-content">
        <h2 class="snake-pause-title">Paused</h2>
        <p class="snake-pause-text">Press Space to Resume</p>
        <p class="snake-current-score">Score: ${this.score}</p>
      </div>
    `;
    
    this.container.appendChild(overlay);
  }
  
  resume() {
    if (this.gamePaused) {
      this.gamePaused = false;
      const pauseOverlay = this.container.querySelector('.snake-pause-overlay');
      if (pauseOverlay) {
        pauseOverlay.remove();
      }
    }
  }
  
  getScore() {
    return this.score;
  }
  
  destroy() {
    this.gameRunning = false;
    this.gamePaused = false;
    
    if (this.gameLoopId) {
      cancelAnimationFrame(this.gameLoopId);
    }
    
    document.removeEventListener('keydown', this.handleKeyDown);
    
    if (this.canvas) {
      this.canvas.removeEventListener('touchstart', this.handleTouchStart);
      this.canvas.removeEventListener('touchend', this.handleTouchEnd);
      this.canvas.remove();
    }
    
    const overlays = this.container.querySelectorAll(
      '.snake-game-over, .snake-pause-overlay'
    );
    overlays.forEach(overlay => overlay.remove());
  }
}

window.Snake = Snake;
