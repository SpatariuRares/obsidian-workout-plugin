import type { ParameterDefinition } from "@app/types/ExerciseTypes";
import type { LogFormData } from "@app/types/ModalTypes";
import type { WorkoutLogData } from "@app/types/WorkoutLogData";
import { WorkoutProtocol } from "@app/types/WorkoutLogData";
import {
  fieldFor,
  fieldKey,
  fieldValue,
  formatFieldNumber,
} from "@app/services/exercise/ExerciseFields";
import {
  isStandardProtocol,
  isWarmupProtocol,
  protocolId,
} from "@app/services/protocols/ProtocolCatalog";
import {
  sectionRestOf,
  stepRest,
} from "@app/features/session/business/sessionPlan";
import type { CodeBlockMatch } from "@app/services/editor/CodeBlockEditorService";
import type { EmbeddedTimerParams } from "@app/features/timer/types";
import { betweenRest, type EmbeddedSetsParams } from "@app/features/tables/setsBlock";
import {
  readSetFields,
  validate,
  type FormError,
} from "@app/features/modals/base/logic/LogEntryDraft";

/** What the user typed or picked in a row not logged yet */
export interface SetDraft {
  /** Text typed per field key ("true"/"" for a checkbox); missing = untouched */
  values: Record<string, string>;
  /** Picked protocol id; undefined = the row's suggestion */
  protocol?: string;
  notes: string;
}

export function emptyDraft(): SetDraft {
  return { values: {}, notes: "" };
}

/**
 * A logged set back as a row's draft, when it is unticked: ticking the row
 * again logs the same set (weight in the settings unit).
 */
export function draftFromSet(set: WorkoutLogData, parameters: ParameterDefinition[]): SetDraft {
  const values: Record<string, string> = {};
  for (const param of parameters) {
    const value = fieldValue(set, param.key);
    if (param.type === "boolean") values[param.key] = value === true || value === "true" ? "true" : "";
    else if (typeof value === "number") values[param.key] = formatFieldNumber(fieldFor(param), value);
    else if (typeof value === "string" && value !== "") values[param.key] = value;
  }
  return { values, protocol: protocolId(set.protocol), notes: set.notes ?? "" };
}

/** One row of the sheet */
export interface SetRow {
  /** 1-based within its group (warm-up vs working) */
  number: number;
  /** True for warm-up rows (W1, W2, ...) above working sets */
  warmup?: boolean;
  /** The set logged today for this row; undefined for a row to fill in */
  logged?: WorkoutLogData;
  /** Grey hint per field key: the same set last time, else the target (working only) */
  placeholders: Record<string, string>;
  /** Protocol of the same set last time (working), else the block's working protocol, or warmup (warm-up rows) */
  suggestedProtocol?: string;
}

export interface SheetInput {
  /** The fields a set of the exercise records */
  parameters: ParameterDefinition[];
  /** Today's sets of the exercise in this workout (and block), in set order */
  today: WorkoutLogData[];
  /** The sets of the last earlier day the exercise was done, in set order */
  previous: WorkoutLogData[];
  /** Planned working sets (the block's `sets`) */
  sets?: number;
  /** Planned warm-up sets (the block's `warmups`) */
  warmups?: number;
  /** Default protocol for working sets (`warmup`/`standard`/unset do not override working rows) */
  protocol?: string;
  targetReps?: number;
  targetWeight?: number;
  /** Working rows to fill in, beyond the plan, the user added */
  extraRows: number;
  /** Unlogged warm-up rows kept after unticking an extra warm-up set */
  extraWarmups?: number;
}

/** Planned working sets: the block's `sets`, else as many working sets as last time (at least one) */
export function plannedSets({ sets, previous }: Pick<SheetInput, "sets" | "previous">): number {
  const previousWorking = previous.filter((s) => !isWarmupProtocol(s.protocol));
  return sets ?? Math.max(previousWorking.length, 1);
}

function partitionSets(today: WorkoutLogData[], previous: WorkoutLogData[]) {
  return {
    todayWarmups: today.filter((s) => isWarmupProtocol(s.protocol)),
    todayWorking: today.filter((s) => !isWarmupProtocol(s.protocol)),
    previousWarmups: previous.filter((s) => isWarmupProtocol(s.protocol)),
    previousWorking: previous.filter((s) => !isWarmupProtocol(s.protocol)),
  };
}

function resolveBlockWorkingProtocol(protocol: string | undefined): string | undefined {
  return protocol && !isStandardProtocol(protocol) && !isWarmupProtocol(protocol)
    ? protocolId(protocol)
    : undefined;
}

