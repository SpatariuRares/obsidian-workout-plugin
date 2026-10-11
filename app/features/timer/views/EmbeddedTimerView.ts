// Embedded Timer View for workout timing functionality
import { TimerCore } from "@app/features/timer/business/TimerCore";
import { TimerDisplay } from "@app/features/timer/components/TimerDisplay";
import {
  TimerControls,
  TimerControlCallbacks,
} from "@app/features/timer/components/TimerControls";
import {
  TimerState,
  TimerPresetConfig,
  EmbeddedTimerParams,
  TIMER_TYPE,
} from "@app/features/timer/types";
import { BaseView } from "@app/features/common/views/BaseView";
import { TimerActionSelect } from "@app/features/timer/ui/TimerActionSelect";
import { timerBlock } from "@app/features/timer/timerBlock";
import type { WorkoutPluginContext } from "@app/types/PluginPorts";

export class EmbeddedTimerView extends BaseView {
  private timerId: string;
  private timerCore: TimerCore;
  private autoStarted = false;

  constructor(plugin: WorkoutPluginContext, id?: string) {
    super(plugin);
    this.timerId =
      id ||
      `timer-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    // Initialize timer core with callbacks
    this.timerCore = new TimerCore(this.timerId, {
      onTimerComplete: () => {},
      onSoundPlay: () => {},
      onStateChange: (_state: TimerState) => {},
    });
  }

  createTimer(
    container: HTMLElement,
    params: EmbeddedTimerParams,
  ): void {
    try {
      // Resolve parameters from preset and defaults
      const resolveResult = this.resolveTimerParams(params);
      if (resolveResult.error) {
        this.renderPresetError(container, resolveResult.error);
        return;
      }
      const resolvedParams = resolveResult.params;

      // If timer is already running, we only re-render the UI components
      // without resetting the core timing state, unless parameters changed significantly
      const currentState = this.timerCore.getState();
      const timerType = resolvedParams.type ?? TIMER_TYPE.COUNTDOWN;
      const duration = resolvedParams.duration ?? 30;
      const totalRounds = resolvedParams.rounds ?? 1;

      const needsReset =
        !this.timerCore.isRunning() ||
        currentState.timerType !== timerType ||
        currentState.duration !== duration ||
        currentState.totalRounds !== totalRounds;

      if (needsReset) {
        this.timerCore.stop();
        this.timerCore.setState({
          timerType,
          duration,
          totalRounds,
          elapsedTime: 0,
          currentRound: 1,
          isRunning: false,
          startTime: undefined,
        });
      }

      this.timerCore.setSoundEnabled(resolvedParams.sound !== false);

      this.renderTimerContent(container, resolvedParams, params);

      // autoStart fires once per timer, not on every re-render
      if (resolvedParams.autoStart && !this.autoStarted) {
        this.autoStarted = true;
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
   * 4. The timerBlock defaults
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
      const defaultPreset =
        settings.timerPresets[settings.defaultTimerPreset];
      if (defaultPreset) {
        baseParams = this.presetToParams(defaultPreset);
      }
    }

    // Merge: the preset overrides the defaults, the block overrides both
    const resolvedParams: EmbeddedTimerParams = {
      ...timerBlock.defaults,
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
    return Object.fromEntries(
      Object.entries(params).filter(([, value]) => value !== undefined),
    ) as Partial<EmbeddedTimerParams>;
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

  private renderTimerContent(
    container: HTMLElement,
    params: EmbeddedTimerParams,
    originalParams: EmbeddedTimerParams,
  ): void {
    container.empty();

    const rowDiv = container.createDiv({
      cls: "workout-timer-row",
    });

    const contentDiv = rowDiv.createDiv({
      cls: "workout-timer",
      attr: { id: this.timerId },
    });

    // Time display
    const timeDisplay = TimerDisplay.createDisplay(contentDiv);

    // Actions group: controls + dropdown together on the right
    const actionsGroup = contentDiv.createDiv({
      cls: "workout-timer-actions-group",
    });

    // Controls (play/pause + reset)
    let startStopBtn: HTMLButtonElement | undefined;
    if (params.showControls !== false) {
      const callbacks: TimerControlCallbacks = {
        onStart: () => this.timerCore.start(),
        onStop: () => this.timerCore.stop(),
        onReset: () => this.timerCore.reset(),
      };

      startStopBtn = TimerControls.createControls(
        actionsGroup,
        () => this.timerCore.getState(),
        callbacks,
      );

      TimerControls.updateStartStopButton(
        startStopBtn,
        this.timerCore.isRunning(),
      );
    }

    // Round counter (interval timers only) — sibling after controls
    const timerType = params.type || TIMER_TYPE.COUNTDOWN;
    let roundCounterDisplay: HTMLElement | undefined;
    if (timerType === TIMER_TYPE.INTERVAL) {
      roundCounterDisplay =
        TimerDisplay.createRoundCounter(actionsGroup);
    }

    // Menu button (only if code block has an ID)
    TimerActionSelect.render(actionsGroup, {
      app: this.plugin.app,
      plugin: this.plugin,
      params: originalParams,
    });

    // Store references in timer core state
    this.timerCore.setState({
      timerDisplay: timeDisplay,
      roundCounterDisplay,
      startStopBtn,
    });

    // Initial display update
    TimerDisplay.updateDisplay(
      this.timerCore.getState(),
      this.timerId,
    );
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
