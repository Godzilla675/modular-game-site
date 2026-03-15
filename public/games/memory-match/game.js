/**
 * Memory Match Game
 * A classic card matching game with smooth animations and responsive design
 */

class MemoryMatch {
  constructor(container) {
    this.container = container;
    this.gameState = 'idle'; // idle, playing, paused, won
    this.moves = 0;
    this.matches = 0;
    this.mismatches = 0;
    this.timeElapsed = 0;
    this.timerInterval = null;
    this.gridSize = '4x4'; // default size
    this.cards = [];
    this.flippedCards = [];
    this.matchedPairs = new Set();
    this.isProcessing = false;
    this.matchCheckTimeout = null;
    
    this.emojis = [
      '🐶', '🐱', '🐭', '🐹', '🐰', '🦊',
      '🐻', '🐼', '🐨', '🐯', '🦁', '🐮',
      '🍎', '🍊', '🍌', '🍉', '🍓', '🍕',
      '⭐', '🌙', '☀️', '🎨', '🎭', '🎪'
    ];
  }

  /**
   * Initialize and start the game
   */
  start() {
    this.gameState = 'playing';
    this.moves = 0;
    this.matches = 0;
    this.mismatches = 0;
    this.timeElapsed = 0;
    this.cards = [];
    this.flippedCards = [];
    this.matchedPairs.clear();
    this.isProcessing = false;

    this.render();
    this.startTimer();
  }

  /**
   * Pause the game
   */
  pause() {
    if (this.gameState === 'playing') {
      this.gameState = 'paused';
      clearInterval(this.timerInterval);
      this.updatePauseButton();
    }
  }

  /**
   * Resume the game
   */
  resume() {
    if (this.gameState === 'paused') {
      this.gameState = 'playing';
      this.startTimer();
      this.updatePauseButton();
    }
  }

  /**
   * Get current score
   * Score = (pairs_found * 100) - (mismatches * 10), minimum 0
   */
  getScore() {
    const score = (this.matches * 100) - (this.mismatches * 10);
    return Math.max(0, score);
  }

  /**
   * Destroy the game and clean up all resources
   */
  destroy() {
    clearInterval(this.timerInterval);
    this.timerInterval = null;
    if (this.matchCheckTimeout) {
      clearTimeout(this.matchCheckTimeout);
      this.matchCheckTimeout = null;
    }
    this.gameState = 'idle';
    this.container.innerHTML = '';
    this.cards = [];
    this.flippedCards = [];
    this.matchedPairs.clear();
    this.isProcessing = false;
  }

  /**
   * Render the game UI
   */
  render() {
    const html = `
      <div class="memory-match-wrapper">
        <div class="memory-match-header">
          <h2 class="memory-match-title">Memory Match</h2>
          <div class="memory-match-controls">
            <div class="memory-match-size-selector">
              <label for="mm-size">Grid Size:</label>
              <select id="mm-size" class="memory-match-size-select">
                <option value="4x3">4x3 (6 pairs)</option>
                <option value="4x4" selected>4x4 (8 pairs)</option>
                <option value="6x4">6x4 (12 pairs)</option>
              </select>
            </div>
            <button class="memory-match-btn memory-match-new-game" id="mm-new-game">New Game</button>
          </div>
        </div>

        <div class="memory-match-stats">
          <div class="memory-match-stat">
            <span class="memory-match-stat-label">Moves:</span>
            <span class="memory-match-stat-value" id="mm-moves">0</span>
          </div>
          <div class="memory-match-stat">
            <span class="memory-match-stat-label">Matches:</span>
            <span class="memory-match-stat-value" id="mm-matches">0</span>
          </div>
          <div class="memory-match-stat">
            <span class="memory-match-stat-label">Time:</span>
            <span class="memory-match-stat-value" id="mm-timer">0:00</span>
          </div>
          <div class="memory-match-stat">
            <span class="memory-match-stat-label">Score:</span>
            <span class="memory-match-stat-value" id="mm-score">0</span>
          </div>
        </div>

        <div class="memory-match-game-area">
          <div class="memory-match-grid" id="mm-grid" data-size="${this.gridSize}"></div>
          <button class="memory-match-btn memory-match-pause-btn" id="mm-pause">Pause</button>
        </div>

        <div class="memory-match-modal" id="mm-modal">
          <div class="memory-match-modal-content">
            <h3 class="memory-match-modal-title">You Won!</h3>
            <div class="memory-match-modal-stats">
              <p>Moves: <strong id="mm-modal-moves">0</strong></p>
              <p>Time: <strong id="mm-modal-time">0:00</strong></p>
              <p>Score: <strong id="mm-modal-score">0</strong></p>
            </div>
            <button class="memory-match-btn memory-match-modal-btn" id="mm-play-again">Play Again</button>
          </div>
        </div>
      </div>
    `;

    this.container.innerHTML = html;
    this.attachEventListeners();
    this.generateCards();
    this.renderCards();
  }

