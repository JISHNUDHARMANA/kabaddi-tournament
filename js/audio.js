/**
 * Kabaddi Match Audio Synthesizer (Web Audio API)
 * Generates synthetic sports whistles, countdown ticks, buzzers, and fanfares without external audio assets.
 */
class KabaddiAudio {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  playTone(freq, type = 'sine', duration = 0.15, gainVal = 0.15, startTime = 0) {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime + startTime);

      gain.gain.setValueAtTime(gainVal, this.ctx.currentTime + startTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + startTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(this.ctx.currentTime + startTime);
      osc.stop(this.ctx.currentTime + startTime + duration);
    } catch (e) {
      console.warn('Audio play error', e);
    }
  }

  // Referee double whistle
  whistle() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const playChirp = (delay) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const now = this.ctx.currentTime + delay;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(2400, now);
        osc.frequency.linearRampToValueAtTime(2800, now + 0.08);
        osc.frequency.linearRampToValueAtTime(2300, now + 0.16);

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.16);
      };

      playChirp(0);
      playChirp(0.2);
    } catch (e) {
      console.warn(e);
    }
  }

  // 30s raid buzzer (horn sound)
  buzzer() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;

      osc1.type = 'sawtooth';
      osc2.type = 'square';
      osc1.frequency.setValueAtTime(140, now);
      osc2.frequency.setValueAtTime(145, now);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.linearRampToValueAtTime(0.3, now + 0.6);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.9);
      osc2.stop(now + 0.9);
    } catch (e) {
      console.warn(e);
    }
  }

  // Soft clock tick during raid
  tick(isUrgent = false) {
    if (this.isMuted) return;
    this.playTone(isUrgent ? 880 : 440, 'triangle', 0.05, isUrgent ? 0.2 : 0.08);
  }

  // Point celebration chime
  pointScored() {
    if (this.isMuted) return;
    this.init();
    const now = 0;
    this.playTone(523.25, 'sine', 0.1, 0.2, now); // C5
    this.playTone(659.25, 'sine', 0.12, 0.2, now + 0.09); // E5
    this.playTone(783.99, 'sine', 0.22, 0.2, now + 0.18); // G5
  }

  // Super raid / Super tackle fanfare
  superCelebration() {
    if (this.isMuted) return;
    this.init();
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      this.playTone(freq, 'triangle', 0.25, 0.25, i * 0.1);
    });
  }

  // All-Out / Lona gong
  allOutGong() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      [110, 220, 330].forEach(f => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 1.2);
      });
    } catch (e) {
      console.warn(e);
    }
  }
}

// Global audio singleton
window.kabaddiAudio = new KabaddiAudio();