function buildWarmupRow(
  index: number,
  parameters: ParameterDefinition[],
  todayWarmups: WorkoutLogData[],
  previousWarmups: WorkoutLogData[],
): SetRow {
  const sameSet = previousWarmups[index];
  return {
    number: index + 1,
    warmup: true,
    logged: todayWarmups[index],
    placeholders: placeholdersFor(
      parameters,
      sameSet ?? previousWarmups[previousWarmups.length - 1],
    ),
    suggestedProtocol: WorkoutProtocol.WARMUP,
  };
}

function buildWorkingRow(
  index: number,
  parameters: ParameterDefinition[],
  todayWorking: WorkoutLogData[],
  previousWorking: WorkoutLogData[],
  blockProtocol: string | undefined,
  targets?: Pick<SheetInput, "targetReps" | "targetWeight">,
): SetRow {
  const sameSet = previousWorking[index];
  return {
    number: index + 1,
    warmup: false,
    logged: todayWorking[index],
    placeholders: placeholdersFor(
      parameters,
      sameSet ?? previousWorking[previousWorking.length - 1],
      targets,
    ),
    suggestedProtocol:
      sameSet && !isStandardProtocol(sameSet.protocol) ? protocolId(sameSet.protocol) : blockProtocol,
  };
}

/**
 * The rows the sheet shows: warm-up rows (`W1, W2, ...`) above working rows
 * (`1, 2, ...`). Warm-up and working sets pair independently with last time's
 * matching category; warm-up sets never reduce planned working rows.
 */
export function setRows(input: SheetInput): SetRow[] {
  const { todayWarmups, todayWorking, previousWarmups, previousWorking } = partitionSets(
    input.today,
    input.previous,
  );

  const warmupTotal = Math.max(input.warmups ?? 0, todayWarmups.length) + (input.extraWarmups ?? 0);
  const workingTotal = Math.max(plannedSets(input), todayWorking.length) + input.extraRows;
  const blockProtocol = resolveBlockWorkingProtocol(input.protocol);
  const targets = { targetReps: input.targetReps, targetWeight: input.targetWeight };

  const warmupRows: SetRow[] = Array.from({ length: warmupTotal }, (_, index) =>
    buildWarmupRow(index, input.parameters, todayWarmups, previousWarmups),
  );
  const workingRows: SetRow[] = Array.from({ length: workingTotal }, (_, index) =>
    buildWorkingRow(index, input.parameters, todayWorking, previousWorking, blockProtocol, targets),
  );

  return [...warmupRows, ...workingRows];
}

export interface SupersetExerciseInput {
  exercise: string;
  parameters: ParameterDefinition[];
  today: WorkoutLogData[];
  previous: WorkoutLogData[];
}

export interface SupersetInput {
  exercises: SupersetExerciseInput[];
  sets?: number;
  warmups?: number;
  /** Block protocol override; defaults to `superset` when unset */
  protocol?: string;
  extraRounds: number;
  extraWarmups?: number;
}

export interface SupersetSlot {
  exercise: string;
  exerciseIndex: number;
  parameters: ParameterDefinition[];
  row: SetRow;
}

export interface SupersetRound {
  /** 1-based within its group (warm-up vs working) */
  number: number;
  warmup: boolean;
  slots: SupersetSlot[];
}

/** Planned working rounds: `sets` if given, else the max previous working sets across exercises (at least 1) */
export function plannedSupersetRounds(
  exercises: Pick<SupersetExerciseInput, "previous">[],
  sets?: number,
): number {
  if (sets !== undefined) return sets;
  return Math.max(
    1,
    ...exercises.map((e) => e.previous.filter((s) => !isWarmupProtocol(s.protocol)).length),
  );
}

/**
 * Builds round-by-round slots for a multi-exercise superset sheet in strict
 * declared exercise order (`A -> B -> ...`). Each exercise's history and
 * parameters are partitioned independently; working slots default to
 * `superset` unless overridden by last time's non-standard protocol or `protocol`.
 */
export function supersetRounds(input: SupersetInput): SupersetRound[] {
  const partitioned = input.exercises.map((ex) => ({
    ...ex,
    ...partitionSets(ex.today, ex.previous),
  }));

  const warmupTotal =
    Math.max(input.warmups ?? 0, ...partitioned.map((p) => p.todayWarmups.length)) +
    (input.extraWarmups ?? 0);
  const plannedWorking = plannedSupersetRounds(input.exercises, input.sets);
  const workingTotal =
    Math.max(plannedWorking, ...partitioned.map((p) => p.todayWorking.length)) + input.extraRounds;
  const blockProtocol = resolveBlockWorkingProtocol(input.protocol ?? WorkoutProtocol.SUPERSET);

  const warmupRounds: SupersetRound[] = Array.from({ length: warmupTotal }, (_, roundIndex) => ({
    number: roundIndex + 1,
    warmup: true,
    slots: partitioned.map((ex, exerciseIndex) => ({
      exercise: ex.exercise,
      exerciseIndex,
      parameters: ex.parameters,
      row: buildWarmupRow(roundIndex, ex.parameters, ex.todayWarmups, ex.previousWarmups),
    })),
  }));

  const workingRounds: SupersetRound[] = Array.from({ length: workingTotal }, (_, roundIndex) => ({
    number: roundIndex + 1,
    warmup: false,
    slots: partitioned.map((ex, exerciseIndex) => ({
      exercise: ex.exercise,
      exerciseIndex,
      parameters: ex.parameters,
      row: buildWorkingRow(
        roundIndex,
        ex.parameters,
        ex.todayWorking,
        ex.previousWorking,
        blockProtocol,
      ),
    })),
  }));

  return [...warmupRounds, ...workingRounds];
}