  /**
   * Attach all event listeners
   */
  attachEventListeners() {
    const sizeSelect = this.container.querySelector('#mm-size');
    const newGameBtn = this.container.querySelector('#mm-new-game');
    const pauseBtn = this.container.querySelector('#mm-pause');
    const playAgainBtn = this.container.querySelector('#mm-play-again');

    sizeSelect.addEventListener('change', (e) => {
      this.gridSize = e.target.value;
      this.start();
    });

    newGameBtn.addEventListener('click', () => {
      this.start();
    });

    pauseBtn.addEventListener('click', () => {
      if (this.gameState === 'playing') {
        this.pause();
      } else if (this.gameState === 'paused') {
        this.resume();
      }
    });

    playAgainBtn.addEventListener('click', () => {
      this.hideModal();
      this.start();
    });
  }

  /**
   * Generate card pairs based on grid size
   */
  generateCards() {
    const [cols, rows] = this.gridSize.split('x').map(Number);
    const pairCount = (cols * rows) / 2;
    
    const selectedEmojis = this.emojis.slice(0, pairCount);
    const cardEmojis = [...selectedEmojis, ...selectedEmojis];
    
    // Shuffle cards
    for (let i = cardEmojis.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cardEmojis[i], cardEmojis[j]] = [cardEmojis[j], cardEmojis[i]];
    }

