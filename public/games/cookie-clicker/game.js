class CookieClicker {
  constructor(container) {
    this.container = container;
    this.score = 0;
    this.cookies = 0;
    this.clickValue = 1;
    this.cookiesPerSecond = 0;
    this.isPaused = false;
    this.isDestroyed = false;

    // Track upgrade counts and their price multipliers
    this.upgrades = {
      autoClicker: { count: 0, basePrice: 15, cps: 0.1, name: 'Auto-Clicker' },
      grandma: { count: 0, basePrice: 100, cps: 1, name: 'Grandma' },
      farm: { count: 0, basePrice: 500, cps: 5, name: 'Farm' },
      factory: { count: 0, basePrice: 2000, cps: 20, name: 'Factory' },
      mine: { count: 0, basePrice: 10000, cps: 100, name: 'Mine' }
    };

    this.gameloopInterval = null;
    this.animationFrameId = null;
    this.lastAnimationTime = 0;
    this.floatingTextTimers = [];

    // DOM elements
    this.elements = {};
  }

  start() {
    if (this.isDestroyed) {
      throw new Error('Cannot start a destroyed game instance');
    }

    this.score = 0;
    this.cookies = 0;
    this.clickValue = 1;
    this.cookiesPerSecond = 0;
    this.isPaused = false;

    // Reset upgrades
    Object.keys(this.upgrades).forEach(key => {
      this.upgrades[key].count = 0;
    });

    this.render();
    this.startGameLoop();
  }

  render() {
    this.container.innerHTML = '';
    this.container.className = 'cookie-clicker-container';

    // Main layout wrapper
    const wrapper = document.createElement('div');
    wrapper.className = 'cookie-clicker-wrapper';
    this.container.appendChild(wrapper);

    // Left side - Cookie clicker
    const leftSide = document.createElement('div');
    leftSide.className = 'cookie-clicker-left';
    wrapper.appendChild(leftSide);

    // Score display
    const scoreDisplay = document.createElement('div');
    scoreDisplay.className = 'cookie-clicker-score-display';
    this.elements.scoreDisplay = scoreDisplay;
    leftSide.appendChild(scoreDisplay);

    // Cookie button
    const cookieBtn = document.createElement('button');
    cookieBtn.className = 'cookie-clicker-cookie-btn';
    cookieBtn.innerHTML = '🍪';
    this.elements.cookieBtn = cookieBtn;
    leftSide.appendChild(cookieBtn);

    // CPS display
    const cpsDisplay = document.createElement('div');
    cpsDisplay.className = 'cookie-clicker-cps';
    this.elements.cpsDisplay = cpsDisplay;
    leftSide.appendChild(cpsDisplay);

    // Right side - Shop/Upgrades
    const rightSide = document.createElement('div');
    rightSide.className = 'cookie-clicker-right';
    wrapper.appendChild(rightSide);

    // Shop title
    const shopTitle = document.createElement('h2');
    shopTitle.className = 'cookie-clicker-shop-title';
    shopTitle.textContent = 'Upgrades';
    rightSide.appendChild(shopTitle);

    // Upgrades list
    const upgradesList = document.createElement('div');
    upgradesList.className = 'cookie-clicker-upgrades-list';
    this.elements.upgradesList = upgradesList;
    rightSide.appendChild(upgradesList);

    // Create upgrade buttons
    Object.keys(this.upgrades).forEach(key => {
      const upgrade = this.upgrades[key];
      const btn = document.createElement('button');
      btn.className = 'cookie-clicker-upgrade-btn';
      btn.dataset.upgradeKey = key;
      this.elements[`upgrade-${key}`] = btn;
      upgradesList.appendChild(btn);
    });

    // Attach event listeners
    cookieBtn.addEventListener('click', (e) => this.handleCookieClick(e));

    Object.keys(this.upgrades).forEach(key => {
      const btn = this.elements[`upgrade-${key}`];
      btn.addEventListener('click', () => this.buyUpgrade(key));
    });

    this.updateDisplay();
  }

  handleCookieClick(event) {
    if (this.isPaused) return;

    this.cookies += this.clickValue;
    this.score += this.clickValue;

    // Visual feedback
    const btn = this.elements.cookieBtn;
    btn.classList.add('cookie-clicker-cookie-clicked');
    setTimeout(() => btn.classList.remove('cookie-clicker-cookie-clicked'), 100);

    // Floating text animation
    const floatingText = document.createElement('div');
    floatingText.className = 'cookie-clicker-floating-text';
    floatingText.textContent = `+${this.clickValue}`;
    
    const rect = btn.getBoundingClientRect();
    floatingText.style.left = rect.left + rect.width / 2 + 'px';
    floatingText.style.top = rect.top + 'px';
    
    this.container.appendChild(floatingText);
    
    // Animate and remove
    const timerId = setTimeout(() => {
      floatingText.remove();
      this.floatingTextTimers = this.floatingTextTimers.filter(t => t !== timerId);
    }, 800);
    this.floatingTextTimers.push(timerId);

    this.updateDisplay();
  }

  buyUpgrade(upgradeKey) {
    if (this.isPaused) return;

    const upgrade = this.upgrades[upgradeKey];
    const price = this.getCurrentPrice(upgrade);

    if (this.cookies >= price) {
      this.cookies -= price;
      upgrade.count += 1;
      this.recalculateCPS();
      this.updateDisplay();
    }
  }

  getCurrentPrice(upgrade) {
    return Math.floor(upgrade.basePrice * Math.pow(1.15, upgrade.count));
  }

  recalculateCPS() {
    this.cookiesPerSecond = Object.values(this.upgrades).reduce((total, upgrade) => {
      return total + upgrade.cps * upgrade.count;
    }, 0);
  }

  updateDisplay() {
    // Update score display (animated number rolling)
    const scoreDisplay = this.elements.scoreDisplay;
    scoreDisplay.textContent = Math.floor(this.score).toLocaleString();

    // Update cookie count
    const cookieCount = Math.floor(this.cookies).toLocaleString();
    
    // Update CPS display
    const cpsDisplay = this.elements.cpsDisplay;
    cpsDisplay.textContent = `${this.cookiesPerSecond.toFixed(2)} cookies/sec`;

    // Update upgrade buttons
    Object.keys(this.upgrades).forEach(key => {
      const upgrade = this.upgrades[key];
      const btn = this.elements[`upgrade-${key}`];
      const price = this.getCurrentPrice(upgrade);
      const canAfford = this.cookies >= price;

      btn.textContent = `${upgrade.name}\n${upgrade.count} owned\nPrice: ${price}`;
      btn.disabled = !canAfford;
      btn.className = 'cookie-clicker-upgrade-btn';
      if (canAfford) {
        btn.classList.add('cookie-clicker-upgrade-affordable');
      }
    });
  }

  startGameLoop() {
    // Game loop: accumulate cookies based on CPS
    this.gameloopInterval = setInterval(() => {
      if (!this.isPaused) {
        const deltaSeconds = 0.1; // 100ms interval
        const coralFractionPerSecond = this.cookiesPerSecond * deltaSeconds;
        this.cookies += coralFractionPerSecond;
        this.score += coralFractionPerSecond;
        this.updateDisplay();
      }
    }, 100);
  }

  pause() {
    this.isPaused = true;
  }

  resume() {
    this.isPaused = false;
  }

  getScore() {
    return Math.floor(this.score);
  }

  destroy() {
    this.isDestroyed = true;

    // Clear intervals
    if (this.gameloopInterval) {
      clearInterval(this.gameloopInterval);
      this.gameloopInterval = null;
    }

    // Remove animation frame
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    // Clear floating text timers
    this.floatingTextTimers.forEach(t => clearTimeout(t));
    this.floatingTextTimers = [];

    // Clear DOM
    this.container.innerHTML = '';
    this.elements = {};
  }
}

// Export for use in the site
window.CookieClicker = CookieClicker;
