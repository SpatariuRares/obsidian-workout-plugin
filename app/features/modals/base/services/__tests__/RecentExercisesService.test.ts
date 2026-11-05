import { RecentExercisesService } from "@app/features/modals/base/services/RecentExercisesService";
import type { WorkoutPluginContext } from "@app/types/PluginPorts";

function serviceWith(recentExercises: string[]) {
  const plugin = {
    settings: { recentExercises },
    saveSettings: jest.fn().mockResolvedValue(undefined),
  };
  const service = new RecentExercisesService(
    plugin as unknown as WorkoutPluginContext,
  );
  return { plugin, service };
}

describe("RecentExercisesService.trackExercise", () => {
  it("moves an exercise to the front", async () => {
    const { plugin, service } = serviceWith(["Squat", "Bench Press"]);

    await service.trackExercise("Bench Press");

    expect(plugin.settings.recentExercises).toEqual(["Bench Press", "Squat"]);
    expect(plugin.saveSettings).toHaveBeenCalled();
  });

  it("treats a name written with other case or spacing as the same exercise", async () => {
    const { plugin, service } = serviceWith(["Squat", "Bench Press"]);

    await service.trackExercise("bench  press");

    expect(plugin.settings.recentExercises).toEqual(["bench  press", "Squat"]);
  });

  it("saves nothing when the exercise is already first", async () => {
    const { plugin, service } = serviceWith(["Bench Press", "Squat"]);

    await service.trackExercise(" bench   press ");

    expect(plugin.settings.recentExercises).toEqual(["Bench Press", "Squat"]);
    expect(plugin.saveSettings).not.toHaveBeenCalled();
  });

  it("keeps at most 10 exercises", async () => {
    const recent = Array.from({ length: 10 }, (_, i) => `Exercise ${i}`);
    const { plugin, service } = serviceWith(recent);

    await service.trackExercise("Deadlift");

    expect(plugin.settings.recentExercises).toHaveLength(10);
    expect(plugin.settings.recentExercises[0]).toBe("Deadlift");
  });
});
