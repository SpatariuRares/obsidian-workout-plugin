import {
  BUILT_IN_EXERCISE_TYPES,
  EXERCISE_TYPE_IDS,
  resolveExerciseTypeId,
} from "@app/constants/exerciseTypes.constants";
import type {
  ExerciseTypeDefinition,
  ParameterDefinition,
} from "@app/types/ExerciseTypes";
import type { CustomExerciseType } from "@app/types/WorkoutLogData";
import { ParameterUtils } from "@app/utils/parameter/ParameterUtils";
import { StringUtils } from "@app/utils/StringUtils";
import { t } from "@app/i18n";

/** An exercise type as the catalog gives it */
export interface ExerciseTypeInfo extends ExerciseTypeDefinition {
  /** Strength, timed, distance, cardio, custom: read only */
  builtIn: boolean;
  /** Deleted by the user: read for the pages that name it, never offered */
  retired: boolean;
}

/**
 * The only place that knows the exercise types (see "Exercise type" in
 * CONTEXT.md): the built-in ones, read only, then the ones the user made in
 * Settings → Exercise types (`settings.exerciseTypes`). A page names one by
 * `exercise_type`; a deleted type keeps resolving for the pages that name it.
 */
export class ExerciseTypeCatalog {
  constructor(private readonly custom: readonly CustomExerciseType[] = []) {}

  /**
   * The type a page's `exercise_type` names, however it is written ("Strength",
   * "run", "climbing", "Rock climbing"), or nothing when none has that id or name
   */
  resolve(raw: string | undefined): ExerciseTypeInfo | undefined {
    const wanted = StringUtils.normalize(raw);
    if (!wanted) return undefined;
    const builtIn = BUILT_IN_EXERCISE_TYPES.find(
      (type) => type.id === resolveExerciseTypeId(wanted),
    );
    if (builtIn) return { ...builtIn, builtIn: true, retired: false };
    const mine =
      this.custom.find((type) => StringUtils.normalize(type.id) === wanted) ??
      this.custom.find((type) => StringUtils.normalize(type.name) === wanted);
    return mine ? fromCustom(mine) : undefined;
  }

  /** The built-in types, as Settings → Exercise types lists them */
  builtIns(): ExerciseTypeInfo[] {
    return BUILT_IN_EXERCISE_TYPES.filter(
      (type) => type.id !== EXERCISE_TYPE_IDS.CUSTOM,
    ).map((type) => ({ ...type, builtIn: true, retired: false }));
  }

  /** The user's types still offered, in the settings order */
  mine(): ExerciseTypeInfo[] {
    return this.custom.filter((type) => !type.retired).map(fromCustom);
  }

  /**
   * The types a new exercise can pick: the built-in ones, then the user's.
   * "Custom" is not one: a type of your own takes its place.
   */
  pickable(): ExerciseTypeInfo[] {
    return [...this.builtIns(), ...this.mine()];
  }
}

function fromCustom(type: CustomExerciseType): ExerciseTypeInfo {
  return {
    id: type.id,
    name: type.name,
    parameters: type.parameters,
    builtIn: false,
    retired: type.retired === true,
  };
}

/**
 * The fields the built-in types log (reps, weight, duration, distance, heart
 * rate), offered when a type of your own is made: they keep their key, so
 * charts, volume and PRs read them as they read a strength set.
 */
export function builtInFields(): ParameterDefinition[] {
  const fields: ParameterDefinition[] = [];
  for (const type of BUILT_IN_EXERCISE_TYPES) {
    for (const param of type.parameters) {
      if (!fields.some((f) => f.key === param.key)) fields.push({ ...param });
    }
  }
  return fields;
}

/** A plain id from a type's name ("Rock climbing" → "rock_climbing") */
export function exerciseTypeIdFromName(name: string): string {
  return slug(name) || "type";
}

/**
 * A new field's key from its label ("Max grade" → "max_grade"), the name of
 * its column in the log: never one of `taken`, never a reserved column
 * (date, reps…), always a valid key. Fixed once the field is made.
 */
export function fieldKeyFromLabel(label: string, taken: readonly string[]): string {
  let base = slug(label) || "field";
  if (!/^[a-z]/.test(base)) base = `field_${base}`;
  const used = (key: string) =>
    ParameterUtils.isReservedParamKey(key) ||
    taken.some((k) => k.toLowerCase() === key.toLowerCase()) ||
    builtInFields().some((f) => f.key.toLowerCase() === key.toLowerCase());
  let key = base;
  for (let n = 2; used(key); n++) key = `${base}_${n}`;
  return key;
}

/** Letters and digits of `text`, accents dropped, the rest as "_" */
function slug(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

/**
 * Why `draft` can't be saved into `list`, or null. `originalId` is the type
 * being edited (null for a new one).
 */
export function exerciseTypeProblem(
  draft: CustomExerciseType,
  list: readonly CustomExerciseType[],
  originalId: string | null,
): string | null {
  if (!draft.name.trim()) return t("settings.exerciseTypes.nameRequired");
  const catalog = new ExerciseTypeCatalog(
    // A deleted type gives its name back
    list.filter((type) => !type.retired && type.id !== originalId),
  );
  // A built-in name or alias ("Run") would be read as the built-in type
  if ([draft.id, draft.name].some((raw) => catalog.resolve(raw))) {
    return t("settings.exerciseTypes.nameExists");
  }
  if (draft.parameters.length === 0) return t("settings.exerciseTypes.fieldsRequired");
  const labels = new Set<string>();
  for (const field of draft.parameters) {
    const label = StringUtils.normalize(field.label);
    if (!label) return t("settings.exerciseTypes.fieldLabelRequired");
    if (labels.has(label)) {
      return t("settings.exerciseTypes.fieldLabelExists", { field: field.label.trim() });
    }
    labels.add(label);
  }
  return null;
}

/**
 * Writes `draft` into `list`: over the type `originalId`, over a deleted type
 * with its id (it comes back), else at the end
 */
export function upsertExerciseType(
  list: CustomExerciseType[],
  draft: CustomExerciseType,
  originalId: string | null,
): void {
  const saved: CustomExerciseType = {
    id: draft.id,
    name: draft.name.trim(),
    parameters: draft.parameters.map((field) => ({ ...field, label: field.label.trim() })),
  };
  const at = list.findIndex((type) => type.id === (originalId ?? draft.id));
  if (at === -1) list.push(saved);
  else list[at] = saved;
}

/** The names of the exercise pages whose `exercise_type` is the type `id` */
export function exercisesOfType(
  pages: readonly { names: string[]; type?: string }[],
  list: readonly CustomExerciseType[],
  id: string,
): string[] {
  const catalog = new ExerciseTypeCatalog(list);
  return pages
    .filter((page) => catalog.resolve(page.type)?.id === id)
    .map((page) => page.names[page.names.length > 1 ? 1 : 0]);
}

/** Deletes the type `id`: kept, as retired, for the pages that name it */
export function retireExerciseType(list: CustomExerciseType[], id: string): void {
  const type = list.find((entry) => entry.id === id);
  if (type) type.retired = true;
}
