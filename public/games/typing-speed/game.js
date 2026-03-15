/**
 * Typing Speed Test Game
 * A responsive and satisfying typing test experience
 */

class TypingSpeed {
  constructor(container) {
    this.container = container;
    this.state = 'idle'; // idle, running, paused, finished
    this.currentPassage = '';
    this.userInput = '';
    this.timerDuration = 30;
    this.timeRemaining = 30;
    this.timerInterval = null;
    this.startTime = null;
    this.stats = {
      wpm: 0,
      accuracy: 0,
      charactersTyped: 0,
      errors: 0
    };

    // Passages/quotes database (15+ different texts)
    this.passages = [
      "The quick brown fox jumps over the lazy dog during a sunny afternoon.",
      "Technology is best when it brings people together and helps them achieve great things.",
      "Every morning brings new possibilities and opportunities for growth and learning.",
      "Writing code is like poetry; it should be beautiful, elegant, and meaningful.",
      "The future belongs to those who can imagine it, design it, and build it.",
      "Typing speed tests improve both accuracy and rhythm in digital communication.",
      "Success is not final, failure is not fatal: it is the courage to continue that counts.",
      "In the middle of difficulty lies opportunity waiting to be discovered.",
      "The best way to predict the future is to invent it with dedication and passion.",
      "Learning to type faster opens doors to better productivity and efficiency.",
      "Every keystroke brings you closer to mastering the art of fast typing.",
      "Mistakes are proof that you are trying and learning something new.",
      "Consistency in practice builds skill and confidence over time.",
      "The mind is everything; what you think, you become through repetition.",
      "Challenge yourself daily to grow beyond your comfort zone and limitations.",
      "Words have power to inspire, motivate, and transform lives in meaningful ways."
    ];

    this.setupUI();
  }

  setupUI() {
    this.container.innerHTML = `
      <div class="typing-speed-container">
        <div class="typing-speed-header">
          <h1 class="typing-speed-title">Typing Speed Test</h1>
          <p class="typing-speed-subtitle">Test your typing speed and accuracy</p>
        </div>

        <div class="typing-speed-controls">
          <div class="typing-speed-timer-select">
            <label class="typing-speed-label">Time Duration:</label>
            <div class="typing-speed-button-group">
              <button class="typing-speed-btn typing-speed-time-btn" data-time="15">15s</button>
              <button class="typing-speed-btn typing-speed-time-btn active" data-time="30">30s</button>
              <button class="typing-speed-btn typing-speed-time-btn" data-time="60">60s</button>
            </div>
          </div>
          <button class="typing-speed-btn typing-speed-start-btn">Start</button>
        </div>

        <div class="typing-speed-stats">
          <div class="typing-speed-stat">
            <span class="typing-speed-stat-label">WPM</span>
            <span class="typing-speed-stat-value">0</span>
          </div>
          <div class="typing-speed-stat">
            <span class="typing-speed-stat-label">Accuracy</span>
            <span class="typing-speed-stat-value">100%</span>
          </div>
          <div class="typing-speed-stat">
            <span class="typing-speed-stat-label">Time</span>
            <span class="typing-speed-stat-value" id="typing-speed-timer">30s</span>
          </div>
        </div>

        <div class="typing-speed-display">
          <div class="typing-speed-passage" id="typing-speed-passage"></div>
        </div>

        <input 
          type="text" 
          class="typing-speed-input" 
          id="typing-speed-input"
          placeholder="Click 'Start' and begin typing..."
          disabled
        />

        <div class="typing-speed-buttons">
          <button class="typing-speed-btn typing-speed-restart-btn" style="display: none;">Restart</button>
          <button class="typing-speed-btn typing-speed-pause-btn" style="display: none;">Pause</button>
        </div>

        <div class="typing-speed-results" id="typing-speed-results" style="display: none;">
          <h2 class="typing-speed-results-title">Test Complete!</h2>
          <div class="typing-speed-results-grid">
            <div class="typing-speed-result-item">
              <span class="typing-speed-result-label">Words Per Minute</span>
              <span class="typing-speed-result-value" id="result-wpm">0</span>
            </div>
            <div class="typing-speed-result-item">
              <span class="typing-speed-result-label">Accuracy</span>
              <span class="typing-speed-result-value" id="result-accuracy">0%</span>
            </div>
            <div class="typing-speed-result-item">
              <span class="typing-speed-result-label">Characters Typed</span>
              <span class="typing-speed-result-value" id="result-chars">0</span>
            </div>
            <div class="typing-speed-result-item">
              <span class="typing-speed-result-label">Errors</span>
              <span class="typing-speed-result-value" id="result-errors">0</span>
            </div>
          </div>
          <button class="typing-speed-btn typing-speed-play-again-btn">Play Again</button>
        </div>
      </div>
    `;

    this.cacheElements();
    this.attachEventListeners();
  }

