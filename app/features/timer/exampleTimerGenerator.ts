import { CodeGenerator } from "@app/features/modals/components/CodeGenerator";
import { TIMER_TYPE } from "@app/features/timer/types";

export function generateCountdownTimerBlock(
  duration: number,
  exercise: string,
): string {
  return CodeGenerator.generateTimerCode({
    duration,
    type: TIMER_TYPE.COUNTDOWN,
    exercise,
    showControls: true,
    sound: true,
  });
}

export function generateIntervalTimerBlock(
  duration: number,
  rounds: number,
  exercise: string,
): string {
  return CodeGenerator.generateTimerCode({
    duration,
    rounds,
    type: TIMER_TYPE.INTERVAL,
    exercise,
    showControls: true,
    sound: true,
  });
}
