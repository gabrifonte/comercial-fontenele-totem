/**
 * Web Audio API synthesized mechanical ticker & sound effects.
 * No external audio files required, instant latency and zero CORS issues.
 */

class SoundEffectsManager {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  private getContext(): AudioContext | null {
    if (!this.enabled) return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private lastPegClickTime: number = 0;

  /**
   * Mechanical flapper click sound when hitting pegs on the prize wheel
   */
  public playPegClick(speedFactor: number = 1): void {
    if (!this.enabled) return;
    const nowMs = performance.now();
    // Throttle to at most one click every 30ms to prevent audio buffer saturation
    if (nowMs - this.lastPegClickTime < 30) return;
    this.lastPegClickTime = nowMs;

    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      // Short metallic wooden click
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      const baseFreq = 750 + Math.min(speedFactor * 40, 350);
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.025);

      gain.gain.setValueAtTime(0.28, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.03);
    } catch {
      // Audio autoplay policy fallback
    }
  }

  /**
   * Celebratory "ta-da-NAM!" when the wheel lands on a prize:
   * two quick brass hits, then a big sustained major chord with a bass drum and cymbal crash.
   */
  public playWinFanfare(): void {
    if (!this.enabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime + 0.03;
      const master = ctx.createGain();
      master.gain.setValueAtTime(0.5, now);
      master.connect(ctx.destination);

      // Brass-like note: detuned sawtooths through a low-pass filter with a quick "blat" attack
      const brass = (freqs: number[], start: number, dur: number, level: number) => {
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.Q.value = 1.5;
        filter.frequency.setValueAtTime(700, start);
        filter.frequency.exponentialRampToValueAtTime(3200, start + 0.07);
        filter.frequency.exponentialRampToValueAtTime(1400, start + dur);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, start);
        g.gain.exponentialRampToValueAtTime(level, start + 0.03);
        g.gain.setValueAtTime(level, start + Math.max(dur - 0.25, 0.04));
        g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
        filter.connect(g);
        g.connect(master);
        freqs.forEach((freq) => {
          [-6, 6].forEach((detune) => {
            const osc = ctx.createOscillator();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, start);
            osc.detune.setValueAtTime(detune, start);
            osc.connect(filter);
            osc.start(start);
            osc.stop(start + dur + 0.05);
          });
        });
      };

      // "ta" "da" (short, rising) ... "NAAAM" (long chord: C major with octave)
      brass([392.0], now, 0.16, 0.12); // G4
      brass([523.25], now + 0.18, 0.16, 0.12); // C5
      const big = now + 0.4;
      brass([261.63, 329.63, 392.0, 523.25, 659.25], big, 1.5, 0.1);

      // Bass drum on the big hit
      const kick = ctx.createOscillator();
      const kickGain = ctx.createGain();
      kick.type = 'sine';
      kick.frequency.setValueAtTime(150, big);
      kick.frequency.exponentialRampToValueAtTime(45, big + 0.25);
      kickGain.gain.setValueAtTime(0.9, big);
      kickGain.gain.exponentialRampToValueAtTime(0.0001, big + 0.4);
      kick.connect(kickGain);
      kickGain.connect(master);
      kick.start(big);
      kick.stop(big + 0.45);

      // Cymbal crash (filtered noise)
      const noise = this.createNoiseSource(ctx, 1.6);
      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.setValueAtTime(5000, big);
      const crashGain = ctx.createGain();
      crashGain.gain.setValueAtTime(0.35, big);
      crashGain.gain.exponentialRampToValueAtTime(0.0001, big + 1.5);
      noise.connect(hp);
      hp.connect(crashGain);
      crashGain.connect(master);
      noise.start(big);
      noise.stop(big + 1.6);
    } catch {
      // Audio autoplay policy fallback
    }
  }

  /** Creates a white-noise source of the given length (seconds). */
  private createNoiseSource(ctx: AudioContext, seconds: number): AudioBufferSourceNode {
    const length = Math.max(1, Math.floor(ctx.sampleRate * seconds));
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    return src;
  }

  /**
   * UI Click feedback
   */
  public playClick(): void {
    if (!this.enabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.04);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.05);
    } catch {
      // Audio fallback
    }
  }

  private musicMaster: GainNode | null = null;
  private musicNodes: AudioScheduledSourceNode[] = [];

  /**
   * Snare drum roll played while the wheel is spinning: hits start slow and get faster and
   * louder (crescendo), with soft toms underneath. Fully synthesized, no audio files.
   * Pre-schedules the whole roll; call stopSuspenseMusic() when the spin ends.
   */
  public startSuspenseMusic(durationSec: number = 7): void {
    if (!this.enabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      this.stopSuspenseMusic(true);

      const t0 = ctx.currentTime + 0.05;

      const master = ctx.createGain();
      master.gain.setValueAtTime(0.0001, t0);
      master.gain.exponentialRampToValueAtTime(0.9, t0 + 0.2);
      master.connect(ctx.destination);
      this.musicMaster = master;

      const track = (node: AudioScheduledSourceNode) => {
        this.musicNodes.push(node);
        return node;
      };

      // One shared noise buffer reused by every snare hit
      const noiseLen = Math.floor(ctx.sampleRate * 0.12);
      const noiseBuf = ctx.createBuffer(1, noiseLen, ctx.sampleRate);
      const nd = noiseBuf.getChannelData(0);
      for (let i = 0; i < noiseLen; i++) nd[i] = Math.random() * 2 - 1;

      const snareHit = (t: number, level: number) => {
        const src = track(ctx.createBufferSource()) as AudioBufferSourceNode;
        src.buffer = noiseBuf;
        const bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.setValueAtTime(2200, t);
        bp.Q.value = 0.8;
        const g = ctx.createGain();
        g.gain.setValueAtTime(level, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
        src.connect(bp);
        bp.connect(g);
        g.connect(master);
        src.start(t);
        src.stop(t + 0.12);

        // Short tonal "body" of the drum
        const osc = track(ctx.createOscillator()) as OscillatorNode;
        const og = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(190, t);
        osc.frequency.exponentialRampToValueAtTime(130, t + 0.05);
        og.gain.setValueAtTime(level * 0.5, t);
        og.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
        osc.connect(og);
        og.connect(master);
        osc.start(t);
        osc.stop(t + 0.08);
      };

      // Snare roll: interval shrinks from ~95ms to ~45ms, volume rises; slight random humanization
      let t = t0;
      const end = t0 + durationSec;
      while (t < end) {
        const progress = (t - t0) / durationSec;
        const interval = 0.095 - progress * 0.05;
        const level = 0.18 + progress * 0.5;
        snareHit(t + (Math.random() - 0.5) * 0.008, level * (0.85 + Math.random() * 0.3));
        t += interval;
      }

      // Low toms pulsing underneath, accelerating over the spin
      let tt = t0;
      let beat = 0;
      while (tt < end) {
        const progress = (tt - t0) / durationSec;
        const osc = track(ctx.createOscillator()) as OscillatorNode;
        const g = ctx.createGain();
        osc.type = 'sine';
        const f = beat % 2 === 0 ? 95 : 75;
        osc.frequency.setValueAtTime(f * 1.6, tt);
        osc.frequency.exponentialRampToValueAtTime(f, tt + 0.1);
        g.gain.setValueAtTime(0.25 + progress * 0.35, tt);
        g.gain.exponentialRampToValueAtTime(0.0001, tt + 0.22);
        osc.connect(g);
        g.connect(master);
        osc.start(tt);
        osc.stop(tt + 0.25);
        tt += 0.34 - progress * 0.17;
        beat++;
      }
    } catch {
      // Audio autoplay policy fallback
    }
  }

  /**
   * Fades out and stops the suspense music.
   */
  public stopSuspenseMusic(immediate: boolean = false): void {
    const ctx = this.ctx;
    const master = this.musicMaster;
    const nodes = this.musicNodes;
    this.musicMaster = null;
    this.musicNodes = [];
    if (!ctx || !master) return;
    try {
      const now = ctx.currentTime;
      const fade = immediate ? 0.02 : 0.3;
      master.gain.cancelScheduledValues(now);
      master.gain.setValueAtTime(Math.max(master.gain.value, 0.0001), now);
      master.gain.exponentialRampToValueAtTime(0.0001, now + fade);
      nodes.forEach((n) => {
        try {
          n.stop(now + fade + 0.02);
        } catch {
          // Already stopped
        }
      });
      setTimeout(() => {
        try {
          master.disconnect();
        } catch {
          // Ignore
        }
      }, (fade + 0.1) * 1000);
    } catch {
      // Ignore
    }
  }
}

export const soundManager = new SoundEffectsManager();
