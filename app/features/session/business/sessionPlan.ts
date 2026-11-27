import { TFile, type Vault } from "obsidian";
import {
  readWorkoutNote,
  type NoteBlock,
  type NoteSection,
} from "@app/services/notes/WorkoutNote";
import { tableBlock } from "@app/features/tables/tableBlock";
import {
  blockExercises,
  blockProtocol,
  blockRest,
  isSupersetBlock,
  setsBlock,
  type EmbeddedSetsParams,
} from "@app/features/tables/setsBlock";
import { timerBlock } from "@app/features/timer/timerBlock";
import type { EmbeddedTimerParams } from "@app/features/timer/types";
import { TIMER_TYPE } from "@app/types/WorkoutConfigTypes";
import {
  findBlock,
  type CodeBlockMatch,
} from "@app/services/editor/CodeBlockEditorService";
import type { WorkoutLogData } from "@app/types/WorkoutLogData";
import { isWarmupProtocol } from "@app/services/protocols/ProtocolCatalog";
import { StringUtils } from "@app/utils/StringUtils";

/** One exercise (or composite superset) of the plan a workout note describes */
export interface SessionStep {
  exercise: string;
  /** Ordered exercises for a composite superset step (>= 2); undefined for single-exercise steps */
  exercises?: string[];
  /**
   * Id of the step's `workout-sets` block: the sets logged from it (or for
   * the step) carry it, so two steps of the same exercise keep their own
   */
  block?: string;
  /** Planned sets (rounds for a superset step); undefined when the table doesn't say */
  sets?: number;
  /** Planned warm-up sets (workout-sets only); excluded from working counts and rest */
  warmups?: number;
  /** Seconds of rest between exercises within a superset round */
  restBetween?: number;
  /** Default working protocol from a `workout-sets` block (e.g. `superset`, `drop_set`) */
  protocol?: string;
  targetReps?: number;
  targetWeight?: number;
  /**
   * The rest after each set (or round for a superset step, see stepRest):
   * none when its `workout-sets` block says `rest: 0`, else that block's own
   * timer, else for a superset `restBetween` when positive, else the
   * section's `workout-timer` block ({} without one: the default preset)
   */
  rest?: EmbeddedTimerParams;
  /** Where the rest is set, to edit it; none without either block */
  restBlock?: RestBlock;
}

/**
 * The block a step's rest is written in: its `workout-sets` block (which
 * takes the timer's options), else the section's `workout-timer`
 */
export type RestBlock =
  | { type: "workout-sets"; params: EmbeddedSetsParams; match: CodeBlockMatch }
  | { type: "workout-timer"; params: EmbeddedTimerParams; match: CodeBlockMatch };

/**
 * The plan of a workout note: one step per `workout-log` or `workout-sets`
 * block that names an exercise, in note order. Blocks with invalid
 * parameters are left out. Two blocks of the same exercise in one section
 * (its table and its sets) are one step: the first, with the plan values
 * it lacks taken from the other.
 */
export function readSessionPlan(content: string): SessionStep[] {
  return readWorkoutNote(content).sections.flatMap(readSectionPlan);
}

/**
 * The steps of one level-2 section of a workout note (see readSessionPlan):
 * the note's plan is its sections' steps, in order
 */
export function readSectionPlan(section: NoteSection): SessionStep[] {
  const { rest, restBlock: sectionRestBlock } = sectionRest(section);

  const sectionSteps: SessionStep[] = [];
  for (const block of section.blocks) {
    if (block.type === tableBlock.type) {
      const { params, errors } = tableBlock.parse(block.body);
      if (errors.length > 0 || !params.exercise) continue;
      const same = findSingleExerciseStep(sectionSteps, params.exercise);
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
        restBlock: sectionRestBlock,
      });
      continue;
    }

    if (block.type !== setsBlock.type) continue;
    const { params, errors } = setsBlock.parse(block.body);
    if (errors.length > 0) continue;
    const exercises = blockExercises(params);
    if (exercises.length === 0) continue;

    const superset = exercises.length >= 2;
    const warmups = params.warmups;
    const protocol = blockProtocol(params);
    const setsRest: RestBlock = {
      type: "workout-sets",
      params,
      match: matchOf(block),
    };

    const same = !superset
      ? findSingleExerciseStep(sectionSteps, exercises[0])
      : undefined;
    if (same) {
      same.block ??= params.id;
      same.sets ??= params.sets;
      same.warmups ??= warmups;
      same.protocol ??= protocol;
      same.targetReps ??= params.targetReps;
      same.targetWeight ??= params.targetWeight;
      if (same.restBlock?.type !== setsBlock.type) {
        same.restBlock = setsRest;
        same.rest = stepRest(params, rest);
      }
      continue;
    }

    sectionSteps.push({
      exercise: exercises.join(" + "),
      exercises: superset ? exercises : undefined,
      block: params.id,
      sets: params.sets,
      warmups,
      restBetween: superset ? params.restBetween : undefined,
      protocol,
      targetReps: superset ? undefined : params.targetReps,
      targetWeight: superset ? undefined : params.targetWeight,
      rest: stepRest(params, rest),
      restBlock: setsRest,
    });
  }
  return sectionSteps;
}

