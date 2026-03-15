/**
 * Sliding Puzzle (15-Puzzle) Game
 * A classic puzzle game where you slide numbered tiles to arrange them in order
 */

class SlidingPuzzle {
  constructor(container) {
    this.container = container;
    this.gridSize = 4;
    this.tiles = [];
    this.empty = { row: 3, col: 3 };
    this.moves = 0;
    this.elapsedTime = 0;
    this.gameStarted = false;
    this.gamePaused = false;
    this.gameWon = false;
    this.timerInterval = null;
    this.animatingTiles = new Set();

    this.init();
  }

  init() {
    // Create main game container
    this.gameContainer = document.createElement('div');
    this.gameContainer.className = 'sliding-puzzle-container';
    
    // Create header with title and stats
    const header = document.createElement('div');
    header.className = 'sliding-puzzle-header';
    
    const title = document.createElement('h2');
    title.className = 'sliding-puzzle-title';
    title.textContent = 'Sliding Puzzle';
    header.appendChild(title);

    // Create stats
    const stats = document.createElement('div');
    stats.className = 'sliding-puzzle-stats';
    
    const movesDisplay = document.createElement('div');
    movesDisplay.className = 'sliding-puzzle-stat';
    const movesLabel = document.createElement('span');
    movesLabel.className = 'sliding-puzzle-stat-label';
    movesLabel.textContent = 'Moves:';
    this.movesValue = document.createElement('span');
    this.movesValue.className = 'sliding-puzzle-stat-value';
    this.movesValue.textContent = '0';
    movesDisplay.appendChild(movesLabel);
    movesDisplay.appendChild(this.movesValue);
    
    const timerDisplay = document.createElement('div');
    timerDisplay.className = 'sliding-puzzle-stat';
    const timerLabel = document.createElement('span');
    timerLabel.className = 'sliding-puzzle-stat-label';
    timerLabel.textContent = 'Time:';
    this.timerValue = document.createElement('span');
    this.timerValue.className = 'sliding-puzzle-stat-value';
    this.timerValue.textContent = '0:00';
    timerDisplay.appendChild(timerLabel);
    timerDisplay.appendChild(this.timerValue);
    
    const scoreDisplay = document.createElement('div');
    scoreDisplay.className = 'sliding-puzzle-stat';
    const scoreLabel = document.createElement('span');
    scoreLabel.className = 'sliding-puzzle-stat-label';
    scoreLabel.textContent = 'Score:';
    this.scoreValue = document.createElement('span');
    this.scoreValue.className = 'sliding-puzzle-stat-value';
    this.scoreValue.textContent = '0';
    scoreDisplay.appendChild(scoreLabel);
    scoreDisplay.appendChild(this.scoreValue);
    
    stats.appendChild(movesDisplay);
    stats.appendChild(timerDisplay);
    stats.appendChild(scoreDisplay);
    header.appendChild(stats);
    
    this.gameContainer.appendChild(header);

    // Create grid
    this.grid = document.createElement('div');
    this.grid.className = 'sliding-puzzle-grid';
    this.gameContainer.appendChild(this.grid);

    // Create button container
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'sliding-puzzle-buttons';
    
    const shuffleBtn = document.createElement('button');
    shuffleBtn.className = 'sliding-puzzle-btn sliding-puzzle-btn-shuffle';
    shuffleBtn.textContent = 'Shuffle';
    shuffleBtn.addEventListener('click', () => this.start());
    
    const pauseBtn = document.createElement('button');
    pauseBtn.className = 'sliding-puzzle-btn sliding-puzzle-btn-pause';
    pauseBtn.textContent = 'Pause';
    pauseBtn.addEventListener('click', () => {
      if (this.gamePaused) {
        this.resume();
        pauseBtn.textContent = 'Pause';
      } else {
        this.pause();
        pauseBtn.textContent = 'Resume';
      }
    });
    this.pauseBtn = pauseBtn;
    
    buttonContainer.appendChild(shuffleBtn);
    buttonContainer.appendChild(pauseBtn);
    this.gameContainer.appendChild(buttonContainer);

    // Create win overlay
    this.winOverlay = document.createElement('div');
    this.winOverlay.className = 'sliding-puzzle-win-overlay';
    
    const winContent = document.createElement('div');
    winContent.className = 'sliding-puzzle-win-content';
    
    const winTitle = document.createElement('h3');
    winTitle.className = 'sliding-puzzle-win-title';
    winTitle.textContent = '🎉 Puzzle Solved! 🎉';
    winContent.appendChild(winTitle);
    
    const winStats = document.createElement('div');
    winStats.className = 'sliding-puzzle-win-stats';
    
    const winMoves = document.createElement('p');
    winMoves.className = 'sliding-puzzle-win-stat';
    this.winMovesText = document.createElement('span');
    this.winMovesText.textContent = '0';
    winMoves.appendChild(document.createTextNode('Moves: '));
    winMoves.appendChild(this.winMovesText);
    winStats.appendChild(winMoves);
    
    const winTime = document.createElement('p');
    winTime.className = 'sliding-puzzle-win-stat';
    this.winTimeText = document.createElement('span');
    this.winTimeText.textContent = '0:00';
    winTime.appendChild(document.createTextNode('Time: '));
    winTime.appendChild(this.winTimeText);
    winStats.appendChild(winTime);
    
    const winScore = document.createElement('p');
    winScore.className = 'sliding-puzzle-win-stat sliding-puzzle-win-score';
    this.winScoreText = document.createElement('span');
    this.winScoreText.textContent = '0';
    winScore.appendChild(document.createTextNode('Score: '));
    winScore.appendChild(this.winScoreText);
    winStats.appendChild(winScore);
    
    winContent.appendChild(winStats);
    
    const newGameBtn = document.createElement('button');
    newGameBtn.className = 'sliding-puzzle-btn sliding-puzzle-btn-play-again';
    newGameBtn.textContent = 'Play Again';
    newGameBtn.addEventListener('click', () => this.start());
    winContent.appendChild(newGameBtn);
    
    this.winOverlay.appendChild(winContent);
    this.gameContainer.appendChild(this.winOverlay);

    this.container.appendChild(this.gameContainer);
  }

