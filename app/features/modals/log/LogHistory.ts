import type { WorkoutPluginContext } from "@app/types/PluginPorts";
import type { WorkoutLogData } from "@app/types/WorkoutLogData";
import type { ParameterDefinition } from "@app/types/ExerciseTypes";
import { TrainingHistory } from "@app/services/history/TrainingHistory";
import {
  fieldFor,
  fieldKey,
  formatFieldNumber,
} from "@app/services/exercise/ExerciseFields";
import { t } from "@app/i18n";

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
        plugin
          .getExerciseDefinitionService()
          .getParametersForExercise(exercise)
          .catch((): ParameterDefinition[] => []),
      ]);
      if (container.dataset.exercise !== exercise) return;
      container.empty();
      const last = history.lastSet(exercise);
      const unit = plugin.settings.weightUnit;
      if (last) {
        const set = describeSet(last, parameters, unit);
        container.createDiv({ text: t("logs.lastSet", { set }) });
      }
      const record = history.personalRecord(exercise);
      if (record)
        container.createDiv({
          text: t("logs.personalRecord", {
            weight: Number(record.weight.toFixed(2)),
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
      weight: Number(set.weight.toFixed(2)),
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