function findSingleExerciseStep(
  steps: SessionStep[],
  exercise: string,
): SessionStep | undefined {
  const wanted = StringUtils.normalize(exercise);
  return steps.find(
    (step) => !step.exercises && StringUtils.normalize(step.exercise) === wanted,
  );
}

/**
 * A section's rest: its `workout-timer` block (the first, when its
 * parameters are valid), else {} for the default preset
 */
function sectionRest(section: NoteSection): {
  rest: EmbeddedTimerParams;
  restBlock?: RestBlock;
} {
  const timer = section.blocks.find((b) => b.type === timerBlock.type);
  if (!timer) return { rest: {} };
  const { params, errors } = timerBlock.parse(timer.body);
  if (errors.length > 0) return { rest: {} };
  return {
    rest: params,
    restBlock: { type: "workout-timer", params, match: matchOf(timer) },
  };
}

/**
 * The rest of the section a `workout-sets` block is written in (see
 * sectionRest), the block found with `match`; {} when it is not found
 */
export function sectionRestOf(
  content: string,
  match: CodeBlockMatch,
): EmbeddedTimerParams {
  const { sections } = readWorkoutNote(content);
  const sets = sections.flatMap((section) =>
    section.blocks.filter((block) => block.type === setsBlock.type),
  );
  const block = findBlock(sets, setsBlock, match);
  const section = block && sections.find((s) => s.blocks.includes(block));
  return section ? sectionRest(section).rest : {};
}

/**
 * The one rule for the rest after a set of a `workout-sets` block (or after a
 * superset round): none with `rest: 0`, else the block's own timer (`rest`
 * and `timer.*`, see blockRest), else for a superset `restBetween` when
 * positive, else the section's rest (its `workout-timer`, or {} for the
 * default preset).
 */
export function stepRest(
  params: EmbeddedSetsParams,
  sectionRest: EmbeddedTimerParams,
): EmbeddedTimerParams | undefined {
  if (params.rest === 0) return undefined;
  const own = blockRest(params);
  if (own) return own;
  if (isSupersetBlock(params) && params.restBetween && params.restBetween > 0) {
    return { type: TIMER_TYPE.COUNTDOWN, duration: params.restBetween };
  }
  return sectionRest;
}

/** How to find a block written without an id */
function matchOf(block: NoteBlock): CodeBlockMatch {
  return { body: block.body, lines: { start: block.start, end: block.end } };
}

/** The text of the note at `path`; null when there is no such note */
export async function readNote(
  vault: Pick<Vault, "getAbstractFileByPath" | "cachedRead">,
  path: string,
): Promise<string | null> {
  const file = vault.getAbstractFileByPath(path);
  if (!(file instanceof TFile)) return null;
  return vault.cachedRead(file);
}

/** The plan of the note at `path`; null when there is no such note */
export async function readNotePlan(
  vault: Pick<Vault, "getAbstractFileByPath" | "cachedRead">,
  path: string,
): Promise<SessionStep[] | null> {
  const content = await readNote(vault, path);
  return content === null ? null : readSessionPlan(content);
}

/** The exercises a step covers: its `exercises` list for a superset, else `[step.exercise]` */
export function stepExercises(
  step: Pick<SessionStep, "exercise" | "exercises">,
): string[] {
  return step.exercises && step.exercises.length >= 2 ? step.exercises : [step.exercise];
}

