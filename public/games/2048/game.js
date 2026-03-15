class Game2048 {
  constructor(container) {
    this.container = typeof container === 'string' ? document.getElementById(container) : container;
    this.gridSize = 4;
    this.grid = [];
    this.score = 0;
    this.gameOver = false;
    this.won = false;
    this.tiles = new Map(); // Store tile elements
    this.animating = false;
    this.moveCount = 0;
    
    this.init();
  }

  init() {
    this.createGrid();
    this.createDOM();
    this.addNewTile();
    this.addNewTile();
    this.setupEventListeners();
    this.render();
  }

  createGrid() {
    this.grid = Array(this.gridSize)
      .fill(null)
      .map(() => Array(this.gridSize).fill(0));
  }

  createDOM() {
    this.container.classList.add('game-2048-container');
    this.container.innerHTML = '';

    // Create the game board
    const board = document.createElement('div');
    board.classList.add('game-2048-board');

    // Create grid cells
    for (let i = 0; i < this.gridSize; i++) {
      for (let j = 0; j < this.gridSize; j++) {
        const cell = document.createElement('div');
        cell.classList.add('game-2048-cell');
        board.appendChild(cell);
      }
    }

    this.board = board;
    this.container.appendChild(board);

    // Create tiles container
    const tilesContainer = document.createElement('div');
    tilesContainer.classList.add('game-2048-tiles');
    this.board.appendChild(tilesContainer);
    this.tilesContainer = tilesContainer;

    // Create UI elements
    const ui = document.createElement('div');
    ui.classList.add('game-2048-ui');

    const scoreLabel = document.createElement('div');
    scoreLabel.classList.add('game-2048-score-label');
    scoreLabel.textContent = 'Score';
    ui.appendChild(scoreLabel);

    const scoreValue = document.createElement('div');
    scoreValue.classList.add('game-2048-score-value');
    scoreValue.textContent = '0';
    this.scoreDisplay = scoreValue;
    ui.appendChild(scoreValue);

    const newGameBtn = document.createElement('button');
    newGameBtn.classList.add('game-2048-new-game-btn');
    newGameBtn.textContent = 'New Game';
    newGameBtn.addEventListener('click', () => this.reset());
    ui.appendChild(newGameBtn);

    this.container.appendChild(ui);

    // Create game over overlay
    const gameOverOverlay = document.createElement('div');
    gameOverOverlay.classList.add('game-2048-overlay', 'game-2048-game-over-overlay');
    gameOverOverlay.innerHTML = `
      <div class="game-2048-overlay-content">
        <div class="game-2048-overlay-title">Game Over!</div>
        <div class="game-2048-overlay-score">Score: <span class="game-2048-overlay-score-value">0</span></div>
        <button class="game-2048-overlay-button">Try Again</button>
      </div>
    `;
    gameOverOverlay.querySelector('.game-2048-overlay-button').addEventListener('click', () => this.reset());
    this.gameOverOverlay = gameOverOverlay;
    this.gameOverScoreDisplay = gameOverOverlay.querySelector('.game-2048-overlay-score-value');
    this.container.appendChild(gameOverOverlay);

    // Create win overlay
    const winOverlay = document.createElement('div');
    winOverlay.classList.add('game-2048-overlay', 'game-2048-win-overlay');
    winOverlay.innerHTML = `
      <div class="game-2048-overlay-content">
        <div class="game-2048-overlay-title">You Won!</div>
        <div class="game-2048-overlay-score">Score: <span class="game-2048-overlay-score-value">0</span></div>
        <button class="game-2048-overlay-button">Continue Playing</button>
        <button class="game-2048-overlay-button game-2048-overlay-button-secondary">New Game</button>
      </div>
    `;
    winOverlay.querySelectorAll('.game-2048-overlay-button')[0].addEventListener('click', () => {
      this.winOverlay.classList.remove('game-2048-show');
    });
    winOverlay.querySelector('.game-2048-overlay-button-secondary').addEventListener('click', () => this.reset());
    this.winOverlay = winOverlay;
    this.winScoreDisplay = winOverlay.querySelector('.game-2048-overlay-score-value');
    this.container.appendChild(winOverlay);
  }

  setupEventListeners() {
    document.addEventListener('keydown', (e) => this.handleKeyPress(e));
    
    // Touch/swipe support
    let touchStartX = 0;
    let touchStartY = 0;

    this.board.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    });

    this.board.addEventListener('touchend', (e) => {
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      this.handleSwipe(touchStartX, touchStartY, touchEndX, touchEndY);
    });
  }

  handleKeyPress(e) {
    if (this.gameOver || this.animating) return;

    const keyMap = {
      'ArrowUp': 'up',
      'ArrowDown': 'down',
      'ArrowLeft': 'left',
      'ArrowRight': 'right'
    };

    const direction = keyMap[e.key];
    if (direction) {
      e.preventDefault();
      this.move(direction);
    }
  }

  handleSwipe(startX, startY, endX, endY) {
    if (this.gameOver || this.animating) return;

    const deltaX = endX - startX;
    const deltaY = endY - startY;
    const threshold = 50;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Horizontal swipe
      if (Math.abs(deltaX) > threshold) {
        this.move(deltaX > 0 ? 'right' : 'left');
      }
    } else {
      // Vertical swipe
      if (Math.abs(deltaY) > threshold) {
        this.move(deltaY > 0 ? 'down' : 'up');
      }
    }
  }

  move(direction) {
    const moved = this.performMove(direction);
    
    if (moved) {
      this.animating = true;
      setTimeout(() => {
        this.addNewTile();
        this.render();
        this.checkGameState();
        this.animating = false;
      }, 200);
      this.render();
    }
  }

  performMove(direction) {
    const originalGrid = JSON.parse(JSON.stringify(this.grid));
    
    if (direction === 'up') {
      this.moveVertical(true);
    } else if (direction === 'down') {
      this.moveVertical(false);
    } else if (direction === 'left') {
      this.moveHorizontal(true);
    } else if (direction === 'right') {
      this.moveHorizontal(false);
    }

    // Check if grid changed
    return !this.gridEquals(originalGrid, this.grid);
  }

  moveHorizontal(moveLeft) {
    for (let i = 0; i < this.gridSize; i++) {
      let row = this.grid[i];
      if (moveLeft) {
        row = this.slide(row);
      } else {
        row = this.slide(row.reverse()).reverse();
      }
      this.grid[i] = row;
    }
  }

  moveVertical(moveUp) {
    for (let j = 0; j < this.gridSize; j++) {
      let column = [
        this.grid[0][j],
        this.grid[1][j],
        this.grid[2][j],
        this.grid[3][j]
      ];
      
      if (moveUp) {
        column = this.slide(column);
      } else {
        column = this.slide(column.reverse()).reverse();
      }

      this.grid[0][j] = column[0];
      this.grid[1][j] = column[1];
      this.grid[2][j] = column[2];
      this.grid[3][j] = column[3];
    }
  }

  slide(line) {
    // Remove zeros
    let newLine = line.filter(val => val !== 0);
    
    // Merge
    for (let i = 0; i < newLine.length - 1; i++) {
      if (newLine[i] === newLine[i + 1] && newLine[i] !== 0) {
        const merged = newLine[i] * 2;
        newLine[i] = merged;
        newLine.splice(i + 1, 1);
        this.score += merged;
        i++; // Skip next comparison
      }
    }

    // Add zeros
    while (newLine.length < this.gridSize) {
      newLine.push(0);
    }

    return newLine;
  }

  addNewTile() {
    const empty = [];
    for (let i = 0; i < this.gridSize; i++) {
      for (let j = 0; j < this.gridSize; j++) {
        if (this.grid[i][j] === 0) {
          empty.push({ i, j });
        }
      }
    }

    if (empty.length > 0) {
      const { i, j } = empty[Math.floor(Math.random() * empty.length)];
      const value = Math.random() < 0.9 ? 2 : 4;
      this.grid[i][j] = value;
    }
  }

  render() {
    // Clear existing tiles
    this.tilesContainer.innerHTML = '';
    this.tiles.clear();

    // Create tiles
    for (let i = 0; i < this.gridSize; i++) {
      for (let j = 0; j < this.gridSize; j++) {
        const value = this.grid[i][j];
        if (value !== 0) {
          const tile = document.createElement('div');
          tile.classList.add('game-2048-tile');
          tile.classList.add(`game-2048-tile-${value}`);
          tile.textContent = value;
          tile.style.gridColumn = j + 1;
          tile.style.gridRow = i + 1;
          this.tilesContainer.appendChild(tile);
          this.tiles.set(`${i},${j}`, tile);
        }
      }
    }

    this.scoreDisplay.textContent = this.score;
  }

  checkGameState() {
    // Check for 2048
    for (let i = 0; i < this.gridSize; i++) {
      for (let j = 0; j < this.gridSize; j++) {
        if (this.grid[i][j] === 2048 && !this.won) {
          this.won = true;
          this.showWinOverlay();
          return;
        }
      }
    }

    // Check for game over
    if (!this.canMove()) {
      this.gameOver = true;
      this.showGameOverOverlay();
    }
  }

  canMove() {
    // Check for empty cells
    for (let i = 0; i < this.gridSize; i++) {
      for (let j = 0; j < this.gridSize; j++) {
        if (this.grid[i][j] === 0) {
          return true;
        }
      }
    }

    // Check for possible merges
    for (let i = 0; i < this.gridSize; i++) {
      for (let j = 0; j < this.gridSize; j++) {
        const current = this.grid[i][j];
        if (current === 0) continue;

        // Check right
        if (j < this.gridSize - 1 && current === this.grid[i][j + 1]) {
          return true;
        }
        // Check down
        if (i < this.gridSize - 1 && current === this.grid[i + 1][j]) {
          return true;
        }
      }
    }

    return false;
  }

  showGameOverOverlay() {
    this.gameOverScoreDisplay.textContent = this.score;
    this.gameOverOverlay.classList.add('game-2048-show');
  }

  showWinOverlay() {
    this.winScoreDisplay.textContent = this.score;
    this.winOverlay.classList.add('game-2048-show');
  }

  reset() {
    this.createGrid();
    this.score = 0;
    this.gameOver = false;
    this.won = false;
    this.moveCount = 0;
    this.gameOverOverlay.classList.remove('game-2048-show');
    this.winOverlay.classList.remove('game-2048-show');
    this.addNewTile();
    this.addNewTile();
    this.render();
  }

  gridEquals(grid1, grid2) {
    for (let i = 0; i < this.gridSize; i++) {
      for (let j = 0; j < this.gridSize; j++) {
        if (grid1[i][j] !== grid2[i][j]) {
          return false;
        }
      }
    }
    return true;
  }
}

// Expose the class to the global scope with both naming conventions
window.Game2048 = Game2048;
window['2048'] = Game2048;
