class Minesweeper {
  constructor(container) {
    this.container = container;
    this.difficulty = 'easy';
    this.gameActive = false;
    this.gamePaused = false;
    this.gameOver = false;
    this.firstClick = true;
    this.board = [];
    this.revealed = [];
    this.flagged = [];
    this.timeStart = null;
    this.timeElapsed = 0;
    this.timerInterval = null;
    this.touchLongPressTimer = null;
    this.setupUI();
  }

  // Difficulty configurations
  difficulties = {
    easy: { width: 9, height: 9, mines: 10, cellSize: 38, gap: 2, fontSize: 18, maxWidth: 380 },
    medium: { width: 16, height: 16, mines: 40, cellSize: 28, gap: 2, fontSize: 14, maxWidth: 480 },
    hard: { width: 30, height: 16, mines: 99, cellSize: 18, gap: 1, fontSize: 11, maxWidth: 570 }
  };

  // Color map for numbers 1-8
  numberColors = {
    1: '#0000FF',  // Blue
    2: '#008000',  // Green
    3: '#FF0000',  // Red
    4: '#000080',  // Dark Blue
    5: '#800000',  // Maroon
    6: '#008080',  // Teal
    7: '#000000',  // Black
    8: '#808080'   // Gray
  };

  setupUI() {
    this.container.innerHTML = `
      <div class="minesweeper-container">
        <div class="minesweeper-header">
          <div class="minesweeper-controls">
            <label for="minesweeper-difficulty">Difficulty:</label>
            <select id="minesweeper-difficulty" class="minesweeper-difficulty-select">
              <option value="easy">Easy (9x9, 10 mines)</option>
              <option value="medium">Medium (16x16, 40 mines)</option>
              <option value="hard">Hard (30x16, 99 mines)</option>
            </select>
            <button id="minesweeper-new-game" class="minesweeper-button">New Game</button>
            <button id="minesweeper-pause" class="minesweeper-button" disabled>Pause</button>
          </div>
          <div class="minesweeper-stats">
            <div class="minesweeper-stat">
              <span class="minesweeper-stat-label">Mines:</span>
              <span id="minesweeper-mine-counter" class="minesweeper-stat-value">0</span>
            </div>
            <div class="minesweeper-stat">
              <span class="minesweeper-stat-label">Time:</span>
              <span id="minesweeper-timer" class="minesweeper-stat-value">0</span>
            </div>
          </div>
        </div>
        <div id="minesweeper-status" class="minesweeper-status"></div>
        <div id="minesweeper-board" class="minesweeper-board"></div>
      </div>
    `;

    this.difficultySelect = this.container.querySelector('#minesweeper-difficulty');
    this.newGameButton = this.container.querySelector('#minesweeper-new-game');
    this.pauseButton = this.container.querySelector('#minesweeper-pause');
    this.boardContainer = this.container.querySelector('#minesweeper-board');
    this.statusDisplay = this.container.querySelector('#minesweeper-status');
    this.mineCounterDisplay = this.container.querySelector('#minesweeper-mine-counter');
    this.timerDisplay = this.container.querySelector('#minesweeper-timer');

    this.newGameButton.addEventListener('click', () => this.start());
    this.pauseButton.addEventListener('click', () => {
      if (this.gamePaused) {
        this.resume();
      } else {
        this.pause();
      }
    });

    this.difficultySelect.addEventListener('change', (e) => {
      this.difficulty = e.target.value;
    });
  }

  start() {
    this.cleanup();
    this.difficulty = this.difficultySelect.value;
    const config = this.difficulties[this.difficulty];
    this.width = config.width;
    this.height = config.height;
    this.mineCount = config.mines;
    this.totalMines = config.mines;
    this.gameActive = true;
    this.gamePaused = false;
    this.gameOver = false;
    this.firstClick = true;
    this.timeStart = null;
    this.timeElapsed = 0;
    this.revealed = Array(this.width * this.height).fill(false);
    this.flagged = Array(this.width * this.height).fill(false);
    this.board = Array(this.width * this.height).fill(null);
    this.statusDisplay.textContent = '';
    this.pauseButton.disabled = false;
    this.pauseButton.textContent = 'Pause';
    this.difficultySelect.disabled = true;

    this.createBoard();
  }

