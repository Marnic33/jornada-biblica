/**
 * AudioManager — música ambiente e efeitos gerados por código
 * (Web Audio API), sem arquivos externos. Reutilizável por qualquer missão.
 *
 * - música: progressão suave de acordes em loop (pad etéreo)
 * - sfx: "coleta" (arpejo ascendente), "vitória" (fanfarra curta)
 * O navegador exige interação do usuário antes de tocar áudio,
 * então start() deve ser chamado a partir de um clique.
 */
export class AudioManager {
  constructor() {
    this.ctx = null;
    this.musicGain = null;
    this.enabled = true;
    this._musicTimer = null;
  }

  _ensure() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.5;
      this.master.connect(this.ctx.destination);
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.18;
      this.musicGain.connect(this.master);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  startMusic() {
    this._ensure();
    if (this._musicTimer) return;
    // Acordes (semitons relativos a uma fundamental) — progressão serena
    const chords = [
      [0, 4, 7, 11],   // Imaj7
      [-3, 0, 4, 9],   // vi
      [-5, -1, 2, 7],  // IV
      [-7, -3, 0, 5],  // V
    ];
    const base = 220; // Lá
    let i = 0;
    const playChord = () => {
      if (!this.enabled) return;
      const chord = chords[i % chords.length];
      const t = this.ctx.currentTime;
      chord.forEach((semi) => {
        const freq = base * Math.pow(2, semi / 12);
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        // envelope suave (pad)
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.25, t + 1.2);
        g.gain.linearRampToValueAtTime(0, t + 3.6);
        osc.connect(g); g.connect(this.musicGain);
        osc.start(t); osc.stop(t + 3.8);
      });
      i++;
    };
    playChord();
    this._musicTimer = setInterval(playChord, 3400);
  }

  stopMusic() {
    clearInterval(this._musicTimer);
    this._musicTimer = null;
  }

  setMuted(muted) {
    this.enabled = !muted;
    if (this.master) this.master.gain.value = muted ? 0 : 0.5;
    if (muted) this.stopMusic();
    else if (!this._musicTimer) this.startMusic();
  }

  /** Efeito de coleta — arpejo ascendente alegre. */
  collect() {
    if (!this.ctx || !this.enabled) return;
    const notes = [523, 659, 784, 1047]; // Dó Mi Sol Dó
    notes.forEach((f, k) => {
      const t = this.ctx.currentTime + k * 0.08;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'triangle'; osc.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.3, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
      osc.connect(g); g.connect(this.master);
      osc.start(t); osc.stop(t + 0.32);
    });
  }

  /** Fanfarra curta de vitória. */
  victory() {
    if (!this.ctx || !this.enabled) return;
    const seq = [523, 659, 784, 1047, 1319];
    seq.forEach((f, k) => {
      const t = this.ctx.currentTime + k * 0.15;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sawtooth'; osc.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.25, t + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
      osc.connect(g); g.connect(this.master);
      osc.start(t); osc.stop(t + 0.52);
    });
  }
}
