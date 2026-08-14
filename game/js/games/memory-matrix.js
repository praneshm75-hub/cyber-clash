/* ==========================================================================
   GAME 1: MEMORY MATRIX (Spatial Memory)
   ========================================================================== */

class MemoryMatrixGame {
  constructor(arenaController) {
    this.arena = arenaController;
    this.gridSize = 3;
    this.patternCount = 3;
    this.score = 0;
    this.lives = 3;
    this.level = 1;
    this.targetTiles = new Set();
    this.foundTiles = new Set();
    this.isShowingPattern = false;
    this.combo = 0;
  }

  start() {
    this.score = 0;
    this.lives = 3;
    this.level = 1;
    this.gridSize = 3;
    this.patternCount = 3;
    this.combo = 0;
    this.nextRound();
  }

  nextRound() {
    this.targetTiles.clear();
    this.foundTiles.clear();
    this.isShowingPattern = true;

    // Difficulty scaling
    if (this.level > 2 && this.level <= 5) {
      this.gridSize = 4;
      this.patternCount = 4 + Math.floor((this.level - 2) / 2);
    } else if (this.level > 5) {
      this.gridSize = 5;
      this.patternCount = 6 + Math.floor((this.level - 5) / 2);
    } else {
      this.gridSize = 3;
      this.patternCount = 3 + (this.level - 1);
    }

    const totalCells = this.gridSize * this.gridSize;
    while (this.targetTiles.size < Math.min(this.patternCount, totalCells - 1)) {
      const randomIdx = Math.floor(Math.random() * totalCells);
      this.targetTiles.add(randomIdx);
    }

    this.render();
    this.showPattern();
  }

  render() {
    this.arena.updateHeader({
      score: this.score,
      level: this.level,
      lives: '❤️'.repeat(this.lives),
      timerPercent: 100
    });

    const totalCells = this.gridSize * this.gridSize;
    let gridHTML = `<div class="matrix-container" style="grid-template-columns: repeat(${this.gridSize}, 1fr);">`;

    for (let i = 0; i < totalCells; i++) {
      gridHTML += `<div class="matrix-tile" data-index="${i}"></div>`;
    }
    gridHTML += `</div>`;

    this.arena.setStageContent(gridHTML);
    this.bindEvents();
  }

  showPattern() {
    const tiles = this.arena.stageEl.querySelectorAll('.matrix-tile');
    tiles.forEach(tile => tile.classList.add('disabled'));

    // Highlight target tiles
    this.targetTiles.forEach(idx => {
      if (tiles[idx]) tiles[idx].classList.add('active-flash');
    });

    const displayTime = Math.max(1000, 2200 - (this.level * 100));
    setTimeout(() => {
      tiles.forEach(tile => {
        tile.classList.remove('active-flash');
        tile.classList.remove('disabled');
      });
      this.isShowingPattern = false;
    }, displayTime);
  }

  bindEvents() {
    const container = this.arena.stageEl.querySelector('.matrix-container');
    if (!container) return;

    container.addEventListener('click', (e) => {
      const tile = e.target.closest('.matrix-tile');
      if (!tile || this.isShowingPattern || tile.classList.contains('revealed') || tile.classList.contains('disabled')) return;

      const idx = parseInt(tile.dataset.index);

      if (this.targetTiles.has(idx)) {
        // Correct Tile!
        tile.classList.add('correct', 'revealed');
        this.foundTiles.add(idx);
        this.combo += 1;
        const pts = 100 * (1 + Math.floor(this.combo / 3));
        this.score += pts;
        window.soundEngine.playCorrect();

        if (this.combo >= 3) {
          this.arena.showComboBanner(`${this.combo}x COMBO!`);
        }

        // Check if round cleared
        if (this.foundTiles.size === this.targetTiles.size) {
          this.level += 1;
          window.soundEngine.playLevelUp();
          setTimeout(() => this.nextRound(), 600);
        }
      } else {
        // Wrong Tile!
        tile.classList.add('wrong', 'revealed');
        this.combo = 0;
        this.lives -= 1;
        this.arena.hideComboBanner();
        window.soundEngine.playWrong();

        if (this.lives <= 0) {
          setTimeout(() => this.gameOver(), 500);
        }
      }

      this.arena.updateHeader({
        score: this.score,
        level: this.level,
        lives: '❤️'.repeat(Math.max(0, this.lives))
      });
    });
  }

  gameOver() {
    window.soundEngine.playGameOver();
    this.arena.endGame('memoryMatrix', this.score, 'memory');
  }

  stop() {
    this.isShowingPattern = false;
  }
}

window.MemoryMatrixGame = MemoryMatrixGame;
