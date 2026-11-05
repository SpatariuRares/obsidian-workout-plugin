import { TIMER_TYPE, type EmbeddedTimerParams } from "@app/features/timer/types";
import type { WorkoutChartsSettings } from "@app/types/WorkoutLogData";
import { resolveTimer } from "@app/features/timer/business/resolveTimer";
import {
  intervalPlan,
  intervalSeconds,
} from "@app/features/timer/business/intervalSchedule";

/**
 * Seconds a timer runs for, as it runs (preset, default preset, defaults,
 * every interval round); 0 for a stopwatch or an unknown preset.
 */
export function timerRunSeconds(
  timer: EmbeddedTimerParams,
  settings: Pick<WorkoutChartsSettings, "timerPresets" | "defaultTimerPreset">,
): number {
  const { params, error } = resolveTimer(timer, settings);
  if (error || params.type === TIMER_TYPE.STOPWATCH) return 0;
  return params.type === TIMER_TYPE.INTERVAL
    ? intervalSeconds(intervalPlan(params))
    : params.duration ?? 0;
}
