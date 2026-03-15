class TicTacToe {
  constructor(container) {
    this.container = container;
    this.board = [null, null, null, null, null, null, null, null, null];
    this.currentPlayer = 'X';
    this.gameActive = true;
    this.gamePaused = false;
    this.difficulty = 'medium';
    this.score = 0;
    this.wins = 0;
    this.losses = 0;
    this.draws = 0;

    this.cellElements = [];
    this.listeners = {};
    this.animationFrameId = null;
    this.aiThinkingTimeout = null;

    this.init();
  }

  init() {
    this.container.innerHTML = '';
    this.container.className = 'tic-tac-toe-container';

    // Header with difficulty selector
    const header = document.createElement('div');
    header.className = 'tic-tac-toe-header';
    
    const diffLabel = document.createElement('label');
    diffLabel.className = 'tic-tac-toe-label';
    diffLabel.textContent = 'Difficulty: ';
    
    const diffSelect = document.createElement('select');
    diffSelect.className = 'tic-tac-toe-select';
    diffSelect.id = 'tic-tac-toe-difficulty';
    
    ['easy', 'medium', 'hard'].forEach(level => {
      const option = document.createElement('option');
      option.value = level;
      option.textContent = level.charAt(0).toUpperCase() + level.slice(1);
      option.selected = level === this.difficulty;
      diffSelect.appendChild(option);
    });
    
    this.listeners.difficultyChange = (e) => {
      this.difficulty = e.target.value;
      this.start();
    };
    diffSelect.addEventListener('change', this.listeners.difficultyChange);
    
    diffLabel.appendChild(diffSelect);
    header.appendChild(diffLabel);
    this.container.appendChild(header);

    // Score display
    const scoreDiv = document.createElement('div');
    scoreDiv.className = 'tic-tac-toe-score';
    scoreDiv.id = 'tic-tac-toe-score';
    scoreDiv.innerHTML = `
      <div class="tic-tac-toe-score-item">Score: <span id="tic-tac-toe-score-value">0</span></div>
      <div class="tic-tac-toe-tally">W: <span id="tic-tac-toe-wins">0</span> | D: <span id="tic-tac-toe-draws">0</span> | L: <span id="tic-tac-toe-losses">0</span></div>
    `;
    this.container.appendChild(scoreDiv);

    // Game board
    const board = document.createElement('div');
    board.className = 'tic-tac-toe-board';
    
    for (let i = 0; i < 9; i++) {
      const cell = document.createElement('div');
      cell.className = 'tic-tac-toe-cell';
      cell.dataset.index = i;
      
      this.listeners[`cell-${i}`] = () => this.playerMove(i);
      cell.addEventListener('click', this.listeners[`cell-${i}`]);
      
      board.appendChild(cell);
      this.cellElements[i] = cell;
    }
    
    this.container.appendChild(board);

    // Game over overlay
    const overlay = document.createElement('div');
    overlay.className = 'tic-tac-toe-overlay';
    overlay.id = 'tic-tac-toe-overlay';
    overlay.style.display = 'none';
    
    const overlayContent = document.createElement('div');
    overlayContent.className = 'tic-tac-toe-overlay-content';
    
    const overlayText = document.createElement('h2');
    overlayText.id = 'tic-tac-toe-overlay-text';
    overlayText.className = 'tic-tac-toe-overlay-text';
    
    const playAgainBtn = document.createElement('button');
    playAgainBtn.className = 'tic-tac-toe-btn';
    playAgainBtn.textContent = 'Play Again';
    
    this.listeners.playAgain = () => this.start();
    playAgainBtn.addEventListener('click', this.listeners.playAgain);
    
    overlayContent.appendChild(overlayText);
    overlayContent.appendChild(playAgainBtn);
    overlay.appendChild(overlayContent);
    this.container.appendChild(overlay);
  }

  start() {
    this.board = [null, null, null, null, null, null, null, null, null];
    this.currentPlayer = 'X';
    this.gameActive = true;
    this.gamePaused = false;
    
    this.cellElements.forEach(cell => {
      cell.textContent = '';
      cell.className = 'tic-tac-toe-cell';
    });
    
    const overlay = document.getElementById('tic-tac-toe-overlay');
    overlay.style.display = 'none';
  }

  pause() {
    this.gamePaused = true;
  }

  resume() {
    this.gamePaused = false;
  }

  destroy() {
    // Clear all event listeners
    Object.values(this.listeners).forEach((listener, index) => {
      if (index < 9) {
        const cell = this.cellElements[index];
        if (cell) cell.removeEventListener('click', listener);
      }
    });
    
    const diffSelect = document.getElementById('tic-tac-toe-difficulty');
    if (diffSelect && this.listeners.difficultyChange) {
      diffSelect.removeEventListener('change', this.listeners.difficultyChange);
    }
    
    const playAgainBtn = this.container.querySelector('.tic-tac-toe-btn');
    if (playAgainBtn && this.listeners.playAgain) {
      playAgainBtn.removeEventListener('click', this.listeners.playAgain);
    }

    // Clear timeouts
    if (this.aiThinkingTimeout) {
      clearTimeout(this.aiThinkingTimeout);
    }
    
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }

    // Clear DOM
    this.container.innerHTML = '';
  }

  getScore() {
    return this.score;
  }

  playerMove(index) {
    if (!this.gameActive || this.gamePaused || this.currentPlayer !== 'X' || this.board[index] !== null) {
      return;
    }

    this.makeMove(index, 'X');

    if (this.gameActive) {
      this.currentPlayer = 'O';
      this.aiThinkingTimeout = setTimeout(() => this.aiMove(), 500);
    }
  }

  makeMove(index, player) {
    this.board[index] = player;
    const cell = this.cellElements[index];
    cell.textContent = player;
    cell.className = `tic-tac-toe-cell tic-tac-toe-${player.toLowerCase()}`;

    const result = this.checkWin();
    if (result) {
      this.endGame(result);
    } else if (this.board.every(cell => cell !== null)) {
      this.endGame('draw');
    } else {
      this.currentPlayer = player === 'X' ? 'O' : 'X';
    }
  }

  aiMove() {
    if (!this.gameActive || this.gamePaused) return;

    let bestMove;
    
    switch (this.difficulty) {
      case 'easy':
        bestMove = this.getRandomMove();
        break;
      case 'medium':
        bestMove = this.getMediumMove();
        break;
      case 'hard':
        bestMove = this.getHardMove();
        break;
      default:
        bestMove = this.getRandomMove();
    }

    if (bestMove !== -1) {
      this.makeMove(bestMove, 'O');
      if (this.gameActive) {
        this.currentPlayer = 'X';
      }
    }
  }

  getRandomMove() {
    const availableMoves = this.board
      .map((cell, index) => cell === null ? index : null)
      .filter(index => index !== null);
    
    return availableMoves[Math.floor(Math.random() * availableMoves.length)];
  }

  getMediumMove() {
    // First, try to win
    const winMove = this.findWinningMove('O');
    if (winMove !== -1) return winMove;

    // Second, block player's win
    const blockMove = this.findWinningMove('X');
    if (blockMove !== -1) return blockMove;

    // Otherwise, random move
    return this.getRandomMove();
  }

  getHardMove() {
    const { bestMove } = this.minimax(this.board, 'O');
    return bestMove;
  }

  findWinningMove(player) {
    for (let i = 0; i < 9; i++) {
      if (this.board[i] === null) {
        this.board[i] = player;
        const result = this.checkWin();
        this.board[i] = null;
        
        if (result && result.winner === player) {
          return i;
        }
      }
    }
    return -1;
  }

  minimax(board, player, depth = 0) {
    const result = this.checkWin();
    
    if (result) {
      if (result.winner === 'O') {
        return { score: 10 - depth, bestMove: -1 };
      } else if (result.winner === 'X') {
        return { score: depth - 10, bestMove: -1 };
      }
    }
    
    if (board.every(cell => cell !== null)) {
      return { score: 0, bestMove: -1 };
    }

    const availableMoves = board
      .map((cell, index) => cell === null ? index : null)
      .filter(index => index !== null);

    let bestScore = player === 'O' ? -Infinity : Infinity;
    let bestMove = availableMoves[0];

    for (const move of availableMoves) {
      board[move] = player;
      const nextPlayer = player === 'O' ? 'X' : 'O';
      const { score } = this.minimax(board, nextPlayer, depth + 1);
      board[move] = null;

      if (player === 'O' && score > bestScore) {
        bestScore = score;
        bestMove = move;
      } else if (player === 'X' && score < bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }

    return { score: bestScore, bestMove };
  }

  checkWin() {
    const lines = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6]
    ];

    for (const line of lines) {
      const [a, b, c] = line;
      if (this.board[a] && this.board[a] === this.board[b] && this.board[b] === this.board[c]) {
        return { winner: this.board[a], line };
      }
    }

    return null;
  }

  endGame(result) {
    this.gameActive = false;

    let message = '';
    let scoreGain = 0;

    if (result === 'draw') {
      message = "It's a Draw!";
      this.draws++;
      scoreGain = 5;
    } else if (result.winner === 'X') {
      message = 'You Won!';
      this.wins++;
      scoreGain = 10;
    } else {
      message = 'You Lost!';
      this.losses++;
      scoreGain = 0;
    }

    this.score += scoreGain;
    this.updateScoreDisplay();

    // Highlight winning line
    if (result.line) {
      this.highlightWinningLine(result.line);
    }

    // Show overlay
    setTimeout(() => {
      const overlay = document.getElementById('tic-tac-toe-overlay');
      const overlayText = document.getElementById('tic-tac-toe-overlay-text');
      overlayText.textContent = message;
      overlay.style.display = 'flex';
    }, 600);
  }

  highlightWinningLine(line) {
    line.forEach(index => {
      this.cellElements[index].classList.add('tic-tac-toe-winning');
    });
  }

  updateScoreDisplay() {
    const scoreValue = document.getElementById('tic-tac-toe-score-value');
    const winsDisplay = document.getElementById('tic-tac-toe-wins');
    const drawsDisplay = document.getElementById('tic-tac-toe-draws');
    const lossesDisplay = document.getElementById('tic-tac-toe-losses');

    if (scoreValue) scoreValue.textContent = this.score;
    if (winsDisplay) winsDisplay.textContent = this.wins;
    if (drawsDisplay) drawsDisplay.textContent = this.draws;
    if (lossesDisplay) lossesDisplay.textContent = this.losses;
  }
}

window.TicTacToe = TicTacToe;
