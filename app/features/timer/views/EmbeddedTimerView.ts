// Embedded Timer View for workout timing functionality
import { TimerCore, type TimerConfig } from "@app/features/timer/business/TimerCore";
import { TimerDisplay } from "@app/features/timer/components/TimerDisplay";
import {
  TimerControls,
  TimerControlCallbacks,
} from "@app/features/timer/components/TimerControls";
import {
  TimerState,
  EmbeddedTimerParams,
  TIMER_TYPE,
} from "@app/features/timer/types";
import { BaseView } from "@app/features/common/views/BaseView";
import { BlockMenu, type BlockMenuAction } from "@app/features/common/ui/BlockMenu";
import { resolveTimer } from "@app/features/timer/business/resolveTimer";
import { intervalPlan } from "@app/features/timer/business/intervalSchedule";
import type { WorkoutPluginContext } from "@app/types/PluginPorts";
import { generateCodeBlockId } from "@app/utils/IdUtils";

export class EmbeddedTimerView extends BaseView {
  private timerId: string;
  private timerCore: TimerCore;
  private autoStarted = false;

  constructor(plugin: WorkoutPluginContext, id?: string) {
    super(plugin);
    this.timerId = id || generateCodeBlockId("timer");

    // Initialize timer core with callbacks
    this.timerCore = new TimerCore(this.timerId, {
      onTimerComplete: () => this.plugin.timerDeviceEffects.complete(),
      onSoundPlay: () => {},
      onStateChange: (state: TimerState) =>
        this.plugin.timerDeviceEffects.setRunning(this, state.isRunning),
    });
  }

  /** @param editAction - The block's edit action, for its ⋮ menu (none for a rest timer) */
  createTimer(
    container: HTMLElement,
    params: EmbeddedTimerParams,
    editAction?: BlockMenuAction,
  ): void {
    try {
      const resolved = this.resolveConfig(params);
      if ("error" in resolved) {
        this.renderPresetError(container, resolved.error);
        return;
      }
      const { params: resolvedParams, config } = resolved;

      // If timer is already running, we only re-render the UI components
      // without resetting the core timing state, unless parameters changed significantly
      const currentState = this.timerCore.getState();
      const needsReset =
        !this.timerCore.isRunning() ||
        currentState.timerType !== config.timerType ||
        currentState.duration !== config.duration ||
        currentState.rest !== config.rest ||
        currentState.totalRounds !== config.totalRounds;

      if (needsReset) {
        this.timerCore.configure(config);
      }

      this.timerCore.setSoundEnabled(resolvedParams.sound !== false);

      this.renderTimerContent(container, resolvedParams, editAction);

      // autoStart fires once per timer, not on every re-render
      if (resolvedParams.autoStart && !this.autoStarted) {
        this.autoStarted = true;
        this.timerCore.start();
      }
    } catch (error) {
      this.handleError(container, error);
    }
  }

  /**
   * Renders an error message when a preset is not found
   */
  private renderPresetError(
    container: HTMLElement,
    errorMessage: string,
  ): void {
    container.empty();
    container.createDiv({
      cls: "workout-timer-error",
      text: errorMessage,
    });
  }

  private renderTimerContent(
    container: HTMLElement,
    params: EmbeddedTimerParams,
    editAction?: BlockMenuAction,
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

    if (editAction) BlockMenu.render(actionsGroup, [editAction]);

    // Draw on this rendering too (the note may also be open in another view)
    this.timerCore.addSurface({
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

  /** Reconfigures this timer's duration/type from block parameters (used for dual-rest switching) */
  public configure(params: EmbeddedTimerParams): void {
    const resolved = this.resolveConfig(params);
    if ("error" in resolved) return;
    this.timerCore.configure(resolved.config);
    this.timerCore.setSoundEnabled(resolved.params.sound !== false);
    TimerDisplay.updateDisplay(this.timerCore.getState(), this.timerId);
  }

  private resolveConfig(
    params: EmbeddedTimerParams,
  ): { params: EmbeddedTimerParams; config: TimerConfig } | { error: string } {
    const resolveResult = resolveTimer(params, this.plugin.settings);
    if (resolveResult.error) return { error: resolveResult.error };
    const resolvedParams = resolveResult.params;
    const timerType = resolvedParams.type ?? TIMER_TYPE.COUNTDOWN;
    const plan = intervalPlan(resolvedParams);
    const isInterval = timerType === TIMER_TYPE.INTERVAL;
    return {
      params: resolvedParams,
      config: {
        timerType,
        duration: isInterval ? plan.work : resolvedParams.duration ?? 30,
        rest: isInterval ? plan.rest : 0,
        totalRounds: plan.rounds,
      },
    };
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
