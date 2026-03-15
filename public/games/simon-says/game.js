class SimonSays {
  constructor(container) {
    this.container = container;
    this.sequence = [];
    this.playerIndex = 0;
    this.score = 0;
    this.isPlaying = false;
    this.isPaused = false;
    this.isShowingSequence = false;
    this.timeouts = [];
    this.boundListeners = [];

    this.colors = ['green', 'red', 'yellow', 'blue'];

    // Audio context for tones
    this.audioCtx = null;
    this.toneFrequencies = {
      green: 392,
      red: 261.63,
      yellow: 329.63,
      blue: 196,
    };

    this._render();
  }

  _render() {
    this.container.innerHTML = '';

    const wrapper = document.createElement('div');
    wrapper.className = 'simon-says-container';

    // Header
    const header = document.createElement('div');
    header.className = 'simon-says-header';
    header.innerHTML =
      '<h2 class="simon-says-title">Simon Says</h2>' +
      '<p class="simon-says-score">Score: <span>0</span></p>';
    wrapper.appendChild(header);
    this.scoreEl = header.querySelector('.simon-says-score span');

    // Board
    const board = document.createElement('div');
    board.className = 'simon-says-board';

    this.buttons = {};
    this.colors.forEach((color) => {
      const btn = document.createElement('button');
      btn.className = `simon-says-btn simon-says-btn-${color} simon-says-disabled`;
      btn.dataset.color = color;
      board.appendChild(btn);
      this.buttons[color] = btn;

      const handler = () => this._handlePlayerInput(color);
      btn.addEventListener('click', handler);
      this.boundListeners.push({ el: btn, event: 'click', handler });
    });

    // Center circle
    const center = document.createElement('div');
    center.className = 'simon-says-center';
    center.innerHTML = '<div class="simon-says-center-text">SIMON</div>';
    board.appendChild(center);

    wrapper.appendChild(board);
    this.boardEl = board;

    // Status
    const status = document.createElement('div');
    status.className = 'simon-says-status';
    status.textContent = 'Press Start to play';
    wrapper.appendChild(status);
    this.statusEl = status;

    // Controls
    const controls = document.createElement('div');
    controls.className = 'simon-says-controls';

    this.startBtn = document.createElement('button');
    this.startBtn.className = 'simon-says-start-btn';
    this.startBtn.textContent = 'Start';
    const startHandler = () => this.start();
    this.startBtn.addEventListener('click', startHandler);
    this.boundListeners.push({ el: this.startBtn, event: 'click', handler: startHandler });
    controls.appendChild(this.startBtn);

    wrapper.appendChild(controls);
    this.container.appendChild(wrapper);
    this.wrapperEl = wrapper;
  }

  _initAudio() {
    if (!this.audioCtx) {
      try {
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      } catch (_) {
        this.audioCtx = null;
      }
    }
  }

  _playTone(color, duration) {
    if (!this.audioCtx) return;
    try {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.value = this.toneFrequencies[color];
      gain.gain.setValueAtTime(0.3, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + duration / 1000);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start();
      osc.stop(this.audioCtx.currentTime + duration / 1000);
    } catch (_) {
      // Silently fail if audio isn't available
    }
  }

  _playErrorTone() {
    if (!this.audioCtx) return;
    try {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.value = 100;
      gain.gain.setValueAtTime(0.3, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.8);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.8);
    } catch (_) {}
  }

  _setTimeout(fn, delay) {
    const id = setTimeout(fn, delay);
    this.timeouts.push(id);
    return id;
  }

  _clearAllTimeouts() {
    this.timeouts.forEach((id) => clearTimeout(id));
    this.timeouts = [];
  }

  _setButtonsEnabled(enabled) {
    this.colors.forEach((color) => {
      if (enabled) {
        this.buttons[color].classList.remove('simon-says-disabled');
      } else {
        this.buttons[color].classList.add('simon-says-disabled');
      }
    });
  }

  _flashButton(color, duration = 400) {
    const btn = this.buttons[color];
    btn.classList.add('simon-says-active');
    this._playTone(color, duration);
    this._setTimeout(() => {
      btn.classList.remove('simon-says-active');
    }, duration);
  }

  _addToSequence() {
    const randomColor = this.colors[Math.floor(Math.random() * 4)];
    this.sequence.push(randomColor);
  }

  _showSequence() {
    this.isShowingSequence = true;
    this._setButtonsEnabled(false);
    this.statusEl.textContent = 'Watch carefully...';
    this.statusEl.className = 'simon-says-status';

    const speed = Math.max(300, 600 - this.sequence.length * 20);
    const gap = speed + 200;

    this.sequence.forEach((color, i) => {
      this._setTimeout(() => {
        if (!this.isPlaying || this.isPaused) return;
        this._flashButton(color, speed);
      }, i * gap);
    });

    this._setTimeout(() => {
      if (!this.isPlaying) return;
      this.isShowingSequence = false;
      this.playerIndex = 0;
      this._setButtonsEnabled(true);
      this.statusEl.textContent = 'Your turn!';
    }, this.sequence.length * gap + 200);
  }

  _handlePlayerInput(color) {
    if (!this.isPlaying || this.isPaused || this.isShowingSequence) return;

    this._flashButton(color, 250);

    if (this.sequence[this.playerIndex] === color) {
      this.playerIndex++;

      if (this.playerIndex === this.sequence.length) {
        // Round complete
        this.score++;
        this.scoreEl.textContent = this.score;
        this._setButtonsEnabled(false);
        this.statusEl.textContent = 'Correct! 🎉';
        this.statusEl.className = 'simon-says-status simon-says-status-success';

        this._setTimeout(() => {
          if (!this.isPlaying) return;
          this._nextRound();
        }, 1200);
      }
    } else {
      this._gameOver();
    }
  }

  _nextRound() {
    this._addToSequence();
    this._showSequence();
  }

  _gameOver() {
    this.isPlaying = false;
    this._setButtonsEnabled(false);
    this._playErrorTone();

    // Flash all buttons red briefly
    this.colors.forEach((c) => {
      this.buttons[c].classList.add('simon-says-active');
    });

    this._setTimeout(() => {
      this.colors.forEach((c) => {
        this.buttons[c].classList.remove('simon-says-active');
      });
    }, 300);

    this._setTimeout(() => {
      this.colors.forEach((c) => {
        this.buttons[c].classList.add('simon-says-active');
      });
    }, 500);

    this._setTimeout(() => {
      this.colors.forEach((c) => {
        this.buttons[c].classList.remove('simon-says-active');
      });
    }, 800);

    this.statusEl.textContent = `Game Over! Score: ${this.score}`;
    this.statusEl.className = 'simon-says-status simon-says-status-error';
    this.startBtn.textContent = 'Play Again';
  }

  start() {
    this._clearAllTimeouts();
    this._initAudio();

    this.sequence = [];
    this.playerIndex = 0;
    this.score = 0;
    this.isPlaying = true;
    this.isPaused = false;
    this.isShowingSequence = false;

    this.scoreEl.textContent = '0';
    this.startBtn.textContent = 'Restart';
    this.statusEl.className = 'simon-says-status';

    this.colors.forEach((c) => {
      this.buttons[c].classList.remove('simon-says-active');
    });

    this._setTimeout(() => {
      this._nextRound();
    }, 500);
  }

  pause() {
    if (!this.isPlaying || this.isPaused) return;
    this.isPaused = true;
    this._setButtonsEnabled(false);
    this.statusEl.textContent = 'Paused';
    this.statusEl.className = 'simon-says-status';
  }

  resume() {
    if (!this.isPlaying || !this.isPaused) return;
    this.isPaused = false;

    if (this.isShowingSequence) {
      // Re-show the full sequence from the start
      this._showSequence();
    } else {
      this._setButtonsEnabled(true);
      this.statusEl.textContent = 'Your turn!';
    }
  }

  destroy() {
    this._clearAllTimeouts();
    this.isPlaying = false;
    this.isPaused = false;

    this.boundListeners.forEach(({ el, event, handler }) => {
      el.removeEventListener(event, handler);
    });
    this.boundListeners = [];

    if (this.audioCtx) {
      try {
        this.audioCtx.close();
      } catch (_) {}
      this.audioCtx = null;
    }

    this.container.innerHTML = '';
    this.buttons = {};
    this.sequence = [];
  }

  getScore() {
    return this.score;
  }
}

window.SimonSays = SimonSays;
