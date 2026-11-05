import { Notice } from "obsidian";
import { t } from "@app/i18n";
import type { CustomExerciseType } from "@app/types/WorkoutLogData";
import type { EventBusPort, SettingsPort } from "@app/types/PluginPorts";
import {
  exerciseTypeIdFromName,
  exerciseTypeProblem,
  upsertExerciseType,
} from "@app/services/exercise/ExerciseTypeCatalog";

/**
 * Saves a type made outside the settings list (Duplicate, the create-exercise
 * form's "New exercise type"), as the list's Save does: checked (a Notice
 * says why not), written, settings saved. It says so with `settings:changed`,
 * so the settings tab draws the list again. False keeps the form open.
 */
export async function saveExerciseType(
  plugin: SettingsPort & EventBusPort,
  draft: CustomExerciseType,
  originalId: string | null,
): Promise<boolean> {
  draft.name = draft.name.trim();
  if (!originalId) draft.id = exerciseTypeIdFromName(draft.name);
  const list = (plugin.settings.exerciseTypes ??= []);
  const problem = exerciseTypeProblem(draft, list, originalId);
  if (problem) {
    new Notice(problem);
    return false;
  }
  const previousValue = list.map((type) => ({ ...type }));
  upsertExerciseType(list, draft, originalId);
  await plugin.saveSettings();
  new Notice(t("settings.exerciseTypes.saved"));
  plugin.eventBus.emit({
    type: "settings:changed",
    payload: { key: "exerciseTypes", previousValue, newValue: list },
  });
  return true;
}
