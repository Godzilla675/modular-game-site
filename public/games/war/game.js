/**
 * War Card Game
 * A classic card game implementation for two players (player vs computer)
 */

class War {
  constructor(container) {
    this.container = container;
    this.gameState = 'idle'; // idle, playing, paused, gameOver
    this.autoPlay = false;
    this.autoPlayInterval = null;
    this.animationDelay = 800; // ms between auto plays

    // Game variables
    this.playerCards = [];
    this.computerCards = [];
    this.tableCards = { player: [], computer: [] };
    this.lastResult = '';
    this.roundCount = 0;

    // DOM elements
    this.elements = {};

    this.init();
  }

  /**
   * Initialize the game
   */
  init() {
    this.createDOM();
    this.setupEventListeners();
  }

  /**
   * Create the game DOM structure
   */
  createDOM() {
    this.container.innerHTML = '';
    this.container.className = 'war-container';

    // Header
    const header = document.createElement('div');
    header.className = 'war-header';
    header.innerHTML = `
      <h1>⚔️ WAR</h1>
      <p>Classic Card Battle Game</p>
    `;

    // Main game area
    const game = document.createElement('div');
    game.className = 'war-game';

    // Battle area
    const battle = document.createElement('div');
    battle.className = 'war-battle';
    battle.innerHTML = `
      <div class="war-player">
        <div class="war-player-label">YOU</div>
        <div class="war-card-slot war-player-slot">
          <div class="war-card war-card-back">BACK</div>
        </div>
        <div class="war-stat-box">
          <div class="war-stat-label">Cards</div>
          <div class="war-stat-value war-player-count">26</div>
        </div>
      </div>
      <div class="war-computer">
        <div class="war-computer-label">COMPUTER</div>
        <div class="war-card-slot war-computer-slot">
          <div class="war-card war-card-back">BACK</div>
        </div>
        <div class="war-stat-box">
          <div class="war-stat-label">Cards</div>
          <div class="war-stat-value war-computer-count">26</div>
        </div>
      </div>
    `;

    // Result display
    const result = document.createElement('div');
    result.className = 'war-result';
    result.textContent = 'Ready to battle!';
    this.elements.result = result;

    // Controls
    const controls = document.createElement('div');
    controls.className = 'war-controls';

    const flipBtn = document.createElement('button');
    flipBtn.className = 'war-button war-button-flip';
    flipBtn.id = 'flip-btn';
    flipBtn.textContent = 'Flip Card';
    this.elements.flipBtn = flipBtn;

    const autoBtn = document.createElement('button');
    autoBtn.className = 'war-button war-button-auto';
    autoBtn.id = 'auto-btn';
    autoBtn.textContent = '▶ Auto Play';
    this.elements.autoBtn = autoBtn;

    const resetBtn = document.createElement('button');
    resetBtn.className = 'war-button war-button-reset';
    resetBtn.id = 'reset-btn';
    resetBtn.textContent = 'New Game';
    this.elements.resetBtn = resetBtn;

    controls.appendChild(flipBtn);
    controls.appendChild(autoBtn);
    controls.appendChild(resetBtn);

    // Game over screen
    const gameOverScreen = document.createElement('div');
    gameOverScreen.className = 'war-game-over';
    gameOverScreen.style.display = 'none';
    this.elements.gameOverScreen = gameOverScreen;

    // Assemble DOM
    game.appendChild(battle);
    game.appendChild(result);
    game.appendChild(controls);
    game.appendChild(gameOverScreen);

    this.container.appendChild(header);
    this.container.appendChild(game);

    // Store slot references
    this.elements.playerSlot = this.container.querySelector('.war-player-slot');
    this.elements.computerSlot = this.container.querySelector('.war-computer-slot');
    this.elements.playerCount = this.container.querySelector('.war-player-count');
    this.elements.computerCount = this.container.querySelector('.war-computer-count');
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    this._handleFlip = () => {
      if (this.gameState === 'playing') {
        this.playRound();
      }
    };
    this._handleAuto = () => this.toggleAutoPlay();
    this._handleReset = () => this.start();

    this.elements.flipBtn.addEventListener('click', this._handleFlip);
    this.elements.autoBtn.addEventListener('click', this._handleAuto);
    this.elements.resetBtn.addEventListener('click', this._handleReset);
  }

  /**
   * Start or restart the game
   */
  start() {
    this.gameState = 'playing';
    this.autoPlay = false;
    this.roundCount = 0;
    this.lastResult = '';

    // Clear auto play if running
    if (this.autoPlayInterval) {
      clearInterval(this.autoPlayInterval);
      this.autoPlayInterval = null;
    }

    // Reset buttons
    this.elements.flipBtn.disabled = false;
    this.elements.autoBtn.disabled = false;
    this.elements.autoBtn.classList.remove('active');
    this.elements.autoBtn.textContent = '▶ Auto Play';
    this.elements.gameOverScreen.style.display = 'none';

    // Initialize deck
    this.initializeDeck();
    this.shuffle();
    this.dealCards();

    // Reset result display
    this.elements.result.className = 'war-result';
    this.elements.result.textContent = 'Ready to battle!';

    // Update UI
    this.updateDisplay();
  }

