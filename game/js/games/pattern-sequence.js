/* ==========================================================================
   GAME 3: PATTERN SEQUENCE (Working Memory / Audio-Visual Simon)
   ========================================================================== */

class PatternSequenceGame {
  constructor(arenaController) {
    this.arena = arenaController;
    this.sequence = [];
    this.playerStep = 0;
    this.score = 0;
    this.round = 1;
    this.isPlayingSequence = false;
  }

  start() {
    this.sequence = [];
    this.score = 0;
    this.round = 1;
    this.nextRound();
  }

  nextRound() {
    this.playerStep = 0;
    this.isPlayingSequence = true;

    // Add random pad (0 to 3) to sequence
    const nextPad = Math.floor(Math.random() * 4);
    this.sequence.push(nextPad);

    this.render();
    setTimeout(() => this.playSequence(), 600);
  }

  render() {
    this.arena.updateHeader({
      score: this.score,
      level: this.round,
      lives: `Round ${this.round}`,
      timerPercent: 100
    });

    const content = `
      <div class="simon-board">
        <div class="simon-pad" data-pad="0"></div>
        <div class="simon-pad" data-pad="1"></div>
        <div class="simon-pad" data-pad="2"></div>
        <div class="simon-pad" data-pad="3"></div>
      </div>
    `;

    this.arena.setStageContent(content);
    this.bindEvents();
  }

  playSequence() {
    const pads = this.arena.stageEl.querySelectorAll('.simon-pad');
    let idx = 0;

    const interval = setInterval(() => {
      if (idx >= this.sequence.length) {
        clearInterval(interval);
        this.isPlayingSequence = false;
        return;
      }

      const padIndex = this.sequence[idx];
      this.flashPad(pads[padIndex], padIndex);
      idx++;
    }, Math.max(350, 750 - (this.round * 20)));
  }

  flashPad(padEl, padIndex) {
    if (!padEl) return;
    padEl.classList.add('active');
    window.soundEngine.playSimonTone(padIndex);
    setTimeout(() => {
      padEl.classList.remove('active');
    }, 250);
  }

  bindEvents() {
    const board = this.arena.stageEl.querySelector('.simon-board');
    if (!board) return;

    board.addEventListener('click', (e) => {
      const pad = e.target.closest('.simon-pad');
      if (!pad || this.isPlayingSequence) return;

      const padIndex = parseInt(pad.dataset.pad);
      this.flashPad(pad, padIndex);

      // Check if matches sequence step
      if (padIndex === this.sequence[this.playerStep]) {
        this.playerStep++;

        // Completed sequence for this round
        if (this.playerStep === this.sequence.length) {
          this.score += this.sequence.length * 150;
          this.round += 1;
          this.isPlayingSequence = true;
          window.soundEngine.playLevelUp();
          this.arena.showComboBanner(`ROUND ${this.round}!`);

          setTimeout(() => this.nextRound(), 1000);
        }
      } else {
        // Wrong pattern!
        window.soundEngine.playWrong();
        setTimeout(() => this.gameOver(), 400);
      }
    });
  }

  gameOver() {
    window.soundEngine.playGameOver();
    this.arena.endGame('patternSequence', this.score, 'pattern');
  }

  stop() {
    this.isPlayingSequence = false;
  }
}

window.PatternSequenceGame = PatternSequenceGame;
