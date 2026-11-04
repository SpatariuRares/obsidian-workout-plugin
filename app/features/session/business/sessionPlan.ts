import { readWorkoutNote } from "@app/services/notes/WorkoutNote";
import { tableBlock } from "@app/features/tables/tableBlock";
import { setsBlock } from "@app/features/tables/setsBlock";
import { timerBlock } from "@app/features/timer/timerBlock";
import type { EmbeddedTimerParams } from "@app/features/timer/types";
import {
  WorkoutProtocol,
  type WorkoutLogData,
} from "@app/types/WorkoutLogData";
import { protocolId } from "@app/services/protocols/ProtocolCatalog";
import { StringUtils } from "@app/utils/StringUtils";

/** One exercise of the plan a workout note describes */
export interface SessionStep {
  exercise: string;
  /** Planned sets; undefined when the table doesn't say */
  sets?: number;
  targetReps?: number;
  targetWeight?: number;
  /** The section's `workout-timer` block ({} without one: the default preset) */
  rest: EmbeddedTimerParams;
}

/**
 * The plan of a workout note: one step per `workout-log` or `workout-sets`
 * block that names an exercise, in note order. Blocks with invalid
 * parameters are left out. Two blocks of the same exercise in one section
 * (its table and its sets) are one step: the first, with the plan values
 * it lacks taken from the other.
 */
export function readSessionPlan(content: string): SessionStep[] {
  const steps: SessionStep[] = [];
  for (const section of readWorkoutNote(content).sections) {
    const timer = section.blocks.find((b) => b.type === timerBlock.type);
    const timerRead = timer ? timerBlock.parse(timer.body) : undefined;
    const rest =
      timerRead && timerRead.errors.length === 0 ? timerRead.params : {};

    const sectionSteps: SessionStep[] = [];
    for (const block of section.blocks) {
      const read =
        block.type === tableBlock.type
          ? tableBlock.parse(block.body)
          : block.type === setsBlock.type
            ? setsBlock.parse(block.body)
            : undefined;
      if (!read) continue;
      const { params, errors } = read;
      if (errors.length > 0 || !params.exercise) continue;

      const exercise = StringUtils.normalize(params.exercise);
      const same = sectionSteps.find(
        (step) => StringUtils.normalize(step.exercise) === exercise,
      );
      if (same) {
        same.sets ??= params.sets;
        same.targetReps ??= params.targetReps;
        same.targetWeight ??= params.targetWeight;
        continue;
      }
      sectionSteps.push({
        exercise: params.exercise,
        sets: params.sets,
        targetReps: params.targetReps,
        targetWeight: params.targetWeight,
        rest,
      });
    }
    steps.push(...sectionSteps);
  }
  return steps;
}

/** What is done of the plan today */
export interface SessionProgress {
  /** Today's sets of each step, in step order */
  done: WorkoutLogData[][];
  /** The step to do next; -1 when the plan is done */
  current: number;
}

/**
 * Hands today's sets to the plan's steps: a set goes to the first step of
 * its exercise that still lacks sets (the last one takes any extra), and
 * warm-ups don't count as planned sets. The
 * current step is the first incomplete one: short of its planned sets, or,
 * without a plan, until a later step has a set.
 */
export function sessionProgress(
  steps: SessionStep[],
  todaysSets: WorkoutLogData[],
): SessionProgress {
  const done: WorkoutLogData[][] = steps.map(() => []);
  for (const set of todaysSets) {
    if (protocolId(set.protocol) === protocolId(WorkoutProtocol.WARMUP)) {
      continue;
    }
    const exercise = StringUtils.normalize(set.exercise);
    const candidates = steps
      .map((step, index) => ({ step, index }))
      .filter(({ step }) => StringUtils.normalize(step.exercise) === exercise);
    const target =
      candidates.find(
        ({ step, index }) =>
          step.sets === undefined || done[index].length < step.sets,
      ) ?? candidates[candidates.length - 1];
    if (target) done[target.index].push(set);
  }

  const complete = (index: number): boolean => {
    const planned = steps[index].sets;
    return planned !== undefined
      ? done[index].length >= planned
      : done.slice(index + 1).some((sets) => sets.length > 0);
  };
  const current = steps.findIndex((_, index) => !complete(index));
  return { done, current };
}
