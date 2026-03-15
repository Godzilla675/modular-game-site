class Checkers {
  constructor(container) {
    this.container = container;
    this.boardSize = 8;
    this.board = [];
    this.selectedPiece = null;
    this.validMoves = [];
    this.isPlayerTurn = true;
    this.gameActive = true;
    this.gamePaused = false;
    this.score = 0;
    this.playerCaptured = 0;
    this.aiCaptured = 0;
    this.playerKings = 0;
    this.aiKings = 0;
    this.aiTimeout = null;

    this.initializeBoard();
    this.renderBoard();
    this.attachEventListeners();
  }

  initializeBoard() {
    // Create empty board
    this.board = Array(this.boardSize)
      .fill(null)
      .map(() => Array(this.boardSize).fill(null));

    // Place player pieces (red/dark) at bottom
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < this.boardSize; col++) {
        if ((row + col) % 2 === 1) {
          this.board[row][col] = { color: 'player', isKing: false };
        }
      }
    }

    // Place AI pieces (light) at top
    for (let row = 5; row < 8; row++) {
      for (let col = 0; col < this.boardSize; col++) {
        if ((row + col) % 2 === 1) {
          this.board[row][col] = { color: 'ai', isKing: false };
        }
      }
    }
  }

  start() {
    this.initializeBoard();
    this.selectedPiece = null;
    this.validMoves = [];
    this.isPlayerTurn = true;
    this.gameActive = true;
    this.gamePaused = false;
    this.score = 0;
    this.playerCaptured = 0;
    this.aiCaptured = 0;
    this.playerKings = 0;
    this.aiKings = 0;
    this.renderBoard();
  }

  pause() {
    this.gamePaused = true;
    this.gameActive = false;
  }

  resume() {
    this.gamePaused = false;
    this.gameActive = true;
    if (!this.isPlayerTurn) {
      this.makeAIMove();
    }
  }

  destroy() {
    if (this.aiTimeout) clearTimeout(this.aiTimeout);
    this.container.innerHTML = '';
    this.container.removeEventListener('click', this.handleBoardClick);
  }

  getScore() {
    return this.score;
  }

  renderBoard() {
    this.container.innerHTML = '';
    this.container.className = 'checkers-container';

    const boardEl = document.createElement('div');
    boardEl.className = 'checkers-board';

    for (let row = 0; row < this.boardSize; row++) {
      for (let col = 0; col < this.boardSize; col++) {
        const square = document.createElement('div');
        const isLight = (row + col) % 2 === 0;
        square.className = `checkers-square ${isLight ? 'checkers-light' : 'checkers-dark'}`;
        square.dataset.row = row;
        square.dataset.col = col;

        // Check if this square is a valid move
        const isValidMove = this.validMoves.some(move => move.row === row && move.col === col);
        if (isValidMove) {
          square.classList.add('checkers-valid-move');
        }

        // Check if this square is selected
        if (this.selectedPiece && this.selectedPiece.row === row && this.selectedPiece.col === col) {
          square.classList.add('checkers-selected');
        }

        // Add piece if exists
        const piece = this.board[row][col];
        if (piece) {
          const pieceEl = document.createElement('div');
          pieceEl.className = `checkers-piece checkers-${piece.color}`;
          if (piece.isKing) {
            pieceEl.classList.add('checkers-king');
            pieceEl.innerHTML = '♕';
          }
          square.appendChild(pieceEl);
        }

        boardEl.appendChild(square);
      }
    }

    this.container.appendChild(boardEl);

    // Add status info
    const statusEl = document.createElement('div');
    statusEl.className = 'checkers-status';
    statusEl.innerHTML = `
      <div class="checkers-score">Score: ${this.score}</div>
      <div class="checkers-turn">${this.isPlayerTurn ? 'Your Turn' : 'AI Thinking...'}</div>
      <div class="checkers-captured">You: ${this.playerCaptured} | AI: ${this.aiCaptured}</div>
    `;
    this.container.appendChild(statusEl);
  }

  attachEventListeners() {
    this.handleBoardClick = (e) => {
      if (!this.gameActive || this.gamePaused || !this.isPlayerTurn) return;

      const square = e.target.closest('.checkers-square');
      if (!square) return;

      const row = parseInt(square.dataset.row);
      const col = parseInt(square.dataset.col);

      if (this.selectedPiece === null) {
        // Select a piece
        if (this.board[row][col] && this.board[row][col].color === 'player') {
          this.selectedPiece = { row, col };
          this.validMoves = this.getValidMoves(row, col);
          this.renderBoard();
        }
      } else {
        // Try to move the selected piece
        const move = this.validMoves.find(m => m.row === row && m.col === col);
        if (move) {
          this.makeMove(this.selectedPiece, move);
        } else {
          // Deselect or select different piece
          if (this.board[row][col] && this.board[row][col].color === 'player') {
            this.selectedPiece = { row, col };
            this.validMoves = this.getValidMoves(row, col);
          } else {
            this.selectedPiece = null;
            this.validMoves = [];
          }
          this.renderBoard();
        }
      }
    };

    this.container.addEventListener('click', this.handleBoardClick);
  }

  getValidMoves(row, col) {
    const piece = this.board[row][col];
    if (!piece) return [];

    const moves = [];
    const directions = piece.isKing
      ? [[-1, -1], [-1, 1], [1, -1], [1, 1]]
      : piece.color === 'player'
      ? [[1, -1], [1, 1]]
      : [[-1, -1], [-1, 1]];

    // Check regular moves
    for (const [dr, dc] of directions) {
      const newRow = row + dr;
      const newCol = col + dc;
      if (this.isValidPosition(newRow, newCol) && !this.board[newRow][newCol]) {
        moves.push({ row: newRow, col: newCol, isCapture: false });
      }
    }

    // Check capture moves (mandatory)
    const captures = this.getCaptureMoves(row, col);
    return captures.length > 0 ? captures : moves;
  }

  getCaptureMoves(row, col, visited = new Set(), moves = []) {
    const piece = this.board[row][col];
    if (!piece) return moves;

    const visited_key = `${row},${col}`;
    visited.add(visited_key);

    const directions = piece.isKing
      ? [[-1, -1], [-1, 1], [1, -1], [1, 1]]
      : piece.color === 'player'
      ? [[1, -1], [1, 1]]
      : [[-1, -1], [-1, 1]];

    for (const [dr, dc] of directions) {
      const enemyRow = row + dr;
      const enemyCol = col + dc;
      const newRow = row + dr * 2;
      const newCol = col + dc * 2;

      if (
        this.isValidPosition(enemyRow, enemyCol) &&
        this.isValidPosition(newRow, newCol) &&
        this.board[enemyRow][enemyCol] &&
        this.board[enemyRow][enemyCol].color !== piece.color &&
        !this.board[newRow][newCol]
      ) {
        const move_key = `${newRow},${newCol}`;
        if (!visited.has(move_key)) {
          moves.push({
            row: newRow,
            col: newCol,
            isCapture: true,
            capturedRow: enemyRow,
            capturedCol: enemyCol
          });

          // Simulate move for chain captures
          const tempPiece = this.board[enemyRow][enemyCol];
          this.board[newRow][newCol] = piece;
          this.board[row][col] = null;
          this.board[enemyRow][enemyCol] = null;

          // Get additional captures
          const chainCaptures = this.getCaptureMoves(newRow, newCol, new Set(visited), []);
          chainCaptures.forEach(capture => {
            if (!moves.some(m => m.row === capture.row && m.col === capture.col && 
                                  m.capturedRow === capture.capturedRow && 
                                  m.capturedCol === capture.capturedCol)) {
              moves.push(capture);
            }
          });

          // Undo simulation
          this.board[row][col] = piece;
          this.board[newRow][newCol] = null;
          this.board[enemyRow][enemyCol] = tempPiece;
        }
      }
    }

    return moves;
  }

  isValidPosition(row, col) {
    return row >= 0 && row < this.boardSize && col >= 0 && col < this.boardSize;
  }

  makeMove(from, to) {
    const piece = this.board[from.row][from.col];
    this.board[to.row][to.col] = piece;
    this.board[from.row][from.col] = null;

    // Handle capture
    if (to.isCapture) {
      const capturedPiece = this.board[to.capturedRow][to.capturedCol];
      this.board[to.capturedRow][to.capturedCol] = null;
      if (capturedPiece.color === 'ai') {
        this.playerCaptured++;
        this.score += 10;
      }
    }

    // Handle king promotion
    if ((piece.color === 'player' && to.row === 7) || (piece.color === 'ai' && to.row === 0)) {
      piece.isKing = true;
      if (piece.color === 'player') {
        this.playerKings++;
        this.score += 20;
      }
    }

    this.selectedPiece = null;
    this.validMoves = [];

    // Check if more captures available (chain captures)
    const moreCaptures = this.getCaptureMoves(to.row, to.col);
    if (moreCaptures.length > 0 && moreCaptures[0].isCapture) {
      // Player must continue capturing
      this.selectedPiece = to;
      this.validMoves = moreCaptures;
      this.renderBoard();
      return;
    }

    // Check game end
    if (!this.hasValidMoves('ai')) {
      this.endGame('You win! Opponent has no valid moves.');
      return;
    }

    if (this.countPieces('ai') === 0) {
      this.endGame('You win! Opponent has no pieces left.');
      return;
    }

    this.isPlayerTurn = false;
    this.renderBoard();
    this.aiTimeout = setTimeout(() => this.makeAIMove(), 800);
  }

  makeAIMove() {
    if (this.gamePaused || !this.gameActive) return;

    const moves = this.getAIMoves();
    if (moves.length === 0) {
      this.endGame('Game Over! You win!');
      return;
    }

    // AI strategy: prefer captures, prefer king moves, avoid losing pieces
    const bestMove = this.selectBestAIMove(moves);
    this.executeAIMove(bestMove.from, bestMove.to);
  }

  getAIMoves() {
    const moves = [];
    for (let row = 0; row < this.boardSize; row++) {
      for (let col = 0; col < this.boardSize; col++) {
        const piece = this.board[row][col];
        if (piece && piece.color === 'ai') {
          const validMoves = this.getValidMoves(row, col);
          validMoves.forEach(move => {
            moves.push({ from: { row, col }, to: move });
          });
        }
      }
    }
    return moves;
  }

  selectBestAIMove(moves) {
    // Prioritize captures
    const captureMoves = moves.filter(m => m.to.isCapture);
    if (captureMoves.length > 0) {
      // Among captures, prefer moving kings
      const kingCaptures = captureMoves.filter(m => this.board[m.from.row][m.from.col].isKing);
      return kingCaptures.length > 0 ? kingCaptures[0] : captureMoves[0];
    }

    // Then prioritize king moves
    const kingMoves = moves.filter(m => this.board[m.from.row][m.from.col].isKing);
    if (kingMoves.length > 0) return kingMoves[0];

    // Otherwise, prefer moving pieces away from edges (basic defense)
    const safeMoves = moves.filter(m => {
      const fromRow = m.from.row;
      return fromRow > 0 && fromRow < this.boardSize - 1;
    });

    return safeMoves.length > 0 ? safeMoves[0] : moves[0];
  }

  executeAIMove(from, to) {
    const piece = this.board[from.row][from.col];
    this.board[to.row][to.col] = piece;
    this.board[from.row][from.col] = null;

    // Handle capture
    if (to.isCapture) {
      const capturedPiece = this.board[to.capturedRow][to.capturedCol];
      this.board[to.capturedRow][to.capturedCol] = null;
      if (capturedPiece.color === 'player') {
        this.aiCaptured++;
      }
    }

    // Handle king promotion
    if ((piece.color === 'ai' && to.row === 0) || (piece.color === 'player' && to.row === 7)) {
      piece.isKing = true;
      if (piece.color === 'ai') {
        this.aiKings++;
      }
    }

    // Check for chain captures
    const moreCaptures = this.getCaptureMoves(to.row, to.col);
    if (moreCaptures.length > 0 && moreCaptures[0].isCapture) {
      // Continue capturing
      const nextCapture = moreCaptures[0];
      this.executeAIMove(to, nextCapture);
      return;
    }

    // Check game end
    if (!this.hasValidMoves('player')) {
      this.endGame('Game Over! Opponent has no valid moves.');
      return;
    }

    if (this.countPieces('player') === 0) {
      this.endGame('Game Over! You have no pieces left.');
      return;
    }

    this.isPlayerTurn = true;
    this.renderBoard();
  }

  hasValidMoves(color) {
    for (let row = 0; row < this.boardSize; row++) {
      for (let col = 0; col < this.boardSize; col++) {
        const piece = this.board[row][col];
        if (piece && piece.color === color) {
          const moves = this.getValidMoves(row, col);
          if (moves.length > 0) return true;
        }
      }
    }
    return false;
  }

  countPieces(color) {
    let count = 0;
    for (let row = 0; row < this.boardSize; row++) {
      for (let col = 0; col < this.boardSize; col++) {
        if (this.board[row][col] && this.board[row][col].color === color) {
          count++;
        }
      }
    }
    return count;
  }

  endGame(message) {
    this.gameActive = false;
    const statusEl = this.container.querySelector('.checkers-status');
    if (statusEl) {
      statusEl.innerHTML += `<div class="checkers-game-over">${message}</div>`;
    }
  }
}

window.Checkers = Checkers;
