import { Notice } from "obsidian";
import { TimerState, TimerCallbacks } from "@app/components/timer/TimerTypes";
import { TimerAudio } from "@app/components/timer/TimerAudio";
import { TimerDisplay } from "@app/components/timer/TimerDisplay";
import { TimerControls } from "@app/components/timer/TimerControls";

export class TimerCore {
  private state: TimerState;
  private timerId: string;
  private callbacks: TimerCallbacks;
  private debugMode: boolean;

  constructor(
    timerId: string,
    callbacks: TimerCallbacks = {},
    debugMode: boolean = false
  ) {
    this.timerId = timerId;
    this.callbacks = callbacks;
    this.debugMode = debugMode;

    // Initialize state for this timer instance
    this.state = {
      timerInterval: undefined,
      startTime: undefined,
      elapsedTime: 0,
      isRunning: false,
      currentRound: 1,
      totalRounds: 1,
      intervalTime: 30,
      timerType: "countdown",
      duration: 90,
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
      if (this.debugMode) {
        console.debug("TimerCore: Cannot start timer - display not initialized", {
          timerId: this.timerId,
        });
      }
      return;
    }

    if (this.state.timerType === "countdown") {
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


    if (this.debugMode) {
      console.debug("TimerCore: Timer started", {
        timerId: this.timerId,
        duration: this.state.duration,
        elapsedTime: this.state.elapsedTime,
      });
    }

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
      currentRound: 1
    });
    this.updateDisplay();
  }

  private updateTimer(): void {
    if (!this.state.startTime) {
      if (this.debugMode) {
        console.debug("TimerCore: updateTimer called but startTime is null", {
          timerId: this.timerId,
          isRunning: this.state.isRunning,
        });
      }
      return;
    }

    const now = Date.now();
    this.setState({ elapsedTime: now - this.state.startTime });

    if (this.state.timerType === "countdown") {
      const remaining = Math.max(
        0,
        this.state.duration * 1000 - this.state.elapsedTime
      );
      if (remaining <= 0) {
        this.handleTimerComplete();
        return;
      }
    } else if (this.state.timerType === "interval") {
      const intervalElapsed =
        this.state.elapsedTime % (this.state.intervalTime * 1000);
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
    TimerDisplay.updateDisplay(this.state, this.timerId, this.debugMode);
  }

  private handleTimerComplete(): void {
    this.stop();
    TimerAudio.playSound();

    if (this.debugMode) {
      console.debug("TimerCore: Timer completed", {
        timerId: this.timerId,
      });
    }

    if (this.state.startStopBtn) {
      TimerControls.updateStartStopButton(this.state.startStopBtn, false);
    }

    // Update display to show completion
    this.updateDisplay();

    // Show completion message
    new Notice("Timer completed!");

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