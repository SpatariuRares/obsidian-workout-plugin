/** An interval timer: each round is a work phase followed by a rest phase */
export interface IntervalPlan {
  /** Seconds */
  work: number;
  /** Seconds; 0 = rounds follow each other with no rest */
  rest: number;
  rounds: number;
}

export type IntervalPhase = "work" | "rest" | "done";

export interface IntervalPoint {
  phase: IntervalPhase;
  round: number;
  /** Milliseconds left in the current phase */
  remainingMs: number;
}

/** The plan of a block: `work` wins over `duration` (the older way to set it) */
export function intervalPlan(params: {
  duration?: number;
  work?: number;
  rest?: number;
  rounds?: number;
}): IntervalPlan {
  return {
    work: params.work ?? params.duration ?? 0,
    rest: params.rest ?? 0,
    rounds: params.rounds ?? 1,
  };
}

/** Where the timer is after `elapsedMs`; the last round's rest is counted too */
export function intervalAt(plan: IntervalPlan, elapsedMs: number): IntervalPoint {
  const workMs = plan.work * 1000;
  const roundMs = workMs + plan.rest * 1000;
  if (roundMs <= 0 || elapsedMs >= roundMs * plan.rounds) {
    return { phase: "done", round: plan.rounds, remainingMs: 0 };
  }

  const round = Math.floor(elapsedMs / roundMs) + 1;
  const inRound = elapsedMs % roundMs;
  return inRound < workMs
    ? { phase: "work", round, remainingMs: workMs - inRound }
    : { phase: "rest", round, remainingMs: roundMs - inRound };
}

/** How long the whole timer runs */
export function intervalSeconds(plan: IntervalPlan): number {
  return (plan.work + plan.rest) * plan.rounds;
}
