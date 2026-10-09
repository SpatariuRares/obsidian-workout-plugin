type AudioContextCtor = typeof AudioContext;

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

  play(): void {
    try {
      const context = this.getContext();
      if (!context) return;
      if (context.state === "suspended") {
        void context.resume().catch(() => {});
      }

      // Create a more pleasant notification sound with multiple tones
      const playTone = (
        frequency: number,
        startTime: number,
        duration: number,
        volume: number = 0.15,
      ) => {
        const oscillator = context.createOscillator();
        const gainNode = context.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(context.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = "sine";

        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(
          volume,
          startTime + 0.08,
        );
        gainNode.gain.exponentialRampToValueAtTime(
          0.01,
          startTime + duration,
        );

        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      };

      const currentTime = context.currentTime;

      playTone(523.25, currentTime, 0.4); // C5
      playTone(659.25, currentTime + 0.1, 0.4); // E5
      playTone(783.99, currentTime + 0.2, 0.4); // G5
      playTone(1046.5, currentTime + 0.3, 0.4); // C6

      // Resolution: descending back to C
      playTone(783.99, currentTime + 0.5, 0.3); // G5
      playTone(659.25, currentTime + 0.65, 0.3); // E5
      playTone(523.25, currentTime + 0.8, 0.4); // C5 (final note)
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
