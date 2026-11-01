type AudioContextCtor = typeof AudioContext;

/** What a sound announces: an interval phase starting, or the timer ending */
export type TimerCue = "work" | "rest" | "end";

/** Tones as [frequency Hz, start s, length s] */
const CUE_TONES: Record<TimerCue, Array<[number, number, number]>> = {
  // Two short high beeps: go
  work: [
    [880, 0, 0.15],
    [1174.66, 0.18, 0.25],
  ],
  // One low falling pair: ease off
  rest: [
    [523.25, 0, 0.3],
    [392, 0.25, 0.4],
  ],
  // Rising C major arpeggio, then back down to C
  end: [
    [523.25, 0, 0.4],
    [659.25, 0.1, 0.4],
    [783.99, 0.2, 0.4],
    [1046.5, 0.3, 0.4],
    [783.99, 0.5, 0.3],
    [659.25, 0.65, 0.3],
    [523.25, 0.8, 0.4],
  ],
};

/**
 * Notification sound for a single timer.
 *
 * Mobile browsers keep an AudioContext suspended until it is resumed inside a
 * user gesture, so the timer calls unlock() when the user taps Start and then
 * reuses the same context for every sound. close() releases it on cleanup.
 */
export class TimerAudio {
  private context?: AudioContext;

  /** Create (if needed) and resume the context. Call from a user gesture. */
  unlock(): void {
    const context = this.getContext();
    if (context?.state === "suspended") {
      void context.resume().catch(() => {});
    }
  }

  play(cue: TimerCue = "end"): void {
    try {
      const context = this.getContext();
      if (!context) return;
      if (context.state === "suspended") {
        void context.resume().catch(() => {});
      }

      const now = context.currentTime;
      for (const [frequency, start, length] of CUE_TONES[cue]) {
        const oscillator = context.createOscillator();
        const gainNode = context.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(context.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = "sine";

        const startTime = now + start;
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.15, startTime + 0.08);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + length);

        oscillator.start(startTime);
        oscillator.stop(startTime + length);
      }
    } catch {
      // Silently fail if audio is unavailable
    }
  }

  close(): void {
    const context = this.context;
    this.context = undefined;
    if (context && context.state !== "closed") {
      void context.close().catch(() => {});
    }
  }

  private getContext(): AudioContext | undefined {
    if (this.context && this.context.state !== "closed") {
      return this.context;
    }
    const Ctor: AudioContextCtor | undefined =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: AudioContextCtor })
        .webkitAudioContext;
    if (!Ctor) return undefined;
    try {
      this.context = new Ctor();
    } catch {
      this.context = undefined;
    }
    return this.context;
  }
}
