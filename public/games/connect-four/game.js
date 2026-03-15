class ConnectFour {
  constructor(container) {
    this.container = container;
    this.cols = 7;
    this.rows = 6;
    this.board = [];
    this.score = 0;
    this.gameActive = true;
    this.gameOver = false;
    this.currentPlayer = 'player'; // 'player' or 'ai'
    this.animatingDrops = 0;
    this.pausedState = false;
    
    // Game constants
    this.PLAYER_DISC = 1;    // red
    this.AI_DISC = 2;        // yellow
    this.EMPTY = 0;
    
    // DOM elements
    this.gameBoard = null;
    this.scoreDisplay = null;
    this.overlay = null;
    this.cells = [];
    
    // Bind methods
    this.handleColumnClick = this.handleColumnClick.bind(this);
  }
  
  start() {
    this.score = 0;
    this.gameActive = true;
    this.gameOver = false;
    this.currentPlayer = 'player';
    this.animatingDrops = 0;
    this.pausedState = false;
    this.initBoard();
    this.render();
  }
  
  pause() {
    this.pausedState = true;
    this.gameActive = false;
  }
  
  resume() {
    this.pausedState = false;
    this.gameActive = !this.gameOver;
    if (this.gameActive && this.currentPlayer === 'ai') {
      this.scheduleAIMove();
    }
  }
  
  destroy() {
    if (this.container) {
      this.container.innerHTML = '';
    }
    this.cells = [];
    this.gameBoard = null;
    this.scoreDisplay = null;
    this.overlay = null;
  }
  
  getScore() {
    return this.score;
  }
  
  initBoard() {
    this.board = Array(this.rows)
      .fill(null)
      .map(() => Array(this.cols).fill(this.EMPTY));
  }
  
  render() {
    this.container.innerHTML = '';
    
    // Create wrapper
    const wrapper = document.createElement('div');
    wrapper.className = 'connect-four-wrapper';
    
    // Create header
    const header = document.createElement('div');
    header.className = 'connect-four-header';
    
    const title = document.createElement('h2');
    title.className = 'connect-four-title';
    title.textContent = 'Connect Four';
    header.appendChild(title);
    
    this.scoreDisplay = document.createElement('div');
    this.scoreDisplay.className = 'connect-four-score';
    this.scoreDisplay.textContent = `Score: ${this.score}`;
    header.appendChild(this.scoreDisplay);
    
    wrapper.appendChild(header);
    
    // Create game board
    this.gameBoard = document.createElement('div');
    this.gameBoard.className = 'connect-four-board';
    
    // Create column containers
    this.cells = [];
    for (let col = 0; col < this.cols; col++) {
      const column = document.createElement('div');
      column.className = 'connect-four-column';
      column.dataset.column = col;
      column.addEventListener('click', this.handleColumnClick);
      
      this.cells[col] = [];
      for (let row = 0; row < this.rows; row++) {
        const cell = document.createElement('div');
        cell.className = 'connect-four-cell';
        cell.dataset.row = row;
        cell.dataset.col = col;
        
        const disc = document.createElement('div');
        disc.className = 'connect-four-disc';
        cell.appendChild(disc);
        
        column.appendChild(cell);
        this.cells[col][row] = cell;
      }
      
      this.gameBoard.appendChild(column);
    }
    
    wrapper.appendChild(this.gameBoard);
    this.container.appendChild(wrapper);
    
    // Create overlay for game end
    this.overlay = document.createElement('div');
    this.overlay.className = 'connect-four-overlay';
    this.overlay.style.display = 'none';
    this.container.appendChild(this.overlay);
    
    this.updateBoardDisplay();
  }
  
  updateBoardDisplay() {
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const cell = this.cells[col][row];
        const disc = cell.querySelector('.connect-four-disc');
        const value = this.board[row][col];
        
        disc.className = 'connect-four-disc';
        
        if (value === this.PLAYER_DISC) {
          disc.classList.add('connect-four-disc-red');
        } else if (value === this.AI_DISC) {
          disc.classList.add('connect-four-disc-yellow');
        }
      }
    }
  }
  
  handleColumnClick(event) {
    if (!this.gameActive || this.pausedState || this.gameOver) return;
    if (this.currentPlayer !== 'player') return;
    if (this.animatingDrops > 0) return;
    
    const col = parseInt(event.currentTarget.dataset.column);
    this.dropDisc(col, this.PLAYER_DISC);
  }
  
  dropDisc(col, player) {
    // Find the lowest empty row in the column
    let row = -1;
    for (let r = this.rows - 1; r >= 0; r--) {
      if (this.board[r][col] === this.EMPTY) {
        row = r;
        break;
      }
    }
    
    if (row === -1) return; // Column is full
    
    // Animate the drop
    this.animatingDrops++;
    this.animateDrop(col, row, player, () => {
      this.animatingDrops--;
      
      // Place the disc
      this.board[row][col] = player;
      this.updateBoardDisplay();
      
      // Check for win
      const winningCells = this.checkWin(row, col, player);
      if (winningCells.length > 0) {
        this.gameActive = false;
        this.gameOver = true;
        this.highlightWinningCells(winningCells);
        
        if (player === this.PLAYER_DISC) {
          this.score += 10;
          this.scoreDisplay.textContent = `Score: ${this.score}`;
          this.showGameOverOverlay('You Won!', 'Player Wins!');
        } else {
          this.showGameOverOverlay('AI Won!', 'AI Wins!');
        }
        return;
      }
      
      // Check for draw
      if (this.isBoardFull()) {
        this.gameActive = false;
        this.gameOver = true;
        this.showGameOverOverlay("It's a Draw!", "Draw!");
        return;
      }
      
      // Switch player
      this.currentPlayer = player === this.PLAYER_DISC ? 'ai' : 'player';
      
      if (this.currentPlayer === 'ai') {
        this.scheduleAIMove();
      }
    });
  }
  
  animateDrop(col, finalRow, player, callback) {
    const cell = this.cells[col][finalRow];
    const disc = cell.querySelector('.connect-four-disc');
    
    // Add animation class
    disc.classList.add('connect-four-disc-dropping');
    
    if (player === this.PLAYER_DISC) {
      disc.classList.add('connect-four-disc-red');
    } else {
      disc.classList.add('connect-four-disc-yellow');
    }
    
    // Simulate drop animation
    setTimeout(() => {
      disc.classList.remove('connect-four-disc-dropping');
      if (callback) callback();
    }, 400);
  }
  
  checkWin(row, col, player) {
    const directions = [
      { dr: 0, dc: 1 },  // horizontal
      { dr: 1, dc: 0 },  // vertical
      { dr: 1, dc: 1 },  // diagonal down-right
      { dr: 1, dc: -1 }  // diagonal down-left
    ];
    
    const winningCells = [];
    
    for (const { dr, dc } of directions) {
      const cells = [{ r: row, c: col }];
      
      // Check in positive direction
      for (let i = 1; i < 4; i++) {
        const r = row + dr * i;
        const c = col + dc * i;
        if (r >= 0 && r < this.rows && c >= 0 && c < this.cols && this.board[r][c] === player) {
          cells.push({ r, c });
        } else {
          break;
        }
      }
      
      // Check in negative direction
      for (let i = 1; i < 4; i++) {
        const r = row - dr * i;
        const c = col - dc * i;
        if (r >= 0 && r < this.rows && c >= 0 && c < this.cols && this.board[r][c] === player) {
          cells.push({ r, c });
        } else {
          break;
        }
      }
      
      // If we have 4 or more in a line, it's a win
      if (cells.length >= 4) {
        return cells.slice(0, 4);
      }
    }
    
    return winningCells;
  }
  
  isBoardFull() {
    for (let col = 0; col < this.cols; col++) {
      if (this.board[0][col] === this.EMPTY) {
        return false;
      }
    }
    return true;
  }
  
  highlightWinningCells(cells) {
    for (const { r, c } of cells) {
      const cell = this.cells[c][r];
      const disc = cell.querySelector('.connect-four-disc');
      disc.classList.add('connect-four-disc-winner');
    }
  }
  
  scheduleAIMove() {
    // Delay AI move for better UX
    setTimeout(() => {
      if (this.gameActive && !this.pausedState && this.currentPlayer === 'ai') {
        const col = this.getAIMove();
        this.dropDisc(col, this.AI_DISC);
      }
    }, 800);
  }
  
  getAIMove() {
    // AI strategy:
    // 1. Check if AI can win
    // 2. Check if player can win (block)
    // 3. Prefer center column
    // 4. Random valid move
    
    // Check if AI can win
    for (let col = 0; col < this.cols; col++) {
      const row = this.findDropRow(col);
      if (row !== -1) {
        this.board[row][col] = this.AI_DISC;
        if (this.checkWin(row, col, this.AI_DISC).length > 0) {
          this.board[row][col] = this.EMPTY;
          return col;
        }
        this.board[row][col] = this.EMPTY;
      }
    }
    
    // Check if player can win (block)
    for (let col = 0; col < this.cols; col++) {
      const row = this.findDropRow(col);
      if (row !== -1) {
        this.board[row][col] = this.PLAYER_DISC;
        if (this.checkWin(row, col, this.PLAYER_DISC).length > 0) {
          this.board[row][col] = this.EMPTY;
          return col;
        }
        this.board[row][col] = this.EMPTY;
      }
    }
    
    // Prefer center column
    const centerCol = Math.floor(this.cols / 2);
    if (this.findDropRow(centerCol) !== -1) {
      return centerCol;
    }
    
    // Random valid move
    const validCols = [];
    for (let col = 0; col < this.cols; col++) {
      if (this.findDropRow(col) !== -1) {
        validCols.push(col);
      }
    }
    
    return validCols[Math.floor(Math.random() * validCols.length)] || 0;
  }
  
  findDropRow(col) {
    for (let row = this.rows - 1; row >= 0; row--) {
      if (this.board[row][col] === this.EMPTY) {
        return row;
      }
    }
    return -1;
  }
  
  showGameOverOverlay(title, message) {
    const content = document.createElement('div');
    content.className = 'connect-four-overlay-content';
    
    const titleEl = document.createElement('h2');
    titleEl.className = 'connect-four-overlay-title';
    titleEl.textContent = title;
    content.appendChild(titleEl);
    
    const messageEl = document.createElement('p');
    messageEl.className = 'connect-four-overlay-message';
    messageEl.textContent = message;
    content.appendChild(messageEl);
    
    const button = document.createElement('button');
    button.className = 'connect-four-overlay-button';
    button.textContent = 'Play Again';
    button.addEventListener('click', () => {
      this.start();
    });
    content.appendChild(button);
    
    this.overlay.innerHTML = '';
    this.overlay.appendChild(content);
    this.overlay.style.display = 'flex';
  }
}

window.ConnectFour = ConnectFour;