  /**
   * Initialize the deck (52 cards)
   */
  initializeDeck() {
    const values = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]; // 14 = Ace
    const suits = ['♠', '♥', '♦', '♣'];
    const deck = [];

    for (let suit of suits) {
      for (let value of values) {
        deck.push({ value, suit });
      }
    }

    return deck;
  }

  /**
   * Shuffle the deck using Fisher-Yates algorithm
   */
  shuffle() {
    let deck = this.initializeDeck();

    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    return deck;
  }

  /**
   * Deal cards - 26 to each player
   */
  dealCards() {
    const deck = this.shuffle();
    this.playerCards = deck.slice(0, 26);
    this.computerCards = deck.slice(26, 52);
    this.tableCards = { player: [], computer: [] };
  }

  /**
   * Play one round
   */
  playRound() {
    if (this.gameState !== 'playing') return;
    if (this.playerCards.length === 0 || this.computerCards.length === 0) {
      this.endGame();
      return;
    }

    this.battle();
    this.roundCount++;
    this.updateDisplay();
  }

  /**
   * Battle logic
   */
  battle() {
    const playerCard = this.playerCards.shift();
    const computerCard = this.computerCards.shift();

    this.tableCards.player.push(playerCard);
    this.tableCards.computer.push(computerCard);

    this.displayCards(playerCard, computerCard);

    const result = this.compareCards(playerCard, computerCard);

    if (result === 'tie') {
      this.war();
    } else if (result === 'player') {
      this.playerWins();
    } else {
      this.computerWins();
    }
  }

  /**
   * Compare two cards
   */
  compareCards(card1, card2) {
    if (card1.value > card2.value) return 'player';
    if (card2.value > card1.value) return 'computer';
    return 'tie';
  }

  /**
   * War logic - when there's a tie
   */
  war() {
    this.elements.result.className = 'war-result war';
    this.elements.result.textContent = '⚔️ WAR! Three cards face-down...';
    this.lastResult = 'war';

    // Take 3 cards face-down from each player
    for (let i = 0; i < 3; i++) {
      if (this.playerCards.length > 0) {
        this.tableCards.player.push(this.playerCards.shift());
      }
      if (this.computerCards.length > 0) {
        this.tableCards.computer.push(this.computerCards.shift());
      }
    }

    // Take 1 face-up card
    if (this.playerCards.length > 0 && this.computerCards.length > 0) {
      const playerCard = this.playerCards.shift();
      const computerCard = this.computerCards.shift();

      this.tableCards.player.push(playerCard);
      this.tableCards.computer.push(computerCard);

      this.displayCards(playerCard, computerCard);

      const result = this.compareCards(playerCard, computerCard);

      if (result === 'tie') {
        // Recursive war if another tie
        this.war();
      } else if (result === 'player') {
        this.playerWins();
      } else {
        this.computerWins();
      }
    }
  }

  /**
   * Player wins the round
   */
  playerWins() {
    this.elements.result.className = 'war-result player-win';
    this.elements.result.textContent = '✓ You win this round!';
    this.lastResult = 'player';

    // Player takes all cards on table
    this.playerCards = this.playerCards.concat(this.tableCards.player);
    this.playerCards = this.playerCards.concat(this.tableCards.computer);
    this.tableCards = { player: [], computer: [] };
  }

  /**
   * Computer wins the round
   */
  computerWins() {
    this.elements.result.className = 'war-result computer-win';
    this.elements.result.textContent = '✗ Computer wins this round!';
    this.lastResult = 'computer';

    // Computer takes all cards on table
    this.computerCards = this.computerCards.concat(this.tableCards.computer);
    this.computerCards = this.computerCards.concat(this.tableCards.player);
    this.tableCards = { player: [], computer: [] };
  }

  /**
   * Display cards in the slots
   */
  displayCards(playerCard, computerCard) {
    this.elements.playerSlot.innerHTML = this.createCardHTML(playerCard, 'player');
    this.elements.computerSlot.innerHTML = this.createCardHTML(computerCard, 'computer');
  }

  /**
   * Create HTML for a card
   */
  createCardHTML(card, player) {
    const isRed = card.suit === '♥' || card.suit === '♦';
    const className = `war-card ${isRed ? 'war-card-red' : 'war-card-black'}`;
    const value = this.getCardValue(card.value);

    return `<div class="${className}">
      <div class="war-card-value">${value}</div>
      <div class="war-card-suit">${card.suit}</div>
    </div>`;
  }

  /**
   * Convert card value to display string
   */
  getCardValue(value) {
    switch (value) {
      case 11:
        return 'J';
      case 12:
        return 'Q';
      case 13:
        return 'K';
      case 14:
        return 'A';
      default:
        return value.toString();
    }
  }

  /**
   * Update the display
   */
  updateDisplay() {
    this.elements.playerCount.textContent = this.playerCards.length + this.tableCards.player.length;
    this.elements.computerCount.textContent = this.computerCards.length + this.tableCards.computer.length;
  }

  /**
   * End the game
   */
  endGame() {
    this.gameState = 'gameOver';
    this.autoPlay = false;

    if (this.autoPlayInterval) {
      clearInterval(this.autoPlayInterval);
      this.autoPlayInterval = null;
    }

    this.elements.flipBtn.disabled = true;
    this.elements.autoBtn.disabled = true;
    this.elements.autoBtn.classList.remove('active');
    this.elements.autoBtn.textContent = '▶ Auto Play';

    const winner = this.playerCards.length > this.computerCards.length ? 'You' : 'Computer';
    const isPlayerWin = winner === 'You';

    this.elements.gameOverScreen.style.display = 'block';
    this.elements.gameOverScreen.innerHTML = `
      <h2>${isPlayerWin ? '🎉 You Win!' : '☠️ Game Over'}</h2>
      <p><span class="${isPlayerWin ? 'war-winner' : 'war-loser'}">${winner}</span> wins!</p>
      <p>Rounds played: ${this.roundCount}</p>
      <p>Your cards: ${this.playerCards.length}</p>
      <p>Computer cards: ${this.computerCards.length}</p>
    `;

    this.elements.result.className = 'war-result';
    this.elements.result.textContent = `Game Over - ${winner} wins!`;
  }

  /**
   * Toggle auto play mode
   */
  toggleAutoPlay() {
    if (!this.autoPlay) {
      this.autoPlay = true;
      this.elements.autoBtn.classList.add('active');
      this.elements.autoBtn.textContent = '⏸ Auto Playing...';
      this.elements.flipBtn.disabled = true;

      this.autoPlayInterval = setInterval(() => {
        if (this.gameState === 'playing') {
          this.playRound();
        }

        if (this.gameState === 'gameOver') {
          this.autoPlay = false;
          this.elements.autoBtn.classList.remove('active');
          this.elements.autoBtn.textContent = '▶ Auto Play';
          this.elements.flipBtn.disabled = true;
          clearInterval(this.autoPlayInterval);
          this.autoPlayInterval = null;
        }
      }, this.animationDelay);
    } else {
      this.autoPlay = false;
      this.elements.autoBtn.classList.remove('active');
      this.elements.autoBtn.textContent = '▶ Auto Play';
      this.elements.flipBtn.disabled = false;

      if (this.autoPlayInterval) {
        clearInterval(this.autoPlayInterval);
        this.autoPlayInterval = null;
      }
    }
  }

  /**
   * Pause the game
   */
  pause() {
    if (this.gameState === 'playing') {
      this.gameState = 'paused';
      this.elements.flipBtn.disabled = true;
      this.elements.autoBtn.disabled = true;

      if (this.autoPlayInterval) {
        clearInterval(this.autoPlayInterval);
        this.autoPlayInterval = null;
      }
    }
  }

  /**
   * Resume the game
   */
  resume() {
    if (this.gameState === 'paused') {
      this.gameState = 'playing';
      this.elements.flipBtn.disabled = false;
      this.elements.autoBtn.disabled = false;

      if (this.autoPlay) {
        this.startAutoPlayInterval();
      }
    }
  }

  /**
   * Start the auto play interval
   */
  startAutoPlayInterval() {
    this.autoPlayInterval = setInterval(() => {
      if (this.gameState === 'playing') {
        this.playRound();
      }

      if (this.gameState === 'gameOver') {
        this.autoPlay = false;
        this.elements.autoBtn.classList.remove('active');
        this.elements.autoBtn.textContent = '▶ Auto Play';
        clearInterval(this.autoPlayInterval);
        this.autoPlayInterval = null;
      }
    }, this.animationDelay);
  }

  /**
   * Get current score (player's card count)
   */
  getScore() {
    return this.playerCards.length + this.tableCards.player.length;
  }

  /**
   * Destroy the game - cleanup
   */
  destroy() {
    // Clear intervals
    if (this.autoPlayInterval) {
      clearInterval(this.autoPlayInterval);
      this.autoPlayInterval = null;
    }

    // Remove event listeners
    if (this.elements.flipBtn && this._handleFlip) {
      this.elements.flipBtn.removeEventListener('click', this._handleFlip);
    }
    if (this.elements.autoBtn && this._handleAuto) {
      this.elements.autoBtn.removeEventListener('click', this._handleAuto);
    }
    if (this.elements.resetBtn && this._handleReset) {
      this.elements.resetBtn.removeEventListener('click', this._handleReset);
    }

    // Clear DOM
    this.container.innerHTML = '';

    // Reset state
    this.gameState = 'idle';
    this.autoPlay = false;
    this.playerCards = [];
    this.computerCards = [];
    this.tableCards = { player: [], computer: [] };
    this.elements = {};
  }
}

// Export the War class
window.War = War;