  start() {
    // Reset game state
    this.moves = 0;
    this.elapsedTime = 0;
    this.gameStarted = true;
    this.gamePaused = false;
    this.gameWon = false;
    this.animatingTiles.clear();
    
    // Clear timer
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    
    // Hide win overlay
    this.winOverlay.style.display = 'none';
    
    // Initialize tiles to solved state
    this.tiles = [];
    let num = 1;
    for (let row = 0; row < this.gridSize; row++) {
      this.tiles[row] = [];
      for (let col = 0; col < this.gridSize; col++) {
        if (row === 3 && col === 3) {
          this.tiles[row][col] = null;
          this.empty = { row, col };
        } else {
          this.tiles[row][col] = num++;
        }
      }
    }

    // Shuffle the puzzle
    this.shuffle();

    // Render the grid
    this.render();

    // Start timer
    this.startTimer();

    // Update UI
    this.updateStats();
    this.pauseBtn.style.display = 'inline-block';
  }

  pause() {
    this.gamePaused = true;
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  resume() {
    this.gamePaused = false;
    this.startTimer();
  }

  startTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    this.timerInterval = setInterval(() => {
      if (!this.gamePaused && !this.gameWon) {
        this.elapsedTime++;
        this.updateStats();
      }
    }, 1000);
  }

  shuffle() {
    // Perform random valid moves to ensure puzzle is solvable
    // We do this by making random moves from the solved state
    const moveCount = 1000; // Sufficient for good randomization
    
    for (let i = 0; i < moveCount; i++) {
      const validMoves = this.getValidMoves();
      const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
      this.slideTile(randomMove.row, randomMove.col, false); // false = no animation during shuffle
    }

    // No need for ensureSolvable() — shuffling via valid moves from the solved
    // state guarantees the puzzle is always solvable.
  }

  ensureSolvable() {
    // Count inversions
    let inversions = 0;
    const flatTiles = [];
    
    for (let row = 0; row < this.gridSize; row++) {
      for (let col = 0; col < this.gridSize; col++) {
        if (this.tiles[row][col] !== null) {
          flatTiles.push(this.tiles[row][col]);
        }
      }
    }

    for (let i = 0; i < flatTiles.length; i++) {
      for (let j = i + 1; j < flatTiles.length; j++) {
        if (flatTiles[i] > flatTiles[j]) {
          inversions++;
        }
      }
    }

    // If odd number of inversions, swap two tiles to make it even
    if (inversions % 2 !== 0) {
      // Swap the first two non-empty tiles
      let swapped = false;
      for (let row = 0; row < this.gridSize && !swapped; row++) {
        for (let col = 0; col < this.gridSize && !swapped; col++) {
          if (this.tiles[row][col] !== null) {
            // Find next tile to swap with
            for (let row2 = 0; row2 < this.gridSize && !swapped; row2++) {
              for (let col2 = 0; col2 < this.gridSize && !swapped; col2++) {
                if (
                  this.tiles[row2][col2] !== null &&
                  (row !== row2 || col !== col2)
                ) {
                  // Swap
                  [this.tiles[row][col], this.tiles[row2][col2]] = [
                    this.tiles[row2][col2],
                    this.tiles[row][col],
                  ];
                  swapped = true;
                }
              }
            }
          }
        }
      }
    }
  }

