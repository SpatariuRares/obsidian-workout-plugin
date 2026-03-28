import { CodeGenerator } from "@app/features/modals/components/CodeGenerator";
import { TIMER_TYPE } from "@app/features/timer/types";

export function generateCountdownTimerBlock(
  id: string,
  duration: number,
  exercise: string,
): string {
  return CodeGenerator.generateTimerCode({
    id,
    duration,
    type: TIMER_TYPE.COUNTDOWN,
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
  return CodeGenerator.generateTimerCode({
    id,
    duration,
    rounds,
    type: TIMER_TYPE.INTERVAL,
    exercise,
    showControls: true,
    sound: true,
  });
}
