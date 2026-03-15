class Hangman {
  constructor(container) {
    this.container = container;
    this.gameState = {
      word: '',
      category: '',
      guessedLetters: new Set(),
      wrongGuesses: new Set(),
      gameOver: false,
      won: false,
      paused: false,
    };

    // Word list by category
    this.wordList = {
      Animals: [
        'elephant', 'giraffe', 'penguin', 'dolphin', 'rhinoceros',
        'butterfly', 'crocodile', 'hippopotamus', 'chimpanzee', 'flamingo',
        'platypus', 'anteater', 'kangaroo', 'koala', 'zebra',
        'porcupine', 'badger', 'otter', 'panda', 'sloth',
        'alligator', 'mongoose', 'ocelot', 'armadillo', 'alpaca',
        'llama', 'bison', 'caribou', 'tapir', 'numbat',
      ],
      Countries: [
        'australia', 'denmark', 'kazakhstan', 'switzerland', 'argentina',
        'netherlands', 'finland', 'scotland', 'thailand', 'venezuela',
        'portugal', 'cameron', 'tanzania', 'bolivia', 'peru',
        'uruguay', 'georgia', 'tunisia', 'slovenia', 'uganda',
        'estonia', 'mozambique', 'mauritius', 'malta', 'cyprus',
        'senegal', 'zambia', 'nairobi', 'ethiopia', 'guatemala',
      ],
      Foods: [
        'spaghetti', 'lasagna', 'ravioli', 'burrito', 'enchilada',
        'bruschetta', 'focaccia', 'gnocchi', 'risotto', 'tiramisu',
        'paella', 'ratatouille', 'pancakes', 'crepes', 'waffle',
        'croissant', 'baguette', 'cheesecake', 'brownie', 'cookies',
        'sandwich', 'hamburger', 'tacos', 'fajitas', 'quesadilla',
        'antipasto', 'calamari', 'ceviche', 'tempura', 'satay',
      ],
      Sports: [
        'basketball', 'volleyball', 'badminton', 'archery', 'wrestling',
        'gymnastics', 'skateboarding', 'snowboarding', 'surfing', 'bowling',
        'lacrosse', 'cricket', 'squash', 'pingpong', 'pickleball',
        'curling', 'fencing', 'horseshoes', 'cornhole', 'tetherball',
        'croquet', 'polo', 'rugby', 'hurling', 'javelin',
        'discus', 'kayaking', 'canoeing', 'rafting', 'triathlon',
      ],
      Movies: [
        'titanic', 'inception', 'interstellar', 'casablanca', 'singin',
        'jaws', 'psycho', 'vertigo', 'airplane', 'ghostbusters',
        'beetlejuice', 'gremlins', 'poltergeist', 'labyrinth', 'willow',
        'highlander', 'predator', 'terminator', 'commando', 'robocop',
        'drivendeadpool', 'wolverine', 'xmen', 'ironman', 'thor',
        'captainamerica', 'blackpanther', 'antman', 'doctorstrange',
      ],
    };

    this.DOM = {};
    this.canvasContext = null;
    this.animationFrameIds = [];
    this.eventListeners = [];
    this.initialized = false;

    this.init();
  }

  init() {
    this.buildDOM();
    this.attachEventListeners();
    this.initialized = true;
  }

  buildDOM() {
    this.container.innerHTML = '';
    this.container.className = 'hangman-container';

    // Main game wrapper
    const gameWrapper = document.createElement('div');
    gameWrapper.className = 'hangman-wrapper';

    // Canvas for hangman drawing
    const canvasContainer = document.createElement('div');
    canvasContainer.className = 'hangman-canvas-container';
    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 350;
    canvas.className = 'hangman-canvas';
    canvasContainer.appendChild(canvas);
    this.DOM.canvas = canvas;
    this.canvasContext = canvas.getContext('2d');

    // Info section
    const infoSection = document.createElement('div');
    infoSection.className = 'hangman-info-section';

    const categoryText = document.createElement('div');
    categoryText.className = 'hangman-category';
    this.DOM.category = categoryText;

    const scoreText = document.createElement('div');
    scoreText.className = 'hangman-score';
    this.DOM.scoreDisplay = scoreText;

    const wrongCountText = document.createElement('div');
    wrongCountText.className = 'hangman-wrong-count';
    this.DOM.wrongCount = wrongCountText;

    infoSection.appendChild(categoryText);
    infoSection.appendChild(scoreText);
    infoSection.appendChild(wrongCountText);

    // Word display
    const wordDisplay = document.createElement('div');
    wordDisplay.className = 'hangman-word-display';
    this.DOM.wordDisplay = wordDisplay;

    // Used letters display
    const usedLettersSection = document.createElement('div');
    usedLettersSection.className = 'hangman-used-letters-section';
    const usedLettersLabel = document.createElement('span');
    usedLettersLabel.textContent = 'Used: ';
    usedLettersLabel.className = 'hangman-used-letters-label';
    const usedLetters = document.createElement('div');
    usedLetters.className = 'hangman-used-letters';
    this.DOM.usedLetters = usedLetters;
    usedLettersSection.appendChild(usedLettersLabel);
    usedLettersSection.appendChild(usedLetters);

    // Alphabet buttons
    const keyboardSection = document.createElement('div');
    keyboardSection.className = 'hangman-keyboard';
    this.DOM.keyboardSection = keyboardSection;
    this.buildAlphabet();

    // Hint button
    const hintButton = document.createElement('button');
    hintButton.className = 'hangman-hint-button';
    hintButton.textContent = 'Hint';
    this.DOM.hintButton = hintButton;

    // Control buttons
    const controlsSection = document.createElement('div');
    controlsSection.className = 'hangman-controls';

    const pauseButton = document.createElement('button');
    pauseButton.className = 'hangman-pause-button';
    pauseButton.textContent = 'Pause';
    this.DOM.pauseButton = pauseButton;

    const newGameButton = document.createElement('button');
    newGameButton.className = 'hangman-new-game-button';
    newGameButton.textContent = 'New Game';
    this.DOM.newGameButton = newGameButton;

    controlsSection.appendChild(hintButton);
    controlsSection.appendChild(pauseButton);
    controlsSection.appendChild(newGameButton);

    // Combine all sections
    gameWrapper.appendChild(canvasContainer);
    gameWrapper.appendChild(infoSection);
    gameWrapper.appendChild(wordDisplay);
    gameWrapper.appendChild(usedLettersSection);
    gameWrapper.appendChild(keyboardSection);
    gameWrapper.appendChild(controlsSection);

    this.container.appendChild(gameWrapper);

    // Overlay for win/lose
    const overlay = document.createElement('div');
    overlay.className = 'hangman-overlay hidden';
    this.DOM.overlay = overlay;

    const overlayContent = document.createElement('div');
    overlayContent.className = 'hangman-overlay-content';

    const overlayMessage = document.createElement('h2');
    overlayMessage.className = 'hangman-overlay-message';
    this.DOM.overlayMessage = overlayMessage;

    const overlayWord = document.createElement('p');
    overlayWord.className = 'hangman-overlay-word';
    this.DOM.overlayWord = overlayWord;

    overlayContent.appendChild(overlayMessage);
    overlayContent.appendChild(overlayWord);
    overlay.appendChild(overlayContent);
    this.container.appendChild(overlay);
  }

  buildAlphabet() {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    letters.forEach((letter) => {
      const button = document.createElement('button');
      button.className = 'hangman-letter-button';
      button.textContent = letter;
      button.dataset.letter = letter.toLowerCase();
      this.DOM.keyboardSection.appendChild(button);
    });
  }

  attachEventListeners() {
    // Letter buttons
    this.DOM.keyboardSection.addEventListener('click', (e) => {
      if (e.target.classList.contains('hangman-letter-button')) {
        this.guessLetter(e.target.dataset.letter);
      }
    });

    // Physical keyboard
    const keyboardHandler = (e) => {
      const letter = e.key.toLowerCase();
      if (/^[a-z]$/.test(letter) && !this.gameState.paused && !this.gameState.gameOver) {
        const btn = this.DOM.keyboardSection.querySelector(`[data-letter="${letter}"]`);
        if (btn && !btn.disabled) {
          this.guessLetter(letter);
        }
      }
    };
    document.addEventListener('keydown', keyboardHandler);
    this.eventListeners.push({ element: document, event: 'keydown', handler: keyboardHandler });

    // Hint button
    this.DOM.hintButton.addEventListener('click', () => this.useHint());
    this.DOM.pauseButton.addEventListener('click', () => this.togglePause());
    this.DOM.newGameButton.addEventListener('click', () => this.start());

    // Overlay click to new game
    this.DOM.overlay.addEventListener('click', () => this.start());
  }

  start() {
    if (!this.initialized) this.init();

    this.gameState = {
      word: '',
      category: '',
      guessedLetters: new Set(),
      wrongGuesses: new Set(),
      gameOver: false,
      won: false,
      paused: false,
    };

    // Pick random category and word
    const categories = Object.keys(this.wordList);
    this.gameState.category = categories[Math.floor(Math.random() * categories.length)];
    const words = this.wordList[this.gameState.category];
    this.gameState.word = words[Math.floor(Math.random() * words.length)].toLowerCase();

    this.DOM.pauseButton.textContent = 'Pause';
    this.DOM.overlay.classList.add('hidden');

    // Reset UI
    this.resetKeyboard();
    this.updateDisplay();
    this.drawHangman();
  }

  resetKeyboard() {
    this.DOM.keyboardSection.querySelectorAll('.hangman-letter-button').forEach((btn) => {
      btn.disabled = false;
      btn.className = 'hangman-letter-button';
    });
  }

  guessLetter(letter) {
    if (this.gameState.gameOver || this.gameState.paused || this.gameState.guessedLetters.has(letter)) {
      return;
    }

    const button = this.DOM.keyboardSection.querySelector(`[data-letter="${letter}"]`);
    button.disabled = true;

    const isCorrect = this.gameState.word.includes(letter);

    if (isCorrect) {
      this.gameState.guessedLetters.add(letter);
      button.classList.add('hangman-letter-correct');
    } else {
      this.gameState.wrongGuesses.add(letter);
      button.classList.add('hangman-letter-wrong');
      this.drawHangman();
    }

    this.updateDisplay();
    this.checkGameStatus();
  }

  useHint() {
    if (this.gameState.gameOver || this.gameState.paused || this.gameState.wrongGuesses.size >= 6) {
      return;
    }

    // Find unrevealed letters
    const unrevealed = [...this.gameState.word].filter(
      (letter) => !this.gameState.guessedLetters.has(letter)
    );

    if (unrevealed.length === 0) return;

    const randomLetter = unrevealed[Math.floor(Math.random() * unrevealed.length)];
    this.guessLetter(randomLetter);
    this.gameState.wrongGuesses.add('hint');
  }

  togglePause() {
    this.gameState.paused = !this.gameState.paused;
    this.DOM.pauseButton.textContent = this.gameState.paused ? 'Resume' : 'Pause';
    this.DOM.pauseButton.classList.toggle('hangman-paused');
  }

  pause() {
    if (!this.gameState.paused) {
      this.gameState.paused = true;
      this.DOM.pauseButton.textContent = 'Resume';
      this.DOM.pauseButton.classList.add('hangman-paused');
    }
  }

  resume() {
    if (this.gameState.paused) {
      this.gameState.paused = false;
      this.DOM.pauseButton.textContent = 'Pause';
      this.DOM.pauseButton.classList.remove('hangman-paused');
    }
  }

  updateDisplay() {
    // Category
    this.DOM.category.textContent = `Category: ${this.gameState.category}`;

    // Word display
    const displayWord = [...this.gameState.word]
      .map((letter) => (this.gameState.guessedLetters.has(letter) ? letter : '_'))
      .join(' ');
    this.DOM.wordDisplay.textContent = displayWord;

    // Wrong count
    const wrongCount = this.gameState.wrongGuesses.size;
    this.DOM.wrongCount.textContent = `Wrong: ${wrongCount}/6`;

    // Score
    this.DOM.scoreDisplay.textContent = `Score: ${this.getScore()}`;

    // Used letters
    const allUsed = Array.from(this.gameState.guessedLetters).concat(Array.from(this.gameState.wrongGuesses));
    this.DOM.usedLetters.innerHTML = allUsed
      .filter(letter => letter !== 'hint')
      .map((letter) => {
        const isCorrect = this.gameState.word.includes(letter);
        const className = isCorrect ? 'hangman-used-letter-correct' : 'hangman-used-letter-wrong';
        return `<span class="${className}">${letter}</span>`;
      })
      .join('');
  }

  checkGameStatus() {
    // Check win
    const allLettersGuessed = [...this.gameState.word].every((letter) => this.gameState.guessedLetters.has(letter));
    if (allLettersGuessed) {
      this.gameState.gameOver = true;
      this.gameState.won = true;
      this.showOverlay();
      return;
    }

    // Check loss
    if (this.gameState.wrongGuesses.size >= 6) {
      this.gameState.gameOver = true;
      this.gameState.won = false;
      this.showOverlay();
    }
  }

  showOverlay() {
    const message = this.gameState.won ? '🎉 You Won!' : '💀 Game Over!';
    this.DOM.overlayMessage.textContent = message;
    this.DOM.overlayWord.textContent = `The word was: ${this.gameState.word.toUpperCase()}`;
    this.DOM.overlay.classList.remove('hidden');

    // Disable all buttons
    this.DOM.keyboardSection.querySelectorAll('.hangman-letter-button').forEach((btn) => {
      btn.disabled = true;
    });
  }

  drawHangman() {
    const ctx = this.canvasContext;
    const wrongCount = this.gameState.wrongGuesses.size;

    ctx.clearRect(0, 0, this.DOM.canvas.width, this.DOM.canvas.height);
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.fillStyle = '#333';

    // Gallows
    ctx.beginPath();
    ctx.moveTo(10, 320);
    ctx.lineTo(150, 320);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(50, 320);
    ctx.lineTo(50, 20);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(50, 20);
    ctx.lineTo(130, 20);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(130, 20);
    ctx.lineTo(130, 50);
    ctx.stroke();

    // Head
    if (wrongCount >= 1) {
      ctx.beginPath();
      ctx.arc(130, 70, 20, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Body
    if (wrongCount >= 2) {
      ctx.beginPath();
      ctx.moveTo(130, 90);
      ctx.lineTo(130, 150);
      ctx.stroke();
    }

    // Left arm
    if (wrongCount >= 3) {
      ctx.beginPath();
      ctx.moveTo(130, 110);
      ctx.lineTo(100, 130);
      ctx.stroke();
    }

    // Right arm
    if (wrongCount >= 4) {
      ctx.beginPath();
      ctx.moveTo(130, 110);
      ctx.lineTo(160, 130);
      ctx.stroke();
    }

    // Left leg
    if (wrongCount >= 5) {
      ctx.beginPath();
      ctx.moveTo(130, 150);
      ctx.lineTo(110, 190);
      ctx.stroke();
    }

    // Right leg
    if (wrongCount >= 6) {
      ctx.beginPath();
      ctx.moveTo(130, 150);
      ctx.lineTo(150, 190);
      ctx.stroke();
    }
  }

  getScore() {
    if (this.gameState.word === '') return 0;

    const correctLetters = [...this.gameState.word].filter((letter) => this.gameState.guessedLetters.has(letter))
      .length;
    const wrongCount = this.gameState.wrongGuesses.size;

    const score = Math.max(0, correctLetters * 10 - wrongCount * 15);
    return Math.floor(score);
  }

  destroy() {
    // Remove event listeners
    this.eventListeners.forEach(({ element, event, handler }) => {
      element.removeEventListener(event, handler);
    });
    this.eventListeners = [];

    // Cancel animation frames
    this.animationFrameIds.forEach((id) => cancelAnimationFrame(id));
    this.animationFrameIds = [];

    // Clear DOM
    this.container.innerHTML = '';
    this.DOM = {};
    this.canvasContext = null;
  }
}

// Export for use
window.Hangman = Hangman;
