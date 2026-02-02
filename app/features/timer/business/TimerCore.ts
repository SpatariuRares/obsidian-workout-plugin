import { CONSTANTS } from "@app/constants";
import { Notice } from "obsidian";
import {
  TimerState,
  TimerCallbacks,
} from "@app/types/TimerTypes";
import { TimerAudio } from "@app/features/timer/components/TimerAudio";
import { TimerDisplay } from "@app/features/timer/components/TimerDisplay";
import { TimerControls } from "@app/features/timer/components/TimerControls";
import { TIMER_TYPE } from "@app/types";

export class TimerCore {
  private state: TimerState;
  private timerId: string;
  private callbacks: TimerCallbacks;

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
      timerDisplay: undefined,
      startStopBtn: undefined,
    };
  }

  getState(): TimerState {
    return { ...this.state };
  }

  setState(newState: Partial<TimerState>): void {
    this.state = { ...this.state, ...newState };
    this.callbacks.onStateChange?.(this.state);
  }

  start(): void {
    if (this.state.isRunning) return;

    // Ensure timer display is available
    if (!this.state.timerDisplay) {
      return;
    }

    if (this.state.timerType === TIMER_TYPE.COUNTDOWN) {
      const remaining = this.state.duration * 1000 - this.state.elapsedTime;
      if (remaining <= 0) {
        this.setState({
          elapsedTime: 0,
          currentRound: 1,
        });
      }
    }

    this.setState({
      isRunning: true,
      startTime: Date.now() - this.state.elapsedTime,
    });

    this.state.timerInterval = window.setInterval(() => {
      this.updateTimer();
    }, 100);
  }

  stop(): void {
    if (!this.state.isRunning) return;

    this.setState({ isRunning: false });

    if (this.state.timerInterval) {
      clearInterval(this.state.timerInterval);
      this.setState({ timerInterval: undefined });
    }
  }

  reset(): void {
    this.stop();
    this.setState({
      elapsedTime: 0,
      currentRound: 1,
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
        this.state.duration * 1000 - this.state.elapsedTime
      );
      if (remaining <= 0) {
        this.handleTimerComplete();
        return;
      }
    } else if (this.state.timerType === TIMER_TYPE.INTERVAL) {
      // Use duration for interval timing (same as countdown)
      const intervalElapsed =
        this.state.elapsedTime % (this.state.duration * 1000);
      if (intervalElapsed < 100 && this.state.elapsedTime > 0) {
        this.setState({ currentRound: this.state.currentRound + 1 });
        if (this.state.currentRound > this.state.totalRounds) {
          this.handleTimerComplete();
          return;
        }
        TimerAudio.playSound();
        this.callbacks.onSoundPlay?.();
      }
    }

    this.updateDisplay();
  }

  private updateDisplay(): void {
    TimerDisplay.updateDisplay(this.state, this.timerId);
  }

  private handleTimerComplete(): void {
    this.stop();
    TimerAudio.playSound();

    if (this.state.startStopBtn) {
      TimerControls.updateStartStopButton(this.state.startStopBtn, false);
    }

    // Update display to show completion
    this.updateDisplay();

    // Show completion message
    new Notice(CONSTANTS.WORKOUT.MESSAGES.TIMER_COMPLETED);

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
  }
}
