import { announceDataPathChange } from "@app/features/settings/business/announceDataPathChange";
import type {
  EventBusPort,
  WorkoutPluginContext,
} from "@app/types/PluginPorts";

function makePlugin() {
  const raw = {
    settings: { csvLogFilePath: "New/workout_logs.csv", exerciseFolderPath: "Exercises" },
    triggerMuscleTagRefresh: jest.fn(),
    getExerciseDefinitionService: () => definitions,
    eventBus: { emit: jest.fn() },
  };
  const definitions = { clearCache: jest.fn() };
  return {
    plugin: raw as unknown as WorkoutPluginContext & EventBusPort,
    raw,
    definitions,
  };
}

describe("announceDataPathChange", () => {
  it.each([
    ["csvLogFilePath", "Old/workout_logs.csv", "New/workout_logs.csv"],
    ["exerciseFolderPath", "Old exercises", "Exercises"],
  ] as const)(
    "reloads muscle tags and exercise types, then tells views that %s changed",
    (key, previousValue, newValue) => {
      const { plugin, raw, definitions } = makePlugin();

      announceDataPathChange(plugin, key, previousValue);

      expect(raw.triggerMuscleTagRefresh).toHaveBeenCalled();
      expect(definitions.clearCache).toHaveBeenCalled();
      expect(raw.eventBus.emit).toHaveBeenCalledWith({
        type: "settings:changed",
        payload: { key, previousValue, newValue },
      });
    },
  );

  it("does nothing when the path ends up unchanged", () => {
    const { plugin, raw } = makePlugin();

    announceDataPathChange(plugin, "exerciseFolderPath", "Exercises");

    expect(raw.triggerMuscleTagRefresh).not.toHaveBeenCalled();
    expect(raw.eventBus.emit).not.toHaveBeenCalled();
  });
});
