import type {
  EventBusPort,
  WorkoutPluginContext,
} from "@app/types/PluginPorts";

type DataPathKey = "csvLogFilePath" | "exerciseFolderPath";

/**
 * After the log file or exercise folder moves: drop what was read from the
 * old place and re-render open views. muscle-tags.csv sits next to the log
 * file and muscle tags come from the exercise notes, so both reload.
 */
export function announceDataPathChange(
  plugin: WorkoutPluginContext & EventBusPort,
  key: DataPathKey,
  previousValue: string,
): void {
  const newValue = plugin.settings[key];
  if (newValue === previousValue) return;

  plugin.triggerMuscleTagRefresh();
  plugin.getExerciseDefinitionService().clearCache();
  plugin.eventBus.emit({
    type: "settings:changed",
    payload: { key, previousValue, newValue },
  });
}
