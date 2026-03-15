/**
 * Higher or Lower Card Game
 * Player guesses if the next card will be higher or lower than the current card
 */

class HigherLower {
  constructor(container) {
    this.container = container;
    this.currentCard = null;
    this.nextCard = null;
    this.streak = 0;
    this.bestStreak = 0;
    this.gameActive = true;
    this.paused = false;
    this.animating = false;

    // Card suits and values
    this.suits = ['♠', '♥', '♦', '♣'];
    this.suitNames = ['Spades', 'Hearts', 'Diamonds', 'Clubs'];
    this.ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    this.rankValues = {
      'A': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8,
      '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13
    };

    this.init();
  }

  init() {
    // Clear container
    this.container.innerHTML = '';

    // Create main game structure
    const html = `
      <div class="higher-lower-game">
        <div class="higher-lower-header">
          <div class="higher-lower-title">Higher or Lower</div>
          <div class="higher-lower-stats">
            <div class="higher-lower-stat">
              <span class="higher-lower-stat-label">Streak</span>
              <span class="higher-lower-streak">0</span>
            </div>
            <div class="higher-lower-stat">
              <span class="higher-lower-stat-label">Best</span>
              <span class="higher-lower-best">0</span>
            </div>
          </div>
        </div>

        <div class="higher-lower-cards">
          <div class="higher-lower-card-slot">
            <div class="higher-lower-card higher-lower-card-current" data-card="current">
              <div class="higher-lower-card-inner">
                <div class="higher-lower-card-front">
                  <div class="higher-lower-card-rank">?</div>
                  <div class="higher-lower-card-suit">?</div>
                </div>
              </div>
            </div>
          </div>

          <div class="higher-lower-vs">VS</div>

          <div class="higher-lower-card-slot">
            <div class="higher-lower-card higher-lower-card-next" data-card="next">
              <div class="higher-lower-card-inner">
                <div class="higher-lower-card-back"></div>
                <div class="higher-lower-card-front" style="display: none;">
                  <div class="higher-lower-card-rank">?</div>
                  <div class="higher-lower-card-suit">?</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="higher-lower-buttons">
          <button class="higher-lower-button higher-lower-higher" data-action="higher">
            <span class="higher-lower-button-label">Higher</span>
            <span class="higher-lower-button-icon">↑</span>
          </button>
          <button class="higher-lower-button higher-lower-lower" data-action="lower">
            <span class="higher-lower-button-label">Lower</span>
            <span class="higher-lower-button-icon">↓</span>
          </button>
        </div>

        <div class="higher-lower-game-over" style="display: none;">
          <div class="higher-lower-game-over-content">
            <h2>Game Over!</h2>
            <div class="higher-lower-game-over-streak">
              <p class="higher-lower-game-over-label">Final Streak</p>
              <p class="higher-lower-game-over-value">0</p>
            </div>
            <div class="higher-lower-game-over-best">
              <p class="higher-lower-game-over-label">Best Streak</p>
              <p class="higher-lower-game-over-best-value">0</p>
            </div>
            <button class="higher-lower-button higher-lower-play-again">Play Again</button>
          </div>
        </div>
      </div>
    `;

    this.container.innerHTML = html;

    // Cache DOM elements
    this.gameEl = this.container.querySelector('.higher-lower-game');
    this.cardsEl = this.container.querySelector('.higher-lower-cards');
    this.currentCardEl = this.container.querySelector('[data-card="current"]');
    this.nextCardEl = this.container.querySelector('[data-card="next"]');
    this.streakEl = this.container.querySelector('.higher-lower-streak');
    this.bestEl = this.container.querySelector('.higher-lower-best');
    this.higherBtn = this.container.querySelector('[data-action="higher"]');
    this.lowerBtn = this.container.querySelector('[data-action="lower"]');
    this.gameOverEl = this.container.querySelector('.higher-lower-game-over');
    this.gameOverStreakEl = this.gameOverEl.querySelector('.higher-lower-game-over-value');
    this.gameOverBestEl = this.gameOverEl.querySelector('.higher-lower-game-over-best-value');
    this.playAgainBtn = this.gameOverEl.querySelector('.higher-lower-play-again');

    // Add event listeners
    this.higherBtn.addEventListener('click', () => this.guess('higher'));
    this.lowerBtn.addEventListener('click', () => this.guess('lower'));
    this.playAgainBtn.addEventListener('click', () => this.start());

    this.start();
  }

  generateCard() {
    const rank = this.ranks[Math.floor(Math.random() * this.ranks.length)];
    const suit = this.suits[Math.floor(Math.random() * this.suits.length)];
    return { rank, suit };
  }

  displayCard(cardEl, card) {
    const rankEl = cardEl.querySelector('.higher-lower-card-rank');
    const suitEl = cardEl.querySelector('.higher-lower-card-suit');

    if (rankEl) rankEl.textContent = card.rank;
    if (suitEl) suitEl.textContent = card.suit;
  }

