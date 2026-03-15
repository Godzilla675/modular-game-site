/**
 * Color Match – Stroop-effect game
 * Fully self-contained, no external dependencies.
 * Exposed as window.ColorMatch.
 */
class ColorMatch {
  /* ── Colour palette ── */
  static COLORS = [
    { name: 'RED',    hex: '#ff1744' },
    { name: 'BLUE',   hex: '#2979ff' },
    { name: 'GREEN',  hex: '#00e676' },
    { name: 'YELLOW', hex: '#ffea00' },
    { name: 'PURPLE', hex: '#d500f9' },
    { name: 'ORANGE', hex: '#ff9100' },
    { name: 'PINK',   hex: '#f50057' },
    { name: 'CYAN',   hex: '#00e5ff' },
  ];

  static GAME_DURATION = 60; // seconds
  static TICK_MS       = 100;

  /* ── Constructor ── */
  constructor(container) {
    this.container = container;
    this.root = null;

    // Game state
    this.score        = 0;
    this.timeLeft     = ColorMatch.GAME_DURATION;
    this.running      = false;
    this.paused       = false;
    this.level        = 1;
    this.streak       = 0;
    this.bestStreak   = 0;
    this.totalCorrect = 0;
    this.totalWrong   = 0;
    this.roundStart   = 0;
    this.roundMode    = 'yesno'; // 'yesno' | 'pick'
    this.currentWord  = null;
    this.currentColor = null;
    this.answer       = null;

    // Timers & bound listeners
    this._tickTimer     = null;
    this._feedbackTimer = null;
    this._boundKeyDown  = null;

    this._buildDOM();
    this._showStartScreen();
  }

  /* ════════════════════════════════════════════
     Public API
     ════════════════════════════════════════════ */

  start() {
    this.score        = 0;
    this.timeLeft     = ColorMatch.GAME_DURATION;
    this.running      = true;
    this.paused       = false;
    this.level        = 1;
    this.streak       = 0;
    this.bestStreak   = 0;
    this.totalCorrect = 0;
    this.totalWrong   = 0;

    this._showGameUI();
    this._updateHeader();
    this._nextRound();
    this._startTimer();
    this._attachKeyboard();
  }

  pause() {
    if (!this.running || this.paused) return;
    this.paused = true;
    this._stopTick();
    this._setButtonsDisabled(true);
  }

  resume() {
    if (!this.running || !this.paused) return;
    this.paused = false;
    this._startTick();
    this._setButtonsDisabled(false);
  }

  destroy() {
    this.running = false;
    this.paused  = false;
    this._stopTick();
    clearTimeout(this._feedbackTimer);
    this._detachKeyboard();
    if (this.root && this.root.parentNode) {
      this.root.parentNode.removeChild(this.root);
    }
    this.root = null;
  }

  getScore() {
    return this.score;
  }

  /* ════════════════════════════════════════════
     DOM construction
     ════════════════════════════════════════════ */

  _buildDOM() {
    this.root = document.createElement('div');
    this.root.className = 'color-match-container';
    this.container.appendChild(this.root);
  }

  _showStartScreen() {
    this.root.innerHTML = '';
    const overlay = this._el('div', 'color-match-overlay');

    const title = this._el('div', 'color-match-overlay-title', 'Color Match');
    const sub   = this._el('div', 'color-match-overlay-subtitle',
      'A color name will appear in a different ink color.\n' +
      'Decide if the WORD matches the INK COLOR — fast!\n' +
      'Score points, build streaks, and beat the clock.');

    const btn = this._el('button', 'color-match-btn-start', 'Play');
    btn.addEventListener('click', () => this.start());

    overlay.append(title, sub, btn);
    this.root.appendChild(overlay);
  }

  _showGameUI() {
    this.root.innerHTML = '';

    // Header
    this.elHeader = this._el('div', 'color-match-header');
    this.elScore  = this._el('div', 'color-match-score');
    this.elLevel  = this._el('div', 'color-match-level');
    this.elTimer  = this._el('div', 'color-match-timer');
    this.elHeader.append(this.elScore, this.elLevel, this.elTimer);

    // Timer bar
    this.elBarWrap = this._el('div', 'color-match-timer-bar-wrap');
    this.elBar     = this._el('div', 'color-match-timer-bar');
    this.elBarWrap.appendChild(this.elBar);

    // Prompt area
    this.elPrompt      = this._el('div', 'color-match-prompt-area');
    this.elInstruction = this._el('div', 'color-match-instruction');
    this.elWord        = this._el('div', 'color-match-word');
    this.elQuestion    = this._el('div', 'color-match-question');
    this.elPrompt.append(this.elInstruction, this.elWord, this.elQuestion);

    // Feedback
    this.elFeedback = this._el('div', 'color-match-feedback');
    this.elStreak   = this._el('div', 'color-match-streak');

    // Buttons
    this.elButtons = this._el('div', 'color-match-buttons');

    this.root.append(
      this.elHeader, this.elBarWrap, this.elPrompt,
      this.elFeedback, this.elStreak, this.elButtons
    );
  }

