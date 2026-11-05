import { EmbeddedTimerView } from "@app/features/timer/views/EmbeddedTimerView";
import type { EmbeddedTimerParams } from "@app/features/timer/types";
import type { WorkoutPluginContext } from "@app/types/PluginPorts";

/**
 * The rest between sets of a block that logs them (`workout-session`,
 * `workout-sets`). A rest that names a `workout-timer` block's `id` runs on
 * that block's timer, shared through `activeTimers` (created here if the
 * block hasn't rendered yet, picked up by it later), so both show one
 * countdown; any other rest runs on the block's own timer.
 */
export class RestTimer {
  private readonly own: EmbeddedTimerView;

  constructor(
    private plugin: WorkoutPluginContext,
    private activeTimers: Map<string, EmbeddedTimerView>,
  ) {
    this.own = new EmbeddedTimerView(plugin);
  }

  private timerFor(rest: EmbeddedTimerParams): EmbeddedTimerView {
    const id = rest.id;
    if (!id) return this.own;
    let timer = this.activeTimers.get(id);
    if (!timer) {
      timer = new EmbeddedTimerView(this.plugin, id);
      this.activeTimers.set(id, timer);
    }
    return timer;
  }

  isRunning(rest: EmbeddedTimerParams): boolean {
    return this.timerFor(rest).isTimerRunning();
  }

  /**
   * Draws the rest's timer as a strip (`.workout-timer-strip`), without a
   * menu (the menu belongs to its block)
   */
  draw(container: HTMLElement, rest: EmbeddedTimerParams): void {
    // One line inside the block, not the timer block's big phone layout
    container.addClass("workout-timer-strip");
    this.timerFor(rest).createTimer(container, rest);
  }

  /** A set was logged: the rest starts over */
  restart(rest: EmbeddedTimerParams): void {
    const timer = this.timerFor(rest);
    timer.reset();
    timer.start();
  }

  /** The set that started the rest was taken back: the rest stops */
  cancel(rest: EmbeddedTimerParams): void {
    this.timerFor(rest).reset();
  }

  /** Shared timers belong to activeTimers, destroyed with the plugin */
  destroy(): void {
    this.own.destroy();
  }
}