  start() {
    this.currentCard = this.generateCard();
    this.nextCard = this.generateCard();
    this.streak = 0;
    this.gameActive = true;
    this.paused = false;
    this.animating = false;

    // Reset UI
    this.gameOverEl.style.display = 'none';
    this.cardsEl.style.display = 'flex';
    this.higherBtn.disabled = false;
    this.lowerBtn.disabled = false;
    this.higherBtn.classList.remove('disabled');
    this.lowerBtn.classList.remove('disabled');

    // Display current card
    this.displayCard(this.currentCardEl, this.currentCard);

    // Hide next card
    const nextCardBack = this.nextCardEl.querySelector('.higher-lower-card-back');
    const nextCardFront = this.nextCardEl.querySelector('.higher-lower-card-front');
    if (nextCardBack) nextCardBack.style.display = 'block';
    if (nextCardFront) nextCardFront.style.display = 'none';

    // Reset card transforms
    this.currentCardEl.classList.remove('flipped');
    this.nextCardEl.classList.remove('flipped', 'correct', 'incorrect');

    this.updateUI();
  }

  guess(direction) {
    if (!this.gameActive || this.paused || this.animating) return;

    this.animating = true;
    this.higherBtn.disabled = true;
    this.lowerBtn.disabled = true;

    // Flip the card
    const nextCardBack = this.nextCardEl.querySelector('.higher-lower-card-back');
    const nextCardFront = this.nextCardEl.querySelector('.higher-lower-card-front');

    if (nextCardBack) nextCardBack.style.display = 'none';
    if (nextCardFront) nextCardFront.style.display = 'block';

    this.nextCardEl.classList.add('flipped');

    // Display next card
    this.displayCard(this.nextCardEl, this.nextCard);

    // Wait for animation
    setTimeout(() => {
      const isCorrect = this.checkGuess(direction);

      if (isCorrect) {
        this.nextCardEl.classList.add('correct');
        this.streak++;
        if (this.streak > this.bestStreak) {
          this.bestStreak = this.streak;
        }

        // Move to next round
        setTimeout(() => {
          this.currentCard = this.nextCard;
          this.nextCard = this.generateCard();

          // Reset next card visual
          this.nextCardEl.classList.remove('flipped', 'correct');
          const backEl = this.nextCardEl.querySelector('.higher-lower-card-back');
          const frontEl = this.nextCardEl.querySelector('.higher-lower-card-front');
          if (backEl) backEl.style.display = 'block';
          if (frontEl) frontEl.style.display = 'none';

          // Move current card
          this.currentCardEl.style.transform = 'translateX(-120px)';
          this.nextCardEl.style.transform = 'translateX(-120px)';

          // Update current card display
          this.displayCard(this.currentCardEl, this.currentCard);

          this.updateUI();
          this.animating = false;
          this.higherBtn.disabled = false;
          this.lowerBtn.disabled = false;
        }, 600);
      } else {
        this.nextCardEl.classList.add('incorrect');
        this.gameOver();
      }
    }, 600);
  }

  checkGuess(direction) {
    const currentValue = this.rankValues[this.currentCard.rank];
    const nextValue = this.rankValues[this.nextCard.rank];

    if (direction === 'higher') {
      return nextValue >= currentValue;
    } else {
      return nextValue <= currentValue;
    }
  }

  gameOver() {
    this.gameActive = false;
    this.animating = false;

    setTimeout(() => {
      this.gameOverStreakEl.textContent = this.streak;
      this.gameOverBestEl.textContent = this.bestStreak;
      this.gameOverEl.style.display = 'flex';
      this.cardsEl.style.display = 'none';
    }, 600);
  }

  updateUI() {
    this.streakEl.textContent = this.streak;
    this.bestEl.textContent = this.bestStreak;
  }

  pause() {
    if (this.gameActive) {
      this.paused = true;
      this.higherBtn.disabled = true;
      this.lowerBtn.disabled = true;
      this.higherBtn.classList.add('disabled');
      this.lowerBtn.classList.add('disabled');
    }
  }

  resume() {
    if (this.gameActive) {
      this.paused = false;
      this.higherBtn.disabled = false;
      this.lowerBtn.disabled = false;
      this.higherBtn.classList.remove('disabled');
      this.lowerBtn.classList.remove('disabled');
    }
  }

  getScore() {
    return this.streak;
  }

  destroy() {
    // Remove event listeners
    if (this.higherBtn) {
      this.higherBtn.removeEventListener('click', () => {});
    }
    if (this.lowerBtn) {
      this.lowerBtn.removeEventListener('click', () => {});
    }
    if (this.playAgainBtn) {
      this.playAgainBtn.removeEventListener('click', () => {});
    }

    // Clear container
    this.container.innerHTML = '';

    // Reset state
    this.gameActive = false;
    this.paused = false;
    this.animating = false;
  }
}

// Export for use in other modules
window.HigherLower = HigherLower;
