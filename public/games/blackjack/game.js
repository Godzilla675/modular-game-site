class Blackjack {
  constructor(container) {
    this.container = container;
    this.chips = 1000;
    this.bet = 0;
    this.isPaused = false;
    this.gameState = 'betting'; // betting, playing, dealer, results, gameOver
    
    // Game state
    this.playerHand = [];
    this.dealerHand = [];
    this.playerValue = 0;
    this.dealerValue = 0;
    this.result = null;
    
    this.timers = [];
    this.listeners = [];
    
    this.init();
  }

  init() {
    this.setupDOM();
    this.attachListeners();
  }

  setupDOM() {
    this.container.innerHTML = `
      <div class="blackjack-game">
        <div class="blackjack-header">
          <h1 class="blackjack-title">BLACKJACK</h1>
          <div class="blackjack-stats">
            <div class="blackjack-stat">
              <span class="blackjack-stat-label">Chips</span>
              <span class="blackjack-stat-value" id="bj-chips">1000</span>
            </div>
            <div class="blackjack-stat">
              <span class="blackjack-stat-label">Bet</span>
              <span class="blackjack-stat-value" id="bj-bet">0</span>
            </div>
          </div>
        </div>

        <div class="blackjack-table">
          <!-- Dealer Section -->
          <div class="blackjack-section blackjack-dealer-section">
            <h3 class="blackjack-hand-label">Dealer</h3>
            <div class="blackjack-hand-value" id="bj-dealer-value"></div>
            <div class="blackjack-cards-container" id="bj-dealer-cards">
              <!-- Cards rendered here -->
            </div>
          </div>

          <!-- Player Section -->
          <div class="blackjack-section blackjack-player-section">
            <h3 class="blackjack-hand-label">Your Hand</h3>
            <div class="blackjack-hand-value" id="bj-player-value"></div>
            <div class="blackjack-cards-container" id="bj-player-cards">
              <!-- Cards rendered here -->
            </div>
          </div>

          <!-- Message Area -->
          <div class="blackjack-message" id="bj-message"></div>
        </div>

        <!-- Control Buttons -->
        <div class="blackjack-controls" id="bj-controls">
          <div class="blackjack-betting-controls" id="bj-betting-controls">
            <button class="blackjack-btn blackjack-bet-btn" data-amount="10">+10</button>
            <button class="blackjack-btn blackjack-bet-btn" data-amount="50">+50</button>
            <button class="blackjack-btn blackjack-bet-btn" data-amount="100">+100</button>
            <button class="blackjack-btn blackjack-bet-btn" data-amount="500">+500</button>
            <button class="blackjack-btn blackjack-clear-bet" id="bj-clear-bet">Clear</button>
            <button class="blackjack-btn blackjack-deal-btn" id="bj-deal">Deal</button>
          </div>

          <div class="blackjack-game-controls" id="bj-game-controls" style="display: none;">
            <button class="blackjack-btn blackjack-action-btn" id="bj-hit">Hit</button>
            <button class="blackjack-btn blackjack-action-btn" id="bj-stand">Stand</button>
            <button class="blackjack-btn blackjack-action-btn" id="bj-double" style="display: none;">Double Down</button>
          </div>

          <div class="blackjack-result-controls" id="bj-result-controls" style="display: none;">
            <button class="blackjack-btn blackjack-new-hand-btn" id="bj-new-hand">New Hand</button>
            <button class="blackjack-btn blackjack-quit-btn" id="bj-quit">Quit</button>
          </div>
        </div>

        <!-- Game Over Screen -->
        <div class="blackjack-game-over" id="bj-game-over" style="display: none;">
          <h2>Game Over</h2>
          <p>You've run out of chips!</p>
          <button class="blackjack-btn blackjack-restart-btn" id="bj-restart">Play Again</button>
        </div>
      </div>
    `;
  }

  attachListeners() {
    // Bet buttons
    this.container.querySelectorAll('.blackjack-bet-btn').forEach(btn => {
      const handler = () => this.addBet(parseInt(btn.dataset.amount));
      btn.addEventListener('click', handler);
      this.listeners.push({ element: btn, event: 'click', handler });
    });

    // Clear bet
    const clearBtn = this.container.querySelector('#bj-clear-bet');
    const clearHandler = () => this.clearBet();
    clearBtn.addEventListener('click', clearHandler);
    this.listeners.push({ element: clearBtn, event: 'click', handler: clearHandler });

    // Deal button
    const dealBtn = this.container.querySelector('#bj-deal');
    const dealHandler = () => this.deal();
    dealBtn.addEventListener('click', dealHandler);
    this.listeners.push({ element: dealBtn, event: 'click', handler: dealHandler });

    // Game action buttons
    const hitBtn = this.container.querySelector('#bj-hit');
    const hitHandler = () => this.hit();
    hitBtn.addEventListener('click', hitHandler);
    this.listeners.push({ element: hitBtn, event: 'click', handler: hitHandler });

    const standBtn = this.container.querySelector('#bj-stand');
    const standHandler = () => this.stand();
    standBtn.addEventListener('click', standHandler);
    this.listeners.push({ element: standBtn, event: 'click', handler: standHandler });

    const doubleBtn = this.container.querySelector('#bj-double');
    const doubleHandler = () => this.doubleDown();
    doubleBtn.addEventListener('click', doubleHandler);
    this.listeners.push({ element: doubleBtn, event: 'click', handler: doubleHandler });

    // New hand button
    const newHandBtn = this.container.querySelector('#bj-new-hand');
    const newHandHandler = () => this.resetHand();
    newHandBtn.addEventListener('click', newHandHandler);
    this.listeners.push({ element: newHandBtn, event: 'click', handler: newHandHandler });

    // Quit button
    const quitBtn = this.container.querySelector('#bj-quit');
    const quitHandler = () => this.resetHand();
    quitBtn.addEventListener('click', quitHandler);
    this.listeners.push({ element: quitBtn, event: 'click', handler: quitHandler });

    // Restart button
    const restartBtn = this.container.querySelector('#bj-restart');
    const restartHandler = () => this.start();
    restartBtn.addEventListener('click', restartHandler);
    this.listeners.push({ element: restartBtn, event: 'click', handler: restartHandler });
  }

  addBet(amount) {
    if (this.gameState !== 'betting') return;
    
    const newBet = this.bet + amount;
    if (newBet <= 500 && newBet <= this.chips) {
      this.bet = newBet;
      this.updateDisplay();
    } else if (newBet > 500) {
      this.showMessage('Maximum bet is 500 chips!', 'error');
    } else {
      this.showMessage('Not enough chips!', 'error');
    }
  }

  clearBet() {
    if (this.gameState !== 'betting') return;
    this.bet = 0;
    this.updateDisplay();
  }

  deal() {
    if (this.gameState !== 'betting' || this.bet < 10) {
      this.showMessage('Place a bet between 10-500 chips!', 'error');
      return;
    }

    this.gameState = 'playing';
    this.playerHand = [];
    this.dealerHand = [];
    this.result = null;

    // Deal initial hands
    this.playerHand.push(this.drawCard());
    this.dealerHand.push(this.drawCard());
    this.playerHand.push(this.drawCard());
    this.dealerHand.push(this.drawCard());

    this.updatePlayerValue();
    this.updateDealerValue(true); // Show only first card value initially

    // Check for blackjack
    if (this.playerValue === 21 && this.playerHand.length === 2) {
      this.gameState = 'dealer';
      this.showMessage('BLACKJACK!', 'win');
      const timer = setTimeout(() => this.dealerPlay(), 1500);
      this.timers.push(timer);
      return;
    }

    this.updateUI();
  }

  hit() {
    if (this.gameState !== 'playing') return;

    this.playerHand.push(this.drawCard());
    this.updatePlayerValue();

    if (this.playerValue > 21) {
      this.gameState = 'results';
      this.result = 'bust';
      this.showMessage('BUST! You went over 21.', 'lose');
      this.endHand();
    } else if (this.playerValue === 21) {
      this.stand();
    } else {
      this.updateUI();
    }
  }

  stand() {
    if (this.gameState !== 'playing') return;
    this.gameState = 'dealer';
    this.dealerPlay();
  }

  doubleDown() {
    if (this.gameState !== 'playing' || this.playerHand.length !== 2) return;
    if (this.bet * 2 > this.chips) {
      this.showMessage('Not enough chips to double down!', 'error');
      return;
    }

    this.bet *= 2;
    this.playerHand.push(this.drawCard());
    this.updatePlayerValue();

    if (this.playerValue > 21) {
      this.gameState = 'results';
      this.result = 'bust';
      this.showMessage('BUST! You went over 21.', 'lose');
      this.endHand();
    } else {
      this.gameState = 'dealer';
      const timer = setTimeout(() => this.dealerPlay(), 800);
      this.timers.push(timer);
    }
    this.updateUI();
  }

  dealerPlay() {
    if (this.isPaused) return;

    this.updateDealerValue(false); // Show full value now

    const dealerHit = () => {
      if (this.dealerValue < 17) {
        this.dealerHand.push(this.drawCard());
        this.updateDealerValue(false);
        this.updateUI();
        const timer = setTimeout(dealerHit, 800);
        this.timers.push(timer);
      } else {
        this.determineWinner();
      }
    };

    const timer = setTimeout(dealerHit, 1000);
    this.timers.push(timer);
  }

  determineWinner() {
    this.gameState = 'results';
    const playerBlackjack = this.playerValue === 21 && this.playerHand.length === 2;
    const dealerBlackjack = this.dealerValue === 21 && this.dealerHand.length === 2;

    if (playerBlackjack && !dealerBlackjack) {
      // Player blackjack pays 3:2
      const winnings = Math.floor(this.bet * 1.5);
      this.chips += this.bet + winnings;
      this.result = 'blackjack';
      this.showMessage('BLACKJACK! You win!', 'win');
    } else if (this.playerValue > 21) {
      this.result = 'bust';
      this.showMessage('You bust! Dealer wins!', 'lose');
    } else if (this.dealerValue > 21) {
      this.chips += this.bet * 2;
      this.result = 'dealer-bust';
      this.showMessage('Dealer busts! You win!', 'win');
    } else if (this.playerValue > this.dealerValue) {
      this.chips += this.bet * 2;
      this.result = 'win';
      this.showMessage('You win!', 'win');
    } else if (this.playerValue < this.dealerValue) {
      this.result = 'lose';
      this.showMessage('Dealer wins!', 'lose');
    } else {
      this.chips += this.bet;
      this.result = 'push';
      this.showMessage('Push! You get your bet back.', 'push');
    }

    this.endHand();
  }

  endHand() {
    this.updateDisplay();

    if (this.chips <= 0) {
      this.gameState = 'gameOver';
      const timer = setTimeout(() => {
        this.container.querySelector('#bj-game-over').style.display = 'block';
        this.container.querySelector('#bj-controls').style.display = 'none';
      }, 1500);
      this.timers.push(timer);
    } else {
      const resultControls = this.container.querySelector('#bj-result-controls');
      resultControls.style.display = 'flex';
    }
  }

  resetHand() {
    this.gameState = 'betting';
    this.playerHand = [];
    this.dealerHand = [];
    this.bet = 0;
    this.playerValue = 0;
    this.dealerValue = 0;
    this.result = null;

    this.container.querySelector('#bj-betting-controls').style.display = 'flex';
    this.container.querySelector('#bj-game-controls').style.display = 'none';
    this.container.querySelector('#bj-result-controls').style.display = 'none';

    this.updateDisplay();
    this.showMessage('Place your bet!', '');
  }

  drawCard() {
    const suits = ['♠', '♥', '♦', '♣'];
    const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    
    return {
      suit: suits[Math.floor(Math.random() * suits.length)],
      value: values[Math.floor(Math.random() * values.length)]
    };
  }

  getCardValue(card) {
    if (card.value === 'A') return 11;
    if (['J', 'Q', 'K'].includes(card.value)) return 10;
    return parseInt(card.value);
  }

  updatePlayerValue() {
    let value = 0;
    let aces = 0;

    for (const card of this.playerHand) {
      const cardValue = this.getCardValue(card);
      value += cardValue;
      if (card.value === 'A') aces++;
    }

    // Adjust for aces
    while (value > 21 && aces > 0) {
      value -= 10;
      aces--;
    }

    this.playerValue = value;
  }

  updateDealerValue(hideFirstCard = false) {
    let value = 0;
    let aces = 0;

    for (let i = 0; i < this.dealerHand.length; i++) {
      if (hideFirstCard && i === 0) continue;

      const card = this.dealerHand[i];
      const cardValue = this.getCardValue(card);
      value += cardValue;
      if (card.value === 'A') aces++;
    }

    // Adjust for aces
    while (value > 21 && aces > 0) {
      value -= 10;
      aces--;
    }

    this.dealerValue = value;
  }

  updateUI() {
    this.updateDisplay();
    this.renderCards();
    this.updateButtonStates();
  }

  updateDisplay() {
    document.querySelector('#bj-chips').textContent = this.chips;
    document.querySelector('#bj-bet').textContent = this.bet;
    document.querySelector('#bj-player-value').textContent = this.gameState === 'betting' ? '' : `Value: ${this.playerValue}`;
    
    const dealerValueEl = document.querySelector('#bj-dealer-value');
    if (this.gameState === 'playing' && this.dealerHand.length > 0) {
      dealerValueEl.textContent = `First Card Value: ${this.getCardValue(this.dealerHand[0])}`;
    } else if (this.gameState !== 'betting' && this.dealerHand.length > 0) {
      dealerValueEl.textContent = `Value: ${this.dealerValue}`;
    } else {
      dealerValueEl.textContent = '';
    }
  }

  renderCards() {
    const playerCardsEl = document.querySelector('#bj-player-cards');
    const dealerCardsEl = document.querySelector('#bj-dealer-cards');

    playerCardsEl.innerHTML = this.playerHand.map(card => this.createCardElement(card)).join('');

    dealerCardsEl.innerHTML = this.dealerHand.map((card, index) => {
      if (this.gameState === 'playing' && index === 0) {
        return '<div class="blackjack-card blackjack-card-back"><div class="blackjack-card-inner">?</div></div>';
      }
      return this.createCardElement(card);
    }).join('');
  }

  createCardElement(card) {
    const isRed = ['♥', '♦'].includes(card.suit);
    const cardClass = `blackjack-card ${isRed ? 'blackjack-red' : 'blackjack-black'}`;
    
    return `
      <div class="${cardClass}">
        <div class="blackjack-card-inner">
          <div class="blackjack-card-top">
            <div class="blackjack-card-value">${card.value}</div>
            <div class="blackjack-card-suit">${card.suit}</div>
          </div>
          <div class="blackjack-card-center">${card.suit}</div>
          <div class="blackjack-card-bottom">
            <div class="blackjack-card-value">${card.value}</div>
            <div class="blackjack-card-suit">${card.suit}</div>
          </div>
        </div>
      </div>
    `;
  }

  updateButtonStates() {
    const bettingControls = this.container.querySelector('#bj-betting-controls');
    const gameControls = this.container.querySelector('#bj-game-controls');
    const resultControls = this.container.querySelector('#bj-result-controls');

    if (this.gameState === 'betting') {
      bettingControls.style.display = 'flex';
      gameControls.style.display = 'none';
      resultControls.style.display = 'none';
    } else if (this.gameState === 'playing' || this.gameState === 'dealer') {
      bettingControls.style.display = 'none';
      gameControls.style.display = 'flex';
      resultControls.style.display = 'none';

      const doubleBtn = this.container.querySelector('#bj-double');
      doubleBtn.style.display = this.playerHand.length === 2 && this.bet * 2 <= this.chips ? 'block' : 'none';

      gameControls.querySelectorAll('button').forEach(btn => {
        btn.disabled = this.gameState === 'dealer';
      });
    } else if (this.gameState === 'results') {
      bettingControls.style.display = 'none';
      gameControls.style.display = 'none';
      resultControls.style.display = 'flex';
    }
  }

  showMessage(message, type) {
    const messageEl = document.querySelector('#bj-message');
    messageEl.textContent = message;
    messageEl.className = `blackjack-message ${type}`;
  }

  start() {
    this.chips = 1000;
    this.bet = 0;
    this.gameState = 'betting';
    this.playerHand = [];
    this.dealerHand = [];
    this.playerValue = 0;
    this.dealerValue = 0;
    this.result = null;

    this.container.querySelector('#bj-game-over').style.display = 'none';
    this.container.querySelector('#bj-controls').style.display = 'flex';
    this.container.querySelector('#bj-betting-controls').style.display = 'flex';
    this.container.querySelector('#bj-game-controls').style.display = 'none';
    this.container.querySelector('#bj-result-controls').style.display = 'none';

    this.updateDisplay();
    this.renderCards();
    this.showMessage('Place your bet!', '');
  }

  pause() {
    this.isPaused = true;
  }

  resume() {
    this.isPaused = false;
  }

  destroy() {
    // Clear all timers
    this.timers.forEach(timer => clearTimeout(timer));
    this.timers = [];

    // Remove all event listeners
    this.listeners.forEach(({ element, event, handler }) => {
      element.removeEventListener(event, handler);
    });
    this.listeners = [];

    // Clear DOM
    this.container.innerHTML = '';
  }

  getScore() {
    return this.chips;
  }
}

window.Blackjack = Blackjack;
