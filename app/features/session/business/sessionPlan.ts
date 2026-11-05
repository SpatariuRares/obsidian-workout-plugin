import { TFile, type Vault } from "obsidian";
import {
  readWorkoutNote,
  type NoteBlock,
  type NoteSection,
} from "@app/services/notes/WorkoutNote";
import { tableBlock } from "@app/features/tables/tableBlock";
import {
  blockRest,
  setsBlock,
  type EmbeddedSetsParams,
} from "@app/features/tables/setsBlock";
import { timerBlock } from "@app/features/timer/timerBlock";
import type { EmbeddedTimerParams } from "@app/features/timer/types";
import {
  findBlock,
  type CodeBlockMatch,
} from "@app/services/editor/CodeBlockEditorService";
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
  /**
   * The rest after each set (see stepRest): none when its `workout-sets`
   * block says `rest: 0`, else that block's own timer, else the section's
   * `workout-timer` block ({} without one: the default preset)
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
    const isSets = block.type === setsBlock.type;
    const read =
      block.type === tableBlock.type
        ? tableBlock.parse(block.body)
        : isSets
          ? setsBlock.parse(block.body)
          : undefined;
    if (!read) continue;
    const { params, errors } = read;
    if (errors.length > 0 || !params.exercise) continue;
    const setsRest: RestBlock | undefined = isSets
      ? { type: "workout-sets", params, match: matchOf(block) }
      : undefined;

    const same = stepOf(sectionSteps, params.exercise);
    if (same) {
      same.sets ??= params.sets;
      same.targetReps ??= params.targetReps;
      same.targetWeight ??= params.targetWeight;
      if (setsRest && same.restBlock?.type !== setsBlock.type) {
        same.restBlock = setsRest;
        same.rest = stepRest(params, rest);
      }
      continue;
    }
    sectionSteps.push({
      exercise: params.exercise,
      sets: params.sets,
      targetReps: params.targetReps,
      targetWeight: params.targetWeight,
      rest: isSets ? stepRest(params, rest) : rest,
      restBlock: setsRest ?? sectionRestBlock,
    });
  }
  return sectionSteps;
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
 * The one rule for the rest after a set of a `workout-sets` block: none with
 * `rest: 0`, else the block's own timer (`rest` and `timer.*`, see
 * blockRest), else the section's rest (its `workout-timer`, or {} for the
 * default preset).
 */
export function stepRest(
  params: EmbeddedSetsParams,
  sectionRest: EmbeddedTimerParams,
): EmbeddedTimerParams | undefined {
  if (params.rest === 0) return undefined;
  return blockRest(params) ?? sectionRest;
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

/** The step of an exercise (case and spacing ignored), the first if repeated */
export function stepOf(
  steps: SessionStep[],
  exercise: string,
): SessionStep | undefined {
  const wanted = StringUtils.normalize(exercise);
  return steps.find((step) => StringUtils.normalize(step.exercise) === wanted);
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
