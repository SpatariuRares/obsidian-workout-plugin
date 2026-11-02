import { timerBlock } from "@app/features/timer/timerBlock";
import { TIMER_TYPE } from "@app/features/timer/types";

export function generateCountdownTimerBlock(
  id: string,
  duration: number,
  exercise: string,
): string {
  return timerBlock.serialize({
    id,
    type: TIMER_TYPE.COUNTDOWN,
    duration,
    exercise,
    showControls: true,
    sound: true,
  });
}

/** Work and rest phases, `rounds` times */
export function generateIntervalTimerBlock(
  id: string,
  interval: { work: number; rest: number; rounds: number },
  exercise: string,
): string {
  return timerBlock.serialize({
    id,
    type: TIMER_TYPE.INTERVAL,
    ...interval,
    exercise,
    showControls: true,
    sound: true,
  });
}

/** A timer that runs a saved preset (Tabata and EMOM are built in) */
export function generatePresetTimerBlock(
  id: string,
  preset: string,
  exercise?: string,
): string {
  return timerBlock.serialize({ id, preset, exercise });
}
