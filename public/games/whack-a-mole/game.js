/**
 * Whack-a-Mole Game
 * A classic whack-a-mole game with 3x3 grid, power-ups, and bombs
 */

class WhackAMole {
  constructor(container) {
    this.container = container;
    this.score = 0;
    this.timeLeft = 30;
    this.gameActive = false;
    this.gamePaused = false;
    this.gameOver = false;

    // Game configuration
    this.config = {
      gameTime: 30, // seconds
      gridSize: 3,
      molePopUpTime: {
        initial: 800, // ms - how long mole stays visible
        min: 300, // ms - minimum time at end game
      },
      moleWaitTime: {
        initial: 600, // ms - wait before next mole pops
        min: 200, // ms - minimum wait time
      },
      scoreValues: {
        normal: 10,
        golden: 50,
        bomb: -30,
      },
      specialMoleChance: {
        golden: 0.15, // 15% chance for golden mole
        bomb: 0.1, // 10% chance for bomb
      },
    };

    // Game state
    this.currentMole = null;
    this.moleTimeouts = [];
    this.gameTimer = null;
    this.moleSpawnTimer = null;
    this.holes = [];

    // Bind methods
    this.onMoleClick = this.onMoleClick.bind(this);
  }

  /**
   * Initialize and render the game UI
   */
  initializeUI() {
    this.container.innerHTML = '';
    this.container.className = 'whack-a-mole-container';

    // Create header
    const header = document.createElement('div');
    header.className = 'whack-a-mole-header';
    header.innerHTML = '<h1>🔨 Whack-a-Mole 🔨</h1>';

    // Create stats display
    const stats = document.createElement('div');
    stats.className = 'whack-a-mole-stats';
    stats.innerHTML = `
      <div class="whack-a-mole-stat">
        <span class="whack-a-mole-stat-label">Score</span>
        <span class="whack-a-mole-stat-value" id="whack-a-mole-score">0</span>
      </div>
      <div class="whack-a-mole-stat">
        <span class="whack-a-mole-stat-label">Time</span>
        <span class="whack-a-mole-stat-value" id="whack-a-mole-timer">30</span>
      </div>
    `;

    // Create game board (3x3 grid)
    const board = document.createElement('div');
    board.className = 'whack-a-mole-board';
    board.id = 'whack-a-mole-board';

    this.holes = [];
    for (let i = 0; i < this.config.gridSize * this.config.gridSize; i++) {
      const hole = document.createElement('div');
      hole.className = 'whack-a-mole-hole';
      hole.id = `whack-a-mole-hole-${i}`;
      board.appendChild(hole);
      this.holes.push({
        element: hole,
        id: i,
        hasMole: false,
      });
    }

    // Create control buttons
    const controls = document.createElement('div');
    controls.className = 'whack-a-mole-controls';
    controls.innerHTML = `
      <button class="whack-a-mole-button whack-a-mole-pause-resume-btn" id="whack-a-mole-pause-btn">
        ⏸ Pause
      </button>
    `;

    // Append all elements
    this.container.appendChild(header);
    this.container.appendChild(stats);
    this.container.appendChild(board);
    this.container.appendChild(controls);

    // Cache DOM elements
    this.scoreDisplay = this.container.querySelector('#whack-a-mole-score');
    this.timerDisplay = this.container.querySelector('#whack-a-mole-timer');
    this.pauseBtn = this.container.querySelector('#whack-a-mole-pause-btn');
    this.board = this.container.querySelector('#whack-a-mole-board');

    // Attach pause button listener
    this.pauseBtn.addEventListener('click', () => {
      if (this.gameActive && !this.gameOver) {
        this.gamePaused ? this.resume() : this.pause();
      }
    });
  }

  /**
   * Start or restart the game
   */
  start() {
    if (this.gameActive) {
      return; // Game already running
    }

    this.initializeUI();

    // Reset game state
    this.score = 0;
    this.timeLeft = this.config.gameTime;
    this.gameActive = true;
    this.gamePaused = false;
    this.gameOver = false;
    this.currentMole = null;

    // Update display
    this.updateDisplay();
    this.pauseBtn.disabled = false;

    // Start game timer
    this.startGameTimer();

    // Start spawning moles
    this.spawnNextMole();
  }

  /**
   * Start the countdown timer
   */
  startGameTimer() {
    this.gameTimer = setInterval(() => {
      if (this.gamePaused) return;

      this.timeLeft--;
      this.updateDisplay();

      if (this.timeLeft <= 0) {
        this.endGame();
      }
    }, 1000);
  }

