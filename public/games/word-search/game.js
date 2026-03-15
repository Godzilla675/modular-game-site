class WordSearch {
  constructor(container) {
    this.container = container;
    this.gridSize = 12;
    this.grid = [];
    this.words = [];
    this.foundWords = new Set();
    this.selectedCells = [];
    this.isSelecting = false;
    this.isPaused = false;
    this.startTime = 0;
    this.pausedTime = 0;
    this.timerInterval = null;
    this.category = '';
    this.score = 0;

    // Word database by category
    this.wordDatabase = {
      Animals: ['ELEPHANT', 'GIRAFFE', 'PENGUIN', 'BUTTERFLY', 'DOLPHIN', 'CHEETAH', 'KANGAROO', 'PEACOCK', 'GAZELLE', 'OSTRICH'],
      Colors: ['RED', 'BLUE', 'GREEN', 'YELLOW', 'PURPLE', 'ORANGE', 'PINK', 'BROWN', 'BLACK', 'WHITE', 'GRAY', 'CYAN'],
      Fruits: ['APPLE', 'BANANA', 'ORANGE', 'STRAWBERRY', 'BLUEBERRY', 'MANGO', 'PINEAPPLE', 'WATERMELON', 'PAPAYA', 'KIWI'],
      Sports: ['SOCCER', 'TENNIS', 'BASKETBALL', 'HOCKEY', 'BASEBALL', 'CRICKET', 'GOLF', 'VOLLEYBALL', 'SWIMMING', 'BOXING'],
      Countries: ['FRANCE', 'BRAZIL', 'JAPAN', 'CANADA', 'MEXICO', 'EGYPT', 'AUSTRALIA', 'SPAIN', 'SWEDEN', 'TURKEY']
    };
  }

  start() {
    this.foundWords.clear();
    this.selectedCells = [];
    this.isSelecting = false;
    this.isPaused = false;
    this.startTime = Date.now();
    this.pausedTime = 0;
    this.score = 0;

    // Select random category
    const categories = Object.keys(this.wordDatabase);
    this.category = categories[Math.floor(Math.random() * categories.length)];

    // Generate puzzle
    this.generatePuzzle();

    // Render UI
    this.render();

    // Start timer
    this.startTimer();
  }

  generatePuzzle() {
    // Initialize empty grid
    this.grid = Array(this.gridSize).fill(null).map(() => Array(this.gridSize).fill(''));

    // Select 8-12 random words
    const availableWords = [...this.wordDatabase[this.category]];
    const wordCount = Math.floor(Math.random() * 5) + 8; // 8-12 words
    this.words = [];

    for (let i = 0; i < wordCount; i++) {
      if (availableWords.length === 0) break;
      const idx = Math.floor(Math.random() * availableWords.length);
      const word = availableWords[idx];
      availableWords.splice(idx, 1);
      this.words.push(word);
    }

    // Place words in grid
    for (const word of this.words) {
      let placed = false;
      let attempts = 0;

      while (!placed && attempts < 50) {
        const direction = Math.floor(Math.random() * 4);
        const row = Math.floor(Math.random() * this.gridSize);
        const col = Math.floor(Math.random() * this.gridSize);

        if (this.canPlaceWord(word, row, col, direction)) {
          this.placeWord(word, row, col, direction);
          placed = true;
        }
        attempts++;
      }
    }

    // Fill remaining cells with random letters
    for (let i = 0; i < this.gridSize; i++) {
      for (let j = 0; j < this.gridSize; j++) {
        if (this.grid[i][j] === '') {
          this.grid[i][j] = String.fromCharCode(65 + Math.floor(Math.random() * 26));
        }
      }
    }
  }

  canPlaceWord(word, row, col, direction) {
    const dirs = [
      [0, 1],   // horizontal
      [1, 0],   // vertical
      [1, 1],   // diagonal down-right
      [1, -1]   // diagonal down-left
    ];

    const [dRow, dCol] = dirs[direction];

    for (let i = 0; i < word.length; i++) {
      const r = row + i * dRow;
      const c = col + i * dCol;

      if (r < 0 || r >= this.gridSize || c < 0 || c >= this.gridSize) {
        return false;
      }

      if (this.grid[r][c] !== '' && this.grid[r][c] !== word[i]) {
        return false;
      }
    }

    return true;
  }

  placeWord(word, row, col, direction) {
    const dirs = [
      [0, 1],   // horizontal
      [1, 0],   // vertical
      [1, 1],   // diagonal down-right
      [1, -1]   // diagonal down-left
    ];

    const [dRow, dCol] = dirs[direction];

    for (let i = 0; i < word.length; i++) {
      const r = row + i * dRow;
      const c = col + i * dCol;
      this.grid[r][c] = word[i];
    }
  }

  render() {
    this.container.innerHTML = `
      <div class="word-search-container">
        <div class="word-search-header">
          <h1 class="word-search-title">Word Search</h1>
          <div class="word-search-category">Category: <strong>${this.category}</strong></div>
          <div class="word-search-timer">Time: <span class="word-search-timer-value">0:00</span></div>
        </div>

        <div class="word-search-content">
          <div class="word-search-game-area">
            <div class="word-search-grid-wrapper">
              <div class="word-search-grid" id="wordSearchGrid"></div>
              <canvas class="word-search-canvas" id="wordSearchCanvas"></canvas>
            </div>
          </div>

          <div class="word-search-sidebar">
            <div class="word-search-words-section">
              <h3>Words to Find</h3>
              <ul class="word-search-words-list" id="wordSearchList"></ul>
            </div>
            <div class="word-search-controls">
              <button class="word-search-btn word-search-btn-primary" id="newPuzzleBtn">New Puzzle</button>
              <button class="word-search-btn word-search-btn-secondary" id="pauseBtn">Pause</button>
            </div>
            <div class="word-search-score">
              Score: <strong id="scoreValue">0</strong>
            </div>
          </div>
        </div>

        <div class="word-search-modal" id="winModal" style="display: none;">
          <div class="word-search-modal-content">
            <h2>🎉 You Won! 🎉</h2>
            <p>All words found!</p>
            <p class="word-search-final-score">Final Score: <strong id="finalScore">0</strong></p>
            <button class="word-search-btn word-search-btn-primary" id="playAgainBtn">Play Again</button>
          </div>
        </div>
      </div>
    `;

    this.renderGrid();
    this.renderWordList();
    this.attachEventListeners();
  }

  renderGrid() {
    const gridElement = document.getElementById('wordSearchGrid');
    gridElement.innerHTML = '';

    for (let i = 0; i < this.gridSize; i++) {
      for (let j = 0; j < this.gridSize; j++) {
        const cell = document.createElement('div');
        cell.className = 'word-search-cell';
        cell.textContent = this.grid[i][j];
        cell.dataset.row = i;
        cell.dataset.col = j;
        cell.id = `cell-${i}-${j}`;
        gridElement.appendChild(cell);
      }
    }

    // Setup canvas for drawing selections
    const canvas = document.getElementById('wordSearchCanvas');
    const gridWrapper = document.querySelector('.word-search-grid-wrapper');
    canvas.width = gridWrapper.offsetWidth;
    canvas.height = gridWrapper.offsetHeight;
  }

  renderWordList() {
    const listElement = document.getElementById('wordSearchList');
    listElement.innerHTML = '';

    for (const word of this.words) {
      const li = document.createElement('li');
      li.className = 'word-search-word-item';
      if (this.foundWords.has(word)) {
        li.classList.add('found');
      }
      li.textContent = word;
      listElement.appendChild(li);
    }
  }

  attachEventListeners() {
    const gridElement = document.getElementById('wordSearchGrid');
    const canvas = document.getElementById('wordSearchCanvas');

    // Mouse events
    gridElement.addEventListener('mousedown', (e) => this.onMouseDown(e, canvas));
    gridElement.addEventListener('mousemove', (e) => this.onMouseMove(e, canvas));
    gridElement.addEventListener('mouseup', (e) => this.onMouseUp(e));

    // Touch events
    gridElement.addEventListener('touchstart', (e) => this.onTouchStart(e, canvas));
    gridElement.addEventListener('touchmove', (e) => this.onTouchMove(e, canvas));
    gridElement.addEventListener('touchend', (e) => this.onTouchEnd(e));

    // Button events
    document.getElementById('newPuzzleBtn').addEventListener('click', () => this.start());
    document.getElementById('pauseBtn').addEventListener('click', () => this.togglePause());
    document.getElementById('playAgainBtn').addEventListener('click', () => this.start());
  }

  onMouseDown(e, canvas) {
    if (this.isPaused) return;
    const cell = e.target.closest('.word-search-cell');
    if (!cell) return;

    this.isSelecting = true;
    this.selectedCells = [];
    this.addCellToSelection(cell, canvas);
  }

  onMouseMove(e, canvas) {
    if (!this.isSelecting || this.isPaused) return;

    const cell = document.elementFromPoint(e.clientX, e.clientY).closest('.word-search-cell');
    if (!cell) return;

    this.addCellToSelection(cell, canvas);
  }

  onMouseUp(e) {
    if (!this.isSelecting) return;
    this.isSelecting = false;
    this.checkWord();
  }

  onTouchStart(e, canvas) {
    if (this.isPaused) return;
    e.preventDefault();
    const touch = e.touches[0];
    const cell = document.elementFromPoint(touch.clientX, touch.clientY).closest('.word-search-cell');
    if (!cell) return;

    this.isSelecting = true;
    this.selectedCells = [];
    this.addCellToSelection(cell, canvas);
  }

  onTouchMove(e, canvas) {
    if (!this.isSelecting || this.isPaused) return;
    e.preventDefault();

    const touch = e.touches[0];
    const cell = document.elementFromPoint(touch.clientX, touch.clientY).closest('.word-search-cell');
    if (!cell) return;

    this.addCellToSelection(cell, canvas);
  }

  onTouchEnd(e) {
    if (!this.isSelecting) return;
    this.isSelecting = false;
    this.checkWord();
  }

  addCellToSelection(cell, canvas) {
    const row = parseInt(cell.dataset.row);
    const col = parseInt(cell.dataset.col);

    // Don't add duplicate consecutive cells
    if (this.selectedCells.length > 0) {
      const lastCell = this.selectedCells[this.selectedCells.length - 1];
      if (lastCell.row === row && lastCell.col === col) {
        return;
      }

      // Check if selection is valid (linear or diagonal)
      if (!this.isValidSelection(row, col)) {
        return;
      }
    }

    this.selectedCells.push({ row, col, element: cell });
    cell.classList.add('selected');
    this.drawSelection(canvas);
  }

  isValidSelection(newRow, newCol) {
    if (this.selectedCells.length === 0) return true;

    // Get the direction from first to second cell
    const first = this.selectedCells[0];
    const second = this.selectedCells[1] || { row: first.row, col: first.col };

    let expectedDRow = second.row - first.row;
    let expectedDCol = second.col - first.col;

    // Normalize direction
    if (expectedDRow !== 0) expectedDRow = expectedDRow / Math.abs(expectedDRow);
    if (expectedDCol !== 0) expectedDCol = expectedDCol / Math.abs(expectedDCol);

    const lastCell = this.selectedCells[this.selectedCells.length - 1];
    const expectedRow = lastCell.row + expectedDRow;
    const expectedCol = lastCell.col + expectedDCol;

    return newRow === expectedRow && newCol === expectedCol;
  }

  drawSelection(canvas) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (this.selectedCells.length < 2) return;

    const gridWrapper = document.querySelector('.word-search-grid-wrapper');
    const cells = document.querySelectorAll('.word-search-cell');
    const firstCell = cells[0];
    const cellSize = firstCell.offsetWidth;
    const gap = parseInt(window.getComputedStyle(document.getElementById('wordSearchGrid')).gap) || 0;

    ctx.strokeStyle = '#4CAF50';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const startCell = this.selectedCells[0];
    const startX = startCell.col * (cellSize + gap) + cellSize / 2;
    const startY = startCell.row * (cellSize + gap) + cellSize / 2;

    ctx.beginPath();
    ctx.moveTo(startX, startY);

    for (let i = 1; i < this.selectedCells.length; i++) {
      const cell = this.selectedCells[i];
      const x = cell.col * (cellSize + gap) + cellSize / 2;
      const y = cell.row * (cellSize + gap) + cellSize / 2;
      ctx.lineTo(x, y);
    }

    ctx.stroke();
  }

  checkWord() {
    const canvas = document.getElementById('wordSearchCanvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (this.selectedCells.length < 2) {
      // Clear selection
      document.querySelectorAll('.word-search-cell.selected').forEach(cell => {
        cell.classList.remove('selected');
      });
      this.selectedCells = [];
      return;
    }

    // Get the word
    const word = this.selectedCells.map(c => this.grid[c.row][c.col]).join('');

    // Check if it's a valid word
    if (this.words.includes(word) && !this.foundWords.has(word)) {
      this.foundWords.add(word);
      this.updateScore();

      // Highlight the found word
      const gridWrapper = document.querySelector('.word-search-grid-wrapper');
      const cells = document.querySelectorAll('.word-search-cell');
      const firstCell = cells[0];
      const cellSize = firstCell.offsetWidth;
      const gap = parseInt(window.getComputedStyle(document.getElementById('wordSearchGrid')).gap) || 0;

      // Draw permanent highlight
      ctx.strokeStyle = '#FF6B6B';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      const startCell = this.selectedCells[0];
      const startX = startCell.col * (cellSize + gap) + cellSize / 2;
      const startY = startCell.row * (cellSize + gap) + cellSize / 2;

      ctx.beginPath();
      ctx.moveTo(startX, startY);

      for (let i = 1; i < this.selectedCells.length; i++) {
        const cell = this.selectedCells[i];
        const x = cell.col * (cellSize + gap) + cellSize / 2;
        const y = cell.row * (cellSize + gap) + cellSize / 2;
        ctx.lineTo(x, y);
      }

      ctx.stroke();

      // Mark cells as found
      this.selectedCells.forEach(c => {
        c.element.classList.add('found');
      });

      this.renderWordList();

      // Check win condition
      if (this.foundWords.size === this.words.length) {
        this.win();
      }
    }

    // Clear selection
    document.querySelectorAll('.word-search-cell.selected').forEach(cell => {
      cell.classList.remove('selected');
    });
    this.selectedCells = [];
  }

  updateScore() {
    // Score = words_found * 50 + time_bonus
    const timeSeconds = Math.floor((Date.now() - this.startTime - this.pausedTime) / 1000);
    const timeBonus = Math.max(0, 300 - timeSeconds) * 2; // Faster = more bonus (max 600)
    this.score = this.foundWords.size * 50 + timeBonus;
    document.getElementById('scoreValue').textContent = Math.floor(this.score);
  }

  startTimer() {
    if (this.timerInterval) clearInterval(this.timerInterval);

    this.timerInterval = setInterval(() => {
      if (!this.isPaused) {
        const timeSeconds = Math.floor((Date.now() - this.startTime - this.pausedTime) / 1000);
        const minutes = Math.floor(timeSeconds / 60);
        const seconds = timeSeconds % 60;
        const display = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        const timerElement = document.querySelector('.word-search-timer-value');
        if (timerElement) {
          timerElement.textContent = display;
        }
        this.updateScore();
      }
    }, 100);
  }

  togglePause() {
    if (this.isPaused) {
      this.resume();
    } else {
      this.pause();
    }
  }

  pause() {
    this.isPaused = true;
    this.pausedTime = Date.now();
    const pauseBtn = document.getElementById('pauseBtn');
    if (pauseBtn) pauseBtn.textContent = 'Resume';
  }

  resume() {
    if (!this.isPaused) return;
    this.isPaused = false;
    this.pausedTime = Date.now() - this.pausedTime;
    const pauseBtn = document.getElementById('pauseBtn');
    if (pauseBtn) pauseBtn.textContent = 'Pause';
  }

  win() {
    clearInterval(this.timerInterval);
    const modal = document.getElementById('winModal');
    document.getElementById('finalScore').textContent = Math.floor(this.score);
    modal.style.display = 'flex';
  }

  getScore() {
    return Math.floor(this.score);
  }

  destroy() {
    if (this.timerInterval) clearInterval(this.timerInterval);

    // Clearing innerHTML removes all DOM-attached listeners
    this.container.innerHTML = '';

    // Clear state
    this.grid = [];
    this.words = [];
    this.foundWords.clear();
    this.selectedCells = [];
  }
}

window.WordSearch = WordSearch;