  getValidMoves() {
    const moves = [];
    const directions = [
      { row: -1, col: 0 },
      { row: 1, col: 0 },
      { row: 0, col: -1 },
      { row: 0, col: 1 },
    ];

    for (const dir of directions) {
      const newRow = this.empty.row + dir.row;
      const newCol = this.empty.col + dir.col;

      if (
        newRow >= 0 &&
        newRow < this.gridSize &&
        newCol >= 0 &&
        newCol < this.gridSize
      ) {
        moves.push({ row: newRow, col: newCol });
      }
    }

    return moves;
  }

  slideTile(row, col, animate = true) {
    // Check if tile is adjacent to empty space
    const distance =
      Math.abs(row - this.empty.row) + Math.abs(col - this.empty.col);

    if (distance === 1) {
      // Swap tile with empty space
      [this.tiles[this.empty.row][this.empty.col], this.tiles[row][col]] = [
        this.tiles[row][col],
        this.tiles[this.empty.row][this.empty.col],
      ];

      // Update empty position
      this.empty = { row, col };

      // Increment moves
      if (animate) {
        this.moves++;
        this.updateStats();
      }

      // Render
      if (animate) {
        this.renderWithAnimation();
      } else {
        this.render();
      }

      // Check for win
      if (animate && this.isWon()) {
        this.gameWon = true;
        if (this.timerInterval) {
          clearInterval(this.timerInterval);
        }
        this.showWinOverlay();
      }

      return true;
    }

    return false;
  }

  isWon() {
    let expectedNum = 1;

    for (let row = 0; row < this.gridSize; row++) {
      for (let col = 0; col < this.gridSize; col++) {
        if (row === 3 && col === 3) {
          // Should be empty
          if (this.tiles[row][col] !== null) {
            return false;
          }
        } else {
          if (this.tiles[row][col] !== expectedNum) {
            return false;
          }
          expectedNum++;
        }
      }
    }

    return true;
  }

  render() {
    this.grid.innerHTML = '';

    for (let row = 0; row < this.gridSize; row++) {
      for (let col = 0; col < this.gridSize; col++) {
        const tile = this.tiles[row][col];
        const tileDiv = document.createElement('div');
        
        if (tile === null) {
          tileDiv.className = 'sliding-puzzle-tile sliding-puzzle-empty';
        } else {
          tileDiv.className = 'sliding-puzzle-tile';
          tileDiv.textContent = tile;
          tileDiv.dataset.row = row;
          tileDiv.dataset.col = col;
          tileDiv.addEventListener('click', () => this.handleTileClick(row, col));
        }

        // Set position via CSS Grid
        tileDiv.style.gridRow = row + 1;
        tileDiv.style.gridColumn = col + 1;

        this.grid.appendChild(tileDiv);
      }
    }
  }

  renderWithAnimation() {
    // Mark tiles as animating
    this.animatingTiles.clear();
    const tiles = this.grid.querySelectorAll('.sliding-puzzle-tile:not(.sliding-puzzle-empty)');
    
    tiles.forEach(el => {
      const row = parseInt(el.dataset.row);
      const col = parseInt(el.dataset.col);
      
      // Find where this tile should be
      for (let r = 0; r < this.gridSize; r++) {
        for (let c = 0; c < this.gridSize; c++) {
          if (this.tiles[r][c] === parseInt(el.textContent)) {
            if (r !== row || c !== col) {
              el.classList.add('sliding-puzzle-animating');
            }
            break;
          }
        }
      }
    });

    // Update DOM after a brief delay to trigger animation
    setTimeout(() => {
      this.render();
    }, 10);
  }

  handleTileClick(row, col) {
    if (!this.gameStarted || this.gamePaused || this.gameWon) {
      return;
    }

    this.slideTile(row, col, true);
  }

  updateStats() {
    this.movesValue.textContent = this.moves;
    this.timerValue.textContent = this.formatTime(this.elapsedTime);
    
    const score = this.getScore();
    this.scoreValue.textContent = score;
  }

  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  showWinOverlay() {
    this.winMovesText.textContent = this.moves;
    this.winTimeText.textContent = this.formatTime(this.elapsedTime);
    
    const score = this.getScore();
    this.winScoreText.textContent = score;
    
    this.winOverlay.style.display = 'flex';
    
    // Add celebration animation
    this.winOverlay.classList.add('sliding-puzzle-celebrate');
    setTimeout(() => {
      this.winOverlay.classList.remove('sliding-puzzle-celebrate');
    }, 600);
  }

  getScore() {
    const score = Math.max(10000 - this.moves * 10 - this.elapsedTime * 5, 0);
    return Math.round(score);
  }

  destroy() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }

    if (this.gameContainer) {
      this.gameContainer.remove();
    }

    this.tiles = [];
    this.gameStarted = false;
  }
}

// Export for use
window.SlidingPuzzle = SlidingPuzzle;