  /**
   * Update score and timer displays
   */
  updateDisplay() {
    if (this.scoreDisplay) {
      this.scoreDisplay.textContent = this.score;
    }
    if (this.timerDisplay) {
      this.timerDisplay.textContent = Math.max(0, this.timeLeft);
    }
  }

  /**
   * Calculate current difficulty multiplier based on time elapsed
   * As time progresses, moles pop up faster and stay visible shorter
   */
  getDifficultyMultiplier() {
    const timeElapsed = this.config.gameTime - this.timeLeft;
    const progress = timeElapsed / this.config.gameTime; // 0 to 1
    // Linear progression: 1.0 at start to 1.8 at end
    return 1 + progress * 0.8;
  }

  /**
   * Spawn the next mole with difficulty scaling
   */
  spawnNextMole() {
    if (!this.gameActive || this.gameOver || this.gamePaused) {
      return;
    }

    const diffMultiplier = this.getDifficultyMultiplier();

    // Get a random hole
    const holeIndex = Math.floor(Math.random() * this.holes.length);
    const hole = this.holes[holeIndex];

    if (hole.hasMole) {
      // If hole already has a mole, try another
      this.moleSpawnTimer = setTimeout(() => this.spawnNextMole(), 100);
      return;
    }

    // Determine mole type
    const moleType = this.getMoleType();

    // Create and insert mole
    const mole = this.createMole(moleType);
    hole.element.appendChild(mole);
    hole.hasMole = true;

    // Store current mole info
    this.currentMole = {
      element: mole,
      hole: hole,
      type: moleType,
      holeIndex: holeIndex,
    };

    // Trigger pop-up animation
    mole.classList.add('active');

    // Calculate pop-up time based on difficulty
    let popUpTime = Math.max(
      this.config.molePopUpTime.min,
      this.config.molePopUpTime.initial / diffMultiplier
    );

    // Golden moles disappear faster
    if (moleType === 'golden') {
      popUpTime *= 0.6;
    }

    // Remove mole after pop-up time
    const removeTimeout = setTimeout(() => {
      if (this.gameActive && hole.hasMole && hole.element.contains(mole)) {
        this.removeMole(hole, mole, false);
      }
    }, popUpTime);

    this.moleTimeouts.push(removeTimeout);

    // Schedule next mole spawn
    const waitTime = Math.max(
      this.config.moleWaitTime.min,
      this.config.moleWaitTime.initial / diffMultiplier
    );

    this.moleSpawnTimer = setTimeout(() => this.spawnNextMole(), waitTime);
  }

  /**
   * Determine mole type based on probability
   */
  getMoleType() {
    const rand = Math.random();

    if (rand < this.config.specialMoleChance.bomb) {
      return 'bomb';
    }
    if (rand < this.config.specialMoleChance.bomb + this.config.specialMoleChance.golden) {
      return 'golden';
    }

    return 'regular';
  }

