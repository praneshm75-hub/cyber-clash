/* ==========================================================================
   NEUROPULSE - SOUND SYNTHESIZER ENGINE (Web Audio API)
   Includes Mind Games & Cyber Royale Firearms Synth
   ========================================================================== */

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.initOnInteraction = this.initOnInteraction.bind(this);

    window.addEventListener('click', this.initOnInteraction, { once: true });
    window.addEventListener('keydown', this.initOnInteraction, { once: true });
    window.addEventListener('touchstart', this.initOnInteraction, { once: true });
  }

  initOnInteraction() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
  }

  ensureContext() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  isMuted() {
    return this.muted;
  }

  playTone(freq, type = 'sine', duration = 0.1, gainVal = 0.15, fadeOut = true) {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
      if (fadeOut) {
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
      }

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      console.warn("Audio playback issue", e);
    }
  }

  // Noise generator for gunfire & explosions
  playNoise(duration = 0.1, gainVal = 0.2) {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    try {
      const bufferSize = this.ctx.sampleRate * duration;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, this.ctx.currentTime);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start();
    } catch (e) {}
  }

  // UI Sounds
  playTap() { this.playTone(600, 'triangle', 0.05, 0.1); }
  playCorrect() {
    if (this.muted) return;
    this.playTone(523.25, 'sine', 0.12, 0.15);
    setTimeout(() => this.playTone(659.25, 'sine', 0.18, 0.15), 80);
  }
  playWrong() { this.playTone(180, 'sawtooth', 0.25, 0.15); }
  playSimonTone(padIndex) {
    const freqs = [261.63, 329.63, 392.00, 523.25][padIndex] || 440;
    this.playTone(freqs, 'sine', 0.35, 0.2);
  }
  playLevelUp() {
    if (this.muted) return;
    [440, 554.37, 659.25, 880].forEach((freq, idx) => {
      setTimeout(() => this.playTone(freq, 'triangle', 0.2, 0.15), idx * 90);
    });
  }
  playGameOver() {
    if (this.muted) return;
    [400, 350, 300, 250].forEach((freq, idx) => {
      setTimeout(() => this.playTone(freq, 'sawtooth', 0.25, 0.12), idx * 120);
    });
  }

  // Firearms & Battle Royale Sounds
  playPistol() {
    this.playTone(320, 'square', 0.08, 0.12);
    this.playNoise(0.06, 0.15);
  }

  playShotgun() {
    this.playTone(150, 'sawtooth', 0.15, 0.25);
    this.playNoise(0.18, 0.3);
  }

  playAssaultRifle() {
    this.playTone(280, 'triangle', 0.06, 0.15);
    this.playNoise(0.05, 0.12);
  }

  playSniper() {
    this.playTone(600, 'sawtooth', 0.2, 0.3);
    this.playNoise(0.25, 0.35);
  }

  playRocket() {
    this.playTone(120, 'sawtooth', 0.3, 0.3);
    this.playNoise(0.35, 0.4);
  }

  playExplosion() {
    this.playTone(80, 'sawtooth', 0.4, 0.4);
    this.playNoise(0.5, 0.5);
  }

  playReload() {
    this.playTone(500, 'triangle', 0.06, 0.1);
    setTimeout(() => this.playTone(700, 'triangle', 0.08, 0.1), 120);
  }

  playLootPickup() {
    this.playTone(880, 'sine', 0.08, 0.15);
    setTimeout(() => this.playTone(1174.66, 'sine', 0.12, 0.15), 70);
  }

  playVictoryRoyale() {
    if (this.muted) return;
    const fanfare = [523.25, 659.25, 783.99, 1046.50, 1318.51];
    fanfare.forEach((f, i) => {
      setTimeout(() => this.playTone(f, 'triangle', 0.3, 0.25), i * 150);
    });
  }
}

window.soundEngine = new SoundEngine();
