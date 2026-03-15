class MathQuiz {
  constructor(container) {
    this.container = container;
    this.score = 0;
    this.questionIndex = 0;
    this.totalQuestions = 10;
    this.difficulty = 'easy';
    this.streak = 0;
    this.bestStreak = 0;
    this.correctCount = 0;
    this.timePerQuestion = 15;
    this.timeLeft = this.timePerQuestion;
    this.timerInterval = null;
    this.paused = false;
    this.playing = false;
    this.currentCorrectAnswer = null;
    this._boundListeners = [];

    this._render();
  }

  /* ------------------------------------------------------------------ */
  /*  Public API                                                         */
  /* ------------------------------------------------------------------ */

  start() {
    this.score = 0;
    this.questionIndex = 0;
    this.streak = 0;
    this.bestStreak = 0;
    this.correctCount = 0;
    this.paused = false;
    this.playing = true;
    this._showGame();
    this._nextQuestion();
  }

  pause() {
    if (!this.playing || this.paused) return;
    this.paused = true;
    this._stopTimer();
    this._showPausedOverlay(true);
  }

  resume() {
    if (!this.playing || !this.paused) return;
    this.paused = false;
    this._showPausedOverlay(false);
    this._startTimer();
  }

  destroy() {
    this._stopTimer();
    this._removeAllListeners();
    if (this.container) this.container.innerHTML = '';
    this.playing = false;
  }

  getScore() {
    return this.score;
  }

  /* ------------------------------------------------------------------ */
  /*  Rendering                                                          */
  /* ------------------------------------------------------------------ */

  _render() {
    this.container.innerHTML = '';

    this.root = this._el('div', 'math-quiz-container');
    this.container.appendChild(this.root);

    this._showStartScreen();
  }

  _showStartScreen() {
    this.root.innerHTML = '';
    const screen = this._el('div', 'math-quiz-start-screen');

    screen.innerHTML = `
      <h1 class="math-quiz-title">Math Quiz</h1>
      <p class="math-quiz-subtitle">Test your mental math skills!</p>
      <span class="math-quiz-difficulty-label">Choose Difficulty</span>
      <div class="math-quiz-difficulty-options">
        <button class="math-quiz-diff-btn math-quiz-selected" data-diff="easy">Easy</button>
        <button class="math-quiz-diff-btn" data-diff="medium">Medium</button>
        <button class="math-quiz-diff-btn" data-diff="hard">Hard</button>
      </div>
      <button class="math-quiz-start-btn">Start Quiz</button>
    `;

    this.root.appendChild(screen);

    const diffBtns = screen.querySelectorAll('.math-quiz-diff-btn');
    diffBtns.forEach(btn => {
      this._addListener(btn, 'click', () => {
        diffBtns.forEach(b => b.classList.remove('math-quiz-selected'));
        btn.classList.add('math-quiz-selected');
        this.difficulty = btn.dataset.diff;
      });
    });

    const startBtn = screen.querySelector('.math-quiz-start-btn');
    this._addListener(startBtn, 'click', () => this.start());
  }

  _showGame() {
    this.root.innerHTML = '';
    this.root.style.position = 'relative';

    // HUD
    const hud = this._el('div', 'math-quiz-hud');
    hud.innerHTML = `
      <div class="math-quiz-hud-item">
        <span class="math-quiz-hud-label">Score</span>
        <span class="math-quiz-hud-value math-quiz-score-display">0</span>
      </div>
      <div class="math-quiz-hud-item">
        <span class="math-quiz-hud-label">Question</span>
        <span class="math-quiz-hud-value math-quiz-qnum-display">1 / ${this.totalQuestions}</span>
      </div>
      <div class="math-quiz-hud-item">
        <span class="math-quiz-hud-label">Streak</span>
        <span class="math-quiz-hud-value math-quiz-streak-value math-quiz-streak-display">0</span>
      </div>
    `;
    this.root.appendChild(hud);

    // Timer bar
    const timerTrack = this._el('div', 'math-quiz-timer-track');
    timerTrack.innerHTML = '<div class="math-quiz-timer-bar" style="width:100%"></div>';
    this.root.appendChild(timerTrack);

    // Card
    const card = this._el('div', 'math-quiz-card');
    card.innerHTML = `
      <p class="math-quiz-question-number">Question 1</p>
      <p class="math-quiz-question-text"></p>
      <div class="math-quiz-answers"></div>
    `;
    this.root.appendChild(card);

    // Feedback
    const fb = this._el('div', 'math-quiz-feedback');
    this.root.appendChild(fb);

    // Cache refs
    this._scoreEl = this.root.querySelector('.math-quiz-score-display');
    this._qnumEl = this.root.querySelector('.math-quiz-qnum-display');
    this._streakEl = this.root.querySelector('.math-quiz-streak-display');
    this._timerBar = this.root.querySelector('.math-quiz-timer-bar');
    this._qNumLabel = this.root.querySelector('.math-quiz-question-number');
    this._qText = this.root.querySelector('.math-quiz-question-text');
    this._answersEl = this.root.querySelector('.math-quiz-answers');
    this._feedbackEl = fb;
  }

  /* ------------------------------------------------------------------ */
  /*  Question generation                                                */
  /* ------------------------------------------------------------------ */

  _generateQuestion() {
    let a, b, op, answer;
    const diff = this.difficulty;

    if (diff === 'easy') {
      op = Math.random() < 0.5 ? '+' : '−';
      a = this._rand(1, 50);
      b = this._rand(1, 50);
      if (op === '−' && b > a) [a, b] = [b, a];
      answer = op === '+' ? a + b : a - b;
    } else if (diff === 'medium') {
      const ops = ['+', '−', '×'];
      op = ops[this._rand(0, ops.length - 1)];
      if (op === '×') {
        a = this._rand(2, 12);
        b = this._rand(2, 12);
        answer = a * b;
      } else {
        a = this._rand(1, 100);
        b = this._rand(1, 100);
        if (op === '−' && b > a) [a, b] = [b, a];
        answer = op === '+' ? a + b : a - b;
      }
    } else {
      const ops = ['+', '−', '×', '÷'];
      op = ops[this._rand(0, ops.length - 1)];
      if (op === '×') {
        a = this._rand(2, 15);
        b = this._rand(2, 15);
        answer = a * b;
      } else if (op === '÷') {
        b = this._rand(2, 12);
        answer = this._rand(2, 15);
        a = b * answer;
      } else {
        a = this._rand(10, 200);
        b = this._rand(10, 200);
        if (op === '−' && b > a) [a, b] = [b, a];
        answer = op === '+' ? a + b : a - b;
      }
    }

    const questionText = `${a} ${op} ${b} = ?`;
    const choices = this._generateChoices(answer);
    return { questionText, answer, choices };
  }

  _generateChoices(correct) {
    const set = new Set([correct]);
    while (set.size < 4) {
      let offset = this._rand(1, Math.max(10, Math.abs(correct)));
      if (Math.random() < 0.5) offset = -offset;
      const wrong = correct + offset;
      if (wrong !== correct) set.add(wrong);
    }
    return this._shuffle([...set]);
  }

  /* ------------------------------------------------------------------ */
  /*  Game loop                                                          */
  /* ------------------------------------------------------------------ */

  _nextQuestion() {
    if (this.questionIndex >= this.totalQuestions) {
      this._endGame();
      return;
    }

    const q = this._generateQuestion();
    this.currentCorrectAnswer = q.answer;
    this.questionIndex++;

    this._qNumLabel.textContent = `Question ${this.questionIndex}`;
    this._qnumEl.textContent = `${this.questionIndex} / ${this.totalQuestions}`;
    this._qText.textContent = q.questionText;
    this._feedbackEl.textContent = '';
    this._feedbackEl.className = 'math-quiz-feedback';

    // Render answer buttons
    this._answersEl.innerHTML = '';
    q.choices.forEach(val => {
      const btn = document.createElement('button');
      btn.className = 'math-quiz-answer-btn';
      btn.textContent = val;
      this._addListener(btn, 'click', () => this._handleAnswer(val, btn));
      this._answersEl.appendChild(btn);
    });

    // Reset & start timer
    this.timeLeft = this.timePerQuestion;
    this._updateTimerBar();
    this._startTimer();
  }

  _handleAnswer(value, btn) {
    this._stopTimer();
    const buttons = this._answersEl.querySelectorAll('.math-quiz-answer-btn');
    buttons.forEach(b => (b.disabled = true));

    if (value === this.currentCorrectAnswer) {
      btn.classList.add('math-quiz-correct');
      this.streak++;
      if (this.streak > this.bestStreak) this.bestStreak = this.streak;
      this.correctCount++;

      // Score: 10 base + up to 5 speed bonus + streak bonus
      const speedBonus = Math.round((this.timeLeft / this.timePerQuestion) * 5);
      const streakBonus = Math.min(this.streak - 1, 5);
      this.score += 10 + speedBonus + streakBonus;

      this._feedbackEl.textContent = speedBonus >= 3 ? '⚡ Fast! Correct!' : '✓ Correct!';
      this._feedbackEl.className = 'math-quiz-feedback math-quiz-fb-correct';
    } else {
      btn.classList.add('math-quiz-wrong');
      // Highlight correct answer
      buttons.forEach(b => {
        if (Number(b.textContent) === this.currentCorrectAnswer) {
          b.classList.add('math-quiz-correct');
        }
      });
      this.streak = 0;
      this._feedbackEl.textContent = `✗ Answer: ${this.currentCorrectAnswer}`;
      this._feedbackEl.className = 'math-quiz-feedback math-quiz-fb-wrong';
    }

    this._scoreEl.textContent = this.score;
    this._streakEl.textContent = this.streak;

    setTimeout(() => {
      if (this.playing && !this.paused) this._nextQuestion();
    }, 1200);
  }

  _onTimeout() {
    this._stopTimer();
    const buttons = this._answersEl.querySelectorAll('.math-quiz-answer-btn');
    buttons.forEach(b => {
      b.disabled = true;
      if (Number(b.textContent) === this.currentCorrectAnswer) {
        b.classList.add('math-quiz-correct');
      }
    });
    this.streak = 0;
    this._streakEl.textContent = this.streak;
    this._feedbackEl.textContent = `⏰ Time's up! Answer: ${this.currentCorrectAnswer}`;
    this._feedbackEl.className = 'math-quiz-feedback math-quiz-fb-timeout';

    setTimeout(() => {
      if (this.playing && !this.paused) this._nextQuestion();
    }, 1500);
  }

  _endGame() {
    this.playing = false;
    this._stopTimer();
    this.root.innerHTML = '';
    this.root.style.position = '';

    const screen = this._el('div', 'math-quiz-gameover-screen');
    screen.innerHTML = `
      <h1 class="math-quiz-title">Quiz Complete!</h1>
      <div class="math-quiz-final-score">${this.score}</div>
      <p class="math-quiz-final-detail">Correct: <span>${this.correctCount} / ${this.totalQuestions}</span></p>
      <p class="math-quiz-final-detail">Best Streak: <span>${this.bestStreak}</span></p>
      <p class="math-quiz-final-detail">Difficulty: <span>${this.difficulty.charAt(0).toUpperCase() + this.difficulty.slice(1)}</span></p>
      <br>
      <button class="math-quiz-restart-btn">Play Again</button>
    `;
    this.root.appendChild(screen);

    const btn = screen.querySelector('.math-quiz-restart-btn');
    this._addListener(btn, 'click', () => this._showStartScreen());
  }

  /* ------------------------------------------------------------------ */
  /*  Timer                                                              */
  /* ------------------------------------------------------------------ */

  _startTimer() {
    this._stopTimer();
    this.timerInterval = setInterval(() => {
      if (this.paused) return;
      this.timeLeft -= 0.25;
      if (this.timeLeft <= 0) {
        this.timeLeft = 0;
        this._updateTimerBar();
        this._onTimeout();
      } else {
        this._updateTimerBar();
      }
    }, 250);
  }

  _stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  _updateTimerBar() {
    const pct = (this.timeLeft / this.timePerQuestion) * 100;
    this._timerBar.style.width = pct + '%';
    this._timerBar.classList.remove('math-quiz-warning', 'math-quiz-danger');
    if (pct <= 25) {
      this._timerBar.classList.add('math-quiz-danger');
    } else if (pct <= 50) {
      this._timerBar.classList.add('math-quiz-warning');
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Paused overlay                                                     */
  /* ------------------------------------------------------------------ */

  _showPausedOverlay(show) {
    const existing = this.root.querySelector('.math-quiz-paused-overlay');
    if (existing) existing.remove();

    if (show) {
      const overlay = this._el('div', 'math-quiz-paused-overlay');
      overlay.innerHTML = '<span class="math-quiz-paused-text">Paused</span>';
      this.root.appendChild(overlay);
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Helpers                                                            */
  /* ------------------------------------------------------------------ */

  _el(tag, className) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    return el;
  }

  _rand(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  _shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  /* Listener tracking for clean destroy() */
  _addListener(el, event, handler) {
    el.addEventListener(event, handler);
    this._boundListeners.push({ el, event, handler });
  }

  _removeAllListeners() {
    this._boundListeners.forEach(({ el, event, handler }) => {
      el.removeEventListener(event, handler);
    });
    this._boundListeners = [];
  }
}

window.MathQuiz = MathQuiz;