  _showGameOver() {
    this.running = false;
    this._stopTick();
    this._detachKeyboard();
    clearTimeout(this._feedbackTimer);

    this.root.innerHTML = '';
    const overlay = this._el('div', 'color-match-overlay');

    const title = this._el('div', 'color-match-overlay-title', 'Time\'s Up!');
    const score = this._el('div', 'color-match-overlay-score', `Score: ${this.score}`);
    const stats = this._el('div', 'color-match-overlay-stats',
      `Correct: ${this.totalCorrect}  |  Wrong: ${this.totalWrong}\n` +
      `Best Streak: ${this.bestStreak}  |  Level Reached: ${this.level}`);

    const btn = this._el('button', 'color-match-btn-start', 'Play Again');
    btn.addEventListener('click', () => this.start());

    overlay.append(title, score, stats, btn);
    this.root.appendChild(overlay);
  }

  /* ════════════════════════════════════════════
     Round logic
     ════════════════════════════════════════════ */

  _nextRound() {
    if (!this.running) return;

    this._updateLevel();

    // Decide round mode: higher levels mix in "pick the color" rounds
    const pickChance = Math.min(0.5, (this.level - 1) * 0.1);
    this.roundMode = (this.level >= 3 && Math.random() < pickChance) ? 'pick' : 'yesno';

    // Choose word and ink color
    const colors = ColorMatch.COLORS;
    const pool = this.level >= 5 ? colors : colors.slice(0, 4 + Math.min(this.level, 4));

    const wordIdx = Math.floor(Math.random() * pool.length);
    this.currentWord = pool[wordIdx];

    // At higher levels, bias toward mismatch to increase difficulty
    const matchChance = Math.max(0.2, 0.45 - this.level * 0.03);
    const shouldMatch = Math.random() < matchChance;

    if (shouldMatch) {
      this.currentColor = this.currentWord;
    } else {
      let colorIdx;
      do { colorIdx = Math.floor(Math.random() * pool.length); }
      while (colorIdx === wordIdx);
      this.currentColor = pool[colorIdx];
    }

    const isMatch = this.currentWord.name === this.currentColor.name;

    // Display
    this.elWord.textContent = this.currentWord.name;
    this.elWord.style.color = this.currentColor.hex;
    this.elWord.style.opacity = '1';

    this.elFeedback.textContent = '';
    this.elFeedback.className = 'color-match-feedback';

    if (this.roundMode === 'yesno') {
      this.answer = isMatch;
      this.elInstruction.textContent = 'Does the WORD match the INK COLOR?';
      this.elQuestion.textContent = '';
      this._renderYesNoButtons();
    } else {
      // "pick" mode – ask what color the ink is
      this.answer = this.currentColor.name;
      this.elInstruction.textContent = 'What COLOR is the ink?';
      this.elQuestion.textContent = '(Ignore what the word says!)';
      this._renderPickButtons(pool);
    }

    this.roundStart = Date.now();
  }

  _renderYesNoButtons() {
    this.elButtons.innerHTML = '';

    const btnYes = this._el('button', 'color-match-btn color-match-btn-yes', 'Yes');
    const btnNo  = this._el('button', 'color-match-btn color-match-btn-no',  'No');

    btnYes.addEventListener('click', () => this._handleAnswer(true));
    btnNo.addEventListener('click',  () => this._handleAnswer(false));

    this.elButtons.append(btnYes, btnNo);
  }

  _renderPickButtons(pool) {
    this.elButtons.innerHTML = '';

    // Shuffle pool copy for button order
    const shuffled = [...pool].sort(() => Math.random() - 0.5);

    // Ensure the correct answer is included (it always will be, but guard)
    if (!shuffled.find(c => c.name === this.currentColor.name)) {
      shuffled[0] = this.currentColor;
    }

    // Show 4 options max
    const options = shuffled.slice(0, Math.min(4, shuffled.length));
    if (!options.find(c => c.name === this.currentColor.name)) {
      options[Math.floor(Math.random() * options.length)] = this.currentColor;
    }

    options.forEach(c => {
      const btn = this._el('button', 'color-match-btn color-match-btn-color', c.name);
      btn.style.background = c.hex;
      // Ensure readability on light colors
      if (['YELLOW', 'CYAN'].includes(c.name)) {
        btn.style.color = '#111';
      }
      btn.addEventListener('click', () => this._handleAnswer(c.name));
      this.elButtons.appendChild(btn);
    });
  }

