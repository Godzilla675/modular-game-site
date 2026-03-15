/**
 * Frogger Game
 * A retro-style Frogger game with cars, logs, and turtles
 */

class Frogger {
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
    this.level = 1;
    this.timeRemaining = 30; // seconds
    this.maxTime = 30;
    
    // Game dimensions
    this.tileSize = 40;
    this.rows = 13;
    this.cols = 13;
    this.canvasWidth = this.cols * this.tileSize;
    this.canvasHeight = this.rows * this.tileSize;
    
    // Frog
    this.frog = {
      x: 6, // center column
      y: 12, // bottom row
      nextX: 6,
      nextY: 12,
      moving: false,
      moveProgress: 0,
      maxMoveTime: 0.1 // seconds
    };
    
    this.frogsAtHome = 0;
    this.homeSpots = [false, false, false, false, false]; // 5 home positions
    
    // Game objects
    this.cars = [];
    this.logs = [];
    this.turtles = [];
    
    // Timing
    this.lastTime = 0;
    this.gameLoopId = null;
    this.timerInterval = null;
    
    // Touch
    this.touchStartX = 0;
    this.touchStartY = 0;
    
    // High-water mark for score
    this.maxRowReached = 12;
    
    this.setupGame();
  }
  
  setupGame() {
    // Create canvas
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'frogger-game-canvas';
    this.canvas.width = this.canvasWidth;
    this.canvas.height = this.canvasHeight;
    this.container.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');
    
    // Setup input listeners
    this.setupInput();
    
    // Initialize game objects
    this.initializeLevel();
  }
  
  initializeLevel() {
    // Clear objects
    this.cars = [];
    this.logs = [];
    this.turtles = [];
    this.frogsAtHome = 0;
    this.homeSpots = [false, false, false, false, false];
    
    // Reset frog
    this.frog = {
      x: 6,
      y: 12,
      nextX: 6,
      nextY: 12,
      moving: false,
      moveProgress: 0,
      maxMoveTime: 0.1
    };
    
    this.maxRowReached = 12;
    this.timeRemaining = this.maxTime;
    
    // Create cars (rows 6-9, from bottom)
    // Row 9 - fast cars going right
    this.createCarLine(9, 'right', 3, 1.5 + (this.level * 0.3), '#FF0000');
    // Row 8 - trucks going left
    this.createCarLine(8, 'left', 2, 1 + (this.level * 0.2), '#FF6600');
    // Row 7 - fast cars going right
    this.createCarLine(7, 'right', 4, 1.8 + (this.level * 0.3), '#FFFF00');
    // Row 6 - trucks going left
    this.createCarLine(6, 'left', 2, 0.8 + (this.level * 0.2), '#FF3300');
    
    // Create logs (rows 2-5, from bottom)
    // Row 5 - logs going right
    this.createLogLine(5, 'right', 3, 0.6, '#8B4513');
    // Row 4 - turtles going left
    this.createTurtleLine(4, 'left', 3, 0.8, '#228B22');
    // Row 3 - logs going right
    this.createLogLine(3, 'right', 2, 0.5, '#8B4513');
    // Row 2 - turtles going left
    this.createTurtleLine(2, 'left', 2, 0.7, '#228B22');
  }
  
  createCarLine(row, direction, count, speed, color) {
    const spacing = this.canvasWidth / count;
    for (let i = 0; i < count; i++) {
      this.cars.push({
        x: (i * spacing),
        y: row,
        width: 1.8,
        height: 0.8,
        speed: speed,
        direction: direction,
        color: color
      });
    }
  }
  
  createLogLine(row, direction, count, speed, color) {
    const spacing = this.canvasWidth / count;
    for (let i = 0; i < count; i++) {
      this.logs.push({
        x: (i * spacing) / this.tileSize,
        y: row,
        width: 2.5,
        height: 0.6,
        speed: speed,
        direction: direction,
        color: color
      });
    }
  }
  
  createTurtleLine(row, direction, count, speed, color) {
    const spacing = this.canvasWidth / count;
    for (let i = 0; i < count; i++) {
      const turtle = {
        x: (i * spacing) / this.tileSize,
        y: row,
        width: 1.2,
        height: 0.6,
        speed: speed,
        direction: direction,
        color: color,
        diveTime: 0,
        diveState: 'swimming' // 'swimming' or 'diving'
      };
      // Random dive timing
      turtle.nextDiveTime = Math.random() * 3 + 2;
      this.turtles.push(turtle);
    }
  }
  
  setupInput() {
    this.keyDownListener = (e) => this.handleKeyDown(e);
    this.touchStartListener = (e) => this.handleTouchStart(e);
    this.touchEndListener = (e) => this.handleTouchEnd(e);
    
    window.addEventListener('keydown', this.keyDownListener);
    this.canvas.addEventListener('touchstart', this.touchStartListener);
    this.canvas.addEventListener('touchend', this.touchEndListener);
  }
  
  handleKeyDown(e) {
    if (!this.gameRunning || this.gamePaused || this.gameOver) return;
    
    switch(e.key) {
      case 'ArrowUp':
        this.moveFrog(0, -1);
        e.preventDefault();
        break;
      case 'ArrowDown':
        this.moveFrog(0, 1);
        e.preventDefault();
        break;
      case 'ArrowLeft':
        this.moveFrog(-1, 0);
        e.preventDefault();
        break;
      case 'ArrowRight':
        this.moveFrog(1, 0);
        e.preventDefault();
        break;
    }
  }
  
  handleTouchStart(e) {
    this.touchStartX = e.touches[0].clientX;
    this.touchStartY = e.touches[0].clientY;
  }
  
  handleTouchEnd(e) {
    if (!this.gameRunning || this.gamePaused || this.gameOver) return;
    
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    
    const deltaX = touchEndX - this.touchStartX;
    const deltaY = touchEndY - this.touchStartY;
    const threshold = 30;
    
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX > threshold) {
        this.moveFrog(1, 0); // Right
      } else if (deltaX < -threshold) {
        this.moveFrog(-1, 0); // Left
      }
    } else {
      if (deltaY > threshold) {
        this.moveFrog(0, 1); // Down
      } else if (deltaY < -threshold) {
        this.moveFrog(0, -1); // Up
      }
    }
  }
  
  moveFrog(dx, dy) {
    if (this.frog.moving) return;
    
    const newX = this.frog.x + dx;
    const newY = this.frog.y + dy;
    
    // Boundary check
    if (newX < 0 || newX >= this.cols || newY < 0 || newY >= this.rows) {
      return;
    }
    
    this.frog.nextX = newX;
    this.frog.nextY = newY;
    this.frog.moving = true;
    this.frog.moveProgress = 0;
  }
  
  start() {
    this.gameRunning = true;
    this.gamePaused = false;
    this.gameOver = false;
    this.lives = 3;
    this.score = 0;
    this.level = 1;
    this.initializeLevel();
    this.lastTime = Date.now();
    this.gameLoopId = requestAnimationFrame((time) => this.gameLoop(time));
    this.startTimer();
  }
  
  startTimer() {
    this.timerInterval = setInterval(() => {
      if (this.gameRunning && !this.gamePaused) {
        this.timeRemaining -= 1;
        if (this.timeRemaining <= 0) {
          this.loseLife('Time ran out!');
        }
      }
    }, 1000);
  }
  
  pause() {
    if (this.gameRunning) {
      this.gamePaused = true;
    }
  }
  
  resume() {
    if (this.gameRunning) {
      this.gamePaused = false;
    }
  }
  
  gameLoop(timestamp) {
    if (!this.lastTime) this.lastTime = timestamp;
    const deltaTime = (timestamp - this.lastTime) / 1000;
    this.lastTime = timestamp;
    
    if (this.gameRunning && !this.gamePaused) {
      this.update(deltaTime);
    }
    
    this.render();
    
    if (this.gameRunning) {
      this.gameLoopId = requestAnimationFrame((time) => this.gameLoop(time));
    }
  }
  
  update(deltaTime) {
    // Update frog movement
    if (this.frog.moving) {
      this.frog.moveProgress += deltaTime;
      if (this.frog.moveProgress >= this.frog.maxMoveTime) {
        this.frog.x = this.frog.nextX;
        this.frog.y = this.frog.nextY;
        this.frog.moving = false;
        
        // Track max row reached
        if (this.frog.y < this.maxRowReached) {
          const rowsAdvanced = this.maxRowReached - this.frog.y;
          this.score += rowsAdvanced * 10;
          this.maxRowReached = this.frog.y;
        }
      }
    }
    
    // Update cars
    for (let car of this.cars) {
      if (car.direction === 'right') {
        car.x += car.speed * deltaTime;
        if (car.x > this.cols) {
          car.x = -car.width;
        }
      } else {
        car.x -= car.speed * deltaTime;
        if (car.x < -car.width) {
          car.x = this.cols;
        }
      }
    }
    
    // Update logs
    for (let log of this.logs) {
      if (log.direction === 'right') {
        log.x += log.speed * deltaTime;
        if (log.x > this.cols) {
          log.x = -log.width;
        }
      } else {
        log.x -= log.speed * deltaTime;
        if (log.x < -log.width) {
          log.x = this.cols;
        }
      }
    }
    
    // Update turtles
    for (let turtle of this.turtles) {
      // Movement
      if (turtle.direction === 'right') {
        turtle.x += turtle.speed * deltaTime;
        if (turtle.x > this.cols) {
          turtle.x = -turtle.width;
        }
      } else {
        turtle.x -= turtle.speed * deltaTime;
        if (turtle.x < -turtle.width) {
          turtle.x = this.cols;
        }
      }
      
      // Dive behavior
      turtle.diveTime += deltaTime;
      if (turtle.diveTime >= turtle.nextDiveTime) {
        turtle.diveState = turtle.diveState === 'swimming' ? 'diving' : 'swimming';
        turtle.diveTime = 0;
        turtle.nextDiveTime = turtle.diveState === 'diving' 
          ? Math.random() * 2 + 1  // Diving for 1-3 seconds
          : Math.random() * 3 + 2;  // Swimming for 2-5 seconds
      }
    }
    
    // Check collisions
    this.checkCollisions();
    
    // Check if frog reached home
    if (this.frog.y === 0) {
      const homeIndex = this.frog.x;
      if (homeIndex >= 0 && homeIndex < 5 && !this.homeSpots[homeIndex]) {
        this.homeSpots[homeIndex] = true;
        this.frogsAtHome++;
        this.score += 50;
        
        if (this.frogsAtHome === 5) {
          this.levelComplete();
        } else {
          this.resetFrogPosition();
        }
      } else {
        // Hit wall or already occupied
        this.loseLife('Home spot blocked!');
      }
    }
  }
  
  checkCollisions() {
    // Get frog position in tile coordinates
    const frogTileX = this.frog.x;
    const frogTileY = this.frog.y;
    
    // Check car collisions (rows 6-9)
    if (frogTileY >= 6 && frogTileY <= 9) {
      for (let car of this.cars) {
        if (car.y === frogTileY) {
          if (this.collidesWithCar(frogTileX, car)) {
            this.loseLife('Hit by car!');
            return;
          }
        }
      }
    }
    
    // Check river collisions (rows 2-5)
    if (frogTileY >= 2 && frogTileY <= 5) {
      let onFloating = false;
      let floatingSpeedX = 0;
      let floatingDirection = 'right';
      
      // Check logs
      for (let log of this.logs) {
        if (log.y === frogTileY) {
          if (this.collidesWithLog(frogTileX, log)) {
            onFloating = true;
            floatingSpeedX = log.speed;
            floatingDirection = log.direction;
            break;
          }
        }
      }
      
      // Check turtles
      if (!onFloating) {
        for (let turtle of this.turtles) {
          if (turtle.y === frogTileY) {
            if (turtle.diveState === 'swimming' && this.collidesWithTurtle(frogTileX, turtle)) {
              onFloating = true;
              floatingSpeedX = turtle.speed;
              floatingDirection = turtle.direction;
              break;
            }
          }
        }
      }
      
      if (!onFloating) {
        this.loseLife('Fell in water!');
        return;
      }
    }
  }
  
  collidesWithCar(frogX, car) {
    const carLeft = car.x;
    const carRight = car.x + car.width;
    return frogX >= carLeft - 0.3 && frogX <= carRight;
  }
  
  collidesWithLog(frogX, log) {
    const logLeft = log.x;
    const logRight = log.x + log.width;
    return frogX >= logLeft - 0.3 && frogX <= logRight;
  }
  
  collidesWithTurtle(frogX, turtle) {
    const turtleLeft = turtle.x;
    const turtleRight = turtle.x + turtle.width;
    return frogX >= turtleLeft - 0.3 && frogX <= turtleRight;
  }
  
  resetFrogPosition() {
    this.frog.x = 6;
    this.frog.y = 12;
    this.frog.nextX = 6;
    this.frog.nextY = 12;
    this.frog.moving = false;
    this.maxRowReached = 12;
    this.timeRemaining = this.maxTime;
  }
  
  loseLife(reason = '') {
    this.lives--;
    if (this.lives <= 0) {
      this.endGame();
    } else {
      this.resetFrogPosition();
    }
  }
  
  levelComplete() {
    this.level++;
    this.score += this.timeRemaining * 5; // Bonus for remaining time
    this.initializeLevel();
    this.resetFrogPosition();
  }
  
  endGame() {
    this.gameRunning = false;
    this.gameOver = true;
    clearInterval(this.timerInterval);
    if (this.gameLoopId) {
      cancelAnimationFrame(this.gameLoopId);
    }
  }
  
  render() {
    // Clear canvas
    this.ctx.fillStyle = '#2C3E50';
    this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
    
    // Draw water (rows 0-1)
    this.ctx.fillStyle = '#3498DB';
    this.ctx.fillRect(0, 0, this.canvasWidth, this.tileSize * 2);
    
    // Draw safe zones
    this.ctx.fillStyle = '#34495E';
    for (let i = 0; i < 5; i++) {
      const x = i * (this.canvasWidth / 5);
      this.ctx.fillRect(x, 0, this.canvasWidth / 5, this.tileSize);
      
      // Draw home spots
      this.ctx.strokeStyle = this.homeSpots[i] ? '#2ECC71' : '#95A5A6';
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(x + 5, 5, this.canvasWidth / 5 - 10, this.tileSize - 10);
      
      if (this.homeSpots[i]) {
        this.ctx.fillStyle = '#2ECC71';
        this.ctx.fillRect(x + 5, 5, this.canvasWidth / 5 - 10, this.tileSize - 10);
      }
    }
    
    // Draw logs
    this.ctx.fillStyle = '#8B4513';
    for (let log of this.logs) {
      const x = log.x * this.tileSize;
      const y = log.y * this.tileSize;
      this.ctx.fillRect(x, y + 7, log.width * this.tileSize, log.height * this.tileSize);
      this.ctx.strokeStyle = '#654321';
      this.ctx.lineWidth = 1;
      this.ctx.strokeRect(x, y + 7, log.width * this.tileSize, log.height * this.tileSize);
    }
    
    // Draw turtles
    for (let turtle of this.turtles) {
      const x = turtle.x * this.tileSize;
      const y = turtle.y * this.tileSize;
      
      if (turtle.diveState === 'swimming') {
        this.ctx.fillStyle = '#228B22';
      } else {
        this.ctx.fillStyle = '#1a6b1a';
      }
      
      // Draw turtle shape
      this.ctx.beginPath();
      this.ctx.ellipse(x + (turtle.width * this.tileSize) / 2, y + 10, 
                       (turtle.width * this.tileSize) / 2, 8, 0, 0, Math.PI * 2);
      this.ctx.fill();
    }
    
    // Draw cars
    for (let car of this.cars) {
      const x = car.x * this.tileSize;
      const y = car.y * this.tileSize;
      
      this.ctx.fillStyle = car.color;
      this.ctx.fillRect(x, y + 8, car.width * this.tileSize, car.height * this.tileSize);
      
      // Windows
      this.ctx.fillStyle = '#333';
      this.ctx.fillRect(x + 8, y + 10, 8, 8);
      this.ctx.fillRect(x + 20, y + 10, 8, 8);
    }
    
    // Draw grass separators
    this.ctx.strokeStyle = '#27AE60';
    this.ctx.lineWidth = 1;
    this.ctx.setLineDash([5, 5]);
    for (let row of [1, 5, 10, 12]) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, row * this.tileSize);
      this.ctx.lineTo(this.canvasWidth, row * this.tileSize);
      this.ctx.stroke();
    }
    this.ctx.setLineDash([]);
    
    // Draw frog
    this.renderFrog();
    
    // Draw UI
    this.renderUI();
  }
  
  renderFrog() {
    let displayX = this.frog.x;
    let displayY = this.frog.y;
    
    if (this.frog.moving) {
      const progress = this.frog.moveProgress / this.frog.maxMoveTime;
      displayX = this.frog.x + (this.frog.nextX - this.frog.x) * progress;
      displayY = this.frog.y + (this.frog.nextY - this.frog.y) * progress;
    }
    
    const x = displayX * this.tileSize + this.tileSize / 2;
    const y = displayY * this.tileSize + this.tileSize / 2;
    
    // Draw frog body
    this.ctx.fillStyle = '#2ECC71';
    this.ctx.beginPath();
    this.ctx.ellipse(x, y, 10, 12, 0, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Draw eyes
    this.ctx.fillStyle = '#000';
    this.ctx.beginPath();
    this.ctx.arc(x - 5, y - 4, 2, 0, Math.PI * 2);
    this.ctx.arc(x + 5, y - 4, 2, 0, Math.PI * 2);
    this.ctx.fill();
  }
  
  renderUI() {
    // Semi-transparent overlay for text
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    this.ctx.fillRect(0, this.canvasHeight - 35, this.canvasWidth, 35);
    
    this.ctx.fillStyle = '#FFF';
    this.ctx.font = '12px Arial';
    this.ctx.textAlign = 'left';
    
    this.ctx.fillText(`Score: ${this.score}`, 10, this.canvasHeight - 18);
    this.ctx.fillText(`Lives: ${this.lives}`, 10, this.canvasHeight - 5);
    
    this.ctx.textAlign = 'right';
    this.ctx.fillText(`Level: ${this.level}`, this.canvasWidth - 10, this.canvasHeight - 18);
    this.ctx.fillText(`Time: ${this.timeRemaining}s`, this.canvasWidth - 10, this.canvasHeight - 5);
    
    // Draw pause/game over overlay
    if (this.gamePaused) {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
      
      this.ctx.fillStyle = '#FFF';
      this.ctx.font = 'bold 24px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('PAUSED', this.canvasWidth / 2, this.canvasHeight / 2);
    }
    
    if (this.gameOver) {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
      
      this.ctx.fillStyle = '#FF0000';
      this.ctx.font = 'bold 28px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('GAME OVER', this.canvasWidth / 2, this.canvasHeight / 2 - 20);
      
      this.ctx.fillStyle = '#FFF';
      this.ctx.font = '16px Arial';
      this.ctx.fillText(`Final Score: ${this.score}`, this.canvasWidth / 2, this.canvasHeight / 2 + 20);
    }
  }
  
  getScore() {
    return this.score;
  }
  
  destroy() {
    this.gameRunning = false;
    this.gamePaused = false;
    
    // Clear timers
    if (this.gameLoopId) {
      cancelAnimationFrame(this.gameLoopId);
      this.gameLoopId = null;
    }
    
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    
    // Remove listeners
    if (this.keyDownListener) {
      window.removeEventListener('keydown', this.keyDownListener);
    }
    if (this.touchStartListener) {
      this.canvas.removeEventListener('touchstart', this.touchStartListener);
    }
    if (this.touchEndListener) {
      this.canvas.removeEventListener('touchend', this.touchEndListener);
    }
    
    // Clear canvas
    if (this.canvas && this.container.contains(this.canvas)) {
      this.container.removeChild(this.canvas);
    }
    
    // Clear references
    this.canvas = null;
    this.ctx = null;
    this.cars = [];
    this.logs = [];
    this.turtles = [];
  }
}

// Export for use
window.Frogger = Frogger;