    this.cards = cardEmojis.map((emoji, index) => ({
      id: index,
      emoji,
      isFlipped: false,
      isMatched: false
    }));
  }

  /**
   * Render all cards to the DOM
   */
  renderCards() {
    const grid = this.container.querySelector('#mm-grid');
    const [cols] = this.gridSize.split('x').map(Number);
    
    grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    grid.innerHTML = '';

    this.cards.forEach((card) => {
      const cardEl = document.createElement('div');
      cardEl.className = 'memory-match-card';
      cardEl.dataset.cardId = card.id;
      
      cardEl.innerHTML = `
        <div class="memory-match-card-inner">
          <div class="memory-match-card-front">?</div>
          <div class="memory-match-card-back">${card.emoji}</div>
        </div>
      `;

      if (card.isFlipped || card.isMatched) {
        cardEl.classList.add('flipped');
      }

      cardEl.addEventListener('click', () => this.flipCard(card.id));
      grid.appendChild(cardEl);
    });
  }

  /**
   * Flip a card when clicked
   */
  flipCard(cardId) {
    // Can't interact while processing or if game is not playing
    if (this.isProcessing || this.gameState !== 'playing') {
      return;
    }

    const card = this.cards[cardId];

    // Can't flip already matched cards or already flipped cards
    if (card.isMatched || card.isFlipped) {
      return;
    }

    // Can't flip more than 2 cards
    if (this.flippedCards.length >= 2) {
      return;
    }

    // Flip the card
    card.isFlipped = true;
    this.flippedCards.push(cardId);
    this.updateCardDisplay(cardId);

    // If 2 cards are flipped, check for match
    if (this.flippedCards.length === 2) {
      this.moves++;
      this.updateStats();
      this.checkMatch();
    }
  }

  /**
   * Update card display in DOM
   */
  updateCardDisplay(cardId) {
    const cardEl = this.container.querySelector(`[data-card-id="${cardId}"]`);
    if (cardEl) {
      cardEl.classList.add('flipped');
    }
  }

  /**
   * Check if two flipped cards match
   */
  checkMatch() {
    this.isProcessing = true;
    const [cardId1, cardId2] = this.flippedCards;
    const card1 = this.cards[cardId1];
    const card2 = this.cards[cardId2];

    this.matchCheckTimeout = setTimeout(() => {
      this.matchCheckTimeout = null;
      if (card1.emoji === card2.emoji) {
        // Match found!
        card1.isMatched = true;
        card2.isMatched = true;
        this.matches++;
        this.updateStats();

        this.flippedCards = [];
        this.isProcessing = false;

        // Check if game is won
        if (this.matches === this.cards.length / 2) {
          this.gameWon();
        }
      } else {
        // No match, flip cards back
        this.mismatches++;
        card1.isFlipped = false;
        card2.isFlipped = false;

        const cardEl1 = this.container.querySelector(`[data-card-id="${cardId1}"]`);
        const cardEl2 = this.container.querySelector(`[data-card-id="${cardId2}"]`);
        
        if (cardEl1) cardEl1.classList.remove('flipped');
        if (cardEl2) cardEl2.classList.remove('flipped');

        this.updateStats();
        this.flippedCards = [];
        this.isProcessing = false;
      }
    }, 1000);
  }

  /**
   * Update game statistics display
   */
  updateStats() {
    const movesEl = this.container.querySelector('#mm-moves');
    const matchesEl = this.container.querySelector('#mm-matches');
    const scoreEl = this.container.querySelector('#mm-score');

    if (movesEl) movesEl.textContent = this.moves;
    if (matchesEl) matchesEl.textContent = this.matches;
    if (scoreEl) scoreEl.textContent = this.getScore();
  }

  /**
   * Start the game timer
   */
  startTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }

    this.timerInterval = setInterval(() => {
      if (this.gameState === 'playing') {
        this.timeElapsed++;
        this.updateTimerDisplay();
      }
    }, 1000);
  }

  /**
   * Update timer display
   */
  updateTimerDisplay() {
    const timerEl = this.container.querySelector('#mm-timer');
    if (timerEl) {
      const minutes = Math.floor(this.timeElapsed / 60);
      const seconds = this.timeElapsed % 60;
      timerEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
  }

  /**
   * Update pause button text
   */
  updatePauseButton() {
    const pauseBtn = this.container.querySelector('#mm-pause');
    if (pauseBtn) {
      pauseBtn.textContent = this.gameState === 'playing' ? 'Pause' : 'Resume';
    }
  }

  /**
   * Handle game win
   */
  gameWon() {
    this.gameState = 'won';
    clearInterval(this.timerInterval);
    this.showModal();
  }

  /**
   * Show win modal
   */
  showModal() {
    const modal = this.container.querySelector('#mm-modal');
    const movesEl = this.container.querySelector('#mm-modal-moves');
    const timeEl = this.container.querySelector('#mm-modal-time');
    const scoreEl = this.container.querySelector('#mm-modal-score');

    const minutes = Math.floor(this.timeElapsed / 60);
    const seconds = this.timeElapsed % 60;
    const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    if (movesEl) movesEl.textContent = this.moves;
    if (timeEl) timeEl.textContent = timeStr;
    if (scoreEl) scoreEl.textContent = this.getScore();

    if (modal) {
      modal.classList.add('active');
    }
  }

  /**
   * Hide win modal
   */
  hideModal() {
    const modal = this.container.querySelector('#mm-modal');
    if (modal) {
      modal.classList.remove('active');
    }
  }
}

// Export the class
window.MemoryMatch = MemoryMatch;
