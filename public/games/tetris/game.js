/**
 * Tetris Game Implementation
 * A full-featured Tetris game with canvas rendering, touch controls, and classic gameplay
 */

class Tetris {
  // Tetromino shapes (all rotations)
  static TETROMINOES = {
    I: {
      color: '#00F0F0',
      rotations: [
        [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]],
        [[0, 0, 1, 0], [0, 0, 1, 0], [0, 0, 1, 0], [0, 0, 1, 0]],
        [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]],
        [[0, 0, 1, 0], [0, 0, 1, 0], [0, 0, 1, 0], [0, 0, 1, 0]]
      ]
    },
    O: {
      color: '#F0F000',
      rotations: [
        [[1, 1], [1, 1]],
        [[1, 1], [1, 1]],
        [[1, 1], [1, 1]],
        [[1, 1], [1, 1]]
      ]
    },
    T: {
      color: '#A000F0',
      rotations: [
        [[0, 1, 0], [1, 1, 1], [0, 0, 0]],
        [[0, 1, 0], [0, 1, 1], [0, 1, 0]],
        [[0, 0, 0], [1, 1, 1], [0, 1, 0]],
        [[0, 1, 0], [1, 1, 0], [0, 1, 0]]
      ]
    },
    S: {
      color: '#00F000',
      rotations: [
        [[0, 1, 1], [1, 1, 0], [0, 0, 0]],
        [[0, 1, 0], [0, 1, 1], [0, 0, 1]],
        [[0, 1, 1], [1, 1, 0], [0, 0, 0]],
        [[0, 1, 0], [0, 1, 1], [0, 0, 1]]
      ]
    },
    Z: {
      color: '#F00000',
      rotations: [
        [[1, 1, 0], [0, 1, 1], [0, 0, 0]],
        [[0, 0, 1], [0, 1, 1], [0, 1, 0]],
        [[1, 1, 0], [0, 1, 1], [0, 0, 0]],
        [[0, 0, 1], [0, 1, 1], [0, 1, 0]]
      ]
    },
    J: {
      color: '#0000F0',
      rotations: [
        [[1, 0, 0], [1, 1, 1], [0, 0, 0]],
        [[0, 1, 1], [0, 1, 0], [0, 1, 0]],
        [[0, 0, 0], [1, 1, 1], [0, 0, 1]],
        [[0, 1, 0], [0, 1, 0], [1, 1, 0]]
      ]
    },
    L: {
      color: '#F0A000',
      rotations: [
        [[0, 0, 1], [1, 1, 1], [0, 0, 0]],
        [[0, 1, 0], [0, 1, 0], [0, 1, 1]],
        [[0, 0, 0], [1, 1, 1], [1, 0, 0]],
        [[1, 1, 0], [0, 1, 0], [0, 1, 0]]
      ]
    }
  };

  constructor(container) {
    this.container = container;
    this.width = 10;
    this.height = 20;
    this.blockSize = 30;
    this.ghostAlpha = 0.3;

    // Initialize game state
    this.reset();

    // Create DOM elements
    this.createElements();

    // Set up event listeners
    this.setupEventListeners();

    // Set up game loop
    this.gameLoopId = null;
    this.lastDropTime = 0;
  }

  reset() {
    this.grid = this.createEmptyGrid();
    this.currentPiece = this.spawnNewPiece();
    this.nextPiece = this.spawnNewPiece();
    this.score = 0;
    this.lines = 0;
    this.level = 1;
    this.gameOver = false;
    this.paused = false;
    this.lastDropTime = Date.now();
  }

  createEmptyGrid() {
    return Array(this.height)
      .fill(null)
      .map(() => Array(this.width).fill(0));
  }

  spawnNewPiece() {
    const types = Object.keys(Tetris.TETROMINOES);
    const type = types[Math.floor(Math.random() * types.length)];
    const tetrominoe = Tetris.TETROMINOES[type];

    return {
      type,
      rotation: 0,
      x: Math.floor(this.width / 2) - 1,
      y: 0,
      color: tetrominoe.color
    };
  }

  createElements() {
    this.container.innerHTML = '';
    this.container.className = 'tetris-game';

    // Main container
    const mainContainer = document.createElement('div');
    mainContainer.className = 'tetris-container';

    // Left panel with game canvas
    const gamePanel = document.createElement('div');
    gamePanel.className = 'tetris-game-panel';

    // Canvas for game
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'tetris-game-canvas';
    this.canvas.width = this.width * this.blockSize;
    this.canvas.height = this.height * this.blockSize;
    this.ctx = this.canvas.getContext('2d');

    gamePanel.appendChild(this.canvas);

    // Right panel with info
    const infoPanel = document.createElement('div');
    infoPanel.className = 'tetris-info-panel';

    // Score
    const scoreLabel = document.createElement('div');
    scoreLabel.className = 'tetris-label';
    scoreLabel.textContent = 'SCORE';
    const scoreValue = document.createElement('div');
    scoreValue.className = 'tetris-score';
    scoreValue.id = 'tetris-score';
    scoreValue.textContent = '0';

    const scoreSection = document.createElement('div');
    scoreSection.className = 'tetris-info-section';
    scoreSection.appendChild(scoreLabel);
    scoreSection.appendChild(scoreValue);

    // Level
    const levelLabel = document.createElement('div');
    levelLabel.className = 'tetris-label';
    levelLabel.textContent = 'LEVEL';
    const levelValue = document.createElement('div');
    levelValue.className = 'tetris-level';
    levelValue.id = 'tetris-level';
    levelValue.textContent = '1';

    const levelSection = document.createElement('div');
    levelSection.className = 'tetris-info-section';
    levelSection.appendChild(levelLabel);
    levelSection.appendChild(levelValue);

    // Lines
    const linesLabel = document.createElement('div');
    linesLabel.className = 'tetris-label';
    linesLabel.textContent = 'LINES';
    const linesValue = document.createElement('div');
    linesValue.className = 'tetris-lines';
    linesValue.id = 'tetris-lines';
    linesValue.textContent = '0';

    const linesSection = document.createElement('div');
    linesSection.className = 'tetris-info-section';
    linesSection.appendChild(linesLabel);
    linesSection.appendChild(linesValue);

    // Next piece
    const nextLabel = document.createElement('div');
    nextLabel.className = 'tetris-label';
    nextLabel.textContent = 'NEXT';
    nextLabel.style.marginTop = '20px';

    const nextCanvas = document.createElement('canvas');
    nextCanvas.className = 'tetris-next-canvas';
    nextCanvas.width = 120;
    nextCanvas.height = 100;
    this.nextCtx = nextCanvas.getContext('2d');

    const nextSection = document.createElement('div');
    nextSection.className = 'tetris-info-section';
    nextSection.appendChild(nextLabel);
    nextSection.appendChild(nextCanvas);

    // Controls info
    const controlsLabel = document.createElement('div');
    controlsLabel.className = 'tetris-label';
    controlsLabel.textContent = 'CONTROLS';
    controlsLabel.style.marginTop = '20px';

    const controlsText = document.createElement('div');
    controlsText.className = 'tetris-controls-text';
    controlsText.innerHTML = `
      <div>← → Move</div>
      <div>↑ Rotate</div>
      <div>↓ Soft Drop</div>
      <div>SPACE Hard Drop</div>
      <div>P Pause</div>
    `;

    const controlsSection = document.createElement('div');
    controlsSection.className = 'tetris-info-section';
    controlsSection.appendChild(controlsLabel);
    controlsSection.appendChild(controlsText);

    infoPanel.appendChild(scoreSection);
    infoPanel.appendChild(levelSection);
    infoPanel.appendChild(linesSection);
    infoPanel.appendChild(nextSection);
    infoPanel.appendChild(controlsSection);

    // Mobile controls
    const mobileControls = document.createElement('div');
    mobileControls.className = 'tetris-mobile-controls';

    const leftBtn = document.createElement('button');
    leftBtn.className = 'tetris-btn tetris-btn-left';
    leftBtn.textContent = '←';
    leftBtn.addEventListener('mousedown', () => this.moveLeft());
    leftBtn.addEventListener('touchstart', (e) => { e.preventDefault(); this.moveLeft(); });

    const rightBtn = document.createElement('button');
    rightBtn.className = 'tetris-btn tetris-btn-right';
    rightBtn.textContent = '→';
    rightBtn.addEventListener('mousedown', () => this.moveRight());
    rightBtn.addEventListener('touchstart', (e) => { e.preventDefault(); this.moveRight(); });

    const downBtn = document.createElement('button');
    downBtn.className = 'tetris-btn tetris-btn-down';
    downBtn.textContent = '↓';
    downBtn.addEventListener('mousedown', () => this.softDrop());
    downBtn.addEventListener('touchstart', (e) => { e.preventDefault(); this.softDrop(); });

    const rotateBtn = document.createElement('button');
    rotateBtn.className = 'tetris-btn tetris-btn-rotate';
    rotateBtn.textContent = '⟲';
    rotateBtn.addEventListener('mousedown', () => this.rotate());
    rotateBtn.addEventListener('touchstart', (e) => { e.preventDefault(); this.rotate(); });

    const dropBtn = document.createElement('button');
    dropBtn.className = 'tetris-btn tetris-btn-drop';
    dropBtn.textContent = 'DROP';
    dropBtn.addEventListener('mousedown', () => this.hardDrop());
    dropBtn.addEventListener('touchstart', (e) => { e.preventDefault(); this.hardDrop(); });

    mobileControls.appendChild(leftBtn);
    mobileControls.appendChild(rightBtn);
    mobileControls.appendChild(downBtn);
    mobileControls.appendChild(rotateBtn);
    mobileControls.appendChild(dropBtn);

    gamePanel.appendChild(mobileControls);

    mainContainer.appendChild(gamePanel);
    mainContainer.appendChild(infoPanel);

    this.container.appendChild(mainContainer);

    // Game over overlay
    this.gameOverOverlay = document.createElement('div');
    this.gameOverOverlay.className = 'tetris-game-over';
    this.gameOverOverlay.style.display = 'none';

    const gameOverContent = document.createElement('div');
    gameOverContent.className = 'tetris-game-over-content';

    const gameOverTitle = document.createElement('div');
    gameOverTitle.className = 'tetris-game-over-title';
    gameOverTitle.textContent = 'GAME OVER';

    const gameOverScore = document.createElement('div');
    gameOverScore.className = 'tetris-game-over-score';
    gameOverScore.id = 'tetris-game-over-score';
    gameOverScore.textContent = 'Score: 0';

    const playAgainBtn = document.createElement('button');
    playAgainBtn.className = 'tetris-btn tetris-btn-large';
    playAgainBtn.textContent = 'Play Again';
    playAgainBtn.addEventListener('click', () => this.start());

    gameOverContent.appendChild(gameOverTitle);
    gameOverContent.appendChild(gameOverScore);
    gameOverContent.appendChild(playAgainBtn);

    this.gameOverOverlay.appendChild(gameOverContent);
    this.container.appendChild(this.gameOverOverlay);
  }

  setupEventListeners() {
    document.addEventListener('keydown', (e) => {
      if (!this.gameOver && !this.paused) {
        switch (e.key) {
          case 'ArrowLeft':
            e.preventDefault();
            this.moveLeft();
            break;
          case 'ArrowRight':
            e.preventDefault();
            this.moveRight();
            break;
          case 'ArrowUp':
            e.preventDefault();
            this.rotate();
            break;
          case 'ArrowDown':
            e.preventDefault();
            this.softDrop();
            break;
          case ' ':
            e.preventDefault();
            this.hardDrop();
            break;
        }
      }
      if (e.key === 'p' || e.key === 'P') {
        this.paused ? this.resume() : this.pause();
      }
    });
  }

  moveLeft() {
    this.movePiece(-1, 0);
  }

  moveRight() {
    this.movePiece(1, 0);
  }

  softDrop() {
    this.movePiece(0, 1);
  }

  hardDrop() {
    while (this.movePiece(0, 1));
  }

  rotate() {
    const piece = this.currentPiece;
    const tetrominoe = Tetris.TETROMINOES[piece.type];
    const nextRotation = (piece.rotation + 1) % tetrominoe.rotations.length;
    const nextShape = tetrominoe.rotations[nextRotation];

    if (this.canPlacePiece(piece.x, piece.y, nextShape)) {
      piece.rotation = nextRotation;
    } else {
      // Try wall kick
      for (let offset = 1; offset <= 2; offset++) {
        if (this.canPlacePiece(piece.x - offset, piece.y, nextShape)) {
          piece.x -= offset;
          piece.rotation = nextRotation;
          return;
        }
        if (this.canPlacePiece(piece.x + offset, piece.y, nextShape)) {
          piece.x += offset;
          piece.rotation = nextRotation;
          return;
        }
      }
    }
  }

  movePiece(dx, dy) {
    const piece = this.currentPiece;
    const tetrominoe = Tetris.TETROMINOES[piece.type];
    const shape = tetrominoe.rotations[piece.rotation];

    if (this.canPlacePiece(piece.x + dx, piece.y + dy, shape)) {
      piece.x += dx;
      piece.y += dy;
      return true;
    }

    // If moving down fails, lock piece
    if (dy > 0) {
      this.lockPiece();
      return false;
    }

    return false;
  }

  canPlacePiece(x, y, shape) {
    for (let row = 0; row < shape.length; row++) {
      for (let col = 0; col < shape[row].length; col++) {
        if (shape[row][col]) {
          const gridX = x + col;
          const gridY = y + row;

          if (gridX < 0 || gridX >= this.width || gridY >= this.height) {
            return false;
          }

          if (gridY >= 0 && this.grid[gridY][gridX]) {
            return false;
          }
        }
      }
    }
    return true;
  }

  lockPiece() {
    const piece = this.currentPiece;
    const tetrominoe = Tetris.TETROMINOES[piece.type];
    const shape = tetrominoe.rotations[piece.rotation];

    for (let row = 0; row < shape.length; row++) {
      for (let col = 0; col < shape[row].length; col++) {
        if (shape[row][col]) {
          const gridX = piece.x + col;
          const gridY = piece.y + row;

          if (gridY >= 0) {
            this.grid[gridY][gridX] = piece.color;
          }
        }
      }
    }

    this.clearLines();
    this.currentPiece = this.nextPiece;
    this.nextPiece = this.spawnNewPiece();

    // Check for game over
    if (!this.canPlacePiece(this.currentPiece.x, this.currentPiece.y, Tetris.TETROMINOES[this.currentPiece.type].rotations[0])) {
      this.endGame();
    }
  }

  clearLines() {
    let linesToClear = [];

    for (let row = 0; row < this.height; row++) {
      if (this.grid[row].every(cell => cell !== 0)) {
        linesToClear.push(row);
      }
    }

    if (linesToClear.length > 0) {
      linesToClear.forEach(row => {
        this.grid.splice(row, 1);
        this.grid.unshift(Array(this.width).fill(0));
      });

      const lineCount = linesToClear.length;
      const baseScores = [100, 300, 500, 800];
      const lineScore = baseScores[lineCount - 1] * this.level;

      this.score += lineScore;
      this.lines += lineCount;

      // Update level
      const newLevel = Math.floor(this.lines / 10) + 1;
      if (newLevel !== this.level) {
        this.level = newLevel;
      }

      this.updateUI();
    }
  }

  getGhostY() {
    let ghostY = this.currentPiece.y;
    const piece = this.currentPiece;
    const tetrominoe = Tetris.TETROMINOES[piece.type];
    const shape = tetrominoe.rotations[piece.rotation];

    while (this.canPlacePiece(piece.x, ghostY + 1, shape)) {
      ghostY++;
    }

    return ghostY;
  }

  updateUI() {
    document.getElementById('tetris-score').textContent = this.score;
    document.getElementById('tetris-level').textContent = this.level;
    document.getElementById('tetris-lines').textContent = this.lines;
  }

  draw() {
    // Clear canvas
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw grid border
    this.ctx.strokeStyle = '#333';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw placed blocks
    for (let row = 0; row < this.height; row++) {
      for (let col = 0; col < this.width; col++) {
        if (this.grid[row][col]) {
          this.drawBlock(col, row, this.grid[row][col], 1);
        }
      }
    }

    // Draw ghost piece
    if (!this.gameOver) {
      const ghostY = this.getGhostY();
      const piece = this.currentPiece;
      const tetrominoe = Tetris.TETROMINOES[piece.type];
      const shape = tetrominoe.rotations[piece.rotation];

      for (let row = 0; row < shape.length; row++) {
        for (let col = 0; col < shape[row].length; col++) {
          if (shape[row][col]) {
            this.drawBlock(piece.x + col, ghostY + row, piece.color, this.ghostAlpha);
          }
        }
      }
    }

    // Draw current piece
    if (!this.gameOver) {
      const piece = this.currentPiece;
      const tetrominoe = Tetris.TETROMINOES[piece.type];
      const shape = tetrominoe.rotations[piece.rotation];

      for (let row = 0; row < shape.length; row++) {
        for (let col = 0; col < shape[row].length; col++) {
          if (shape[row][col]) {
            this.drawBlock(piece.x + col, piece.y + row, piece.color, 1);
          }
        }
      }
    }
  }

  drawBlock(x, y, color, alpha = 1) {
    const pixelX = x * this.blockSize;
    const pixelY = y * this.blockSize;

    this.ctx.globalAlpha = alpha;
    this.ctx.fillStyle = color;
    this.ctx.fillRect(pixelX + 1, pixelY + 1, this.blockSize - 2, this.blockSize - 2);

    // Draw border
    this.ctx.strokeStyle = '#fff';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(pixelX + 1, pixelY + 1, this.blockSize - 2, this.blockSize - 2);

    this.ctx.globalAlpha = 1;
  }

  drawNextPiece() {
    const size = 20;
    this.nextCtx.fillStyle = '#000';
    this.nextCtx.fillRect(0, 0, 120, 100);

    const piece = this.nextPiece;
    const tetrominoe = Tetris.TETROMINOES[piece.type];
    const shape = tetrominoe.rotations[0];

    // Center the piece
    let minCol = 4,
      maxCol = -1;
    for (let row = 0; row < shape.length; row++) {
      for (let col = 0; col < shape[row].length; col++) {
        if (shape[row][col]) {
          minCol = Math.min(minCol, col);
          maxCol = Math.max(maxCol, col);
        }
      }
    }

    const width = maxCol - minCol + 1;
    const startX = (4 - width) * size;

    for (let row = 0; row < shape.length; row++) {
      for (let col = 0; col < shape[row].length; col++) {
        if (shape[row][col]) {
          const pixelX = startX + (col - minCol) * size;
          const pixelY = row * size + 30;

          this.nextCtx.fillStyle = piece.color;
          this.nextCtx.fillRect(pixelX, pixelY, size - 1, size - 1);

          this.nextCtx.strokeStyle = '#fff';
          this.nextCtx.lineWidth = 0.5;
          this.nextCtx.strokeRect(pixelX, pixelY, size - 1, size - 1);
        }
      }
    }
  }

  gameLoop() {
    if (this.paused) {
      return;
    }

    const now = Date.now();
    const dropInterval = Math.max(100, 800 - (this.level - 1) * 50);

    if (now - this.lastDropTime >= dropInterval) {
      this.movePiece(0, 1);
      this.lastDropTime = now;
    }

    this.draw();
    this.drawNextPiece();
  }

  endGame() {
    this.gameOver = true;
    document.getElementById('tetris-game-over-score').textContent = `Score: ${this.score}`;
    this.gameOverOverlay.style.display = 'flex';
  }

  start() {
    this.reset();
    this.updateUI();
    this.gameOverOverlay.style.display = 'none';

    if (this.gameLoopId) {
      cancelAnimationFrame(this.gameLoopId);
    }

    const loop = () => {
      this.gameLoop();
      this.gameLoopId = requestAnimationFrame(loop);
    };
    this.gameLoopId = requestAnimationFrame(loop);
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
    document.removeEventListener('keydown', this.keydownHandler);
    this.container.innerHTML = '';
  }

  getScore() {
    return this.score;
  }
}

// Export for use
window.Tetris = Tetris;
