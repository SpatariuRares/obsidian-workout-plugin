import { Notice } from "obsidian";
import {
  TimerState,
  TimerSurface,
  TimerCallbacks,
  TIMER_TYPE,
} from "@app/features/timer/types";
import {
  TimerAudio,
  type TimerCue,
} from "@app/features/timer/components/TimerAudio";
import {
  intervalAt,
  intervalPlan,
} from "@app/features/timer/business/intervalSchedule";
import { TimerDisplay } from "@app/features/timer/components/TimerDisplay";
import { TimerControls } from "@app/features/timer/components/TimerControls";
import { t } from "@app/i18n";

export class TimerCore {
  private state: TimerState;
  private timerId: string;
  private callbacks: TimerCallbacks;
  private earlySoundPlayed = false;
  private soundEnabled = true;
  private audio = new TimerAudio();

  constructor(timerId: string, callbacks: TimerCallbacks = {}) {
    this.timerId = timerId;
    this.callbacks = callbacks;

    // Initialize state for this timer instance
    this.state = {
      timerInterval: undefined,
      startTime: undefined,
      elapsedTime: 0,
      isRunning: false,
      currentRound: 1,
      totalRounds: 1,
      timerType: TIMER_TYPE.COUNTDOWN,
      duration: 30,
      rest: 0,
      phase: "work",
      surfaces: [],
    };
  }

  getState(): TimerState {
    return { ...this.state };
  }

  setSoundEnabled(enabled: boolean): void {
    this.soundEnabled = enabled;
  }

  /** Draw on this rendering too, dropping renderings no longer in the document */
  addSurface(surface: TimerSurface): void {
    this.state.surfaces = [...this.liveSurfaces(), surface];
  }

  /** Renderings seen in the document; Obsidian may render a block before attaching it */
  private attached = new WeakSet<HTMLElement>();

  /** Surfaces not yet attached, or still attached; drops those removed since */
  private liveSurfaces(): TimerSurface[] {
    return this.state.surfaces.filter(({ timerDisplay }) => {
      if (timerDisplay.isConnected) this.attached.add(timerDisplay);
      return timerDisplay.isConnected || !this.attached.has(timerDisplay);
    });
  }

  private updateButtons(isRunning: boolean): void {
    for (const surface of this.state.surfaces) {
      TimerControls.updateStartStopButton(surface.startStopBtn, isRunning);
    }
  }

  setState(newState: Partial<TimerState>): void {
    this.state = { ...this.state, ...newState };
    this.callbacks.onStateChange?.(this.state);
  }

  start(): void {
    if (this.state.isRunning) return;

    // Ensure there is a rendering to draw on
    this.state.surfaces = this.liveSurfaces();
    if (this.state.surfaces.length === 0) {
      return;
    }

    if (this.state.timerType === TIMER_TYPE.COUNTDOWN) {
      const remaining =
        this.state.duration * 1000 - this.state.elapsedTime;
      if (remaining <= 0) {
        this.setState({
          elapsedTime: 0,
          currentRound: 1,
        });
      }
    } else if (
      this.state.timerType === TIMER_TYPE.INTERVAL &&
      this.state.phase === "done"
    ) {
      this.setState({ elapsedTime: 0, currentRound: 1, phase: "work" });
    }

    // Resume audio while still inside the user's tap (required on mobile)
    if (this.soundEnabled) {
      this.audio.unlock();
    }

    this.earlySoundPlayed = false;
    this.setState({
      isRunning: true,
      startTime: Date.now() - this.state.elapsedTime,
    });

    // Update start/stop button icons (also for auto-start and other renderings)
    this.updateButtons(true);

    this.state.timerInterval = window.setInterval(() => {
      this.updateTimer();
    }, 100);
  }

  stop(): void {
    if (!this.state.isRunning) return;

    this.setState({ isRunning: false });

    if (this.state.timerInterval) {
      window.clearInterval(this.state.timerInterval);
      this.setState({ timerInterval: undefined });
    }
    // Redraw as paused: drops the last-seconds overlay, shows "Paused"
    this.updateButtons(false);
    this.updateDisplay();
  }

  reset(): void {
    this.stop();
    this.earlySoundPlayed = false;
    TimerDisplay.cleanupOverlay(this.timerId);
    this.setState({
      elapsedTime: 0,
      currentRound: 1,
      phase: "work",
    });
    this.updateDisplay();
  }

  private updateTimer(): void {
    if (!this.state.startTime) {
      return;
    }

    const now = Date.now();
    this.setState({ elapsedTime: now - this.state.startTime });

    if (this.state.timerType === TIMER_TYPE.COUNTDOWN) {
      const remaining = Math.max(
        0,
        this.state.duration * 1000 - this.state.elapsedTime,
      );
      if (
        !this.earlySoundPlayed &&
        remaining <= 2000 &&
        remaining > 0
      ) {
        this.earlySoundPlayed = true;
        this.playSound();
      }
      if (remaining <= 0) {
        this.handleTimerComplete();
        return;
      }
    } else if (this.state.timerType === TIMER_TYPE.INTERVAL) {
      const point = intervalAt(
        intervalPlan({
          duration: this.state.duration,
          rest: this.state.rest,
          rounds: this.state.totalRounds,
        }),
        this.state.elapsedTime,
      );
      if (point.phase === "done") {
        this.setState({ phase: "done" });
        this.handleTimerComplete();
        return;
      }
      if (
        point.phase !== this.state.phase ||
        point.round !== this.state.currentRound
      ) {
        this.setState({ phase: point.phase, currentRound: point.round });
        this.playSound(point.phase);
      }
    }

    this.updateDisplay();
  }

  private playSound(cue: TimerCue = "end"): void {
    if (!this.soundEnabled) return;
    this.audio.play(cue);
    this.callbacks.onSoundPlay?.();
  }

  private updateDisplay(): void {
    this.state.surfaces = this.liveSurfaces();
    TimerDisplay.updateDisplay(this.state, this.timerId);
  }

  private handleTimerComplete(): void {
    this.stop();
    TimerDisplay.cleanupOverlay(this.timerId);
    if (!this.earlySoundPlayed) {
      this.playSound();
    }

    // Update display to show completion
    this.updateDisplay();

    // Show completion message
    new Notice(t("messages.timerCompleted"));

    this.callbacks.onTimerComplete?.();
  }

  isRunning(): boolean {
    return this.state.isRunning;
  }

  getId(): string {
    return this.timerId;
  }

  // Cleanup method
  destroy(): void {
    this.stop();
    TimerDisplay.cleanupOverlay(this.timerId);
    this.audio.close();
  }
}
