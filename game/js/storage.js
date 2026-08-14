/* ==========================================================================
   NEUROPULSE & CYBER ROYALE - STATS & STORAGE ENGINE
   Handles LocalStorage persistence, achievements, and SVG Radar rendering.
   ========================================================================== */

const INITIAL_STATS = {
  totalGamesPlayed: 0,
  totalScoreXP: 0,
  streakDays: 1,
  lastPlayedDate: new Date().toDateString(),
  highScores: {
    memoryMatrix: 0,
    colorClash: 0,
    patternSequence: 0,
    speedMath: 0,
    cyberRoyale: 0
  },
  domainRatings: {
    memory: 50,      // Spatial Memory
    flexibility: 50, // Stroop / Executive Focus
    pattern: 50,     // Working Memory
    speed: 50        // Mental Agility & Combat Speed
  },
  unlockedBadges: []
};

const BADGES_LIST = [
  { id: 'first_step', icon: '🌱', name: 'First Step', desc: 'Complete your first game' },
  { id: 'streak_3', icon: '🔥', name: 'Dedicated Mind', desc: 'Maintain a 3-day play streak' },
  { id: 'matrix_master', icon: '🧩', name: 'Grid Master', desc: 'Score 1,000+ in Memory Matrix' },
  { id: 'stroop_ninja', icon: '⚡', name: 'Stroop Ninja', desc: 'Score 1,200+ in Color Clash' },
  { id: 'pattern_genius', icon: '🔮', name: 'Pattern Genius', desc: 'Score 10+ rounds in Pattern Sequence' },
  { id: 'math_wiz', icon: '🧮', name: 'Math Wizard', desc: 'Score 1,500+ in Speed Math' },
  { id: 'victory_royale', icon: '👑', name: 'Victory Royale', desc: 'Score 2,000+ in Cyber Royale' },
  { id: 'brain_master', icon: '🏆', name: 'Grandmaster', desc: 'Reach 5,000+ Total XP' }
];

class StorageEngine {
  constructor() {
    this.storageKey = 'neuropulse_stats_v1';
    this.stats = this.loadStats();
    this.updateStreak();
  }

  loadStats() {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (data) {
        const parsed = JSON.parse(data);
        return { 
          ...INITIAL_STATS, 
          ...parsed, 
          highScores: { ...INITIAL_STATS.highScores, ...parsed.highScores } 
        };
      }
    } catch (e) {
      console.warn("Storage load error", e);
    }
    return { ...INITIAL_STATS };
  }

  saveStats() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.stats));
    } catch (e) {
      console.warn("Storage save error", e);
    }
  }

  updateStreak() {
    const today = new Date().toDateString();
    if (this.stats.lastPlayedDate !== today) {
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      if (this.stats.lastPlayedDate === yesterday) {
        this.stats.streakDays += 1;
      } else {
        this.stats.streakDays = 1;
      }
      this.stats.lastPlayedDate = today;
      this.saveStats();
    }
  }

  recordGameResult(gameId, score, domainKey) {
    this.stats.totalGamesPlayed += 1;
    this.stats.totalScoreXP += score;

    // High Score Update
    if (score > (this.stats.highScores[gameId] || 0)) {
      this.stats.highScores[gameId] = score;
    }

    // Domain rating scaling
    const currentRating = this.stats.domainRatings[domainKey] || 50;
    const ratingGain = Math.min(15, Math.floor(score / 150));
    this.stats.domainRatings[domainKey] = Math.min(100, currentRating + ratingGain);

    // Check Badges
    const newBadges = this.checkBadges();
    this.saveStats();
    return newBadges;
  }

  checkBadges() {
    const newlyUnlocked = [];
    const unlock = (badgeId) => {
      if (!this.stats.unlockedBadges.includes(badgeId)) {
        this.stats.unlockedBadges.push(badgeId);
        newlyUnlocked.push(BADGES_LIST.find(b => b.id === badgeId));
      }
    };

    if (this.stats.totalGamesPlayed >= 1) unlock('first_step');
    if (this.stats.streakDays >= 3) unlock('streak_3');
    if (this.stats.highScores.memoryMatrix >= 1000) unlock('matrix_master');
    if (this.stats.highScores.colorClash >= 1200) unlock('stroop_ninja');
    if (this.stats.highScores.patternSequence >= 10) unlock('pattern_genius');
    if (this.stats.highScores.speedMath >= 1500) unlock('math_wiz');
    if (this.stats.highScores.cyberRoyale >= 2000) unlock('victory_royale');
    if (this.stats.totalScoreXP >= 5000) unlock('brain_master');

    return newlyUnlocked;
  }

  resetAllData() {
    this.stats = { ...INITIAL_STATS };
    this.saveStats();
  }

  renderRadarSVG(svgElement) {
    if (!svgElement) return;

    const domains = [
      { key: 'memory', label: 'Memory', val: this.stats.domainRatings.memory },
      { key: 'flexibility', label: 'Focus', val: this.stats.domainRatings.flexibility },
      { key: 'pattern', label: 'Pattern', val: this.stats.domainRatings.pattern },
      { key: 'speed', label: 'Speed', val: this.stats.domainRatings.speed }
    ];

    const center = 110;
    const maxR = 75;
    const angles = [ -Math.PI / 2, 0, Math.PI / 2, Math.PI ];

    let gridPaths = '';
    [0.25, 0.5, 0.75, 1.0].forEach(rRatio => {
      const r = maxR * rRatio;
      const pts = angles.map(a => `${center + r * Math.cos(a)},${center + r * Math.sin(a)}`).join(' ');
      gridPaths += `<polygon points="${pts}" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>`;
    });

    let axisLines = '';
    angles.forEach(a => {
      const x2 = center + maxR * Math.cos(a);
      const y2 = center + maxR * Math.sin(a);
      axisLines += `<line x1="${center}" y1="${center}" x2="${x2}" y2="${y2}" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>`;
    });

    const polyPoints = domains.map((d, i) => {
      const ratio = Math.max(0.15, d.val / 100);
      const r = maxR * ratio;
      const a = angles[i];
      return `${center + r * Math.cos(a)},${center + r * Math.sin(a)}`;
    }).join(' ');

    let labelsHTML = '';
    const labelPos = [
      { x: center, y: center - maxR - 12, anchor: 'middle' },
      { x: center + maxR + 12, y: center + 4, anchor: 'start' },
      { x: center, y: center + maxR + 18, anchor: 'middle' },
      { x: center - maxR - 12, y: center + 4, anchor: 'end' }
    ];

    domains.forEach((d, i) => {
      const pos = labelPos[i];
      labelsHTML += `<text x="${pos.x}" y="${pos.y}" text-anchor="${pos.anchor}" fill="#94a3b8" font-size="10" font-weight="700">${d.label}</text>`;
    });

    svgElement.innerHTML = `
      ${gridPaths}
      ${axisLines}
      <polygon points="${polyPoints}" fill="rgba(0, 243, 255, 0.25)" stroke="#00f3ff" stroke-width="2.5" stroke-linejoin="round"/>
      ${domains.map((d, i) => {
        const ratio = Math.max(0.15, d.val / 100);
        const r = maxR * ratio;
        const a = angles[i];
        return `<circle cx="${center + r * Math.cos(a)}" cy="${center + r * Math.sin(a)}" r="4" fill="#00f3ff" />`;
      }).join('')}
      ${labelsHTML}
    `;
  }
}

window.storageEngine = new StorageEngine();
