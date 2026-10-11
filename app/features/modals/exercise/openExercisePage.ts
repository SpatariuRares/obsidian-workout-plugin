import type {
  TemplateGeneratorPort,
  WorkoutPluginContext,
} from "@app/types/PluginPorts";
import { CreateExercisePageModal } from "@app/features/modals/exercise/CreateExercisePageModal";

/**
 * Opens the exercise's page, or offers to create it (filled in with the
 * name) when the exercise has none.
 */
export function openExercisePage(
  plugin: WorkoutPluginContext,
  exerciseName: string,
): void {
  const page = plugin.getExerciseLibrary().find(exerciseName);
  if (page) {
    void plugin.app.workspace.getLeaf(false).openFile(page.file);
    return;
  }
  const templatePlugin = plugin as WorkoutPluginContext & TemplateGeneratorPort;
  if ("templateGeneratorService" in templatePlugin) {
    new CreateExercisePageModal(plugin.app, templatePlugin, exerciseName).open();
  }
}
