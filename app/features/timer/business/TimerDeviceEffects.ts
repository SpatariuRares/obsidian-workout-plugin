import type { WorkoutChartsSettings } from "@app/types/WorkoutLogData";

type DeviceSettings = Pick<
  WorkoutChartsSettings,
  "keepScreenAwake" | "vibrateOnCompletion"
>;

/** Foreground device cues shared by all of the plugin's running timers. */
export class TimerDeviceEffects {
  private running = new Set<object>();
  private sentinel: WakeLockSentinel | null = null;
  private requesting = false;
  private generation = 0;
  private destroyed = false;

  constructor(private settings: () => DeviceSettings) {
    document.addEventListener("visibilitychange", this.refresh);
  }

  setRunning(timer: object, running: boolean): void {
    if (this.destroyed || this.running.has(timer) === running) return;
    if (running) this.running.add(timer);
    else this.running.delete(timer);
    this.refresh();
  }

  private needsScreen(): boolean {
    return (
      !this.destroyed &&
      this.settings().keepScreenAwake &&
      this.running.size > 0 &&
      document.visibilityState === "visible"
    );
  }

  /** Also called when settings change, so existing timers update immediately. */
  refresh = (): void => {
    if (!this.needsScreen()) {
      // Invalidate an in-flight grant even if a new timer starts before it resolves.
      this.generation++;
      this.release();
      return;
    }
    if (this.sentinel || this.requesting || !navigator.wakeLock) return;
    this.requesting = true;
    void this.request(this.generation);
  };

  private async request(generation: number): Promise<void> {
    try {
      const sentinel = await navigator.wakeLock.request("screen");
      if (generation !== this.generation || !this.needsScreen()) {
        await sentinel.release();
      } else if (!sentinel.released) {
        this.sentinel = sentinel;
        sentinel.addEventListener("release", this.onRelease);
      }
    } catch {
      // Unsupported origins, power policy and permission denial are normal:
      // device cues must never interrupt timing or the existing audio cue.
    } finally {
      this.requesting = false;
      // Retry only for a newer ownership/visibility cycle, never on system denial.
      if (generation !== this.generation && this.needsScreen()) this.refresh();
    }
  }

  private onRelease = (event: Event): void => {
    if (event.target !== this.sentinel) return;
    this.sentinel?.removeEventListener("release", this.onRelease);
    this.sentinel = null;
    // Reacquire on a new start, setting change or return to visible, not in a loop.
  };

  private release(): void {
    const sentinel = this.sentinel;
    this.sentinel = null;
    if (!sentinel) return;
    sentinel.removeEventListener("release", this.onRelease);
    // Release can fail if the platform has already invalidated the document.
    void sentinel.release().catch(() => {});
  }

  complete(): void {
    if (
      this.destroyed ||
      !this.settings().vibrateOnCompletion ||
      document.visibilityState !== "visible" ||
      typeof navigator.vibrate !== "function" ||
      navigator.userActivation?.hasBeenActive === false
    ) return;
    try {
      navigator.vibrate(200);
    } catch {
      // No native bridge or fallback: unsupported vibration leaves audio usable.
    }
  }

  destroy(): void {
    this.destroyed = true;
    this.running.clear();
    document.removeEventListener("visibilitychange", this.refresh);
    this.refresh();
  }
}
