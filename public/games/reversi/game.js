class Reversi {
  constructor(container) {
    this.container = container;
    this.board = [];
    this.isPaused = false;
    this.gameOver = false;
    this.currentPlayer = 'black'; // Player is black, AI is white
    this.validMoves = [];
    this.animatingCells = new Set();
    this.pendingTimeouts = [];
    this.moveDelay = 1000; // Delay before AI moves

    // Create DOM structure
    this.initDOM();
    
    // Event listeners
    this.boardElement.addEventListener('click', (e) => this.handleBoardClick(e));
  }

  initDOM() {
    // Clear container
    this.container.innerHTML = '';
    this.container.className = 'reversi-container';

    // Info section
    const infoDiv = document.createElement('div');
    infoDiv.className = 'reversi-info';
    
    const scoreDiv = document.createElement('div');
    scoreDiv.className = 'reversi-score';
    scoreDiv.innerHTML = `
      <div class="reversi-player-info">
        <div class="reversi-disc reversi-disc-black"></div>
        <span class="reversi-player-name">You: <span class="reversi-count">2</span></span>
      </div>
      <div class="reversi-player-info">
        <div class="reversi-disc reversi-disc-white"></div>
        <span class="reversi-player-name">AI: <span class="reversi-count">2</span></span>
      </div>
    `;

    const statusDiv = document.createElement('div');
    statusDiv.className = 'reversi-status';
    statusDiv.textContent = 'Your turn';

    infoDiv.appendChild(scoreDiv);
    infoDiv.appendChild(statusDiv);

    // Board
    this.boardElement = document.createElement('div');
    this.boardElement.className = 'reversi-board';

    // Create cells
    this.cells = [];
    for (let i = 0; i < 64; i++) {
      const cell = document.createElement('div');
      cell.className = 'reversi-cell';
      cell.dataset.index = i;
      this.boardElement.appendChild(cell);
      this.cells.push(cell);
    }

    this.container.appendChild(infoDiv);
    this.container.appendChild(this.boardElement);

    this.scoreDiv = scoreDiv;
    this.statusDiv = statusDiv;
  }

  initBoard() {
    // Clear any pending timeouts from previous game
    this.pendingTimeouts.forEach(t => clearTimeout(t));
    this.pendingTimeouts = [];

    // Initialize empty board
    this.board = Array(64).fill(null);

    // Set starting position (center 2x2)
    // Standard start: black at d4 and e5, white at e4 and d5
    const startPositions = [
      { index: 27, player: 'white' }, // d4
      { index: 28, player: 'black' }, // e4
      { index: 35, player: 'black' }, // d5
      { index: 36, player: 'white' }, // e5
    ];

    startPositions.forEach((pos) => {
      this.board[pos.index] = pos.player;
    });

    this.currentPlayer = 'black';
    this.gameOver = false;
    this.validMoves = [];
    this.animatingCells.clear();
    this.updateUI();
  }

  start() {
    this.initBoard();
    this.isPaused = false;
    this.showValidMoves();
    this.updateUI();
  }

  pause() {
    this.isPaused = true;
    this.statusDiv.textContent = 'Game paused';
  }

  resume() {
    this.isPaused = false;
    this.statusDiv.textContent = this.currentPlayer === 'black' ? 'Your turn' : 'AI thinking...';
  }

  destroy() {
    this.gameOver = true;
    this.isPaused = true;
    this.pendingTimeouts.forEach(t => clearTimeout(t));
    this.pendingTimeouts = [];
    this.container.innerHTML = '';
    this.board = [];
    this.cells = [];
    this.validMoves = [];
    this.animatingCells.clear();
  }

  getScore() {
    return this.board.filter((cell) => cell === 'black').length;
  }

  // Board utilities
  getIndex(row, col) {
    return row * 8 + col;
  }

  getRowCol(index) {
    return { row: Math.floor(index / 8), col: index % 8 };
  }

  isValidIndex(row, col) {
    return row >= 0 && row < 8 && col >= 0 && col < 8;
  }

  // Game logic
  findValidMoves(player) {
    const moves = [];
    for (let i = 0; i < 64; i++) {
      if (this.board[i] === null && this.isValidMove(i, player)) {
        moves.push(i);
      }
    }
    return moves;
  }

  isValidMove(index, player) {
    if (this.board[index] !== null) return false;

    const opponent = player === 'black' ? 'white' : 'black';
    const { row, col } = this.getRowCol(index);

    // Check all 8 directions
    const directions = [
      [-1, -1],
      [-1, 0],
      [-1, 1],
      [0, -1],
      [0, 1],
      [1, -1],
      [1, 0],
      [1, 1],
    ];

    for (const [dr, dc] of directions) {
      let r = row + dr;
      let c = col + dc;
      let foundOpponent = false;

      // Move in direction while finding opponent pieces
      while (this.isValidIndex(r, c)) {
        const cell = this.board[this.getIndex(r, c)];
        if (cell === opponent) {
          foundOpponent = true;
        } else if (cell === player && foundOpponent) {
          return true;
        } else {
          break;
        }
        r += dr;
        c += dc;
      }
    }

    return false;
  }

  flipPieces(index, player) {
    const opponent = player === 'black' ? 'white' : 'black';
    const { row, col } = this.getRowCol(index);
    const toFlip = [];

    // Check all 8 directions
    const directions = [
      [-1, -1],
      [-1, 0],
      [-1, 1],
      [0, -1],
      [0, 1],
      [1, -1],
      [1, 0],
      [1, 1],
    ];

    for (const [dr, dc] of directions) {
      let r = row + dr;
      let c = col + dc;
      const line = [];

      // Collect potential pieces to flip
      while (this.isValidIndex(r, c)) {
        const cellIndex = this.getIndex(r, c);
        const cell = this.board[cellIndex];
        if (cell === opponent) {
          line.push(cellIndex);
        } else if (cell === player && line.length > 0) {
          toFlip.push(...line);
          break;
        } else {
          break;
        }
        r += dr;
        c += dc;
      }
    }

    // Animate flips
    toFlip.forEach((flipIndex) => {
      this.animateFlip(flipIndex, opponent, player);
    });

    // Place the player's piece
    this.board[index] = player;
    this.renderBoard();
  }

  animateFlip(index, fromPlayer, toPlayer) {
    this.animatingCells.add(index);
    const cell = this.cells[index];

    // Add animation class
    cell.classList.add('reversi-flip-animate');

    // Update board after animation
    const t = setTimeout(() => {
      this.board[index] = toPlayer;
      this.renderBoard();
      cell.classList.remove('reversi-flip-animate');
      this.animatingCells.delete(index);
    }, 300);
    this.pendingTimeouts.push(t);
  }

  handleBoardClick(e) {
    if (this.isPaused || this.gameOver || this.currentPlayer !== 'black') return;

    const cell = e.target.closest('.reversi-cell');
    if (!cell) return;

    const index = parseInt(cell.dataset.index);
    if (!this.validMoves.includes(index)) return;

    // Make move
    this.flipPieces(index, 'black');
    this.validMoves = [];

    // Next turn
    const t1 = setTimeout(() => this.nextTurn(), 400);
    this.pendingTimeouts.push(t1);
  }

  nextTurn() {
    // Check if current player (just moved) has any moves
    this.currentPlayer = this.currentPlayer === 'black' ? 'white' : 'black';

    const validMoves = this.findValidMoves(this.currentPlayer);

    if (validMoves.length === 0) {
      // No moves, switch player
      this.currentPlayer = this.currentPlayer === 'black' ? 'white' : 'black';
      const nextMoves = this.findValidMoves(this.currentPlayer);

      if (nextMoves.length === 0) {
        // Game over - both players have no moves
        this.endGame();
        return;
      }
    }

    this.validMoves = this.findValidMoves(this.currentPlayer);
    this.showValidMoves();
    this.updateUI();

    // AI turn
    if (this.currentPlayer === 'white' && !this.isPaused) {
      const t3 = setTimeout(() => this.makeAIMove(), this.moveDelay);
      this.pendingTimeouts.push(t3);
    }
  }

  makeAIMove() {
    if (this.currentPlayer !== 'white' || this.isPaused || this.gameOver) return;

    const moves = this.findValidMoves('white');
    if (moves.length === 0) {
      this.nextTurn();
      return;
    }

    // AI strategy
    const move = this.selectAIMove(moves);
    this.flipPieces(move, 'white');
    this.validMoves = [];

    const t2 = setTimeout(() => this.nextTurn(), 400);
    this.pendingTimeouts.push(t2);
  }

  selectAIMove(moves) {
    const scoreMove = (index) => {
      const { row, col } = this.getRowCol(index);

      // Corners are very valuable
      if ((row === 0 || row === 7) && (col === 0 || col === 7)) return 10000;

      // Avoid edges adjacent to corners
      if (
        ((row === 0 || row === 7) && (col === 1 || col === 6)) ||
        ((col === 0 || col === 7) && (row === 1 || row === 6))
      ) {
        return -1000;
      }

      // Prefer edges but not corners
      if (row === 0 || row === 7 || col === 0 || col === 7) return 500;

      // Count flips
      const opponent = 'black';
      let flips = 0;
      const directions = [
        [-1, -1],
        [-1, 0],
        [-1, 1],
        [0, -1],
        [0, 1],
        [1, -1],
        [1, 0],
        [1, 1],
      ];

      for (const [dr, dc] of directions) {
        let r = row + dr;
        let c = col + dc;
        let count = 0;
        while (this.isValidIndex(r, c)) {
          const cell = this.board[this.getIndex(r, c)];
          if (cell === opponent) {
            count++;
          } else if (cell === 'white' && count > 0) {
            flips += count;
            break;
          } else {
            break;
          }
          r += dr;
          c += dc;
        }
      }

      return flips;
    };

    let bestMove = moves[0];
    let bestScore = scoreMove(bestMove);

    for (const move of moves.slice(1)) {
      const score = scoreMove(move);
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }

    return bestMove;
  }

  endGame() {
    this.gameOver = true;
    const blackCount = this.board.filter((cell) => cell === 'black').length;
    const whiteCount = this.board.filter((cell) => cell === 'white').length;

    let message = '';
    if (blackCount > whiteCount) {
      message = `You win! ${blackCount} - ${whiteCount}`;
    } else if (whiteCount > blackCount) {
      message = `AI wins! ${whiteCount} - ${blackCount}`;
    } else {
      message = `Tie! ${blackCount} - ${whiteCount}`;
    }

    this.statusDiv.textContent = message;
    this.renderBoard();
  }

  showValidMoves() {
    this.cells.forEach((cell, index) => {
      if (this.validMoves.includes(index)) {
        cell.classList.add('reversi-valid-move');
      } else {
        cell.classList.remove('reversi-valid-move');
      }
    });
  }

  renderBoard() {
    for (let i = 0; i < 64; i++) {
      const cell = this.cells[i];
      const piece = this.board[i];

      // Don't re-render if animating
      if (this.animatingCells.has(i)) continue;

      // Clear existing content
      cell.innerHTML = '';
      cell.className = 'reversi-cell';

      if (piece) {
        const disc = document.createElement('div');
        disc.className = `reversi-disc reversi-disc-${piece}`;
        cell.appendChild(disc);
      }

      // Re-add valid move indicator if needed
      if (this.validMoves.includes(i)) {
        cell.classList.add('reversi-valid-move');
      }
    }
  }

  updateUI() {
    const blackCount = this.board.filter((cell) => cell === 'black').length;
    const whiteCount = this.board.filter((cell) => cell === 'white').length;

    const counts = this.scoreDiv.querySelectorAll('.reversi-count');
    counts[0].textContent = blackCount;
    counts[1].textContent = whiteCount;

    if (!this.gameOver) {
      const playerName = this.currentPlayer === 'black' ? 'Your' : 'AI\'s';
      this.statusDiv.textContent = `${playerName} turn`;
    }

    this.renderBoard();
  }
}

// Export for use
window.Reversi = Reversi;