  createBoard() {
    const config = this.difficulties[this.difficulty];
    this.boardContainer.innerHTML = '';
    this.boardContainer.style.gridTemplateColumns = `repeat(${this.width}, ${config.cellSize}px)`;
    this.boardContainer.style.gridTemplateRows = `repeat(${this.height}, ${config.cellSize}px)`;
    this.boardContainer.style.gap = `${config.gap}px`;
    this.boardContainer.style.fontSize = `${config.fontSize}px`;
    this.boardContainer.style.maxWidth = `${config.maxWidth}px`;

    for (let i = 0; i < this.width * this.height; i++) {
      const cell = document.createElement('div');
      cell.className = 'minesweeper-cell';
      cell.dataset.index = i;
      cell.addEventListener('click', (e) => this.handleLeftClick(e));
      cell.addEventListener('contextmenu', (e) => this.handleRightClick(e));
      cell.addEventListener('touchstart', (e) => this.handleTouchStart(e));
      cell.addEventListener('touchend', (e) => this.handleTouchEnd(e));
      this.boardContainer.appendChild(cell);
    }

    this.updateUI();
  }

  handleLeftClick(e) {
    if (this.gameOver || !this.gameActive || this.gamePaused) return;
    const index = parseInt(e.target.dataset.index);
    
    if (this.firstClick) {
      this.generateMines(index);
      this.firstClick = false;
      this.timeStart = Date.now();
      this.startTimer();
    }

    if (this.flagged[index]) return;
    if (this.revealed[index]) return;

    this.reveal(index);
  }

  handleRightClick(e) {
    e.preventDefault();
    if (this.gameOver || !this.gameActive || this.gamePaused) return;
    if (!this.firstClick) {
      this.toggleFlag(parseInt(e.target.dataset.index));
    }
  }

  handleTouchStart(e) {
    const index = parseInt(e.target.dataset.index);
    this.touchLongPressTimer = setTimeout(() => {
      if (!this.gameOver && this.gameActive && !this.gamePaused && !this.firstClick) {
        this.toggleFlag(index);
      }
    }, 500);
  }

  handleTouchEnd(e) {
    clearTimeout(this.touchLongPressTimer);
  }

  generateMines(safeIndex) {
    let placed = 0;
    while (placed < this.mineCount) {
      const index = Math.floor(Math.random() * (this.width * this.height));
      if (index !== safeIndex && this.board[index] !== 'M') {
        this.board[index] = 'M';
        placed++;
      }
    }

    // Calculate numbers
    for (let i = 0; i < this.width * this.height; i++) {
      if (this.board[i] !== 'M') {
        const count = this.getAdjacentMineCount(i);
        this.board[i] = count > 0 ? count : 0;
      }
    }
  }

  getAdjacentMineCount(index) {
    const row = Math.floor(index / this.width);
    const col = index % this.width;
    let count = 0;

    for (let r = -1; r <= 1; r++) {
      for (let c = -1; c <= 1; c++) {
        if (r === 0 && c === 0) continue;
        const newRow = row + r;
        const newCol = col + c;
        if (newRow >= 0 && newRow < this.height && newCol >= 0 && newCol < this.width) {
          const newIndex = newRow * this.width + newCol;
          if (this.board[newIndex] === 'M') count++;
        }
      }
    }
    return count;
  }

  reveal(index) {
    if (this.revealed[index] || this.flagged[index]) return;

    this.revealed[index] = true;

    if (this.board[index] === 'M') {
      // Hit a mine - game over
      this.endGame(false);
      return;
    }

    // If it's a 0 (empty), flood fill adjacent cells
    if (this.board[index] === 0) {
      const adjacent = this.getAdjacentCells(index);
      for (const adjIndex of adjacent) {
        if (!this.revealed[adjIndex] && !this.flagged[adjIndex]) {
          this.reveal(adjIndex);
        }
      }
    }

    this.updateUI();
    this.checkWin();
  }

  getAdjacentCells(index) {
    const row = Math.floor(index / this.width);
    const col = index % this.width;
    const adjacent = [];

    for (let r = -1; r <= 1; r++) {
      for (let c = -1; c <= 1; c++) {
        if (r === 0 && c === 0) continue;
        const newRow = row + r;
        const newCol = col + c;
        if (newRow >= 0 && newRow < this.height && newCol >= 0 && newCol < this.width) {
          adjacent.push(newRow * this.width + newCol);
        }
      }
    }
    return adjacent;
  }

  toggleFlag(index) {
    if (this.revealed[index]) return;

    this.flagged[index] = !this.flagged[index];
    if (this.flagged[index]) {
      this.mineCount--;
    } else {
      this.mineCount++;
    }

    this.updateUI();
  }

