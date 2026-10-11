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

export function generateIntervalTimerBlock(
  id: string,
  duration: number,
  rounds: number,
  exercise: string,
): string {
  return timerBlock.serialize({
    id,
    type: TIMER_TYPE.INTERVAL,
    duration,
    rounds,
    exercise,
    showControls: true,
    sound: true,
  });
}
