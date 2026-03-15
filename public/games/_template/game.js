/**
 * Template Game
 * Copy this folder into /games/your-game-id/ and modify.
 * 
 * REQUIRED: Set window.YourGameId = YourGameId at the bottom.
 * The class name should be your game ID in PascalCase.
 * e.g., "my-game" -> class MyGame, window.MyGame = MyGame
 */
class TemplateGame {
  constructor(container) {
    this.container = container;
    this.score = 0;
    this.running = false;
    this.render();
  }

  render() {
    this.container.innerHTML = `
      <div class="template-game" style="text-align:center;padding:60px 20px;">
        <h2 style="margin-bottom:16px;">Template Game</h2>
        <p style="color:var(--text-secondary);margin-bottom:24px;">Replace this with your game!</p>
        <button id="tg-btn" style="padding:12px 24px;border:none;border-radius:8px;background:var(--text-accent);color:#000;font-weight:600;cursor:pointer;">Click Me (+1)</button>
        <p style="margin-top:16px;font-size:24px;" id="tg-score">Score: 0</p>
      </div>
    `;
    document.getElementById('tg-btn').addEventListener('click', () => {
      this.score++;
      document.getElementById('tg-score').textContent = `Score: ${this.score}`;
    });
  }

  start() { this.score = 0; this.running = true; this.render(); }
  pause() { this.running = false; }
  resume() { this.running = true; }
  destroy() { this.running = false; this.container.innerHTML = ''; }
  getScore() { return this.score; }
}

window.TemplateGame = TemplateGame;
