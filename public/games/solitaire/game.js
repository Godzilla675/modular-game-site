class Solitaire {
  constructor(container) {
    this.container = container;
    this.gameState = 'paused';
    this.score = 0;
    this.timerSeconds = 0;
    this.timerInterval = null;
    
    // Game state
    this.stock = [];
    this.waste = [];
    this.foundations = [[], [], [], []]; // Hearts, Diamonds, Clubs, Spades
    this.tableau = [[], [], [], [], [], [], []]; // 7 columns
    
    // UI state
    this.selectedCard = null;
    this.selectedPileType = null;
    this.selectedPileIndex = null;
    this.cardElements = new Map(); // Map of card to DOM element
    
    this.init();
  }

  init() {
    this.container.innerHTML = '';
    this.container.classList.add('solitaire-container');
    
    // Create main game layout
    const gameBoard = document.createElement('div');
    gameBoard.className = 'solitaire-board';
    
    // Top section: Stock, Waste, Foundations
    const topSection = document.createElement('div');
    topSection.className = 'solitaire-top-section';
    
    // Stock and waste piles
    const stockWasteContainer = document.createElement('div');
    stockWasteContainer.className = 'solitaire-stock-waste';
    
    this.stockPileEl = document.createElement('div');
    this.stockPileEl.className = 'solitaire-pile solitaire-stock-pile';
    this.stockPileEl.addEventListener('click', () => this.drawFromStock());
    
    this.wastePileEl = document.createElement('div');
    this.wastePileEl.className = 'solitaire-pile solitaire-waste-pile';
    
    stockWasteContainer.appendChild(this.stockPileEl);
    stockWasteContainer.appendChild(this.wastePileEl);
    
    // Foundations
    const foundationsContainer = document.createElement('div');
    foundationsContainer.className = 'solitaire-foundations';
    
    this.foundationEls = [];
    for (let i = 0; i < 4; i++) {
      const foundationEl = document.createElement('div');
      foundationEl.className = 'solitaire-pile solitaire-foundation-pile';
      foundationEl.dataset.foundationIndex = i;
      foundationEl.addEventListener('click', () => this.selectPile('foundation', i));
      this.foundationEls.push(foundationEl);
      foundationsContainer.appendChild(foundationEl);
    }
    
    topSection.appendChild(stockWasteContainer);
    topSection.appendChild(foundationsContainer);
    
    // Tableau (7 columns)
    const tableauContainer = document.createElement('div');
    tableauContainer.className = 'solitaire-tableau';
    
    this.tableauEls = [];
    for (let i = 0; i < 7; i++) {
      const columnEl = document.createElement('div');
      columnEl.className = 'solitaire-tableau-column';
      columnEl.dataset.columnIndex = i;
      
      const pileEl = document.createElement('div');
      pileEl.className = 'solitaire-pile solitaire-tableau-pile';
      pileEl.addEventListener('click', () => this.selectPile('tableau', i));
      
      columnEl.appendChild(pileEl);
      tableauContainer.appendChild(columnEl);
      this.tableauEls.push(pileEl);
    }
    
    // Info section
    const infoSection = document.createElement('div');
    infoSection.className = 'solitaire-info';
    
    this.scoreEl = document.createElement('div');
    this.scoreEl.className = 'solitaire-score';
    this.scoreEl.textContent = 'Score: 0';
    
    this.timerEl = document.createElement('div');
    this.timerEl.className = 'solitaire-timer';
    this.timerEl.textContent = 'Time: 0:00';
    
    this.statusEl = document.createElement('div');
    this.statusEl.className = 'solitaire-status';
    this.statusEl.textContent = 'Ready to play';
    
    infoSection.appendChild(this.scoreEl);
    infoSection.appendChild(this.timerEl);
    infoSection.appendChild(this.statusEl);
    
    gameBoard.appendChild(topSection);
    gameBoard.appendChild(tableauContainer);
    gameBoard.appendChild(infoSection);
    
    this.container.appendChild(gameBoard);
    this.gameBoard = gameBoard;
  }

  start() {
    this.reset();
    this.gameState = 'playing';
    this.startTimer();
    this.statusEl.textContent = 'Game started!';
  }

  pause() {
    if (this.gameState === 'playing') {
      this.gameState = 'paused';
      this.stopTimer();
      this.statusEl.textContent = 'Paused';
    }
  }

  resume() {
    if (this.gameState === 'paused') {
      this.gameState = 'playing';
      this.startTimer();
      this.statusEl.textContent = 'Resumed';
    }
  }

  destroy() {
    this.stopTimer();
    if (this.container) {
      this.container.innerHTML = '';
    }
  }

  reset() {
    this.score = 0;
    this.timerSeconds = 0;
    this.selectedCard = null;
    this.cardElements.clear();
    
    // Create and shuffle deck
    const deck = this.createDeck();
    this.shuffleDeck(deck);
    
    // Deal cards
    this.stock = [...deck];
    this.waste = [];
    this.foundations = [[], [], [], []];
    this.tableau = [[], [], [], [], [], [], []];
    
    // Deal to tableau: column i gets i+1 cards
    let deckIndex = 0;
    for (let col = 0; col < 7; col++) {
      for (let row = 0; row <= col; row++) {
        const card = this.stock.shift();
        card.faceUp = (row === col); // Only last card face up
        this.tableau[col].push(card);
      }
    }
    
    this.updateUI();
  }

  createDeck() {
    const suits = ['♠', '♥', '♦', '♣'];
    const suitNames = ['spades', 'hearts', 'diamonds', 'clubs'];
    const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
    
    const deck = [];
    for (let s = 0; s < 4; s++) {
      for (let r = 0; r < ranks.length; r++) {
        deck.push({
          suit: suits[s],
          suitName: suitNames[s],
          rank: ranks[r],
          value: values[r],
          faceUp: false,
          id: `${suitNames[s]}-${ranks[r]}`
        });
      }
    }
    return deck;
  }

  shuffleDeck(deck) {
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
  }

  drawFromStock() {
    if (this.gameState !== 'playing') return;
    
    if (this.stock.length === 0) {
      // Recycle waste pile to stock
      while (this.waste.length > 0) {
        const card = this.waste.pop();
        card.faceUp = false;
        this.stock.push(card);
      }
      this.updateUI();
      return;
    }
    
    // Draw one card from stock to waste
    const card = this.stock.pop();
    card.faceUp = true;
    this.waste.push(card);
    this.updateUI();
  }

  selectPile(pileType, pileIndex) {
    if (this.gameState !== 'playing') return;
    
    // If clicking the same pile, deselect
    if (this.selectedPileType === pileType && this.selectedPileIndex === pileIndex) {
      this.selectedCard = null;
      this.selectedPileType = null;
      this.selectedPileIndex = null;
      this.updateUI();
      return;
    }
    
    // Get the top card of the selected pile
    let pile = null;
    if (pileType === 'foundation') pile = this.foundations[pileIndex];
    else if (pileType === 'tableau') pile = this.tableau[pileIndex];
    else if (pileType === 'waste') pile = this.waste;
    
    if (!pile || pile.length === 0) return;
    
    const card = pile[pile.length - 1];
    
    if (!this.selectedCard) {
      // Select a card
      this.selectedCard = card;
      this.selectedPileType = pileType;
      this.selectedPileIndex = pileIndex;
      this.updateUI();
    } else {
      // Try to move the selected card to this pile
      const moveResult = this.tryMove(this.selectedPileType, this.selectedPileIndex, pileType, pileIndex);
      
      if (moveResult) {
        this.selectedCard = null;
        this.selectedPileType = null;
        this.selectedPileIndex = null;
        this.updateUI();
        
        // Check for win
        if (this.checkWin()) {
          this.endGame();
        }
      } else {
        // Move failed, select new card instead
        this.selectedCard = card;
        this.selectedPileType = pileType;
        this.selectedPileIndex = pileIndex;
        this.updateUI();
      }
    }
  }

  tryMove(fromType, fromIndex, toType, toIndex) {
    // Get source and destination piles
    let fromPile = null, toPile = null;
    
    if (fromType === 'foundation') fromPile = this.foundations[fromIndex];
    else if (fromType === 'tableau') fromPile = this.tableau[fromIndex];
    else if (fromType === 'waste') fromPile = this.waste;
    
    if (toType === 'foundation') toPile = this.foundations[toIndex];
    else if (toType === 'tableau') toPile = this.tableau[toIndex];
    
    if (!fromPile || !toPile || fromPile.length === 0) return false;
    
    // Get the card(s) to move
    let cardsToMove = [];
    let moveFromIndex = fromPile.length - 1;
    
    if (fromType === 'tableau') {
      // In tableau, can move multiple cards if first is face up
      const card = fromPile[moveFromIndex];
      if (!card.faceUp) return false;
      
      // Find the start of the sequence
      for (let i = moveFromIndex; i >= 0; i--) {
        if (!fromPile[i].faceUp) break;
        moveFromIndex = i;
      }
      
      cardsToMove = fromPile.slice(moveFromIndex);
    } else {
      // From waste or foundation, move only the top card
      cardsToMove = [fromPile[moveFromIndex]];
    }
    
    const topCard = cardsToMove[0];
    
    // Validate move
    if (toType === 'foundation') {
      // Can only move single cards to foundation
      if (cardsToMove.length !== 1) return false;
      
      const lastCard = toPile.length > 0 ? toPile[toPile.length - 1] : null;
      
      if (!lastCard) {
        // Foundation is empty, must be Ace
        if (topCard.value !== 1) return false;
      } else {
        // Must be same suit and next rank
        if (topCard.suitName !== lastCard.suitName || topCard.value !== lastCard.value + 1) {
          return false;
        }
      }
    } else if (toType === 'tableau') {
      // Can move multiple cards to tableau
      const lastCard = toPile.length > 0 ? toPile[toPile.length - 1] : null;
      
      if (!lastCard) {
        // Empty column, must be King
        if (topCard.value !== 13) return false;
      } else {
        // Must be opposite color and one rank lower
        if (!this.isOppositeColor(topCard, lastCard) || topCard.value !== lastCard.value - 1) {
          return false;
        }
      }
    }
    
    // Move is valid, execute it
    let movedCount = 0;
    if (fromType === 'tableau') {
      movedCount = cardsToMove.length;
      for (let card of cardsToMove) {
        fromPile.pop();
      }
      for (let card of cardsToMove) {
        toPile.push(card);
      }
    } else {
      movedCount = 1;
      fromPile.pop();
      toPile.push(topCard);
    }
    
    // Auto-flip the next card in the source pile if it's in tableau
    if (fromType === 'tableau' && fromPile.length > 0) {
      const nextCard = fromPile[fromPile.length - 1];
      if (!nextCard.faceUp) {
        nextCard.faceUp = true;
      }
    }
    
    // Calculate score
    if (toType === 'foundation') {
      this.score += fromType === 'waste' ? 10 : 15;
    } else if (toType === 'tableau' && fromType === 'waste') {
      this.score += 10;
    }
    
    return true;
  }

  isOppositeColor(card1, card2) {
    const isRed1 = card1.suitName === 'hearts' || card1.suitName === 'diamonds';
    const isRed2 = card2.suitName === 'hearts' || card2.suitName === 'diamonds';
    return isRed1 !== isRed2;
  }

  checkWin() {
    // All foundations must be full
    for (let foundation of this.foundations) {
      if (foundation.length !== 13) return false;
    }
    return true;
  }

  endGame() {
    this.gameState = 'won';
    this.stopTimer();
    const bonusTime = Math.max(0, 600 - this.timerSeconds); // Up to 10 minutes bonus
    const bonus = Math.floor(bonusTime / 10);
    this.score += bonus;
    this.statusEl.textContent = `You won! Final Score: ${this.score}`;
    this.updateUI();
  }

  updateUI() {
    // Update stock pile
    this.stockPileEl.innerHTML = '';
    if (this.stock.length > 0) {
      const cardEl = this.createCardElement(null, true); // Card back
      this.stockPileEl.appendChild(cardEl);
    }
    
    // Update waste pile
    this.wastePileEl.innerHTML = '';
    if (this.waste.length > 0) {
      const topCard = this.waste[this.waste.length - 1];
      const cardEl = this.createCardElement(topCard, false);
      if (this.selectedCard === topCard) {
        cardEl.classList.add('solitaire-selected');
      }
      this.wastePileEl.appendChild(cardEl);
    }
    
    // Update foundations
    for (let i = 0; i < 4; i++) {
      const foundationEl = this.foundationEls[i];
      foundationEl.innerHTML = '';
      const foundation = this.foundations[i];
      
      if (foundation.length > 0) {
        const topCard = foundation[foundation.length - 1];
        const cardEl = this.createCardElement(topCard, false);
        if (this.selectedCard === topCard) {
          cardEl.classList.add('solitaire-selected');
        }
        foundationEl.appendChild(cardEl);
      } else {
        // Show empty foundation with suit indicator
        const suits = ['♠', '♥', '♦', '♣'];
        const emptyEl = document.createElement('div');
        emptyEl.className = 'solitaire-empty-foundation';
        emptyEl.textContent = suits[i];
        foundationEl.appendChild(emptyEl);
      }
    }
    
    // Update tableau
    for (let i = 0; i < 7; i++) {
      const columnEl = this.tableauEls[i];
      columnEl.innerHTML = '';
      const column = this.tableau[i];
      
      for (let j = 0; j < column.length; j++) {
        const card = column[j];
        const cardEl = this.createCardElement(card, !card.faceUp);
        
        // Offset cards vertically
        cardEl.style.marginTop = j > 0 ? '20px' : '0';
        cardEl.style.position = 'relative';
        cardEl.style.zIndex = j;
        
        if (this.selectedCard === card) {
          cardEl.classList.add('solitaire-selected');
        }
        
        // Add double-click to auto-move to foundation
        cardEl.addEventListener('dblclick', (e) => {
          e.stopPropagation();
          this.autoMoveToFoundation(card, i);
        });
        
        columnEl.appendChild(cardEl);
      }
    }
    
    // Update score and timer
    this.scoreEl.textContent = `Score: ${this.score}`;
    
    const minutes = Math.floor(this.timerSeconds / 60);
    const seconds = this.timerSeconds % 60;
    this.timerEl.textContent = `Time: ${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  createCardElement(card, isBack) {
    const cardEl = document.createElement('div');
    cardEl.className = 'solitaire-card';
    
    if (isBack) {
      cardEl.classList.add('solitaire-card-back');
      cardEl.innerHTML = '<div class="solitaire-card-back-pattern"></div>';
    } else {
      cardEl.classList.add(`solitaire-suit-${card.suitName}`);
      
      const isRed = card.suitName === 'hearts' || card.suitName === 'diamonds';
      cardEl.style.color = isRed ? '#e74c3c' : '#2c3e50';
      
      const content = document.createElement('div');
      content.className = 'solitaire-card-content';
      
      const topLeft = document.createElement('div');
      topLeft.className = 'solitaire-card-corner solitaire-card-top-left';
      topLeft.innerHTML = `<div class="solitaire-rank">${card.rank}</div><div class="solitaire-suit">${card.suit}</div>`;
      
      const center = document.createElement('div');
      center.className = 'solitaire-card-center';
      center.textContent = card.suit;
      
      const bottomRight = document.createElement('div');
      bottomRight.className = 'solitaire-card-corner solitaire-card-bottom-right';
      bottomRight.innerHTML = `<div class="solitaire-rank">${card.rank}</div><div class="solitaire-suit">${card.suit}</div>`;
      
      content.appendChild(topLeft);
      content.appendChild(center);
      content.appendChild(bottomRight);
      cardEl.appendChild(content);
    }
    
    return cardEl;
  }

  autoMoveToFoundation(card, fromColumnIndex) {
    if (this.gameState !== 'playing') return;
    
    // Try to find the right foundation for this card
    for (let i = 0; i < 4; i++) {
      if (this.tryMove('tableau', fromColumnIndex, 'foundation', i)) {
        this.updateUI();
        if (this.checkWin()) {
          this.endGame();
        }
        return;
      }
    }
  }

  startTimer() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      this.timerSeconds++;
      this.updateUI();
    }, 1000);
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  getScore() {
    return this.score;
  }
}

window.Solitaire = Solitaire;