  /**
   * Create a mole element with SVG visualization
   */
  createMole(type) {
    const mole = document.createElement('div');
    mole.className = `whack-a-mole-mole type-${type}`;

    // Create SVG mole head
    let svgContent;

    if (type === 'bomb') {
      // Bomb SVG
      svgContent = `
        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <!-- Bomb body -->
          <circle cx="50" cy="55" r="35" fill="#333" stroke="#000" stroke-width="2"/>
          <!-- Shine on bomb -->
          <circle cx="40" cy="40" r="8" fill="#555" opacity="0.5"/>
          <!-- Fuse -->
          <path d="M 50 20 Q 48 10, 50 5" stroke="#8B4513" stroke-width="3" fill="none" stroke-linecap="round"/>
          <!-- Fuse spark -->
          <circle cx="50" cy="4" r="2" fill="#FF6B00"/>
        </svg>
      `;
    } else if (type === 'golden') {
      // Golden mole SVG
      svgContent = `
        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <!-- Head -->
          <circle cx="50" cy="50" r="32" fill="#FFD700" stroke="#DAA520" stroke-width="2"/>
          <!-- Eyes -->
          <circle cx="40" cy="42" r="5" fill="#000"/>
          <circle cx="60" cy="42" r="5" fill="#000"/>
          <!-- Eye shine -->
          <circle cx="41" cy="41" r="2" fill="#fff"/>
          <circle cx="61" cy="41" r="2" fill="#fff"/>
          <!-- Nose -->
          <circle cx="50" cy="55" r="4" fill="#000"/>
          <!-- Mouth -->
          <path d="M 50 55 Q 45 60, 40 58" stroke="#000" stroke-width="2" fill="none" stroke-linecap="round"/>
          <path d="M 50 55 Q 55 60, 60 58" stroke="#000" stroke-width="2" fill="none" stroke-linecap="round"/>
          <!-- Crown (golden) -->
          <path d="M 25 25 L 30 15 L 40 20 L 50 10 L 60 20 L 70 15 L 75 25" fill="#FFD700" stroke="#DAA520" stroke-width="1"/>
        </svg>
      `;
    } else {
      // Regular mole SVG
      svgContent = `
        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <!-- Head -->
          <circle cx="50" cy="50" r="32" fill="#8B6F47" stroke="#6B5437" stroke-width="2"/>
          <!-- Eyes -->
          <circle cx="40" cy="42" r="5" fill="#000"/>
          <circle cx="60" cy="42" r="5" fill="#000"/>
          <!-- Eye shine -->
          <circle cx="41" cy="41" r="2" fill="#fff"/>
          <circle cx="61" cy="41" r="2" fill="#fff"/>
          <!-- Nose -->
          <circle cx="50" cy="55" r="4" fill="#000"/>
          <!-- Mouth -->
          <path d="M 50 55 Q 45 62, 40 60" stroke="#000" stroke-width="2" fill="none" stroke-linecap="round"/>
          <path d="M 50 55 Q 55 62, 60 60" stroke="#000" stroke-width="2" fill="none" stroke-linecap="round"/>
          <!-- Ears -->
          <circle cx="22" cy="35" r="6" fill="#8B6F47" stroke="#6B5437" stroke-width="1"/>
          <circle cx="78" cy="35" r="6" fill="#8B6F47" stroke="#6B5437" stroke-width="1"/>
          <!-- Inner ears -->
          <circle cx="22" cy="35" r="3" fill="#A0826D"/>
          <circle cx="78" cy="35" r="3" fill="#A0826D"/>
        </svg>
      `;
    }

    mole.innerHTML = svgContent;
    mole.addEventListener('click', this.onMoleClick);
    mole.addEventListener('touchend', this.onMoleClick);

    return mole;
  }

  /**
   * Handle mole click/tap
   */
  onMoleClick(event) {
    event.stopPropagation();
    event.preventDefault();

    if (!this.gameActive || this.gameOver || this.gamePaused || !this.currentMole) {
      return;
    }

    const moleElement = event.currentTarget;

    // Check if this is the current mole
    if (moleElement !== this.currentMole.element) {
      return;
    }

    // Already whacked
    if (moleElement.classList.contains('whacked')) {
      return;
    }

    // Mark as whacked
    moleElement.classList.add('whacked');

    // Calculate points
    let points = 0;
    let pointsClass = '';

    switch (this.currentMole.type) {
      case 'golden':
        points = this.config.scoreValues.golden;
        pointsClass = 'points-50';
        break;
      case 'bomb':
        points = this.config.scoreValues.bomb;
        pointsClass = 'points-minus';
        break;
      default:
        points = this.config.scoreValues.normal;
        pointsClass = 'points-10';
    }

    // Update score
    this.score += points;
    this.updateDisplay();

    // Show feedback text
    this.showWhackedFeedback(this.currentMole.hole.element, points, pointsClass);

    // Remove mole
    this.removeMole(this.currentMole.hole, moleElement, true);
  }

  /**
   * Show whacked feedback text (points earned/lost)
   */
  showWhackedFeedback(holeElement, points, pointsClass) {
    const feedbackText = document.createElement('div');
    feedbackText.className = `whack-a-mole-whacked-text ${pointsClass}`;

    if (points > 0) {
      feedbackText.textContent = `+${points}`;
    } else {
      feedbackText.textContent = `${points}`;
    }

    holeElement.appendChild(feedbackText);

    // Remove feedback after animation
    setTimeout(() => {
      if (feedbackText.parentElement) {
        feedbackText.remove();
      }
    }, 600);
  }

  /**
   * Remove mole from hole and clean up
   */
  removeMole(hole, moleElement, wasWhacked) {
    if (!hole.hasMole || !moleElement.parentElement) {
      return;
    }

    // Add going-down animation
    if (!wasWhacked) {
      moleElement.classList.add('going-down');
    }

    // Remove after animation completes
    setTimeout(() => {
      if (moleElement.parentElement) {
        moleElement.removeEventListener('click', this.onMoleClick);
        moleElement.removeEventListener('touchend', this.onMoleClick);
        moleElement.remove();
      }
      hole.hasMole = false;
    }, 400);

    // Clear current mole reference
    if (this.currentMole && this.currentMole.element === moleElement) {
      this.currentMole = null;
    }
  }

