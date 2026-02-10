// Embedded Timer View for workout timing functionality
import WorkoutChartsPlugin from "main";
import {
  TimerCore,
  TimerDisplay,
  TimerControls,
  TimerControlCallbacks,
} from "@app/features/timer";
import {
  TimerState,
  TimerPresetConfig,
  EmbeddedTimerParams,
  TIMER_TYPE,
} from "@app/features/timer";
import { BaseView } from "@app/features/common/views/BaseView";

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
      onTimerComplete: () => {},
      onSoundPlay: () => {},
      onStateChange: (_state: TimerState) => {},
    });
  }

  createTimer(container: HTMLElement, params: EmbeddedTimerParams): void {
    try {
      // Resolve parameters from preset and defaults
      const resolveResult = this.resolveTimerParams(params);
      if (resolveResult.error) {
        this.renderPresetError(container, resolveResult.error);
        return;
      }
      const resolvedParams = resolveResult.params;

      if (!this.validateTimerParams(container, resolvedParams)) {
        return;
      }

      this.timerCore.stop();

      const timerType = resolvedParams.type || TIMER_TYPE.COUNTDOWN;
      const duration = resolvedParams.duration || 30;
      const totalRounds = resolvedParams.rounds || 1;

      this.timerCore.setState({
        timerType,
        duration,
        totalRounds,
        elapsedTime: 0,
        currentRound: 1,
        isRunning: false,
        startTime: undefined,
      });

      this.renderTimerContent(container, resolvedParams);

      // Verify timer display was created
      const currentState = this.timerCore.getState();
      if (!currentState.timerDisplay) {
        return;
      }

      // Auto-start if requested
      if (resolvedParams.autoStart) {
        this.timerCore.start();
      }
    } catch (error) {
      const errorObj =
        error instanceof Error ? error : new Error(String(error));
      this.handleError(container, errorObj);
    }
  }

  /**
   * Resolves timer parameters using the following priority order:
   * 1. Explicit parameters from the code block
   * 2. Parameters from the specified preset (if any)
   * 3. Parameters from the default preset (if configured)
   * 4. Hardcoded defaults
   */
  private resolveTimerParams(params: EmbeddedTimerParams): {
    params: EmbeddedTimerParams;
    error?: string;
  } {
    const settings = this.plugin.settings;
    let baseParams: Partial<EmbeddedTimerParams> = {};

    // Check for explicitly specified preset
    if (params.preset) {
      const preset = settings.timerPresets[params.preset];
      if (!preset) {
        return {
          params,
          error: `Timer preset "${params.preset}" not found. Available presets: ${Object.keys(settings.timerPresets).join(", ") || "none"}`,
        };
      }
      baseParams = this.presetToParams(preset);
    }
    // Check for default preset if no explicit preset specified
    else if (settings.defaultTimerPreset) {
      const defaultPreset = settings.timerPresets[settings.defaultTimerPreset];
      if (defaultPreset) {
        baseParams = this.presetToParams(defaultPreset);
      }
    }

    // Merge: explicit params override preset params
    const resolvedParams: EmbeddedTimerParams = {
      ...baseParams,
      ...this.filterUndefined(params),
    };

    // Remove the preset key from resolved params (it's not needed for timer operation)
    delete resolvedParams.preset;

    return { params: resolvedParams };
  }

  /**
   * Converts a TimerPresetConfig to EmbeddedTimerParams format
   */
  private presetToParams(
    preset: TimerPresetConfig,
  ): Partial<EmbeddedTimerParams> {
    return {
      type: preset.type,
      duration: preset.duration,
      showControls: preset.showControls,
      autoStart: preset.autoStart,
      sound: preset.sound,
      rounds: preset.rounds,
    };
  }

  /**
   * Filters out undefined values from params to ensure proper merging
   */
  private filterUndefined(
    params: EmbeddedTimerParams,
  ): Partial<EmbeddedTimerParams> {
    const filtered: Partial<EmbeddedTimerParams> = {};
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        filtered[key as keyof EmbeddedTimerParams] = value;
      }
    }
    return filtered;
  }

  /**
   * Renders an error message when a preset is not found
   */
  private renderPresetError(
    container: HTMLElement,
    errorMessage: string,
  ): void {
    container.empty();
    container.createEl("div", {
      cls: "workout-timer-error",
      text: errorMessage,
    });
  }

  private validateTimerParams(
    container: HTMLElement,
    params: EmbeddedTimerParams,
  ): boolean {
    const validationErrors: string[] = [];

    if (params.duration && params.duration <= 0) {
      validationErrors.push("Duration must be greater than 0");
    }

    if (params.rounds && params.rounds <= 0) {
      validationErrors.push("Rounds must be greater than 0");
    }

    return this.validateAndHandleErrors(container, validationErrors);
  }

  private renderTimerContent(
    container: HTMLElement,
    params: EmbeddedTimerParams,
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
        ".workout-timer-display",
      ) as HTMLElement;

      const callbacks: TimerControlCallbacks = {
        onStart: () => this.timerCore.start(),
        onStop: () => this.timerCore.stop(),
        onReset: () => this.timerCore.reset(),
      };

      const startStopBtn = TimerControls.createControls(
        timerDisplay,
        this.timerCore.getState(),
        callbacks,
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