function placeholdersFor(
  parameters: ParameterDefinition[],
  hint: WorkoutLogData | undefined,
  targets?: Pick<SheetInput, "targetReps" | "targetWeight">,
): Record<string, string> {
  const placeholders: Record<string, string> = {};
  for (const param of parameters) {
    const field = fieldFor(param);
    const key = fieldKey(param.key);
    // A logged set's weight is in the settings unit
    const value = hint ? fieldValue(hint, key) : targets ? targetValue(targets, key) : undefined;
    if (typeof value === "number") {
      placeholders[param.key] = formatFieldNumber(field, value);
    } else if (typeof value === "string" && value !== "") {
      placeholders[param.key] = value;
    }
  }
  return placeholders;
}

function targetValue(
  targets: Pick<SheetInput, "targetReps" | "targetWeight">,
  key: string,
): number | undefined {
  if (key === "reps") return targets.targetReps;
  if (key === "weight") return targets.targetWeight;
  return undefined;
}

/** The protocol a row logs with: the one picked, else its suggestion */
export function rowProtocol(row: SetRow, draft: SetDraft): string {
  return draft.protocol ?? row.suggestedProtocol ?? WorkoutProtocol.STANDARD;
}

export interface RowContext {
  exercise: string;
  workout: string;
  parameters: ParameterDefinition[];
  /** The block's id, stored with the set so it stays this block's */
  block?: string;
}

/**
 * The set a row logs: each field as typed, or its placeholder when left
 * empty (so ticking an untouched row repeats last time), in the settings
 * unit. An error names the field to fix.
 */
export function rowToFormData(
  row: SetRow,
  draft: SetDraft,
  { exercise, workout, parameters, block }: RowContext,
): { data: LogFormData } | { error: FormError } {
  const { fields, ...values } = readSetFields(
    parameters.map((param): [ParameterDefinition, string | boolean] => {
      const typed = draft.values[param.key];
      if (param.type === "boolean") return [param, typed === "true"];
      return [param, typed?.trim() ? typed.trim() : (row.placeholders[param.key] ?? "")];
    }),
  );
  const error = validate(exercise, fields, parameters);
  if (error) return { error };

  return {
    data: {
      exercise,
      workout,
      ...values,
      notes: draft.notes.trim(),
      protocol: rowProtocol(row, draft),
      block,
    },
  };
}

/**
 * The timer a block rests on after each set: stepRest (none with `rest: 0`,
 * else its own timer), else the `workout-timer` of the `##` section the
 * block is written in ({} for the default preset, also when the note or the
 * block is not found).
 * @param note - The text of the note the block is written in
 * @param match - How to find the block in it
 */
export function restOf(
  params: EmbeddedSetsParams,
  note: string | null,
  match: CodeBlockMatch | undefined,
): EmbeddedTimerParams | undefined {
  const sectionRest = note !== null && match ? sectionRestOf(note, match) : {};
  return stepRest(params, sectionRest);
}

/**
 * Determines the rest timer to run after logging a specific slot in a
 * multi-exercise superset block:
 * - Warm-up slots never trigger a timer.
 * - Non-final exercises within a round use `restBetween` when positive.
 * - The final exercise of a round uses `rest` / `timer.*` (unless final round
 *   or `rest: 0`), falling back to `restBetween` when `rest` is unset, else
 *   to `sectionRest` via `stepRest`.
 */
export function supersetSlotRest(
  params: EmbeddedSetsParams,
  sectionRest: EmbeddedTimerParams,
  {
    isWarmup,
    exerciseIndex,
    exerciseCount,
    roundIndex,
    totalWorkingRounds,
  }: {
    isWarmup: boolean;
    exerciseIndex: number;
    exerciseCount: number;
    roundIndex: number;
    totalWorkingRounds: number;
  },
): EmbeddedTimerParams | undefined {
  if (isWarmup) return undefined;
  if (exerciseIndex < exerciseCount - 1) return betweenRest(params);
  if (roundIndex >= totalWorkingRounds - 1) return undefined;
  return stepRest(params, sectionRest);
}
