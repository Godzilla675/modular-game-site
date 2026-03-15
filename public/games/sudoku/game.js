class Sudoku {
  constructor(container) {
    this.container = container;
    this.difficulty = 'easy'; // easy, medium, hard
    this.grid = Array(81).fill(0);
    this.solution = Array(81).fill(0);
    this.initialGrid = Array(81).fill(0); // Store original clues
    this.selectedCell = null;
    this.pencilMode = false;
    this.timerInterval = null;
    this.isPaused = false;
    this.startTime = null;
    this.pausedTime = 0;
    this.notes = Array(81).fill(null).map(() => new Set());
    this.score = 0;

    // Difficulty config: [min_clues, max_clues, multiplier]
    this.difficultyConfig = {
      easy: { min: 35, max: 40, multiplier: 1 },
      medium: { min: 28, max: 34, multiplier: 2 },
      hard: { min: 22, max: 27, multiplier: 3 }
    };

    this.init();
  }

  init() {
    this.render();
    this.attachEventListeners();
  }

  render() {
    this.container.innerHTML = '';
    this.container.className = 'sudoku-container';

    // Header with difficulty selector
    const header = document.createElement('div');
    header.className = 'sudoku-header';

    const difficultyLabel = document.createElement('label');
    difficultyLabel.className = 'sudoku-label';
    difficultyLabel.textContent = 'Difficulty:';

    const difficultySelect = document.createElement('select');
    difficultySelect.className = 'sudoku-select';
    difficultySelect.id = 'sudoku-difficulty';
    const difficulties = [
      { value: 'easy', text: 'Easy' },
      { value: 'medium', text: 'Medium' },
      { value: 'hard', text: 'Hard' }
    ];
    difficulties.forEach(d => {
      const option = document.createElement('option');
      option.value = d.value;
      option.textContent = d.text;
      option.selected = d.value === this.difficulty;
      difficultySelect.appendChild(option);
    });

    const newGameBtn = document.createElement('button');
    newGameBtn.className = 'sudoku-btn sudoku-btn-new';
    newGameBtn.textContent = 'New Game';
    newGameBtn.id = 'sudoku-new-game';

    header.appendChild(difficultyLabel);
    header.appendChild(difficultySelect);
    header.appendChild(newGameBtn);

    // Timer
    const timerDiv = document.createElement('div');
    timerDiv.className = 'sudoku-timer';
    timerDiv.id = 'sudoku-timer';
    timerDiv.textContent = 'Time: 00:00';

    // Score
    const scoreDiv = document.createElement('div');
    scoreDiv.className = 'sudoku-score';
    scoreDiv.id = 'sudoku-score';
    scoreDiv.textContent = 'Score: 0';

    // Game info
    const infoDiv = document.createElement('div');
    infoDiv.className = 'sudoku-info';
    infoDiv.appendChild(timerDiv);
    infoDiv.appendChild(scoreDiv);

    // Grid
    const gridDiv = document.createElement('div');
    gridDiv.className = 'sudoku-grid';
    gridDiv.id = 'sudoku-grid';

    for (let i = 0; i < 81; i++) {
      const cell = document.createElement('div');
      cell.className = 'sudoku-cell';
      cell.dataset.index = i;
      cell.id = `sudoku-cell-${i}`;

      const valueSpan = document.createElement('span');
      valueSpan.className = 'sudoku-cell-value';

      const notesDiv = document.createElement('div');
      notesDiv.className = 'sudoku-cell-notes';

      cell.appendChild(valueSpan);
      cell.appendChild(notesDiv);

      gridDiv.appendChild(cell);
    }

    // Control buttons
    const controlsDiv = document.createElement('div');
    controlsDiv.className = 'sudoku-controls';

    const pencilBtn = document.createElement('button');
    pencilBtn.className = 'sudoku-btn sudoku-btn-pencil';
    pencilBtn.textContent = '✏️ Pencil';
    pencilBtn.id = 'sudoku-pencil';

    const clearBtn = document.createElement('button');
    clearBtn.className = 'sudoku-btn sudoku-btn-clear';
    clearBtn.textContent = '🗑️ Clear';
    clearBtn.id = 'sudoku-clear';

    const pauseBtn = document.createElement('button');
    pauseBtn.className = 'sudoku-btn sudoku-btn-pause';
    pauseBtn.textContent = '⏸️ Pause';
    pauseBtn.id = 'sudoku-pause';

    controlsDiv.appendChild(pencilBtn);
    controlsDiv.appendChild(clearBtn);
    controlsDiv.appendChild(pauseBtn);

    // Number pad
    const padDiv = document.createElement('div');
    padDiv.className = 'sudoku-pad';

    for (let i = 1; i <= 9; i++) {
      const numBtn = document.createElement('button');
      numBtn.className = 'sudoku-num-btn';
      numBtn.textContent = i;
      numBtn.dataset.number = i;
      padDiv.appendChild(numBtn);
    }

    // Delete button
    const delBtn = document.createElement('button');
    delBtn.className = 'sudoku-num-btn sudoku-del-btn';
    delBtn.textContent = '✕';
    delBtn.id = 'sudoku-delete';
    padDiv.appendChild(delBtn);

    // Assemble
    this.container.appendChild(header);
    this.container.appendChild(infoDiv);
    this.container.appendChild(gridDiv);
    this.container.appendChild(controlsDiv);
    this.container.appendChild(padDiv);

    this.updateDisplay();
  }

  attachEventListeners() {
    // Grid cells
    this.container.addEventListener('click', (e) => {
      const cell = e.target.closest('.sudoku-cell');
      if (cell) {
        const index = parseInt(cell.dataset.index);
        this.selectCell(index);
      }
    });

    // Number pad
    this.container.addEventListener('click', (e) => {
      if (e.target.classList.contains('sudoku-num-btn')) {
        const num = e.target.dataset.number;
        if (num) {
          this.fillCell(parseInt(num));
        }
      }
    });

    // Delete button
    const delBtn = this.container.querySelector('#sudoku-delete');
    if (delBtn) {
      delBtn.addEventListener('click', () => this.fillCell(0));
    }

    // Pencil mode
    const pencilBtn = this.container.querySelector('#sudoku-pencil');
    if (pencilBtn) {
      pencilBtn.addEventListener('click', () => this.togglePencilMode());
    }

    // Clear cell
    const clearBtn = this.container.querySelector('#sudoku-clear');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => this.clearSelectedCell());
    }

    // Pause/Resume
    const pauseBtn = this.container.querySelector('#sudoku-pause');
    if (pauseBtn) {
      pauseBtn.addEventListener('click', () => {
        if (this.isPaused) {
          this.resume();
        } else {
          this.pause();
        }
      });
    }

    // New Game
    const newGameBtn = this.container.querySelector('#sudoku-new-game');
    if (newGameBtn) {
      newGameBtn.addEventListener('click', () => {
        const select = this.container.querySelector('#sudoku-difficulty');
        this.difficulty = select.value;
        this.start();
      });
    }

    // Keyboard support — bound method for proper cleanup
    this._handleKeyDown = (e) => {
      if (this.selectedCell === null || this.isPaused) return;

      const key = e.key;
      if (key >= '1' && key <= '9') {
        e.preventDefault();
        this.fillCell(parseInt(key));
      } else if (key === 'Delete' || key === 'Backspace') {
        e.preventDefault();
        this.fillCell(0);
      }
    };
    document.addEventListener('keydown', this._handleKeyDown);
  }

  start() {
    this.generatePuzzle();
    this.selectedCell = null;
    this.pencilMode = false;
    this.notes = Array(81).fill(null).map(() => new Set());
    this.isPaused = false;
    this.startTime = Date.now();
    this.pausedTime = 0;
    this.score = 0;

    this.clearTimer();
    this.startTimer();
    this.updateDisplay();

    // Update button state
    const pauseBtn = this.container.querySelector('#sudoku-pause');
    if (pauseBtn) {
      pauseBtn.textContent = '⏸️ Pause';
    }
  }

  generatePuzzle() {
    this.solution = Array(81).fill(0);
    this.fillSudoku(this.solution);

    const config = this.difficultyConfig[this.difficulty];
    const clueCount = Math.floor(Math.random() * (config.max - config.min + 1)) + config.min;

    this.grid = [...this.solution];

    // Shuffle cell indices and remove cells to create puzzle
    const indices = Array.from({length: 81}, (_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }

    const toRemove = 81 - clueCount;
    for (let i = 0; i < toRemove && i < indices.length; i++) {
      this.grid[indices[i]] = 0;
    }

    this.initialGrid = [...this.grid];
  }

  fillSudoku(grid) {
    for (let index = 0; index < 81; index++) {
      if (grid[index] === 0) {
        const numbers = this.shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);

        for (const num of numbers) {
          if (this.isValid(grid, index, num)) {
            grid[index] = num;

            if (this.fillSudoku(grid)) {
              return true;
            }

            grid[index] = 0;
          }
        }

        return false;
      }
    }

    return true;
  }

  countSolutions(grid, count = 0) {
    if (count > 2) return count; // Early exit if more than 1 solution found

    for (let i = 0; i < 81; i++) {
      if (grid[i] === 0) {
        for (let num = 1; num <= 9; num++) {
          if (this.isValid(grid, i, num)) {
            grid[i] = num;
            count = this.countSolutions(grid, count);
            grid[i] = 0;

            if (count > 1) return count;
          }
        }
        return count;
      }
    }

    return count + 1;
  }

  isValid(grid, index, num) {
    const row = Math.floor(index / 9);
    const col = index % 9;
    const boxRow = Math.floor(row / 3);
    const boxCol = Math.floor(col / 3);

    // Check row
    for (let c = 0; c < 9; c++) {
      if (grid[row * 9 + c] === num) return false;
    }

    // Check column
    for (let r = 0; r < 9; r++) {
      if (grid[r * 9 + col] === num) return false;
    }

    // Check 3x3 box
    for (let r = boxRow * 3; r < boxRow * 3 + 3; r++) {
      for (let c = boxCol * 3; c < boxCol * 3 + 3; c++) {
        if (grid[r * 9 + c] === num) return false;
      }
    }

    return true;
  }

  selectCell(index) {
    if (this.isPaused || this.initialGrid[index] !== 0) {
      return; // Can't select clue cells or during pause
    }

    this.selectedCell = index;
    this.updateDisplay();
  }

  fillCell(num) {
    if (this.selectedCell === null || this.initialGrid[this.selectedCell] !== 0 || this.isPaused) {
      return;
    }

    const index = this.selectedCell;

    if (num === 0) {
      // Delete
      this.grid[index] = 0;
      this.notes[index].clear();
    } else if (this.pencilMode) {
      // Add/remove note
      if (this.notes[index].has(num)) {
        this.notes[index].delete(num);
      } else {
        this.notes[index].add(num);
      }
    } else {
      // Fill number
      this.grid[index] = num;
      this.notes[index].clear();
    }

    this.updateDisplay();
    this.calculateScore();
  }

  clearSelectedCell() {
    if (this.selectedCell !== null && this.initialGrid[this.selectedCell] === 0) {
      this.grid[this.selectedCell] = 0;
      this.notes[this.selectedCell].clear();
      this.updateDisplay();
    }
  }

  togglePencilMode() {
    this.pencilMode = !this.pencilMode;
    const btn = this.container.querySelector('#sudoku-pencil');
    if (btn) {
      btn.classList.toggle('sudoku-btn-active', this.pencilMode);
    }
  }

  updateDisplay() {
    // Update grid display
    const cells = this.container.querySelectorAll('.sudoku-cell');
    cells.forEach((cell, index) => {
      const valueSpan = cell.querySelector('.sudoku-cell-value');
      const notesDiv = cell.querySelector('.sudoku-cell-notes');
      const row = Math.floor(index / 9);
      const col = index % 9;

      // Clear classes
      cell.classList.remove('sudoku-cell-selected', 'sudoku-cell-highlight', 'sudoku-cell-error', 'sudoku-cell-clue', 'sudoku-cell-filled');

      // Mark clue cells
      if (this.initialGrid[index] !== 0) {
        cell.classList.add('sudoku-cell-clue');
        valueSpan.textContent = this.initialGrid[index];
      } else {
        valueSpan.textContent = this.grid[index] || '';
        if (this.grid[index] !== 0) {
          cell.classList.add('sudoku-cell-filled');
        }
      }

      // Highlighting
      if (this.selectedCell === index) {
        cell.classList.add('sudoku-cell-selected');
      } else if (this.selectedCell !== null) {
        const selectedRow = Math.floor(this.selectedCell / 9);
        const selectedCol = this.selectedCell % 9;
        const selectedBoxRow = Math.floor(selectedRow / 3);
        const selectedBoxCol = Math.floor(selectedCol / 3);
        const boxRow = Math.floor(row / 3);
        const boxCol = Math.floor(col / 3);

        // Highlight same row, column, or box
        if (
          row === selectedRow ||
          col === selectedCol ||
          (boxRow === selectedBoxRow && boxCol === selectedBoxCol)
        ) {
          cell.classList.add('sudoku-cell-highlight');
        }

        // Highlight same number
        const selectedValue = this.grid[this.selectedCell];
        if (
          selectedValue !== 0 &&
          this.grid[index] === selectedValue
        ) {
          cell.classList.add('sudoku-cell-highlight');
        }
      }

      // Error highlighting — temporarily clear cell so isValid doesn't match itself
      if (this.grid[index] !== 0 && this.initialGrid[index] === 0) {
        const val = this.grid[index];
        this.grid[index] = 0;
        if (!this.isValid(this.grid, index, val)) {
          cell.classList.add('sudoku-cell-error');
        }
        this.grid[index] = val;
      }

      // Notes display
      notesDiv.innerHTML = '';
      if (this.notes[index].size > 0) {
        for (let i = 1; i <= 9; i++) {
          const noteSpan = document.createElement('span');
          noteSpan.className = 'sudoku-note';
          noteSpan.textContent = this.notes[index].has(i) ? i : '';
          notesDiv.appendChild(noteSpan);
        }
      }
    });
  }

  startTimer() {
    this.timerInterval = setInterval(() => {
      if (!this.isPaused) {
        this.updateTimer();
      }
    }, 1000);
  }

  updateTimer() {
    const elapsed = Math.floor((Date.now() - this.startTime + this.pausedTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    const timerDiv = this.container.querySelector('#sudoku-timer');
    if (timerDiv) {
      timerDiv.textContent = `Time: ${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
  }

  calculateScore() {
    const elapsed = Math.floor((Date.now() - this.startTime + this.pausedTime) / 1000);
    if (elapsed === 0) return;
    const multiplier = this.difficultyConfig[this.difficulty].multiplier;
    this.score = Math.max(0, Math.floor((multiplier * 10000) / elapsed));
    
    const scoreDiv = this.container.querySelector('#sudoku-score');
    if (scoreDiv) {
      scoreDiv.textContent = `Score: ${this.score}`;
    }
  }

  clearTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  pause() {
    if (this.isPaused) return;
    this.isPaused = true;
    this.pausedTime += Date.now() - this.startTime;
    
    const pauseBtn = this.container.querySelector('#sudoku-pause');
    if (pauseBtn) {
      pauseBtn.textContent = '▶️ Resume';
    }

    // Blur grid
    const gridDiv = this.container.querySelector('.sudoku-grid');
    if (gridDiv) {
      gridDiv.classList.add('sudoku-paused');
    }
  }

  resume() {
    if (!this.isPaused) return;
    this.isPaused = false;
    this.startTime = Date.now();
    
    const pauseBtn = this.container.querySelector('#sudoku-pause');
    if (pauseBtn) {
      pauseBtn.textContent = '⏸️ Pause';
    }

    // Remove blur
    const gridDiv = this.container.querySelector('.sudoku-grid');
    if (gridDiv) {
      gridDiv.classList.remove('sudoku-paused');
    }
  }

  getScore() {
    return this.score;
  }

  destroy() {
    this.clearTimer();
    if (this._handleKeyDown) {
      document.removeEventListener('keydown', this._handleKeyDown);
      this._handleKeyDown = null;
    }
    this.container.innerHTML = '';
    this.container.className = '';
  }

  shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
}

window.Sudoku = Sudoku;