  cacheElements() {
    this.passageElement = this.container.querySelector('#typing-speed-passage');
    this.inputElement = this.container.querySelector('#typing-speed-input');
    this.timerElement = this.container.querySelector('#typing-speed-timer');
    this.wpmElement = this.container.querySelector('.typing-speed-stat-value:nth-of-type(1)');
    this.accuracyElement = this.container.querySelector('.typing-speed-stat-value:nth-of-type(2)');
    this.startBtn = this.container.querySelector('.typing-speed-start-btn');
    this.restartBtn = this.container.querySelector('.typing-speed-restart-btn');
    this.pauseBtn = this.container.querySelector('.typing-speed-pause-btn');
    this.playAgainBtn = this.container.querySelector('.typing-speed-play-again-btn');
    this.resultsElement = this.container.querySelector('#typing-speed-results');
    this.timeBtns = this.container.querySelectorAll('.typing-speed-time-btn');
  }

  attachEventListeners() {
    this.startBtn.addEventListener('click', () => this.start());
    this.restartBtn.addEventListener('click', () => this.start());
    this.pauseBtn.addEventListener('click', () => this.togglePause());
    this.playAgainBtn.addEventListener('click', () => this.start());
    this.inputElement.addEventListener('input', (e) => this.handleInput(e));
    this.inputElement.addEventListener('keydown', (e) => this.handleKeydown(e));

    this.timeBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.timeBtns.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        this.timerDuration = parseInt(e.target.dataset.time);
        this.timeRemaining = this.timerDuration;
        this.updateTimerDisplay();
      });
    });
  }

  start() {
    this.state = 'running';
    this.userInput = '';
    this.startTime = null;
    this.timeRemaining = this.timerDuration;
    this.stats = {
      wpm: 0,
      accuracy: 0,
      charactersTyped: 0,
      errors: 0
    };

    // Randomly select a passage
    this.currentPassage = this.passages[Math.floor(Math.random() * this.passages.length)];

    // Hide results and show game UI
    this.resultsElement.style.display = 'none';
    this.container.querySelector('.typing-speed-controls').style.display = 'block';
    this.container.querySelector('.typing-speed-display').style.display = 'block';
    this.container.querySelector('.typing-speed-buttons').style.display = 'flex';

    // Update button visibility
    this.startBtn.style.display = 'none';
    this.restartBtn.style.display = 'inline-block';
    this.pauseBtn.style.display = 'inline-block';
    this.pauseBtn.textContent = 'Pause';

    // Enable input and focus
    this.inputElement.disabled = false;
    this.inputElement.value = '';
    this.inputElement.placeholder = 'Start typing...';
    this.inputElement.focus();

    // Render passage
    this.renderPassage();
    this.updateTimerDisplay();

    // Clear any existing timer
    if (this.timerInterval) clearInterval(this.timerInterval);
  }

  handleInput(e) {
    // Start timer on first keystroke
    if (this.state === 'running' && !this.startTime) {
      this.startTime = Date.now();
      this.startTimer();
    }

    this.userInput = e.target.value;
    this.renderPassage();
    this.updateStats();
  }

  handleKeydown(e) {
    // Prevent default tab behavior
    if (e.key === 'Tab') {
      e.preventDefault();
    }
  }

  startTimer() {
    this.timerInterval = setInterval(() => {
      this.timeRemaining--;
      this.updateTimerDisplay();

      if (this.timeRemaining <= 0) {
        this.finishTest();
      }
    }, 1000);
  }

  updateTimerDisplay() {
    this.timerElement.textContent = `${this.timeRemaining}s`;
  }

  renderPassage() {
    let html = '';
    const passage = this.currentPassage;

    for (let i = 0; i < passage.length; i++) {
      const char = passage[i];
      const userChar = this.userInput[i];
      let charClass = '';

      if (i < this.userInput.length) {
        if (userChar === char) {
          charClass = 'typing-speed-char-correct';
        } else {
          charClass = 'typing-speed-char-wrong';
        }
      } else if (i === this.userInput.length) {
        charClass = 'typing-speed-char-current';
      } else {
        charClass = 'typing-speed-char-upcoming';
      }

      html += `<span class="typing-speed-char ${charClass}">${char}</span>`;
    }

    // Add caret
    const caretPos = this.userInput.length;
    const caretStyle = caretPos < passage.length 
      ? `transform: translateX(${caretPos * 8.5}px);`
      : `transform: translateX(${caretPos * 8.5}px); display: none;`;

    this.passageElement.innerHTML = html + `<div class="typing-speed-caret" style="${caretStyle}"></div>`;
  }

  updateStats() {
    // Calculate accuracy
    let correctChars = 0;
    for (let i = 0; i < this.userInput.length; i++) {
      if (this.userInput[i] === this.currentPassage[i]) {
        correctChars++;
      }
    }

    const charactersTyped = this.userInput.length;
    const errors = Math.max(0, charactersTyped - correctChars);
    const accuracy = charactersTyped > 0 
      ? Math.round((correctChars / charactersTyped) * 100)
      : 100;

    // Calculate WPM
    let wpm = 0;
    if (this.startTime) {
      const elapsedSeconds = (Date.now() - this.startTime) / 1000;
      const words = correctChars / 5; // Standard: 5 characters = 1 word
      wpm = elapsedSeconds > 0 
        ? Math.round((words / elapsedSeconds) * 60)
        : 0;
    }

    this.stats = {
      wpm: Math.max(0, wpm),
      accuracy,
      charactersTyped,
      errors
    };

    this.wpmElement.textContent = this.stats.wpm;
    this.accuracyElement.textContent = `${this.stats.accuracy}%`;
  }

  pause() {
    if (this.state === 'running') {
      this.state = 'paused';
      if (this.timerInterval) clearInterval(this.timerInterval);
      this.inputElement.disabled = true;
      this.pauseBtn.textContent = 'Resume';
    }
  }

  resume() {
    if (this.state === 'paused') {
      this.state = 'running';
      this.startTimer();
      this.inputElement.disabled = false;
      this.pauseBtn.textContent = 'Pause';
      this.inputElement.focus();
    }
  }

  togglePause() {
    if (this.state === 'running') {
      this.pause();
    } else if (this.state === 'paused') {
      this.resume();
    }
  }

  finishTest() {
    this.state = 'finished';
    if (this.timerInterval) clearInterval(this.timerInterval);

    this.inputElement.disabled = true;
    this.pauseBtn.style.display = 'none';
    this.restartBtn.style.display = 'inline-block';

    // Show results
    this.showResults();
  }

  showResults() {
    const resultWpm = this.container.querySelector('#result-wpm');
    const resultAccuracy = this.container.querySelector('#result-accuracy');
    const resultChars = this.container.querySelector('#result-chars');
    const resultErrors = this.container.querySelector('#result-errors');

    resultWpm.textContent = this.stats.wpm;
    resultAccuracy.textContent = `${this.stats.accuracy}%`;
    resultChars.textContent = this.stats.charactersTyped;
    resultErrors.textContent = this.stats.errors;

    this.resultsElement.style.display = 'block';
    this.container.querySelector('.typing-speed-controls').style.display = 'none';
    this.container.querySelector('.typing-speed-display').style.display = 'none';
    this.container.querySelector('.typing-speed-buttons').style.display = 'none';
  }

  getScore() {
    return this.stats.wpm;
  }

  destroy() {
    // Clear timer
    if (this.timerInterval) clearInterval(this.timerInterval);

    // Remove event listeners
    this.startBtn.removeEventListener('click', () => this.start());
    this.restartBtn.removeEventListener('click', () => this.start());
    this.pauseBtn.removeEventListener('click', () => this.togglePause());
    this.playAgainBtn.removeEventListener('click', () => this.start());
    this.inputElement.removeEventListener('input', (e) => this.handleInput(e));
    this.inputElement.removeEventListener('keydown', (e) => this.handleKeydown(e));

    this.timeBtns.forEach(btn => {
      btn.removeEventListener('click', () => {});
    });

    // Clear container
    this.container.innerHTML = '';

    // Reset state
    this.state = 'idle';
    this.userInput = '';
    this.currentPassage = '';
  }
}

// Export to window
window.TypingSpeed = TypingSpeed;
