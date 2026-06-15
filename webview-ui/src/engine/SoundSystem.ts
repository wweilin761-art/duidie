/**
 * SoundSystem — synthesized sound effects using the Web Audio API.
 *
 * All sounds are generated programmatically via OscillatorNode + GainNode.
 * No external audio files required. All sounds are short (< 1 second)
 * and low volume (0.03-0.10 gain) to avoid being annoying.
 *
 * Waveform conventions:
 *   'sine'     — pleasant sounds (combine, complete, monthStart)
 *   'square'   — alerts (enemy, event)
 *   'triangle' — neutral (pickup, drop, click)
 *   'sawtooth' — harsh sounds (death)
 *
 * Musical frequencies (scientific pitch notation):
 *   C4=262  D4=294  E4=330  F4=349  G4=392  A4=440  B4=494  C5=523
 *   D5=587  E5=659  F5=698  G5=784  A5=880  B5=988  C6=1047
 */

export class SoundSystem {
  private ctx: AudioContext | null = null;
  private enabled: boolean = true;

  private getCtx(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  /** Enable or disable all sound effects. */
  setEnabled(on: boolean): void {
    this.enabled = on;
  }

  // ---------------------------------------------------------------------------
  // Core helpers
  // ---------------------------------------------------------------------------

  /**
   * Play a single short beep.
   * @param freq     Frequency in Hz
   * @param duration Duration in seconds
   * @param type     Oscillator waveform type
   * @param volume   Peak gain (0-1)
   */
  private beep(
    freq: number,
    duration: number,
    type: OscillatorType = 'sine',
    volume: number = 0.1,
  ): void {
    const ctx = this.getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  }

  /**
   * Play a sequence of notes with equal spacing.
   * @param freqs    Array of frequencies
   * @param duration Per-note duration in seconds
   * @param type     Oscillator waveform type
   * @param volume   Peak gain (0-1)
   */
  private playNotes(
    freqs: number[],
    duration: number,
    type: OscillatorType = 'sine',
    volume: number = 0.08,
  ): void {
    freqs.forEach((f, i) => {
      setTimeout(() => this.beep(f, duration, type, volume), i * duration * 800);
    });
  }

  // ---------------------------------------------------------------------------
  // Public sound effect methods
  // ---------------------------------------------------------------------------

  /** Card pickup — short rising tone (A4). */
  pickUp(): void {
    if (!this.enabled) return;
    this.beep(440, 0.08, 'triangle', 0.06);
  }

  /** Card drop on empty space — soft thud (A3 ~220 Hz). */
  drop(): void {
    if (!this.enabled) return;
    this.beep(220, 0.12, 'triangle', 0.05);
  }

  /** Recipe combine — pleasant two-note chime (C5→E5). */
  combine(): void {
    if (!this.enabled) return;
    this.playNotes([523, 659], 0.15, 'sine', 0.07);
  }

  /** Recipe completion — three-note ascending arpeggio (C5→E5→G5). */
  complete(): void {
    if (!this.enabled) return;
    this.playNotes([523, 659, 784], 0.15, 'sine', 0.08);
  }

  /** Sell card — coin jingle: three rapid high notes (A5). */
  sell(): void {
    if (!this.enabled) return;
    this.beep(880, 0.06, 'sine', 0.07);
    setTimeout(() => this.beep(880, 0.06, 'sine', 0.07), 60);
    setTimeout(() => this.beep(880, 0.06, 'sine', 0.07), 120);
  }

  /** Enemy spawn — low warning tone (D3 ~150 Hz, square wave). */
  enemyAppear(): void {
    if (!this.enabled) return;
    this.beep(150, 0.3, 'square', 0.06);
  }

  /** Villager death — descending sad tone (E4→C4→G3, sawtooth). */
  death(): void {
    if (!this.enabled) return;
    this.playNotes([330, 262, 196], 0.2, 'sawtooth', 0.04);
  }

  /** Eating — short crunch/munch (D5 ~600 Hz, triangle). */
  eat(): void {
    if (!this.enabled) return;
    this.beep(600, 0.05, 'triangle', 0.04);
  }

  /** Button click — very short tick (G5 ~800 Hz, triangle). */
  click(): void {
    if (!this.enabled) return;
    this.beep(800, 0.03, 'triangle', 0.03);
  }

  /** Event trigger — two-tone alert (A4→C#5, square wave). */
  event(): void {
    if (!this.enabled) return;
    this.playNotes([440, 554], 0.12, 'square', 0.05);
  }

  /** Month advance — short fanfare (G4→C5→E5→G5 ascending). */
  monthStart(): void {
    if (!this.enabled) return;
    this.playNotes([392, 523, 659, 784], 0.18, 'sine', 0.06);
  }
}

/** Module-level singleton — import { sound } wherever sound effects are needed. */
export const sound = new SoundSystem();
