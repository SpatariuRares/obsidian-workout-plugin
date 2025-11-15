export class TimerAudio {
  static playSound(): void {
    try {
      const audioContext = new (window.AudioContext ||
        (window as typeof window & { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext)();

      // Create a more pleasant notification sound with multiple tones
      const playTone = (
        frequency: number,
        startTime: number,
        duration: number,
        volume: number = 0.15
      ) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = "sine";

        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.08);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      };

      const currentTime = audioContext.currentTime;

      playTone(523.25, currentTime, 0.4); // C5
      playTone(659.25, currentTime + 0.1, 0.4); // E5
      playTone(783.99, currentTime + 0.2, 0.4); // G5
      playTone(1046.5, currentTime + 0.3, 0.4); // C6

      // Resolution: descending back to C
      playTone(783.99, currentTime + 0.5, 0.3); // G5
      playTone(659.25, currentTime + 0.65, 0.3); // E5
      playTone(523.25, currentTime + 0.8, 0.4); // C5 (final note)
    } catch {
      // Silently fail if audio context creation fails
    }
  }
}