  _handleAnswer(playerAnswer) {
    if (!this.running || this.paused) return;

    const elapsed = Date.now() - this.roundStart;
    const correct = playerAnswer === this.answer;

    // Scoring
    if (correct) {
      this.totalCorrect++;
      this.streak++;
      if (this.streak > this.bestStreak) this.bestStreak = this.streak;

      // Base points + speed bonus + streak bonus
      let pts = 10;
      if (elapsed < 1500) pts += 10;
      else if (elapsed < 3000) pts += 5;
      pts += Math.min(this.streak, 10) * 2; // streak bonus capped at +20

      this.score += pts;

      this.elFeedback.textContent = `✓ Correct! +${pts}`;
      this.elFeedback.className = 'color-match-feedback color-match-feedback-correct';
    } else {
      this.totalWrong++;
      const penalty = 5 + Math.floor(this.level / 2);
      this.score = Math.max(0, this.score - penalty);
      this.streak = 0;

      this.elFeedback.textContent = `✗ Wrong! −${penalty}`;
      this.elFeedback.className = 'color-match-feedback color-match-feedback-wrong';
    }

    this._updateHeader();

    // Brief pause then next round
    this._setButtonsDisabled(true);
    clearTimeout(this._feedbackTimer);

    const delay = Math.max(350, 800 - this.level * 50);
    this._feedbackTimer = setTimeout(() => {
      if (this.running && !this.paused) this._nextRound();
    }, delay);
  }

  /* ════════════════════════════════════════════
     Timer
     ════════════════════════════════════════════ */

  _startTimer() {
    this._stopTick();
    this._lastTick = Date.now();
    this._startTick();
  }

  _startTick() {
    this._tickTimer = setInterval(() => this._tick(), ColorMatch.TICK_MS);
  }

  _stopTick() {
    clearInterval(this._tickTimer);
    this._tickTimer = null;
  }

  _tick() {
    if (!this.running || this.paused) return;

    const now = Date.now();
    const dt  = (now - this._lastTick) / 1000;
    this._lastTick = now;

    this.timeLeft = Math.max(0, this.timeLeft - dt);
    this._updateTimerDisplay();

    if (this.timeLeft <= 0) {
      this._showGameOver();
    }
  }

  _updateTimerDisplay() {
    const secs = Math.ceil(this.timeLeft);
    if (this.elTimer) this.elTimer.innerHTML = `Time: <span>${secs}s</span>`;
    if (this.elBar) {
      const pct = (this.timeLeft / ColorMatch.GAME_DURATION) * 100;
      this.elBar.style.width = pct + '%';
    }
  }

  /* ════════════════════════════════════════════
     Difficulty / levels
     ════════════════════════════════════════════ */

  _updateLevel() {
    const elapsed = ColorMatch.GAME_DURATION - this.timeLeft;
    this.level = Math.min(10, 1 + Math.floor(elapsed / 10));
    if (this.elLevel) this.elLevel.textContent = `Level ${this.level}`;
  }

  /* ════════════════════════════════════════════
     Keyboard support
     ════════════════════════════════════════════ */

  _attachKeyboard() {
    this._detachKeyboard();
    this._boundKeyDown = (e) => this._onKeyDown(e);
    document.addEventListener('keydown', this._boundKeyDown);
  }

  _detachKeyboard() {
    if (this._boundKeyDown) {
      document.removeEventListener('keydown', this._boundKeyDown);
      this._boundKeyDown = null;
    }
  }

  _onKeyDown(e) {
    if (!this.running || this.paused) return;
    if (this.roundMode === 'yesno') {
      if (e.key === 'y' || e.key === 'Y' || e.key === 'ArrowLeft')  this._handleAnswer(true);
      if (e.key === 'n' || e.key === 'N' || e.key === 'ArrowRight') this._handleAnswer(false);
    } else {
      // 1–4 for pick mode
      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= 4) {
        const btns = this.elButtons.querySelectorAll('.color-match-btn-color');
        if (btns[num - 1]) btns[num - 1].click();
      }
    }
  }

  /* ════════════════════════════════════════════
     Helpers
     ════════════════════════════════════════════ */

  _updateHeader() {
    if (this.elScore) this.elScore.innerHTML = `Score: <span>${this.score}</span>`;
    this._updateTimerDisplay();
    if (this.elStreak && this.streak > 1) {
      this.elStreak.textContent = `🔥 Streak: ${this.streak}`;
    } else if (this.elStreak) {
      this.elStreak.textContent = '';
    }
  }

  _setButtonsDisabled(disabled) {
    if (!this.elButtons) return;
    this.elButtons.querySelectorAll('button').forEach(b => b.disabled = disabled);
  }

  _el(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text) el.textContent = text;
    return el;
  }
}

window.ColorMatch = ColorMatch;
