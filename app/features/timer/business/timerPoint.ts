import { TIMER_TYPE, type TimerState } from "@app/features/timer/types";
import {
  intervalAt,
  intervalPlan,
  intervalSeconds,
  type IntervalPhase,
} from "@app/features/timer/business/intervalSchedule";

/** Where a timer is, from what it runs and how long it has run */
export interface TimerPoint {
  /** Milliseconds left in the countdown or the interval phase; null for a stopwatch */
  remainingMs: number | null;
  /** Milliseconds left until the whole timer ends; null for a stopwatch */
  remainingToEndMs: number | null;
  phase: IntervalPhase;
  round: number;
  /** The time is up (a stopwatch never is) */
  done: boolean;
}

/** The one place that turns a timer's elapsed time into time left, phase and round */
export function timerPoint(
  state: Pick<TimerState, "timerType" | "duration" | "rest" | "totalRounds" | "elapsedTime">,
): TimerPoint {
  if (state.timerType === TIMER_TYPE.COUNTDOWN) {
    const remainingMs = Math.max(0, state.duration * 1000 - state.elapsedTime);
    const done = remainingMs <= 0;
    return { remainingMs, remainingToEndMs: remainingMs, phase: done ? "done" : "work", round: 1, done };
  }
  if (state.timerType === TIMER_TYPE.INTERVAL) {
    const plan = intervalPlan({
      duration: state.duration,
      rest: state.rest,
      rounds: state.totalRounds,
    });
    const point = intervalAt(plan, state.elapsedTime);
    return {
      remainingMs: point.remainingMs,
      remainingToEndMs: Math.max(0, intervalSeconds(plan) * 1000 - state.elapsedTime),
      phase: point.phase,
      round: point.round,
      done: point.phase === "done",
    };
  }
  return { remainingMs: null, remainingToEndMs: null, phase: "work", round: 1, done: false };
}
