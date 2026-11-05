import type { WorkoutPluginContext } from "@app/types/PluginPorts";
import type { WorkoutLogData } from "@app/types/WorkoutLogData";
import type { ParameterDefinition } from "@app/types/ExerciseTypes";
import { TrainingHistory, localDay } from "@app/services/history/TrainingHistory";
import {
  fieldFor,
  fieldKey,
  formatFieldNumber,
} from "@app/services/exercise/ExerciseFields";
import { parametersOrNone } from "@app/services/exercise/ExerciseDefinitionService";
import { DateUtils } from "@app/utils/DateUtils";
import { t } from "@app/i18n";
import { round2 } from "@app/utils/round2";

/** Read-only context next to the exercise, using the full history. */
export class LogHistory {
  static async render(
    container: HTMLElement,
    plugin: WorkoutPluginContext,
    exercise: string,
  ): Promise<void> {
    container.dataset.exercise = exercise;
    container.empty();
    if (!exercise) return;
    try {
      const [history, parameters] = await Promise.all([
        plugin.getWorkoutLogData().then((rows) => new TrainingHistory(rows)),
        parametersOrNone(plugin, exercise),
      ]);
      if (container.dataset.exercise !== exercise) return;
      container.empty();
      const unit = plugin.settings.weightUnit;
      const previous = history.previousDay(exercise, localDay(new Date()));
      if (previous) {
        container.createDiv({
          text: describeLastTime(previous, parameters, unit),
        });
      }
      const record = history.personalRecord(exercise);
      if (record)
        container.createDiv({
          text: t("logs.personalRecord", {
            weight: round2(record.weight),
            unit,
            reps: record.reps,
          }),
        });
    } catch {
      // History is optional; logging stays available if it cannot be read.
    }
  }
}

/**
 * A logged set as one line: "82.5 kg × 8" for weighted sets, otherwise its
 * fields with the units the form shows ("56 min · 5.5 km · 147 bpm").
 */
export function describeSet(
  set: WorkoutLogData,
  parameters: ParameterDefinition[],
  weightUnit: string,
): string {
  if (set.weight > 0) {
    return t("logs.weightedSet", {
      weight: round2(set.weight),
      unit: weightUnit,
      reps: set.reps,
    });
  }

  const parts = Object.entries(set.customFields ?? {}).map(([key, value]) => {
    const param = parameters.find((p) => fieldKey(p.key) === fieldKey(key));
    if (!param) return `${key}: ${String(value)}`;
    if (typeof value !== "number") return `${param.label}: ${String(value)}`;
    const number = formatFieldNumber(fieldFor(param), value);
    return param.unit ? `${number} ${param.unit}` : `${param.label}: ${number}`;
  });
  return parts.join(" · ") || `${set.reps}`;
}

/**
 * "Last time" (see CONTEXT.md): the previous training day of the exercise with
 * all its sets, "Last time (31/10): 80 kg × 8 · 80 kg × 7".
 */
export function describeLastTime(
  previous: { day: string; sets: WorkoutLogData[] },
  parameters: ParameterDefinition[],
  weightUnit: string,
): string {
  return t("sets.lastTime", {
    date: DateUtils.toShortDate(previous.sets[0]?.date ?? previous.day),
    sets: previous.sets
      .map((set) => describeSet(set, parameters, weightUnit))
      .join(" · "),
  });
}

/** A block's target: "100 kg × 8", "8 reps" or "100 kg"; undefined without one. */
export function describeTarget(
  reps: number | undefined,
  weight: number,
  weightUnit: string,
): string;
export function describeTarget(
  reps: number | undefined,
  weight: number | undefined,
  weightUnit: string,
): string | undefined;
export function describeTarget(
  reps: number | undefined,
  weight: number | undefined,
  weightUnit: string,
): string | undefined {
  if (reps !== undefined && weight !== undefined) {
    return t("logs.weightedSet", { weight, unit: weightUnit, reps });
  }
  if (reps !== undefined) return t("session.targetReps", { reps });
  if (weight !== undefined) {
    return t("session.targetWeight", { weight, unit: weightUnit });
  }
  return undefined;
}
