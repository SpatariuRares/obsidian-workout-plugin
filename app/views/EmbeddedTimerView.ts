// Embedded Timer View for workout timing functionality
import WorkoutChartsPlugin from "main";
import {
  TimerCore,
  TimerDisplay,
  TimerControls,
  TimerControlCallbacks,
  TimerState,
} from "@app/components";
import { BaseView } from "@app/views/BaseView";
import { EmbeddedTimerParams } from "@app/types";

export class EmbeddedTimerView extends BaseView {
  private timerId: string;
  private timerCore: TimerCore;

  constructor(plugin: WorkoutChartsPlugin) {
    super(plugin);
    this.timerId = `timer-${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 9)}`;

    // Initialize timer core with callbacks
    this.timerCore = new TimerCore(this.timerId, {
      onTimerComplete: () => {
        this.logDebug("EmbeddedTimerView", "Timer completed callback", {
          timerId: this.timerId,
        });
      },
      onSoundPlay: () => {
        this.logDebug("EmbeddedTimerView", "Sound played callback", {
          timerId: this.timerId,
        });
      },
      onStateChange: (state: TimerState) => {
        this.logDebug("EmbeddedTimerView", "Timer state changed", {
          timerId: this.timerId,
          state,
        });
      },
    });
  }

  createTimer(container: HTMLElement, params: EmbeddedTimerParams): void {
    try {
      this.logDebug("EmbeddedTimerView", "createTimer called", {
        params,
        timerId: this.timerId,
      });

      if (!this.validateTimerParams(container, params)) {
        return;
      }

      this.timerCore.stop();

      this.timerCore.setState({
        timerType: params.type || "countdown",
        duration: params.duration || 300,
        intervalTime: params.intervalTime || 30,
        totalRounds: params.rounds || 1,
        elapsedTime: 0,
        currentRound: 1,
        isRunning: false,
        startTime: undefined,
      });

      // Log timer initialization
      this.logDebug("EmbeddedTimerView", "Timer initialized", {
        timerId: this.timerId,
        timerType: params.type || "countdown",
        duration: params.duration || 300,
        intervalTime: params.intervalTime || 30,
        totalRounds: params.rounds || 1,
      });

      this.renderTimerContent(container, params);

      // Verify timer display was created
      const currentState = this.timerCore.getState();
      if (!currentState.timerDisplay) {
        this.logDebug(
          "EmbeddedTimerView",
          "Timer display not created after rendering",
          {
            timerId: this.timerId,
          }
        );
        return;
      }

      // Auto-start if requested
      if (params.autoStart) {
        this.timerCore.start();
      }
    } catch (error) {
      const errorObj =
        error instanceof Error ? error : new Error(String(error));
      this.handleError(container, errorObj);
    }
  }

  private validateTimerParams(
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

    return this.validateAndHandleErrors(container, validationErrors);
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

    // Create timer display using the component
    const timeDisplay = TimerDisplay.createDisplay(contentDiv);

    // Store reference in timer core state
    this.timerCore.setState({ timerDisplay: timeDisplay });

    // Create controls if requested
    if (params.showControls !== false) {
      const timerDisplay = contentDiv.querySelector(
        ".workout-timer-display"
      ) as HTMLElement;

      const callbacks: TimerControlCallbacks = {
        onStart: () => this.timerCore.start(),
        onStop: () => this.timerCore.stop(),
        onReset: () => this.timerCore.reset(),
      };

      const startStopBtn = TimerControls.createControls(
        timerDisplay,
        this.timerCore.getState(),
        callbacks
      );

      // Store reference in timer core state
      this.timerCore.setState({ startStopBtn });
    }

    // Initial display update
    TimerDisplay.updateDisplay(this.timerCore.getState(), this.timerId);
  }

  // Public methods for external control - delegated to TimerCore
  public start(): void {
    this.timerCore.start();
  }

  public stop(): void {
    this.timerCore.stop();
  }

  public reset(): void {
    this.timerCore.reset();
  }

  public isTimerRunning(): boolean {
    return this.timerCore.isRunning();
  }

  public getId(): string {
    return this.timerCore.getId();
  }

  // Cleanup method
  public destroy(): void {
    this.timerCore.destroy();
  }
}
