class ReactionTime {
  constructor(container) {
    this.container = container;
    this.totalRounds = 5;
    this.roundTimes = [];
    this.currentRound = 0;
    this.phase = 'idle'; // idle, waiting, ready, early, result, finished, paused
    this.score = 0;
    this.greenTime = 0;
    this.waitTimeout = null;
    this.resumeDelay = null;
    this.pausedPhase = null;
    this.pauseRemainingDelay = 0;
    this.waitStartedAt = 0;
    this.waitDuration = 0;

    this._boundClickHandler = this._handleClick.bind(this);

    this._buildDOM();
    this._showIdleScreen();
  }

  _buildDOM() {
    this.root = document.createElement('div');
    this.root.className = 'reaction-time-container reaction-time-idle';
    this.root.addEventListener('click', this._boundClickHandler);
    this.container.appendChild(this.root);
  }

  _clearTimers() {
    if (this.waitTimeout) {
      clearTimeout(this.waitTimeout);
      this.waitTimeout = null;
    }
    if (this.resumeDelay) {
      clearTimeout(this.resumeDelay);
      this.resumeDelay = null;
    }
  }

  _setPhaseClass(phase) {
    this.root.className = 'reaction-time-container reaction-time-' + phase;
  }

  _render(html, phase) {
    this._setPhaseClass(phase);
    this.root.innerHTML = html;
  }

  _roundIndicatorHTML() {
    if (this.phase === 'idle' || this.phase === 'finished') return '';
    return `<div class="reaction-time-round-indicator">Round ${this.currentRound + 1} / ${this.totalRounds}</div>`;
  }

  _historyHTML() {
    let html = '<div class="reaction-time-history">';
    for (let i = 0; i < this.totalRounds; i++) {
      if (i < this.roundTimes.length) {
        const t = this.roundTimes[i];
        let cls = 'reaction-time-fast';
        if (t > 400) cls = 'reaction-time-slow';
        else if (t > 250) cls = 'reaction-time-medium';
        html += `<div class="reaction-time-history-item">
          <div class="reaction-time-history-dot ${cls}">${t}</div>
          <span class="reaction-time-history-label">R${i + 1}</span>
        </div>`;
      } else {
        html += `<div class="reaction-time-history-item">
          <div class="reaction-time-history-dot reaction-time-pending"></div>
          <span class="reaction-time-history-label">R${i + 1}</span>
        </div>`;
      }
    }
    html += '</div>';
    return html;
  }

  _showIdleScreen() {
    this.phase = 'idle';
    this._render(`
      <div class="reaction-time-message">⚡ Reaction Time</div>
      <div class="reaction-time-submessage">Test how fast you can react</div>
      <button class="reaction-time-btn reaction-time-start-btn">Start Game</button>
    `, 'idle');

    this.root.querySelector('.reaction-time-start-btn')
      .addEventListener('click', (e) => {
        e.stopPropagation();
        this.start();
      });
  }

  start() {
    this._clearTimers();
    this.roundTimes = [];
    this.currentRound = 0;
    this.score = 0;
    this.pausedPhase = null;
    this._startRound();
  }

  _startRound() {
    this.phase = 'waiting';
    this._render(`
      ${this._roundIndicatorHTML()}
      <div class="reaction-time-message">Wait for green...</div>
      <div class="reaction-time-submessage">Click as soon as the screen turns green</div>
      ${this._historyHTML()}
    `, 'waiting');

    const delay = 1000 + Math.random() * 4000;
    this.waitDuration = delay;
    this.waitStartedAt = Date.now();

    this.waitTimeout = setTimeout(() => {
      this.waitTimeout = null;
      this._showGreen();
    }, delay);
  }

  _showGreen() {
    this.phase = 'ready';
    this.greenTime = Date.now();

    this._render(`
      ${this._roundIndicatorHTML()}
      <div class="reaction-time-message">Click NOW!</div>
      ${this._historyHTML()}
    `, 'ready');
  }

