class NumberGuessing {
  constructor(container) {
    this._container = container;
    this._root = null;
    this._listeners = [];
    this._paused = false;
    this._gameOver = false;
    this._score = 0;
    this._target = 0;
    this._guesses = [];
    this._lo = 1;
    this._hi = 100;
    this._maxGuesses = Infinity;
    this._difficulty = 'medium';

    this._difficulties = {
      easy:   { lo: 1, hi: 50,   max: Infinity, label: 'Easy' },
      medium: { lo: 1, hi: 100,  max: 10,       label: 'Medium' },
      hard:   { lo: 1, hi: 1000, max: 15,       label: 'Hard' },
    };

    this._build();
    this.start();
  }

  /* ── Public API ── */

  start() {
    const cfg = this._difficulties[this._difficulty];
    this._lo = cfg.lo;
    this._hi = cfg.hi;
    this._maxGuesses = cfg.max;
    this._rangeLo = cfg.lo;
    this._rangeHi = cfg.hi;
    this._target = this._rand(cfg.lo, cfg.hi);
    this._guesses = [];
    this._score = 0;
    this._paused = false;
    this._gameOver = false;

    this._inputEl.value = '';
    this._inputEl.disabled = false;
    this._submitBtn.disabled = false;
    this._historyList.innerHTML = '';
    this._restartBtn.style.display = 'none';
    this._setFeedback('Pick a number between ' + cfg.lo + ' and ' + cfg.hi, '');
    this._updateInfo();
    this._updateThermometer();
    this._inputEl.focus();
  }

  pause() {
    if (this._gameOver) return;
    this._paused = true;
    this._inputEl.disabled = true;
    this._submitBtn.disabled = true;
    this._setFeedback('⏸ Game Paused', 'paused');
  }

  resume() {
    if (this._gameOver) return;
    this._paused = false;
    this._inputEl.disabled = false;
    this._submitBtn.disabled = false;
    const last = this._guesses[this._guesses.length - 1];
    if (last) {
      this._showGuessResult(last.value, last.direction);
    } else {
      const cfg = this._difficulties[this._difficulty];
      this._setFeedback('Pick a number between ' + cfg.lo + ' and ' + cfg.hi, '');
    }
    this._inputEl.focus();
  }

  destroy() {
    this._listeners.forEach(([el, evt, fn]) => el.removeEventListener(evt, fn));
    this._listeners = [];
    if (this._root && this._root.parentNode) {
      this._root.parentNode.removeChild(this._root);
    }
    this._root = null;
  }

  getScore() {
    return this._score;
  }

  /* ── DOM construction ── */

