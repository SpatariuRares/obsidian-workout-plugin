import type { App, Setting } from "obsidian";
import { t } from "@app/i18n";
import type { DefinitionItem } from "@app/features/settings/settingDefinitionTypes";
import { settingsListEditor } from "@app/features/settings/settingsListEditor";
import { ExerciseTypeEditorModal } from "@app/features/settings/modals/ExerciseTypeEditorModal";
import type { CustomExerciseType } from "@app/types/WorkoutLogData";
import type { ParameterDefinition } from "@app/types/ExerciseTypes";
import type { WorkoutPluginContext } from "@app/types/PluginPorts";
import { saveExerciseType } from "@app/features/settings/business/saveExerciseType";
import { exerciseTypeName } from "@app/constants/ui.constants";
import {
  ExerciseTypeCatalog,
  exerciseTypeIdFromName,
  exerciseTypeProblem,
  exercisesOfType,
  retireExerciseType,
  upsertExerciseType,
  type ExerciseTypeInfo,
} from "@app/services/exercise/ExerciseTypeCatalog";

/**
 * Settings → Exercise types: the built-in types, read only, each with
 * Duplicate, then the list of the user's own (add, edit, delete).
 */
export class ExerciseTypesSettings {
  constructor(
    private app: App,
    private plugin: WorkoutPluginContext,
    /** Redraws the settings tab after the list changed */
    private refresh: () => void,
  ) {}

  definitions(): DefinitionItem[] {
    const catalog = new ExerciseTypeCatalog(this.types());
    return [
      {
        type: "group",
        heading: t("settings.exerciseTypes.heading"),
        items: [
          { name: t("settings.exerciseTypes.heading"), desc: t("settings.exerciseTypes.intro") },
          ...catalog.builtIns().map((type) => ({
            name: exerciseTypeName(type),
            desc: describeFields(type.parameters),
            render: (setting: Setting) =>
              setting.addButton((button) =>
                button
                  .setButtonText(t("settings.exerciseTypes.duplicate"))
                  .onClick(() => this.duplicate(type)),
              ),
          })),
        ],
      },
      this.list(catalog),
    ];
  }

  private list(catalog: ExerciseTypeCatalog): DefinitionItem {
    const editor = (draft: CustomExerciseType, original: CustomExerciseType | null, save: () => Promise<boolean>) =>
      new ExerciseTypeEditorModal(this.app, draft, original, save).open();
    return settingsListEditor<CustomExerciseType>({
      app: this.app,
      heading: t("settings.exerciseTypes.mine"),
      emptyState: t("settings.exerciseTypes.empty"),
      addLabel: t("settings.exerciseTypes.add"),
      editTooltip: t("settings.exerciseTypes.edit"),
      deleteTooltip: t("settings.exerciseTypes.delete"),
      items: this.types().filter((type) => !type.retired),
      keyOf: (type) => type.id,
      describe: (type) => ({
        name: type.name,
        desc: describeFields(catalog.resolve(type.id)?.parameters ?? type.parameters),
      }),
      blank: () => ({ id: "", name: "", parameters: [] }),
      open: editor,
      normalize: (type, originalId) => {
        type.name = type.name.trim();
        if (!originalId) type.id = exerciseTypeIdFromName(type.name);
      },
      validate: (type, originalId) => exerciseTypeProblem(type, this.types(), originalId),
      upsert: (type, originalId) => upsertExerciseType(this.types(), type, originalId),
      remove: (id) => retireExerciseType(this.types(), id),
      persist: () => this.plugin.saveSettings(),
      refresh: this.refresh,
      messages: {
        confirmDelete: (id) => {
          const exercises = exercisesOfType(
            this.plugin.getExerciseLibrary().pages(),
            this.types(),
            id,
          );
          return exercises.length > 0
            ? t("settings.exerciseTypes.confirmDeleteUsed", { exercises: exercises.join(", ") })
            : t("settings.exerciseTypes.confirmDelete");
        },
        saved: t("settings.exerciseTypes.saved"),
        deleted: t("settings.exerciseTypes.deleted"),
      },
    });
  }

  /** Opens the form on a copy of a built-in type, as a new type */
  private duplicate(type: ExerciseTypeInfo): void {
    const name = t("settings.exerciseTypes.copyName", { name: exerciseTypeName(type) });
    const draft: CustomExerciseType = {
      id: exerciseTypeIdFromName(name),
      name,
      parameters: type.parameters.map((field) => ({ ...field })),
    };
    // Saving says settings:changed, on which the tab draws the list again
    new ExerciseTypeEditorModal(this.app, draft, null, () =>
      saveExerciseType(this.plugin, draft, null),
    ).open();
  }

  /** The settings list, created on first use */
  private types(): CustomExerciseType[] {
    this.plugin.settings.exerciseTypes ??= [];
    return this.plugin.settings.exerciseTypes;
  }
}

/** "Logs: Reps, Weight (kg)" */
export function describeFields(fields: readonly ParameterDefinition[]): string {
  return t("settings.exerciseTypes.logs", {
    fields: fields.map((field) => (field.unit ? `${field.label} (${field.unit})` : field.label)).join(", "),
  });
}
