/* ==========================================================================
   NEUROPULSE & CYBER ROYALE - MAIN APP CONTROLLER & NAVIGATION ROUTER
   ========================================================================== */

class AppController {
  constructor() {
    this.activeGameInstance = null;
    this.activeGameId = null;

    // DOM References
    this.dashboardView = document.getElementById('dashboard-view');
    this.arenaView = document.getElementById('arena-view');
    this.stageEl = document.getElementById('arena-stage');

    // Header Stat Elements
    this.arenaScoreEl = document.getElementById('arena-score');
    this.arenaLevelEl = document.getElementById('arena-level');
    this.arenaLivesEl = document.getElementById('arena-lives');
    this.arenaTimerBar = document.getElementById('arena-timer-bar');
    this.arenaTitleEl = document.getElementById('arena-title');
    this.comboBadgeEl = document.getElementById('combo-badge');

    // Dashboard Elements
    this.totalXPEl = document.getElementById('total-xp-val');
    this.gamesPlayedEl = document.getElementById('games-played-val');
    this.streakValEl = document.getElementById('streak-val');
    this.radarSvg = document.getElementById('radar-svg');

    this.init();
  }

  init() {
    this.updateDashboardUI();
    this.bindEvents();
  }

  updateDashboardUI() {
    const stats = window.storageEngine.stats;
    if (this.totalXPEl) this.totalXPEl.textContent = stats.totalScoreXP.toLocaleString();
    if (this.gamesPlayedEl) this.gamesPlayedEl.textContent = stats.totalGamesPlayed;
    if (this.streakValEl) this.streakValEl.textContent = `${stats.streakDays} Day${stats.streakDays > 1 ? 's' : ''}`;

    // Update High Scores on Game Cards
    document.querySelectorAll('.game-card').forEach(card => {
      const gId = card.dataset.game;
      const scoreEl = card.querySelector('.best-score strong');
      if (scoreEl && stats.highScores[gId] !== undefined) {
        scoreEl.textContent = stats.highScores[gId].toLocaleString();
      }
    });

    // Render Dynamic Radar SVG
    window.storageEngine.renderRadarSVG(this.radarSvg);
  }