  _build() {
    const root = document.createElement('div');
    root.className = 'number-guessing-container';
    this._root = root;

    // Title
    const title = document.createElement('h2');
    title.className = 'number-guessing-title';
    title.textContent = '🔢 Number Guessing';
    root.appendChild(title);

    // Difficulty buttons
    const diffRow = document.createElement('div');
    diffRow.className = 'number-guessing-difficulty';
    this._diffBtns = {};
    for (const key of Object.keys(this._difficulties)) {
      const btn = document.createElement('button');
      btn.className = 'number-guessing-diff-btn' + (key === this._difficulty ? ' active' : '');
      btn.textContent = this._difficulties[key].label;
      btn.dataset.diff = key;
      const handler = () => this._selectDifficulty(key);
      this._on(btn, 'click', handler);
      diffRow.appendChild(btn);
      this._diffBtns[key] = btn;
    }
    root.appendChild(diffRow);

    // Info bar
    const info = document.createElement('div');
    info.className = 'number-guessing-info';
    this._guessCountEl = document.createElement('span');
    this._remainEl = document.createElement('span');
    info.appendChild(this._guessCountEl);
    info.appendChild(this._remainEl);
    root.appendChild(info);

    // Thermometer
    const thermo = document.createElement('div');
    thermo.className = 'number-guessing-thermometer';
    this._thermoFill = document.createElement('div');
    this._thermoFill.className = 'number-guessing-thermo-fill';
    this._thermoMarker = document.createElement('div');
    this._thermoMarker.className = 'number-guessing-thermo-marker';
    this._thermoMarker.style.display = 'none';
    const labels = document.createElement('div');
    labels.className = 'number-guessing-thermo-labels';
    this._thermoLabelLo = document.createElement('span');
    this._thermoLabelHi = document.createElement('span');
    labels.appendChild(this._thermoLabelLo);
    labels.appendChild(this._thermoLabelHi);
    thermo.appendChild(this._thermoFill);
    thermo.appendChild(this._thermoMarker);
    thermo.appendChild(labels);
    root.appendChild(thermo);

    // Feedback
    this._feedbackEl = document.createElement('div');
    this._feedbackEl.className = 'number-guessing-feedback';
    root.appendChild(this._feedbackEl);

    // Input row
    const inputRow = document.createElement('div');
    inputRow.className = 'number-guessing-input-row';
    this._inputEl = document.createElement('input');
    this._inputEl.className = 'number-guessing-input';
    this._inputEl.type = 'number';
    this._inputEl.placeholder = 'Enter your guess…';
    this._submitBtn = document.createElement('button');
    this._submitBtn.className = 'number-guessing-submit-btn';
    this._submitBtn.textContent = 'Guess';
    inputRow.appendChild(this._inputEl);
    inputRow.appendChild(this._submitBtn);
    root.appendChild(inputRow);

    this._on(this._submitBtn, 'click', () => this._handleGuess());
    this._on(this._inputEl, 'keydown', (e) => {
      if (e.key === 'Enter') this._handleGuess();
    });

    // History
    const histTitle = document.createElement('div');
    histTitle.className = 'number-guessing-history-title';
    histTitle.textContent = 'Guess History';
    root.appendChild(histTitle);
    this._historyList = document.createElement('ul');
    this._historyList.className = 'number-guessing-history';
    root.appendChild(this._historyList);

    // Restart button
    this._restartBtn = document.createElement('button');
    this._restartBtn.className = 'number-guessing-restart-btn';
    this._restartBtn.textContent = '🔄 Play Again';
    this._restartBtn.style.display = 'none';
    this._on(this._restartBtn, 'click', () => this.start());
    root.appendChild(this._restartBtn);

    this._container.appendChild(root);
  }

  /* ── Core game logic ── */

  _handleGuess() {
    if (this._paused || this._gameOver) return;

    const raw = this._inputEl.value.trim();
    if (raw === '') return;
    const num = parseInt(raw, 10);
    const cfg = this._difficulties[this._difficulty];

    if (isNaN(num) || num < cfg.lo || num > cfg.hi) {
      this._setFeedback('Enter a number between ' + cfg.lo + ' and ' + cfg.hi, '');
      this._animate(this._inputEl, 'number-guessing-shake');
      this._inputEl.value = '';
      this._inputEl.focus();
      return;
    }

    this._inputEl.value = '';

    let direction;
    if (num === this._target) {
      direction = 'correct';
    } else if (num > this._target) {
      direction = 'high';
      if (num < this._rangeHi) this._rangeHi = num - 1;
    } else {
      direction = 'low';
      if (num > this._rangeLo) this._rangeLo = num + 1;
    }

    this._guesses.push({ value: num, direction });
    this._addHistoryItem(this._guesses.length, num, direction);
    this._showGuessResult(num, direction);
    this._updateInfo();
    this._updateThermometer(num);

    if (direction === 'correct') {
      this._win();
    } else {
      this._animate(this._inputEl, 'number-guessing-shake');
      if (this._maxGuesses !== Infinity && this._guesses.length >= this._maxGuesses) {
        this._lose();
      } else {
        this._inputEl.focus();
      }
    }
  }

