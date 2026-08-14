/* ==========================================================================
   GAME 2: COLOR CLASH (Stroop Effect / Cognitive Flexibility)
   ========================================================================== */

class ColorClashGame {
  constructor(arenaController) {
    this.arena = arenaController;
    this.score = 0;
    this.timeLeft = 30;
    this.timerId = null;
    this.combo = 0;
    this.currentColorObj = null;
    this.currentTextObj = null;
    this.mode = 'color'; // 'color' or 'text'

    this.colors = [
      { name: 'RED', hex: '#ff4d6d' },
      { name: 'BLUE', hex: '#00f3ff' },
      { name: 'GREEN', hex: '#00f5d4' },
      { name: 'YELLOW', hex: '#ffb703' },
      { name: 'PURPLE', hex: '#9d4edd' }
    ];
  }

  start() {
    this.score = 0;
    this.timeLeft = 30;
    this.combo = 0;
    this.startTimer();
    this.nextRound();
  }

  startTimer() {
    if (this.timerId) clearInterval(this.timerId);
    this.timerId = setInterval(() => {
      this.timeLeft -= 1;
      const pct = (this.timeLeft / 30) * 100;
      this.arena.updateHeader({
        score: this.score,
        lives: `${this.timeLeft}s`,
        timerPercent: Math.max(0, Math.min(100, pct))
      });

      if (this.timeLeft <= 0) {
        clearInterval(this.timerId);
        this.gameOver();
      }
    }, 1000);
  }

  nextRound() {
    // Pick random text color & font color
    this.currentColorObj = this.colors[Math.floor(Math.random() * this.colors.length)];
    this.currentTextObj = this.colors[Math.floor(Math.random() * this.colors.length)];
    
    // Toggle question mode
    this.mode = Math.random() > 0.5 ? 'color' : 'text';

    this.render();
  }

  render() {
    const instructionText = this.mode === 'color' 
      ? 'MATCH FONT COLOR' 
      : 'MATCH WORD MEANING';

    let optionsHTML = '';
    // Shuffle options
    const shuffled = [...this.colors].sort(() => Math.random() - 0.5);

    shuffled.forEach(col => {
      optionsHTML += `<button class="stroop-btn" data-name="${col.name}">${col.name}</button>`;
    });

    const content = `
      <div class="stroop-container">
        <div class="stroop-instruction">${instructionText}</div>
        <div class="stroop-word" style="color: ${this.currentColorObj.hex};">${this.currentTextObj.name}</div>
        <div class="stroop-options">${optionsHTML}</div>
      </div>
    `;

    this.arena.setStageContent(content);
    this.bindEvents();
  }

  bindEvents() {
    const container = this.arena.stageEl.querySelector('.stroop-options');
    if (!container) return;

    container.addEventListener('click', (e) => {
      const btn = e.target.closest('.stroop-btn');
      if (!btn) return;

      const chosenName = btn.dataset.name;
      const targetName = this.mode === 'color' ? this.currentColorObj.name : this.currentTextObj.name;

      if (chosenName === targetName) {
        // Correct!
        this.combo += 1;
        const pts = 120 * (1 + Math.floor(this.combo / 4));
        this.score += pts;
        window.soundEngine.playCorrect();

        if (this.combo >= 4) {
          this.arena.showComboBanner(`${this.combo}x STREAK!`);
        }

        // Add bonus time for streaks
        if (this.combo % 5 === 0) {
          this.timeLeft += 2;
        }

        this.nextRound();
      } else {
        // Wrong!
        this.combo = 0;
        this.arena.hideComboBanner();
        window.soundEngine.playWrong();
        btn.style.borderColor = '#ff4d6d';
        btn.style.color = '#ff4d6d';
        setTimeout(() => this.nextRound(), 300);
      }
    });
  }

  gameOver() {
    window.soundEngine.playGameOver();
    this.arena.endGame('colorClash', this.score, 'flexibility');
  }

  stop() {
    if (this.timerId) clearInterval(this.timerId);
  }
}

window.ColorClashGame = ColorClashGame;