  _handleClick(e) {
    if (this.phase === 'idle' || this.phase === 'finished' || this.phase === 'paused') return;

    if (this.phase === 'waiting') {
      this._clearTimers();
      this.phase = 'early';
      this._render(`
        ${this._roundIndicatorHTML()}
        <div class="reaction-time-message">Too early! 🚫</div>
        <div class="reaction-time-submessage">Wait for the green screen. Click to retry this round.</div>
        ${this._historyHTML()}
      `, 'early');
      return;
    }

    if (this.phase === 'early') {
      this._startRound();
      return;
    }

    if (this.phase === 'ready') {
      const reactionTime = Date.now() - this.greenTime;
      this.roundTimes.push(reactionTime);
      this.currentRound++;
      this.phase = 'result';

      let feedback = '⚡ Lightning fast!';
      if (reactionTime > 400) feedback = '🐢 A bit slow';
      else if (reactionTime > 300) feedback = '👍 Not bad';
      else if (reactionTime > 200) feedback = '🔥 Great reflexes!';

      if (this.currentRound >= this.totalRounds) {
        this._calculateScore();
        this._showResults();
      } else {
        this._render(`
          ${this._roundIndicatorHTML()}
          <div class="reaction-time-time-display">${reactionTime}<span class="reaction-time-time-unit">ms</span></div>
          <div class="reaction-time-submessage">${feedback}</div>
          <div class="reaction-time-submessage">Click to continue</div>
          ${this._historyHTML()}
        `, 'result');
      }
      return;
    }

    if (this.phase === 'result') {
      this._startRound();
    }
  }

  _calculateScore() {
    const avg = this.roundTimes.reduce((a, b) => a + b, 0) / this.roundTimes.length;
    // Score: perfect 200ms ≈ 1000pts, 500ms ≈ 400pts, scales inversely
    this.score = Math.max(0, Math.round((200 / avg) * 1000));
  }

  _showResults() {
    this.phase = 'finished';
    const avg = Math.round(this.roundTimes.reduce((a, b) => a + b, 0) / this.roundTimes.length);
    const best = Math.min(...this.roundTimes);
    const worst = Math.max(...this.roundTimes);

    let rating = '⚡ Superhuman!';
    if (avg > 400) rating = '🐢 Keep practicing';
    else if (avg > 300) rating = '👍 Average';
    else if (avg > 250) rating = '🔥 Fast!';
    else if (avg > 200) rating = '⚡ Very fast!';

    let breakdownHTML = '<div class="reaction-time-results-breakdown">';
    this.roundTimes.forEach((t, i) => {
      breakdownHTML += `<div class="reaction-time-results-round">
        <div class="reaction-time-results-round-label">Round ${i + 1}</div>
        <div class="reaction-time-results-round-time">${t}ms</div>
      </div>`;
    });
    breakdownHTML += '</div>';

    this._render(`
      <div class="reaction-time-results">
        <div class="reaction-time-results-title">${rating}</div>
        <div class="reaction-time-results-avg">${avg}<span class="reaction-time-time-unit">ms</span></div>
        <div class="reaction-time-submessage">Average Reaction Time</div>
        <div class="reaction-time-results-score">Score: ${this.score} pts</div>
        <div class="reaction-time-submessage">Best: ${best}ms · Worst: ${worst}ms</div>
        ${breakdownHTML}
        <button class="reaction-time-btn reaction-time-restart-btn">Play Again</button>
      </div>
    `, 'finished');

    this.root.querySelector('.reaction-time-restart-btn')
      .addEventListener('click', (e) => {
        e.stopPropagation();
        this.start();
      });
  }

  pause() {
    if (this.phase === 'paused' || this.phase === 'idle' || this.phase === 'finished') return;

    this.pausedPhase = this.phase;

    if (this.phase === 'waiting' && this.waitTimeout) {
      const elapsed = Date.now() - this.waitStartedAt;
      this.pauseRemainingDelay = Math.max(0, this.waitDuration - elapsed);
      this._clearTimers();
    } else {
      this._clearTimers();
      this.pauseRemainingDelay = 0;
    }

    this.phase = 'paused';
    this._setPhaseClass('paused');

    const overlay = document.createElement('div');
    overlay.className = 'reaction-time-paused-overlay';
    overlay.innerHTML = '<div class="reaction-time-paused-text">⏸ Paused</div>';
    this.root.appendChild(overlay);
  }

  resume() {
    if (this.phase !== 'paused' || !this.pausedPhase) return;

    const overlay = this.root.querySelector('.reaction-time-paused-overlay');
    if (overlay) overlay.remove();

    const prev = this.pausedPhase;
    this.pausedPhase = null;
    this.phase = prev;
    this._setPhaseClass(prev);

    if (prev === 'waiting' && this.pauseRemainingDelay > 0) {
      this.waitStartedAt = Date.now();
      this.waitDuration = this.pauseRemainingDelay;
      this.waitTimeout = setTimeout(() => {
        this.waitTimeout = null;
        this._showGreen();
      }, this.pauseRemainingDelay);
    } else if (prev === 'ready') {
      // Reset green time so paused duration doesn't inflate reaction time
      this.greenTime = Date.now();
    }
  }

  getScore() {
    return this.score;
  }

  destroy() {
    this._clearTimers();
    this.root.removeEventListener('click', this._boundClickHandler);
    this.root.remove();
    this.container = null;
    this.root = null;
    this.phase = 'idle';
  }
}

window.ReactionTime = ReactionTime;
