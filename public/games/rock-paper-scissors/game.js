class RockPaperScissors {
  constructor(container) {
    this.container = container;
    this.CHOICES = ['rock', 'paper', 'scissors'];
    this.EMOJI = { rock: '🪨', paper: '📄', scissors: '✂️' };
    this.BEATS = { rock: 'scissors', paper: 'rock', scissors: 'paper' };

    this.wins = 0;
    this.losses = 0;
    this.draws = 0;
    this.streak = 0;
    this.bestStreak = 0;
    this.history = [];

    this.bestOf = 3;
    this.seriesPlayerWins = 0;
    this.seriesAiWins = 0;
    this.seriesRounds = [];
    this.seriesOver = false;

    this.animating = false;
    this.paused = false;
    this._timers = [];
    this._boundHandlers = [];

    this._buildDOM();
  }

  /* ── Lifecycle ───────────────────────────── */

  start() {
    this.wins = 0;
    this.losses = 0;
    this.draws = 0;
    this.streak = 0;
    this.bestStreak = 0;
    this.history = [];
    this._resetSeries();
    this._render();
    this._setChoicesEnabled(true);
  }

  pause() {
    this.paused = true;
    this._setChoicesEnabled(false);
  }

  resume() {
    this.paused = false;
    if (!this.animating && !this.seriesOver) {
      this._setChoicesEnabled(true);
    }
  }

  destroy() {
    this._clearTimers();
    this._boundHandlers.forEach(({ el, evt, fn }) => el.removeEventListener(evt, fn));
    this._boundHandlers = [];
    if (this.wrapper && this.wrapper.parentNode) {
      this.wrapper.parentNode.removeChild(this.wrapper);
    }
    this.wrapper = null;
  }

  getScore() {
    return this.wins;
  }

  /* ── DOM construction ────────────────────── */

  _buildDOM() {
    const w = document.createElement('div');
    w.className = 'rock-paper-scissors-wrapper';

    w.innerHTML = `
      <div class="rock-paper-scissors-mode"></div>
      <div class="rock-paper-scissors-scoreboard">
        <div class="rock-paper-scissors-stat">
          <span class="rock-paper-scissors-stat-label">Wins</span>
          <span class="rock-paper-scissors-stat-value wins" data-rps="wins">0</span>
        </div>
        <div class="rock-paper-scissors-stat">
          <span class="rock-paper-scissors-stat-label">Draws</span>
          <span class="rock-paper-scissors-stat-value draws" data-rps="draws">0</span>
        </div>
        <div class="rock-paper-scissors-stat">
          <span class="rock-paper-scissors-stat-label">Losses</span>
          <span class="rock-paper-scissors-stat-value losses" data-rps="losses">0</span>
        </div>
      </div>
      <div class="rock-paper-scissors-series" data-rps="series"></div>
      <div class="rock-paper-scissors-arena">
        <div class="rock-paper-scissors-player">
          <div class="rock-paper-scissors-arena-emoji" data-rps="player-emoji">❔</div>
          <span class="rock-paper-scissors-arena-label">You</span>
        </div>
        <span class="rock-paper-scissors-vs">VS</span>
        <div class="rock-paper-scissors-ai">
          <div class="rock-paper-scissors-arena-emoji" data-rps="ai-emoji">❔</div>
          <span class="rock-paper-scissors-arena-label">AI</span>
        </div>
      </div>
      <div class="rock-paper-scissors-result" data-rps="result"></div>
      <div class="rock-paper-scissors-streak" data-rps="streak"></div>
      <div class="rock-paper-scissors-choices" data-rps="choices"></div>
      <div data-rps="banner-area"></div>
      <div class="rock-paper-scissors-history">
        <div class="rock-paper-scissors-history-title">Recent rounds</div>
        <div class="rock-paper-scissors-history-list" data-rps="history"></div>
      </div>
    `;

    this.container.appendChild(w);
    this.wrapper = w;

    this.el = {};
    w.querySelectorAll('[data-rps]').forEach(node => {
      this.el[node.dataset.rps] = node;
    });

    this._buildModeButtons();
    this._buildChoiceButtons();
  }

  _buildModeButtons() {
    const modeContainer = this.wrapper.querySelector('.rock-paper-scissors-mode');
    [3, 5, 7].forEach(n => {
      const btn = document.createElement('button');
      btn.className = 'rock-paper-scissors-mode-btn' + (n === this.bestOf ? ' active' : '');
      btn.textContent = `Best of ${n}`;
      const handler = () => this._selectMode(n);
      btn.addEventListener('click', handler);
      this._boundHandlers.push({ el: btn, evt: 'click', fn: handler });
      modeContainer.appendChild(btn);
    });
  }

  _buildChoiceButtons() {
    const container = this.el['choices'];
    this.CHOICES.forEach(choice => {
      const btn = document.createElement('button');
      btn.className = 'rock-paper-scissors-choice-btn';
      btn.textContent = this.EMOJI[choice];
      btn.title = choice.charAt(0).toUpperCase() + choice.slice(1);
      const handler = () => this._onChoice(choice);
      btn.addEventListener('click', handler);
      this._boundHandlers.push({ el: btn, evt: 'click', fn: handler });
      container.appendChild(btn);
    });
  }

  /* ── Mode selection ──────────────────────── */

  _selectMode(n) {
    if (this.animating) return;
    this.bestOf = n;
    this.wrapper.querySelectorAll('.rock-paper-scissors-mode-btn').forEach((btn, i) => {
      btn.classList.toggle('active', [3, 5, 7][i] === n);
    });
    this._resetSeries();
    this._render();
    this._setChoicesEnabled(true);
  }

  _resetSeries() {
    this.seriesPlayerWins = 0;
    this.seriesAiWins = 0;
    this.seriesRounds = [];
    this.seriesOver = false;
    this.el['result'].textContent = '';
    this.el['result'].className = 'rock-paper-scissors-result';
    this.el['player-emoji'].textContent = '❔';
    this.el['player-emoji'].className = 'rock-paper-scissors-arena-emoji';
    this.el['ai-emoji'].textContent = '❔';
    this.el['ai-emoji'].className = 'rock-paper-scissors-arena-emoji';
    this.el['banner-area'].innerHTML = '';
  }

  /* ── Player choice handler ───────────────── */

  _onChoice(playerChoice) {
    if (this.animating || this.paused || this.seriesOver) return;
    this.animating = true;
    this._setChoicesEnabled(false);

    const aiChoice = this.CHOICES[Math.floor(Math.random() * 3)];

    this.el['player-emoji'].textContent = this.EMOJI[playerChoice];
    this.el['player-emoji'].className = 'rock-paper-scissors-arena-emoji';

    // countdown reveal
    const aiBox = this.el['ai-emoji'];
    aiBox.className = 'rock-paper-scissors-arena-emoji shaking';
    this.el['result'].textContent = '';
    this.el['result'].className = 'rock-paper-scissors-result';

    const steps = [3, 2, 1];
    steps.forEach((num, i) => {
      this._delay(() => {
        aiBox.innerHTML = `<span class="rock-paper-scissors-countdown">${num}</span>`;
      }, i * 400);
    });

    this._delay(() => {
      aiBox.className = 'rock-paper-scissors-arena-emoji';
      aiBox.textContent = this.EMOJI[aiChoice];
      this._resolve(playerChoice, aiChoice);
    }, steps.length * 400 + 100);
  }

  /* ── Round resolution ────────────────────── */

  _resolve(player, ai) {
    let outcome;
    if (player === ai) {
      outcome = 'draw';
      this.draws++;
      this.streak = 0;
    } else if (this.BEATS[player] === ai) {
      outcome = 'win';
      this.wins++;
      this.streak++;
      if (this.streak > this.bestStreak) this.bestStreak = this.streak;
      this.seriesPlayerWins++;
    } else {
      outcome = 'lose';
      this.losses++;
      this.streak = 0;
      this.seriesAiWins++;
    }

    this.seriesRounds.push(outcome);
    this.history.unshift({ player, ai, outcome });
    if (this.history.length > 20) this.history.pop();

    this._showOutcome(outcome);
    this._render();

    const neededToWin = Math.ceil(this.bestOf / 2);
    if (this.seriesPlayerWins >= neededToWin || this.seriesAiWins >= neededToWin) {
      this.seriesOver = true;
      this._showSeriesBanner(this.seriesPlayerWins >= neededToWin);
    }

    this.animating = false;
    if (!this.paused && !this.seriesOver) {
      this._setChoicesEnabled(true);
    }
  }

  _showOutcome(outcome) {
    const messages = {
      win:  ['You win! 🎉', 'Nice one! 💪', 'Victory! ✨'],
      lose: ['You lose! 😢', 'AI wins! 🤖', 'Better luck! 🍀'],
      draw: ['It\'s a draw! 🤝', 'Tie game! ⚖️', 'Stalemate! 😐'],
    };
    const list = messages[outcome];
    this.el['result'].textContent = list[Math.floor(Math.random() * list.length)];
    this.el['result'].className = 'rock-paper-scissors-result ' + outcome;

    this.el['player-emoji'].classList.add(outcome === 'win' ? 'win' : outcome === 'lose' ? 'lose' : 'draw');
    this.el['ai-emoji'].classList.add(outcome === 'lose' ? 'win' : outcome === 'win' ? 'lose' : 'draw');
  }

  _showSeriesBanner(playerWon) {
    const area = this.el['banner-area'];
    area.innerHTML = '';

    const banner = document.createElement('div');
    banner.className = 'rock-paper-scissors-banner ' + (playerWon ? 'win' : 'lose');
    banner.textContent = playerWon
      ? `🏆 You won the series ${this.seriesPlayerWins}–${this.seriesAiWins}!`
      : `🤖 AI won the series ${this.seriesAiWins}–${this.seriesPlayerWins}`;
    area.appendChild(banner);

    const btn = document.createElement('button');
    btn.className = 'rock-paper-scissors-new-series-btn';
    btn.textContent = 'New Series';
    const handler = () => {
      this._resetSeries();
      this._render();
      this._setChoicesEnabled(true);
    };
    btn.addEventListener('click', handler);
    this._boundHandlers.push({ el: btn, evt: 'click', fn: handler });
    area.appendChild(btn);
  }

  /* ── Render helpers ──────────────────────── */

  _render() {
    this.el['wins'].textContent = this.wins;
    this.el['losses'].textContent = this.losses;
    this.el['draws'].textContent = this.draws;

    // streak
    const streakEl = this.el['streak'];
    if (this.streak >= 2) {
      streakEl.textContent = `🔥 Win streak: ${this.streak}`;
      streakEl.className = 'rock-paper-scissors-streak hot';
    } else if (this.bestStreak >= 2) {
      streakEl.textContent = `Best streak: ${this.bestStreak}`;
      streakEl.className = 'rock-paper-scissors-streak';
    } else {
      streakEl.textContent = '';
      streakEl.className = 'rock-paper-scissors-streak';
    }

    // series progress
    this._renderSeries();

    // history
    this._renderHistory();
  }

  _renderSeries() {
    const el = this.el['series'];
    const neededToWin = Math.ceil(this.bestOf / 2);
    let html = `Best of ${this.bestOf} — first to ${neededToWin}`;
    html += `<div class="rock-paper-scissors-series-dots">`;
    for (let i = 0; i < this.bestOf; i++) {
      const round = this.seriesRounds[i];
      const cls = round ? ' ' + round : '';
      html += `<div class="rock-paper-scissors-dot${cls}"></div>`;
    }
    html += '</div>';
    el.innerHTML = html;
  }

  _renderHistory() {
    const el = this.el['history'];
    el.innerHTML = '';
    this.history.slice(0, 8).forEach(entry => {
      const item = document.createElement('div');
      item.className = 'rock-paper-scissors-history-item';
      item.innerHTML = `
        <span>${this.EMOJI[entry.player]} vs ${this.EMOJI[entry.ai]}</span>
        <span class="rock-paper-scissors-history-result ${entry.outcome}">
          ${entry.outcome === 'win' ? 'Win' : entry.outcome === 'lose' ? 'Loss' : 'Draw'}
        </span>
      `;
      el.appendChild(item);
    });
  }

  /* ── Utilities ───────────────────────────── */

  _setChoicesEnabled(enabled) {
    this.el['choices'].querySelectorAll('.rock-paper-scissors-choice-btn').forEach(btn => {
      btn.classList.toggle('disabled', !enabled);
    });
  }

  _delay(fn, ms) {
    const id = setTimeout(fn, ms);
    this._timers.push(id);
    return id;
  }

  _clearTimers() {
    this._timers.forEach(id => clearTimeout(id));
    this._timers = [];
  }
}

window.RockPaperScissors = RockPaperScissors;
