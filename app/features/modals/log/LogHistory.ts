import type { WorkoutPluginContext } from "@app/types/PluginPorts";
import { TrainingHistory } from "@app/services/history/TrainingHistory";
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
      const history = new TrainingHistory(
        await plugin.getWorkoutLogData(),
      );
      if (container.dataset.exercise !== exercise) return;
      container.empty();
      const last = history.lastSet(exercise);
      const unit = plugin.settings.weightUnit;
      if (last) {
        const set =
          last.weight > 0
            ? t("logs.weightedSet", {
                weight: Number(last.weight.toFixed(2)),
                unit,
                reps: last.reps,
              })
            : Object.entries(last.customFields ?? {})
                .map(([key, value]) => `${key}: ${value}`)
                .join(", ") || `${last.reps}`;
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
