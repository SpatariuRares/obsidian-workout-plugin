// Embedded Timer View for workout timing functionality
import { Notice } from "obsidian";
import type WorkoutChartsPlugin from "../main";
import { EmbeddedTimerParams, UIComponents } from "../components";

interface TimerState {
  timerInterval?: number;
  startTime?: number;
  elapsedTime: number;
  isRunning: boolean;
  currentRound: number;
  totalRounds: number;
  intervalTime: number;
  timerType: "countdown" | "stopwatch" | "interval";
  duration: number;
  timerDisplay?: HTMLElement;
  startStopBtn?: HTMLButtonElement;
}

export class EmbeddedTimerView {
  private timerId: string;
  private state: TimerState;

  constructor(private plugin: WorkoutChartsPlugin) {
    this.timerId = `timer-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;

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

  async createTimer(
    container: HTMLElement,
    params: EmbeddedTimerParams
  ): Promise<void> {
    try {
      this.logDebug("createTimer called", { params, timerId: this.timerId });

      if (!this.validateAndHandleErrors(container, params)) {
        return;
      }

      // Reset and initialize timer properties for this instance
      this.stopTimer(); // Stop any existing timer
      this.state.timerType = params.type || "countdown";
      this.state.duration = params.duration || 300;
      this.state.intervalTime = params.intervalTime || 30;
      this.state.totalRounds = params.rounds || 1;
      this.state.elapsedTime = 0;
      this.state.currentRound = 1;
      this.state.isRunning = false;
      this.state.startTime = undefined;

      this.renderTimerContent(container, params);

      // Auto-start if requested
      if (params.autoStart) {
        this.startTimer();
      }
    } catch (error) {
      console.error("Error creating embedded timer:", error);
      UIComponents.renderErrorMessage(container, error.message);
    }
  }

  private validateAndHandleErrors(
    container: HTMLElement,
    params: EmbeddedTimerParams
  ): boolean {
    const validationErrors: string[] = [];

    if (params.duration && params.duration <= 0) {
      validationErrors.push("Duration must be greater than 0");
    }

    if (params.intervalTime && params.intervalTime <= 0) {
      validationErrors.push("Interval time must be greater than 0");
    }

    if (params.rounds && params.rounds <= 0) {
      validationErrors.push("Rounds must be greater than 0");
    }

    if (validationErrors.length > 0) {
      UIComponents.renderErrorMessage(
        container,
        `Invalid parameters:\n${validationErrors.join("\n")}`
      );
      return false;
    }
    return true;
  }

  private renderTimerContent(
    container: HTMLElement,
    params: EmbeddedTimerParams
  ): void {
    container.empty();
    const contentDiv = container.createEl("div", {
      cls: "workout-timer-container",
      attr: { id: this.timerId },
    });

    // Create compact timer display
    const timerDisplay = contentDiv.createEl("div", {
      cls: "workout-timer-display",
    });

    // Create time display
    const timeDisplay = timerDisplay.createEl("div", {
      cls: "workout-timer-time",
    });

    // Create minimal controls inline
    if (params.showControls !== false) {
      const controlsDiv = timerDisplay.createEl("div", {
        cls: "workout-timer-controls",
      });

      // Start/Stop button
      const startStopBtn = controlsDiv.createEl("button", {
        cls: "workout-timer-btn workout-timer-start-stop",
        text: "▶",
      });

      // Reset button
      const resetBtn = controlsDiv.createEl("button", {
        cls: "workout-timer-btn workout-timer-reset",
        text: "↺",
      });

      // Add event listeners
      startStopBtn.addEventListener("click", () => {
        if (this.state.isRunning) {
          this.stopTimer();
          startStopBtn.textContent = "▶";
        } else {
          if (
            this.state.timerType === "countdown" &&
            this.state.elapsedTime >= this.state.duration * 1000
          ) {
            this.state.elapsedTime = 0;
            this.state.currentRound = 1;
          }
          this.startTimer();
          startStopBtn.textContent = "⏸";
        }
      });

      resetBtn.addEventListener("click", () => {
        this.resetTimer();
        startStopBtn.textContent = "▶";
      });

      // Store references for updates
      this.state.timerDisplay = timeDisplay;
      this.state.startStopBtn = startStopBtn;
    }

    // Initial display update
    this.updateDisplay();
  }

  private startTimer(): void {
    if (this.state.isRunning) return;

    this.state.isRunning = true;
    this.state.startTime = Date.now() - this.state.elapsedTime;

    this.logDebug("Timer started", {
      timerId: this.timerId,
      duration: this.state.duration,
      elapsedTime: this.state.elapsedTime,
    });

    this.state.timerInterval = window.setInterval(() => {
      this.updateTimer();
    }, 100);
  }

  private stopTimer(): void {
    if (!this.state.isRunning) return;

    this.state.isRunning = false;
    if (this.state.timerInterval) {
      clearInterval(this.state.timerInterval);
      this.state.timerInterval = undefined;
    }
  }

  private resetTimer(): void {
    this.stopTimer();
    this.state.elapsedTime = 0;
    this.state.currentRound = 1;
    this.updateDisplay();
  }

  private updateTimer(): void {
    if (!this.state.startTime) return;

    const now = Date.now();
    this.state.elapsedTime = now - this.state.startTime;

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
      if (intervalElapsed === 0 && this.state.elapsedTime > 0) {
        this.state.currentRound++;
        if (this.state.currentRound > this.state.totalRounds) {
          this.handleTimerComplete();
          return;
        }
        this.playSound();
      }
    }

    this.updateDisplay();
  }

  private updateDisplay(): void {
    if (!this.state.timerDisplay) return;

    let displayTime: string;

    if (this.state.timerType === "countdown") {
      const remaining = Math.max(
        0,
        this.state.duration * 1000 - this.state.elapsedTime
      );
      displayTime = this.formatTime(remaining);
    } else if (this.state.timerType === "stopwatch") {
      displayTime = this.formatTime(this.state.elapsedTime);
    } else if (this.state.timerType === "interval") {
      const intervalElapsed =
        this.state.elapsedTime % (this.state.intervalTime * 1000);
      const remaining = this.state.intervalTime * 1000 - intervalElapsed;
      displayTime = this.formatTime(remaining);
    } else {
      displayTime = "00:00";
    }

    // Only show completion checkmark if timer is stopped and completed
    if (
      !this.state.isRunning &&
      this.state.timerType === "countdown" &&
      this.state.elapsedTime >= this.state.duration * 1000
    ) {
      this.state.timerDisplay.innerHTML = `
        <span class="workout-timer-complete">✓</span>
      `;
    } else {
      this.state.timerDisplay.innerHTML = `
        <span class="workout-timer-time-display">${displayTime}</span>
      `;
    }

    // Debug logging for timer updates
    if (this.plugin.settings.debugMode) {
      this.logDebug("Timer display updated", {
        timerId: this.timerId,
        displayTime,
        isRunning: this.state.isRunning,
        elapsedTime: this.state.elapsedTime,
      });
    }
  }

  private formatTime(milliseconds: number): string {
    const totalSeconds = Math.ceil(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  }

  private handleTimerComplete(): void {
    this.stopTimer();
    this.playSound();

    this.logDebug("Timer completed", { timerId: this.timerId });

    if (this.state.startStopBtn) {
      this.state.startStopBtn.textContent = "▶";
    }

    // Update display to show completion
    this.updateDisplay();

    // Show completion message
    new Notice("Timer completed!");
  }

  private playSound(): void {
    // Simple beep sound using Web Audio API
    try {
      const audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = "sine";

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + 0.5
      );

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      // Fallback to console beep
      console.log("\x07");
    }
  }

  private logDebug(message: string, data?: any): void {
    if (this.plugin.settings.debugMode) {
      console.log(`EmbeddedTimerView: ${message}`, data);
    }
  }

  // Public methods for external control
  public start(): void {
    this.startTimer();
  }

  public stop(): void {
    this.stopTimer();
  }

  public reset(): void {
    this.resetTimer();
  }

  public isTimerRunning(): boolean {
    return this.state.isRunning;
  }

  public getId(): string {
    return this.timerId;
  }

  // Cleanup method
  public destroy(): void {
    this.stopTimer();
  }
}