/** The step of an exercise (case and spacing ignored), the first if repeated */
export function stepOf(
  steps: SessionStep[],
  exercise: string,
): SessionStep | undefined {
  const wanted = StringUtils.normalize(exercise);
  return steps.find((step) =>
    stepExercises(step).some((ex) => StringUtils.normalize(ex) === wanted),
  );
}

/** Round-by-round progress of one composite superset step */
export interface SupersetStepProgress {
  /** Non-warmup working set counts today per exercise, in declared order */
  counts: number[];
  /** Number of fully completed rounds (every exercise has at least this many sets) */
  completedRounds: number;
  /** 1-based round currently in progress */
  round: number;
  /** Index (`0..exercises.length - 1`) of the next unlogged exercise in the current round */
  exerciseIndex: number;
  /** Name of the active exercise */
  exercise: string;
  /** Today's working sets in this step for the active exercise */
  exerciseDone: WorkoutLogData[];
}

/**
 * Computes strict declared-order progress (`Round 1: A -> B -> Round 2: A -> B`)
 * for a composite superset step from its non-warmup working sets logged today.
 */
export function supersetProgress(
  step: Pick<SessionStep, "exercise" | "exercises">,
  stepDone: WorkoutLogData[],
): SupersetStepProgress {
  const exercises = stepExercises(step);
  const working = stepDone.filter((s) => !isWarmupProtocol(s.protocol));
  const byExercise = exercises.map((ex) => {
    const wanted = StringUtils.normalize(ex);
    return working.filter((s) => StringUtils.normalize(s.exercise) === wanted);
  });
  const counts = byExercise.map((sets) => sets.length);
  const completedRounds = Math.min(...counts);
  const round = completedRounds + 1;
  const exerciseIndex = Math.max(
    0,
    counts.findIndex((count) => count < round),
  );
  return {
    counts,
    completedRounds,
    round,
    exerciseIndex,
    exercise: exercises[exerciseIndex],
    exerciseDone: byExercise[exerciseIndex] ?? [],
  };
}

/** What is done of the plan today */
export interface SessionProgress {
  /** Today's sets of each step, in step order */
  done: WorkoutLogData[][];
  /** The step to do next; -1 when the plan is done */
  current: number;
}

function exerciseSetCount(
  step: SessionStep,
  stepDone: WorkoutLogData[],
  normalizedExercise: string,
): number {
  if (!step.exercises || step.exercises.length < 2) return stepDone.length;
  return stepDone.filter(
    (s) => StringUtils.normalize(s.exercise) === normalizedExercise,
  ).length;
}

/**
 * Hands today's sets to the plan's steps: a set logged from a step's
 * `workout-sets` block goes to that step; any other set goes to the first
 * step of its exercise that still lacks sets (the last one takes any
 * extra), and warm-ups don't count as planned sets. The
 * current step is the first incomplete one: short of its planned sets, or,
 * without a plan, until a later step has a set.
 */
export function sessionProgress(
  steps: SessionStep[],
  todaysSets: WorkoutLogData[],
): SessionProgress {
  const done: WorkoutLogData[][] = steps.map(() => []);
  for (const set of todaysSets) {
    if (isWarmupProtocol(set.protocol)) {
      continue;
    }
    const exercise = StringUtils.normalize(set.exercise);
    const own =
      set.block === undefined
        ? -1
        : steps.findIndex(
            (step) =>
              step.block === set.block &&
              stepExercises(step).some((ex) => StringUtils.normalize(ex) === exercise),
          );
    if (own >= 0) {
      done[own].push(set);
      continue;
    }
    const candidates = steps
      .map((step, index) => ({ step, index }))
      .filter(({ step }) =>
        stepExercises(step).some((ex) => StringUtils.normalize(ex) === exercise),
      );
    const target =
      candidates.find(
        ({ step, index }) =>
          step.sets === undefined ||
          exerciseSetCount(step, done[index], exercise) < step.sets,
      ) ?? candidates[candidates.length - 1];
    if (target) done[target.index].push(set);
  }

  const complete = (index: number): boolean => {
    const step = steps[index];
    const planned = step.sets;
    if (planned === undefined) {
      return done.slice(index + 1).some((sets) => sets.length > 0);
    }
    if (step.exercises && step.exercises.length >= 2) {
      return supersetProgress(step, done[index]).completedRounds >= planned;
    }
    return done[index].length >= planned;
  };
  const current = steps.findIndex((_, index) => !complete(index));
  return { done, current };
}
