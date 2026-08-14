/* ==========================================================================
   GAME 4: SPEED MATH (Mental Agility & Rapid Calculation)
   ========================================================================== */

class SpeedMathGame {
  constructor(arenaController) {
    this.arena = arenaController;
    this.score = 0;
    this.timeLeft = 25;
    this.timerId = null;
    this.combo = 0;
    this.currentAnswer = 0;
  }

  start() {
    this.score = 0;
    this.timeLeft = 25;
    this.combo = 0;
    this.startTimer();
    this.nextRound();
  }

  startTimer() {
    if (this.timerId) clearInterval(this.timerId);
    this.timerId = setInterval(() => {
      this.timeLeft -= 1;
      const pct = (this.timeLeft / 25) * 100;
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

  generateEquation() {
    const ops = ['+', '-', '×', '÷'];
    const op = ops[Math.floor(Math.random() * ops.length)];
    let a, b, answer, displayExpr;

    if (op === '+') {
      a = Math.floor(Math.random() * 45) + 5;
      b = Math.floor(Math.random() * 45) + 5;
      answer = a + b;
      displayExpr = `${a} + ${b} = ?`;
    } else if (op === '-') {
      b = Math.floor(Math.random() * 30) + 5;
      answer = Math.floor(Math.random() * 40) + 5;
      a = answer + b;
      displayExpr = `${a} - ${b} = ?`;
    } else if (op === '×') {
      a = Math.floor(Math.random() * 12) + 2;
      b = Math.floor(Math.random() * 12) + 2;
      answer = a * b;
      displayExpr = `${a} × ${b} = ?`;
    } else { // '÷'
      b = Math.floor(Math.random() * 9) + 2;
      answer = Math.floor(Math.random() * 12) + 2;
      a = answer * b;
      displayExpr = `${a} ÷ ${b} = ?`;
    }

    this.currentAnswer = answer;

    // Generate 3 distractors close to answer
    const options = new Set([answer]);
    while (options.size < 4) {
      const offset = (Math.random() > 0.5 ? 1 : -1) * (Math.floor(Math.random() * 8) + 1);
      const wrongVal = answer + offset;
      if (wrongVal >= 0 && wrongVal !== answer) {
        options.add(wrongVal);
      }
    }

    return {
      expr: displayExpr,
      options: [...options].sort(() => Math.random() - 0.5)
    };
  }

  nextRound() {
    const { expr, options } = this.generateEquation();
    this.render(expr, options);
  }

  render(expr, options) {
    let optionsHTML = '';
    options.forEach(opt => {
      optionsHTML += `<button class="math-btn" data-val="${opt}">${opt}</button>`;
    });

    const content = `
      <div class="math-container">
        <div class="math-equation-card">${expr}</div>
        <div class="math-options-grid">${optionsHTML}</div>
      </div>
    `;

    this.arena.setStageContent(content);
    this.bindEvents();
  }

  bindEvents() {
    const grid = this.arena.stageEl.querySelector('.math-options-grid');
    if (!grid) return;

    grid.addEventListener('click', (e) => {
      const btn = e.target.closest('.math-btn');
      if (!btn) return;

      const val = parseInt(btn.dataset.val);
      if (val === this.currentAnswer) {
        // Correct!
        this.combo += 1;
        const pts = 150 * (1 + Math.floor(this.combo / 3));
        this.score += pts;
        this.timeLeft += 2; // Time bonus
        window.soundEngine.playCorrect();

        if (this.combo >= 3) {
          this.arena.showComboBanner(`${this.combo}x MULTIPLIER!`);
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
    this.arena.endGame('speedMath', this.score, 'speed');
  }

  stop() {
    if (this.timerId) clearInterval(this.timerId);
  }
}

window.SpeedMathGame = SpeedMathGame;
