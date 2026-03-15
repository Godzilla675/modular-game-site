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
    this.foundations = [[], [], [], []];
    this.tableau = [[], [], [], [], [], [], []];

    // Selection state
    this.selectedCard = null;
    this.selectedPileType = null;
    this.selectedPileIndex = null;
    this.selectedCardIndex = null; // index within the pile

    this.init();
  }

  init() {
    this.container.innerHTML = '';
    this.container.classList.add('solitaire-container');

    const gameBoard = document.createElement('div');
    gameBoard.className = 'solitaire-board';

    // Top section: Stock, Waste, Foundations
    const topSection = document.createElement('div');
    topSection.className = 'solitaire-top-section';

    const stockWasteContainer = document.createElement('div');
    stockWasteContainer.className = 'solitaire-stock-waste';

    this.stockPileEl = document.createElement('div');
    this.stockPileEl.className = 'solitaire-pile solitaire-stock-pile';
    this.stockPileEl.addEventListener('click', () => this.drawFromStock());

    this.wastePileEl = document.createElement('div');
    this.wastePileEl.className = 'solitaire-pile solitaire-waste-pile';
    this.wastePileEl.addEventListener('click', () => this.handleWasteClick());

    stockWasteContainer.appendChild(this.stockPileEl);
    stockWasteContainer.appendChild(this.wastePileEl);

    const foundationsContainer = document.createElement('div');
    foundationsContainer.className = 'solitaire-foundations';

    this.foundationEls = [];
    for (let i = 0; i < 4; i++) {
      const foundationEl = document.createElement('div');
      foundationEl.className = 'solitaire-pile solitaire-foundation-pile';
      foundationEl.dataset.foundationIndex = i;
      foundationEl.addEventListener('click', () => this.handlePileClick('foundation', i));
      this.foundationEls.push(foundationEl);
      foundationsContainer.appendChild(foundationEl);
    }

    topSection.appendChild(stockWasteContainer);
    topSection.appendChild(foundationsContainer);

    // Tableau
    const tableauContainer = document.createElement('div');
    tableauContainer.className = 'solitaire-tableau';

    this.tableauEls = [];
    for (let i = 0; i < 7; i++) {
      const columnEl = document.createElement('div');
      columnEl.className = 'solitaire-tableau-column';
      columnEl.dataset.columnIndex = i;

      const pileEl = document.createElement('div');
      pileEl.className = 'solitaire-pile solitaire-tableau-pile';
      // Click on empty area of the pile (not on a card)
      pileEl.addEventListener('click', (e) => {
        if (e.target === pileEl) {
          this.handlePileClick('tableau', i);
        }
      });

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
    this.stopTimer();
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
    this.clearSelection();

    const deck = this.createDeck();
    this.shuffleDeck(deck);

    this.stock = [...deck];
    this.waste = [];
    this.foundations = [[], [], [], []];
    this.tableau = [[], [], [], [], [], [], []];

    for (let col = 0; col < 7; col++) {
      for (let row = 0; row <= col; row++) {
        const card = this.stock.shift();
        card.faceUp = (row === col);
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

  clearSelection() {
    this.selectedCard = null;
    this.selectedPileType = null;
    this.selectedPileIndex = null;
    this.selectedCardIndex = null;
  }

  drawFromStock() {
    if (this.gameState !== 'playing') return;

    // Deselect any selected card first
    this.clearSelection();

    if (this.stock.length === 0) {
      while (this.waste.length > 0) {
        const card = this.waste.pop();
        card.faceUp = false;
        this.stock.push(card);
      }
      this.updateUI();
      return;
    }

    const card = this.stock.pop();
    card.faceUp = true;
    this.waste.push(card);
    this.updateUI();
  }

  handleWasteClick() {
    if (this.gameState !== 'playing') return;
    if (this.waste.length === 0) return;

    const topCard = this.waste[this.waste.length - 1];

    if (this.selectedCard) {
      // If waste card is already selected, deselect
      if (this.selectedCard === topCard) {
        this.clearSelection();
        this.updateUI();
        return;
      }
      // Can't move cards TO the waste pile, so just select the waste card instead
      this.selectedCard = topCard;
      this.selectedPileType = 'waste';
      this.selectedPileIndex = 0;
      this.selectedCardIndex = this.waste.length - 1;
      this.updateUI();
    } else {
      this.selectedCard = topCard;
      this.selectedPileType = 'waste';
      this.selectedPileIndex = 0;
      this.selectedCardIndex = this.waste.length - 1;
      this.updateUI();
    }
  }

  handlePileClick(pileType, pileIndex, cardIndexInPile) {
    if (this.gameState !== 'playing') return;

    let pile = null;
    if (pileType === 'foundation') pile = this.foundations[pileIndex];
    else if (pileType === 'tableau') pile = this.tableau[pileIndex];

    // If a card is already selected, try to move it here
    if (this.selectedCard) {
      // Clicking same pile+card = deselect
      if (this.selectedPileType === pileType && this.selectedPileIndex === pileIndex
          && cardIndexInPile !== undefined && this.selectedCardIndex === cardIndexInPile) {
        this.clearSelection();
        this.updateUI();
        return;
      }

      const moveResult = this.tryMove(
        this.selectedPileType, this.selectedPileIndex,
        pileType, pileIndex
      );

      if (moveResult) {
        this.clearSelection();
        this.updateUI();
        if (this.checkWin()) {
          this.endGame();
        }
        return;
      }

      // Move failed — if clicking a face-up card in tableau, select it instead
      if (pileType === 'tableau' && cardIndexInPile !== undefined) {
        const card = pile[cardIndexInPile];
        if (card && card.faceUp) {
          this.selectedCard = card;
          this.selectedPileType = pileType;
          this.selectedPileIndex = pileIndex;
          this.selectedCardIndex = cardIndexInPile;
          this.updateUI();
          return;
        }
      }

      // Clicked somewhere invalid, deselect
      this.clearSelection();
      this.updateUI();
      return;
    }

    // No card selected yet — try to select one
    if (!pile || pile.length === 0) return;

    if (pileType === 'tableau' && cardIndexInPile !== undefined) {
      const card = pile[cardIndexInPile];
      if (card && card.faceUp) {
        this.selectedCard = card;
        this.selectedPileType = pileType;
        this.selectedPileIndex = pileIndex;
        this.selectedCardIndex = cardIndexInPile;
        this.updateUI();
      }
    } else {
      // Foundation: select top card
      const card = pile[pile.length - 1];
      this.selectedCard = card;
      this.selectedPileType = pileType;
      this.selectedPileIndex = pileIndex;
      this.selectedCardIndex = pile.length - 1;
      this.updateUI();
    }
  }

  tryMove(fromType, fromIndex, toType, toIndex) {
    let fromPile = null, toPile = null;

    if (fromType === 'foundation') fromPile = this.foundations[fromIndex];
    else if (fromType === 'tableau') fromPile = this.tableau[fromIndex];
    else if (fromType === 'waste') fromPile = this.waste;

    if (toType === 'foundation') toPile = this.foundations[toIndex];
    else if (toType === 'tableau') toPile = this.tableau[toIndex];

    if (!fromPile || !toPile || fromPile.length === 0) return false;

    let cardsToMove = [];
    let moveFromIndex;

    if (fromType === 'tableau') {
      // Use selectedCardIndex to move from that card down
      moveFromIndex = this.selectedCardIndex != null
        ? this.selectedCardIndex
        : fromPile.length - 1;

      if (moveFromIndex < 0 || moveFromIndex >= fromPile.length) return false;
      if (!fromPile[moveFromIndex].faceUp) return false;

      cardsToMove = fromPile.slice(moveFromIndex);

      // Verify all cards in the sequence are face up
      if (cardsToMove.some(c => !c.faceUp)) return false;
    } else {
      cardsToMove = [fromPile[fromPile.length - 1]];
      moveFromIndex = fromPile.length - 1;
    }

    const topCard = cardsToMove[0];

    // Validate move
    if (toType === 'foundation') {
      if (cardsToMove.length !== 1) return false;

      const lastCard = toPile.length > 0 ? toPile[toPile.length - 1] : null;

      if (!lastCard) {
        if (topCard.value !== 1) return false;
      } else {
        if (topCard.suitName !== lastCard.suitName || topCard.value !== lastCard.value + 1) {
          return false;
        }
      }
    } else if (toType === 'tableau') {
      const lastCard = toPile.length > 0 ? toPile[toPile.length - 1] : null;

      if (!lastCard) {
        if (topCard.value !== 13) return false;
      } else {
        if (!this.isOppositeColor(topCard, lastCard) || topCard.value !== lastCard.value - 1) {
          return false;
        }
      }
    }

    // Execute move
    if (fromType === 'tableau') {
      fromPile.splice(moveFromIndex, cardsToMove.length);
    } else {
      fromPile.pop();
    }

    for (const card of cardsToMove) {
      toPile.push(card);
    }

    // Auto-flip the next card in tableau source
    if (fromType === 'tableau' && fromPile.length > 0) {
      const nextCard = fromPile[fromPile.length - 1];
      if (!nextCard.faceUp) {
        nextCard.faceUp = true;
      }
    }

    // Score
    if (toType === 'foundation') {
      this.score += fromType === 'waste' ? 10 : 15;
    } else if (toType === 'tableau' && fromType === 'waste') {
      this.score += 5;
    }

    return true;
  }

  isOppositeColor(card1, card2) {
    const isRed1 = card1.suitName === 'hearts' || card1.suitName === 'diamonds';
    const isRed2 = card2.suitName === 'hearts' || card2.suitName === 'diamonds';
    return isRed1 !== isRed2;
  }

  checkWin() {
    for (const foundation of this.foundations) {
      if (foundation.length !== 13) return false;
    }
    return true;
  }

  endGame() {
    this.gameState = 'won';
    this.stopTimer();
    const bonusTime = Math.max(0, 600 - this.timerSeconds);
    const bonus = Math.floor(bonusTime / 10);
    this.score += bonus;
    this.statusEl.textContent = `You won! Final Score: ${this.score}`;
    this.updateUI();
  }

  updateUI() {
    // Stock pile
    this.stockPileEl.innerHTML = '';
    if (this.stock.length > 0) {
      const cardEl = this.createCardElement(null, true);
      this.stockPileEl.appendChild(cardEl);
    }

    // Waste pile
    this.wastePileEl.innerHTML = '';
    if (this.waste.length > 0) {
      const topCard = this.waste[this.waste.length - 1];
      const cardEl = this.createCardElement(topCard, false);
      if (this.selectedCard === topCard) {
        cardEl.classList.add('solitaire-selected');
      }
      this.wastePileEl.appendChild(cardEl);
    }

    // Foundations
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
        const suits = ['♠', '♥', '♦', '♣'];
        const emptyEl = document.createElement('div');
        emptyEl.className = 'solitaire-empty-foundation';
        emptyEl.textContent = suits[i];
        foundationEl.appendChild(emptyEl);
      }
    }

    // Tableau
    for (let i = 0; i < 7; i++) {
      const pileEl = this.tableauEls[i];
      pileEl.innerHTML = '';
      const column = this.tableau[i];

      for (let j = 0; j < column.length; j++) {
        const card = column[j];
        const cardEl = this.createCardElement(card, !card.faceUp);

        cardEl.style.marginTop = j > 0 ? '20px' : '0';
        cardEl.style.position = 'relative';
        cardEl.style.zIndex = j;

        // Highlight selected card and cards below it in the stack
        if (this.selectedCard && this.selectedPileType === 'tableau'
            && this.selectedPileIndex === i && this.selectedCardIndex !== null
            && j >= this.selectedCardIndex && card.faceUp) {
          cardEl.classList.add('solitaire-selected');
        }

        if (card.faceUp) {
          const colIdx = i;
          const cardIdx = j;
          cardEl.addEventListener('click', (e) => {
            e.stopPropagation();
            this.handlePileClick('tableau', colIdx, cardIdx);
          });

          cardEl.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            this.autoMoveToFoundation(colIdx);
          });
        }

        pileEl.appendChild(cardEl);
      }
    }

    // Score and timer
    this.scoreEl.textContent = `Score: ${this.score}`;
    this.updateTimerDisplay();
  }

  updateTimerDisplay() {
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

  autoMoveToFoundation(fromColumnIndex) {
    if (this.gameState !== 'playing') return;

    // Set selectedCardIndex to the top card for tryMove
    const col = this.tableau[fromColumnIndex];
    if (col.length === 0) return;

    const savedCard = this.selectedCard;
    const savedType = this.selectedPileType;
    const savedIndex = this.selectedPileIndex;
    const savedCardIdx = this.selectedCardIndex;

    this.selectedCardIndex = col.length - 1;

    for (let i = 0; i < 4; i++) {
      if (this.tryMove('tableau', fromColumnIndex, 'foundation', i)) {
        this.clearSelection();
        this.updateUI();
        if (this.checkWin()) {
          this.endGame();
        }
        return;
      }
    }

    // Restore selection if no move was made
    this.selectedCard = savedCard;
    this.selectedPileType = savedType;
    this.selectedPileIndex = savedIndex;
    this.selectedCardIndex = savedCardIdx;
  }

  startTimer() {
    this.stopTimer();
    this.timerInterval = setInterval(() => {
      this.timerSeconds++;
      this.updateTimerDisplay();
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