  bindEvents() {
    // Game Card Clicks
    document.querySelectorAll('.game-card').forEach(card => {
      card.addEventListener('click', () => {
        const gameId = card.dataset.game;
        window.soundEngine.playTap();
        this.launchGame(gameId);
      });
    });

    // Quit Arena Button
    const quitBtn = document.getElementById('btn-quit-arena');
    if (quitBtn) {
      quitBtn.addEventListener('click', () => {
        window.soundEngine.playTap();
        this.exitArena();
      });
    }

    // Audio Toggle
    const soundBtn = document.getElementById('btn-sound-toggle');
    if (soundBtn) {
      soundBtn.addEventListener('click', () => {
        const isMuted = window.soundEngine.toggleMute();
        soundBtn.textContent = isMuted ? '🔇' : '🔊';
        this.showToast(isMuted ? 'Audio Muted' : 'Audio Enabled');
      });
    }

    // Stats / Modal Launcher
    const statsBtn = document.getElementById('btn-view-stats');
    const modalBackdrop = document.getElementById('stats-modal');
    const modalClose = document.getElementById('modal-close');

    if (statsBtn && modalBackdrop) {
      statsBtn.addEventListener('click', () => {
        window.soundEngine.playTap();
        this.renderBadgesModal();
        modalBackdrop.classList.add('active');
      });
    }

    if (modalClose && modalBackdrop) {
      modalClose.addEventListener('click', () => {
        window.soundEngine.playTap();
        modalBackdrop.classList.remove('active');
      });
    }

    // Reset Data Button inside Modal
    const resetBtn = document.getElementById('btn-reset-data');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (confirm("Reset all high scores, stats, and unlocked badges?")) {
          window.storageEngine.resetAllData();
          this.updateDashboardUI();
          this.renderBadgesModal();
          this.showToast("All progress reset.");
        }
      });
    }
  }

  launchGame(gameId) {
    this.activeGameId = gameId;
    this.dashboardView.style.display = 'none';
    this.arenaView.classList.add('active');

    const gameNames = {
      memoryMatrix: 'Memory Matrix',
      colorClash: 'Color Clash',
      patternSequence: 'Pattern Sequence',
      speedMath: 'Speed Math',
      cyberRoyale: 'Cyber Royale 2D'
    };

    if (this.arenaTitleEl) this.arenaTitleEl.textContent = gameNames[gameId] || 'Battle Arena';

    // Hide standard timer bar for Cyber Royale (uses custom HUD)
    if (gameId === 'cyberRoyale') {
      const timerBarWrap = document.querySelector('.arena-timer-bar-wrap');
      if (timerBarWrap) timerBarWrap.style.display = 'none';
      const arenaHeader = document.querySelector('.arena-header');
      if (arenaHeader) arenaHeader.style.display = 'none';
    } else {
      const timerBarWrap = document.querySelector('.arena-timer-bar-wrap');
      if (timerBarWrap) timerBarWrap.style.display = 'block';
      const arenaHeader = document.querySelector('.arena-header');
      if (arenaHeader) arenaHeader.style.display = 'flex';
    }

    // Instantiate game class
    if (gameId === 'memoryMatrix') {
      this.activeGameInstance = new window.MemoryMatrixGame(this);
    } else if (gameId === 'colorClash') {
      this.activeGameInstance = new window.ColorClashGame(this);
    } else if (gameId === 'patternSequence') {
      this.activeGameInstance = new window.PatternSequenceGame(this);
    } else if (gameId === 'speedMath') {
      this.activeGameInstance = new window.SpeedMathGame(this);
    } else if (gameId === 'cyberRoyale') {
      this.activeGameInstance = new window.CyberRoyaleGame(this);
    }

    if (this.activeGameInstance) {
      this.activeGameInstance.start();
    }
  }

  updateHeader({ score, level, lives, timerPercent }) {
    if (score !== undefined && this.arenaScoreEl) this.arenaScoreEl.textContent = score.toLocaleString();
    if (level !== undefined && this.arenaLevelEl) this.arenaLevelEl.textContent = level;
    if (lives !== undefined && this.arenaLivesEl) this.arenaLivesEl.textContent = lives;
    if (timerPercent !== undefined && this.arenaTimerBar) {
      this.arenaTimerBar.style.width = `${timerPercent}%`;
    }
  }

  setStageContent(htmlContent) {
    if (this.stageEl) {
      this.stageEl.innerHTML = htmlContent;
    }
  }

  showComboBanner(text) {
    if (this.comboBadgeEl) {
      this.comboBadgeEl.textContent = text;
      this.comboBadgeEl.classList.add('show');
      setTimeout(() => this.hideComboBanner(), 1500);
    }
  }

  hideComboBanner() {
    if (this.comboBadgeEl) {
      this.comboBadgeEl.classList.remove('show');
    }
  }

  endGame(gameId, score, domainKey) {
    if (this.activeGameInstance && this.activeGameInstance.stop) {
      this.activeGameInstance.stop();
    }

    // Restore standard arena header
    const timerBarWrap = document.querySelector('.arena-timer-bar-wrap');
    if (timerBarWrap) timerBarWrap.style.display = 'block';
    const arenaHeader = document.querySelector('.arena-header');
    if (arenaHeader) arenaHeader.style.display = 'flex';

    const newlyUnlocked = window.storageEngine.recordGameResult(gameId, score, domainKey);
    this.updateDashboardUI();

    const isNewHigh = score > 0 && score >= (window.storageEngine.stats.highScores[gameId] || score);

    const resultHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; gap: 1.5rem; text-align: center; z-index: 1000;">
        <h2 style="font-size: 2.2rem; font-weight: 800;">${gameId === 'cyberRoyale' ? '💥 MATCH ENDED!' : 'Session Completed!'}</h2>
        ${isNewHigh ? '<div style="padding: 0.3rem 1rem; background: rgba(0, 245, 212, 0.2); border: 1px solid #00f5d4; color: #00f5d4; font-weight: 800; border-radius: 9999px;">🎉 NEW HIGH SCORE!</div>' : ''}
        
        <div style="font-size: 3.5rem; font-weight: 900; font-family: var(--font-mono); color: var(--primary-cyan);">
          ${score.toLocaleString()} <span style="font-size: 1rem; color: var(--text-muted);">PTS</span>
        </div>

        <div style="display: flex; gap: 1rem;">
          <button class="btn-primary" id="btn-replay">Play Again</button>
          <button class="btn-secondary" id="btn-exit">Return to Hub</button>
        </div>
      </div>
    `;

    this.setStageContent(resultHTML);

    const replayBtn = document.getElementById('btn-replay');
    const exitBtn = document.getElementById('btn-exit');

    if (replayBtn) {
      replayBtn.addEventListener('click', () => {
        window.soundEngine.playTap();
        this.launchGame(gameId);
      });
    }

    if (exitBtn) {
      exitBtn.addEventListener('click', () => {
        window.soundEngine.playTap();
        this.exitArena();
      });
    }

    newlyUnlocked.forEach(b => {
      this.showToast(`🏆 Badge Unlocked: ${b.name}`);
    });
  }

  exitArena() {
    if (this.activeGameInstance && this.activeGameInstance.stop) {
      this.activeGameInstance.stop();
    }
    this.activeGameInstance = null;
    this.arenaView.classList.remove('active');
    this.dashboardView.style.display = 'block';

    const timerBarWrap = document.querySelector('.arena-timer-bar-wrap');
    if (timerBarWrap) timerBarWrap.style.display = 'block';
    const arenaHeader = document.querySelector('.arena-header');
    if (arenaHeader) arenaHeader.style.display = 'flex';

    this.updateDashboardUI();
  }

  renderBadgesModal() {
    const container = document.getElementById('modal-badges-container');
    if (!container) return;

    const unlocked = window.storageEngine.stats.unlockedBadges;

    let html = '<div class="badges-grid">';
    BADGES_LIST.forEach(badge => {
      const isUnlocked = unlocked.includes(badge.id);
      html += `
        <div class="badge-item ${isUnlocked ? 'unlocked' : ''}">
          <div class="badge-icon">${badge.icon}</div>
          <div class="badge-name">${badge.name}</div>
          <div style="font-size: 0.65rem; color: var(--text-muted);">${badge.desc}</div>
        </div>
      `;
    });
    html += '</div>';

    container.innerHTML = html;
  }

  showToast(message) {
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.className = 'toast-container';
      document.body.appendChild(toastContainer);
    }

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 3000);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.appController = new AppController();
});