  _win() {
    const guessCount = this._guesses.length;
    const cfg = this._difficulties[this._difficulty];
    const range = cfg.hi - cfg.lo + 1;
    const optimal = Math.ceil(Math.log2(range));
    this._score = Math.max(0, Math.round((optimal / guessCount) * 1000));

    this._setFeedback('🎉 Correct! Score: ' + this._score, 'correct');
    this._animate(this._feedbackEl, 'number-guessing-bounce');
    this._endGame();
  }

  _lose() {
    this._score = 0;
    this._setFeedback('😞 Out of guesses! It was ' + this._target, '');
    this._endGame();
  }

  _endGame() {
    this._gameOver = true;
    this._inputEl.disabled = true;
    this._submitBtn.disabled = true;
    this._restartBtn.style.display = 'block';
  }

  /* ── UI helpers ── */

  _selectDifficulty(key) {
    this._difficulty = key;
    for (const k of Object.keys(this._diffBtns)) {
      this._diffBtns[k].classList.toggle('active', k === key);
    }
    this.start();
  }

  _setFeedback(text, cls) {
    this._feedbackEl.textContent = text;
    this._feedbackEl.className = 'number-guessing-feedback' + (cls ? ' ' + cls : '');
  }

  _showGuessResult(num, direction) {
    if (direction === 'correct') {
      return; // handled by _win
    }
    const arrow = direction === 'high' ? '📈 Too High!' : '📉 Too Low!';
    this._setFeedback(arrow, direction === 'high' ? 'too-high' : 'too-low');
  }

  _updateInfo() {
    const count = this._guesses.length;
    this._guessCountEl.textContent = 'Guesses: ' + count;
    if (this._maxGuesses === Infinity) {
      this._remainEl.textContent = 'Unlimited';
    } else {
      this._remainEl.textContent = 'Remaining: ' + (this._maxGuesses - count);
    }
  }

  _updateThermometer(lastGuess) {
    const cfg = this._difficulties[this._difficulty];
    const totalRange = cfg.hi - cfg.lo;
    if (totalRange === 0) return;

    const leftPct = ((this._rangeLo - cfg.lo) / totalRange) * 100;
    const widthPct = ((this._rangeHi - this._rangeLo) / totalRange) * 100;
    this._thermoFill.style.left = leftPct + '%';
    this._thermoFill.style.width = Math.max(widthPct, 0.5) + '%';

    this._thermoLabelLo.textContent = this._rangeLo;
    this._thermoLabelHi.textContent = this._rangeHi;

    if (lastGuess !== undefined) {
      const markerPct = ((lastGuess - cfg.lo) / totalRange) * 100;
      this._thermoMarker.style.left = 'calc(' + markerPct + '% - 1px)';
      this._thermoMarker.style.display = 'block';
    }
  }

  _addHistoryItem(index, value, direction) {
    const li = document.createElement('li');
    li.className = 'number-guessing-history-item';

    const numSpan = document.createElement('span');
    numSpan.className = 'guess-num';
    numSpan.textContent = '#' + index;

    const valSpan = document.createElement('span');
    valSpan.className = 'guess-val';
    valSpan.textContent = value;

    const dirSpan = document.createElement('span');
    dirSpan.className = 'guess-dir ' + direction;
    if (direction === 'high') dirSpan.textContent = '↑ High';
    else if (direction === 'low') dirSpan.textContent = '↓ Low';
    else dirSpan.textContent = '✓ Correct';

    li.appendChild(numSpan);
    li.appendChild(valSpan);
    li.appendChild(dirSpan);

    this._historyList.prepend(li);
  }

  _animate(el, cls) {
    el.classList.remove(cls);
    void el.offsetWidth; // reflow to restart animation
    el.classList.add(cls);
  }

  /* ── Utilities ── */

  _rand(lo, hi) {
    return Math.floor(Math.random() * (hi - lo + 1)) + lo;
  }

  _on(el, evt, fn) {
    el.addEventListener(evt, fn);
    this._listeners.push([el, evt, fn]);
  }
}

window.NumberGuessing = NumberGuessing;