  /**
   * Pause the game
   */
  pause() {
    if (!this.gameActive || this.gameOver || this.gamePaused) {
      return;
    }

    this.gamePaused = true;
    this.pauseBtn.textContent = '▶ Resume';

    // Show pause overlay
    const pauseOverlay = document.createElement('div');
    pauseOverlay.className = 'whack-a-mole-pause-overlay';
    pauseOverlay.id = 'whack-a-mole-pause-overlay';
    pauseOverlay.innerHTML = '<div class="whack-a-mole-pause-text">PAUSED</div>';

    this.board.appendChild(pauseOverlay);
  }

  /**
   * Resume the game
   */
  resume() {
    if (!this.gameActive || this.gameOver || !this.gamePaused) {
      return;
    }

    this.gamePaused = false;
    this.pauseBtn.textContent = '⏸ Pause';

    // Remove pause overlay
    const pauseOverlay = this.container.querySelector('#whack-a-mole-pause-overlay');
    if (pauseOverlay) {
      pauseOverlay.remove();
    }

    // Restart mole spawning (the spawn chain stops when paused)
    this.spawnNextMole();
  }

  /**
   * End the game and show game over screen
   */
  endGame() {
    this.gameActive = false;
    this.gameOver = true;

    // Clear all timeouts
    this.moleTimeouts.forEach(timeout => clearTimeout(timeout));
    this.moleTimeouts = [];
    clearTimeout(this.moleSpawnTimer);
    clearInterval(this.gameTimer);

    // Remove any active moles
    this.holes.forEach(hole => {
      if (hole.hasMole) {
        const moles = hole.element.querySelectorAll('.whack-a-mole-mole');
        moles.forEach(mole => {
          mole.removeEventListener('click', this.onMoleClick);
          mole.removeEventListener('touchend', this.onMoleClick);
          mole.remove();
        });
        hole.hasMole = false;
      }
    });

    // Show game over screen
    this.showGameOverScreen();
  }

  /**
   * Display game over screen with final score
   */
  showGameOverScreen() {
    const gameOverOverlay = document.createElement('div');
    gameOverOverlay.className = 'whack-a-mole-game-over';
    gameOverOverlay.id = 'whack-a-mole-game-over';

    gameOverOverlay.innerHTML = `
      <div class="whack-a-mole-game-over-content">
        <h2>🎮 Game Over!</h2>
        <div class="whack-a-mole-game-over-text">
          Time's up! Great effort!
        </div>
        <div class="whack-a-mole-final-score">${this.score}</div>
        <div class="whack-a-mole-game-over-text">
          Final Score
        </div>
        <button class="whack-a-mole-button whack-a-mole-play-again-btn" id="whack-a-mole-play-again">
          🔄 Play Again
        </button>
      </div>
    `;

    this.container.appendChild(gameOverOverlay);

    // Attach play again button listener
    const playAgainBtn = this.container.querySelector('#whack-a-mole-play-again');
    playAgainBtn.addEventListener('click', () => {
      this.destroy();
      this.start();
    });
  }

  /**
   * Get the current score
   */
  getScore() {
    return this.score;
  }

  /**
   * Destroy the game and clean up all resources
   */
  destroy() {
    // Stop game
    this.gameActive = false;
    this.gameOver = false;
    this.gamePaused = false;

    // Clear all timers
    clearInterval(this.gameTimer);
    clearTimeout(this.moleSpawnTimer);
    this.moleTimeouts.forEach(timeout => clearTimeout(timeout));
    this.moleTimeouts = [];

    // Remove event listeners from moles
    this.holes.forEach(hole => {
      const moles = hole.element.querySelectorAll('.whack-a-mole-mole');
      moles.forEach(mole => {
        mole.removeEventListener('click', this.onMoleClick);
        mole.removeEventListener('touchend', this.onMoleClick);
      });
    });

    // Remove pause button listener
    if (this.pauseBtn) {
      this.pauseBtn.removeEventListener('click', null);
    }

    // Clear DOM
    this.container.innerHTML = '';
    this.holes = [];
    this.currentMole = null;
  }
}

// Export the class globally
window.WhackAMole = WhackAMole;