  checkWin() {
    let allNonMinesRevealed = true;
    for (let i = 0; i < this.width * this.height; i++) {
      if (this.board[i] !== 'M' && !this.revealed[i]) {
        allNonMinesRevealed = false;
        break;
      }
    }

    if (allNonMinesRevealed) {
      this.endGame(true);
    }
  }

  endGame(won) {
    this.gameActive = false;
    this.gameOver = true;
    clearInterval(this.timerInterval);
    this.pauseButton.disabled = true;

    // Reveal all mines
    for (let i = 0; i < this.width * this.height; i++) {
      if (this.board[i] === 'M') {
        this.revealed[i] = true;
      }
    }

    if (won) {
      this.statusDisplay.textContent = `🎉 You Won! Score: ${this.getScore()}`;
      this.statusDisplay.className = 'minesweeper-status minesweeper-status-win';
    } else {
      this.statusDisplay.textContent = '💣 Game Over! You hit a mine!';
      this.statusDisplay.className = 'minesweeper-status minesweeper-status-lose';
    }

    this.updateUI();
  }

  updateUI() {
    const cells = this.boardContainer.querySelectorAll('.minesweeper-cell');
    cells.forEach((cell) => {
      const index = parseInt(cell.dataset.index);
      cell.className = 'minesweeper-cell';

      if (this.revealed[index]) {
        cell.classList.add('minesweeper-revealed');
        if (this.board[index] === 'M') {
          cell.classList.add('minesweeper-mine');
          cell.textContent = '💣';
        } else if (this.board[index] > 0) {
          cell.textContent = this.board[index];
          cell.style.color = this.numberColors[this.board[index]];
          cell.classList.add(`minesweeper-number-${this.board[index]}`);
        }
      } else if (this.flagged[index]) {
        cell.classList.add('minesweeper-flagged');
        cell.textContent = '🚩';
      }
    });

    this.mineCounterDisplay.textContent = Math.max(0, this.mineCount);

    if (this.timeStart) {
      this.timeElapsed = Math.floor((Date.now() - this.timeStart) / 1000);
      this.timerDisplay.textContent = this.timeElapsed;
    }
  }

  startTimer() {
    this.timerInterval = setInterval(() => {
      if (!this.gamePaused) {
        this.timeElapsed = Math.floor((Date.now() - this.timeStart) / 1000);
        this.timerDisplay.textContent = this.timeElapsed;
      }
    }, 100);
  }

  pause() {
    if (this.gameActive && !this.gameOver) {
      this.gamePaused = true;
      this.pauseButton.textContent = 'Resume';
      this.statusDisplay.textContent = '⏸ Game Paused';
      this.statusDisplay.className = 'minesweeper-status minesweeper-status-paused';
      clearInterval(this.timerInterval);
    }
  }

  resume() {
    if (this.gamePaused) {
      this.gamePaused = false;
      this.pauseButton.textContent = 'Pause';
      this.statusDisplay.textContent = '';
      this.statusDisplay.className = '';
      this.timeStart = Date.now() - this.timeElapsed * 1000;
      this.startTimer();
    }
  }

  getScore() {
    if (this.gameOver && !this.gameActive) {
      // Game ended - check if won
      let allNonMinesRevealed = true;
      for (let i = 0; i < this.width * this.height; i++) {
        if (this.board[i] !== 'M' && !this.revealed[i]) {
          allNonMinesRevealed = false;
          break;
        }
      }
      if (allNonMinesRevealed) {
        return Math.max(0, this.totalMines * 100 - this.timeElapsed);
      }
    }
    return 0;
  }

  cleanup() {
    clearInterval(this.timerInterval);
    clearTimeout(this.touchLongPressTimer);
    this.gameActive = false;
    this.gameOver = false;
    this.gamePaused = false;
    this.pauseButton.disabled = true;
    this.difficultySelect.disabled = false;
    if (this.boardContainer) {
      const cells = this.boardContainer.querySelectorAll('.minesweeper-cell');
      cells.forEach((cell) => {
        cell.removeEventListener('click', this.handleLeftClick);
        cell.removeEventListener('contextmenu', this.handleRightClick);
        cell.removeEventListener('touchstart', this.handleTouchStart);
        cell.removeEventListener('touchend', this.handleTouchEnd);
      });
    }
  }

  destroy() {
    this.cleanup();
    this.container.innerHTML = '';
  }
}

window.Minesweeper = Minesweeper;
