// Refactored CreateExercisePageModal using reusable components

import { DEFAULT_EXERCISE_TYPE_ID } from "@app/constants/exerciseTypes.constants";
import { App, normalizePath, Notice } from "obsidian";
import type {
  WorkoutPluginContext,
  TemplateGeneratorPort,
} from "@app/types/PluginPorts";
import { ModalBase } from "@app/features/modals/base/ModalBase";
import { ErrorUtils } from "@app/utils/ErrorUtils";
import { ExerciseAutocomplete } from "@app/features/modals/components/ExerciseAutocomplete";
import { MuscleTagSelector } from "@app/features/modals/components/MuscleTagSelector";
import { Button } from "@app/components/atoms";
import { t } from "@app/i18n";
import { fillExercisePageTemplate } from "@app/services/exercise/ExercisePageContent";
import {
  BUTTONSIZE,
  BUTTONVARIANT,
} from "@app/components/atoms/Button";
import { exerciseTypeName } from "@app/constants/ui.constants";
import type { CustomExerciseType } from "@app/types/WorkoutLogData";
import { ExerciseTypeCatalog } from "@app/services/exercise/ExerciseTypeCatalog";
import { ExerciseTypeEditorModal } from "@app/features/settings/modals/ExerciseTypeEditorModal";
import { saveExerciseType } from "@app/features/settings/business/saveExerciseType";
import { describeFields } from "@app/features/settings/components/ExerciseTypesSettings";

export class CreateExercisePageModal extends ModalBase {
  private exerciseName?: string;
  private getSelectedTags?: () => string[];

  constructor(
    app: App,
    private plugin: WorkoutPluginContext & TemplateGeneratorPort,
    exerciseName?: string,
  ) {
    super(app);
    this.exerciseName = exerciseName;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.addClass("workout-modal");

    // Add modal title
    contentEl.createEl("h2", {
      text: t("modal.titles.createExercisePage"),
    });

    // Create form container
    const formContainer = contentEl.createDiv({
      cls: "workout-charts-form",
    });

    // Exercise autocomplete using reusable component
    const { elements: exerciseElements } =
      ExerciseAutocomplete.create(
        this,
        formContainer,
        this.plugin,
        this.exerciseName,
        { showCreateButton: false },
      );

    const exerciseTypeSelect = this.createSelectField(
      formContainer,
      t("modal.exerciseType"),
      [],
    );
    this.createTypePicker(exerciseTypeSelect);

    // Muscle tag selector (replaces plain text input)
    const tagSelector = MuscleTagSelector.create(
      formContainer,
      this.plugin,
    );
    this.getSelectedTags = tagSelector.getSelectedTags;

    // Folder path input
    const folderInput = this.createTextField(
      formContainer,
      t("modal.folderPath"),
      t("modal.placeholders.folderPath"),
      this.plugin.settings.exerciseFolderPath,
    );

    Button.createModalActions(formContainer, {
      primary: {
        text: t("modal.buttons.createExercise"),
        onClick: async () => {
          const exerciseName =
            exerciseElements.exerciseInput.value.trim();
          const exerciseType = exerciseTypeSelect.value;
          const selectedTags = this.getSelectedTags
            ? this.getSelectedTags()
            : [];
          const folderPath = folderInput.value.trim();

          if (!exerciseName) {
            new Notice(t("modal.notices.exercisePageNameRequired"));
            return;
          }

          try {
            await this.createExercisePage(
              exerciseName,
              exerciseType,
              selectedTags,
              folderPath,
            );
            this.close();
            new Notice(t("modal.notices.exercisePageCreated"));
          } catch (error) {
            const errorMessage = ErrorUtils.getErrorMessage(error);
            new Notice(
              t("modal.notices.exercisePageError", {
                error: errorMessage,
              }),
            );
          }
        },
      },
      onCancel: () => this.close(),
    });

    // Focus on exercise input
    exerciseElements.exerciseInput.focus();
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }

  /**
   * The exercise types to pick from (built-in, then the user's), the fields
   * the picked one logs, and a button that makes a new type and picks it
   */
  private createTypePicker(select: HTMLSelectElement): void {
    const fields = select.parentElement!.createDiv({
      cls: "workout-exercise-type-preview setting-item-description",
    });
    const catalog = () => new ExerciseTypeCatalog(this.plugin.settings.exerciseTypes);
    const show = () => {
      const type = catalog().resolve(select.value);
      fields.setText(type ? describeFields(type.parameters) : "");
    };
    const fill = (selected: string) => {
      select.empty();
      for (const type of catalog().pickable()) {
        select.createEl("option", { text: exerciseTypeName(type), value: type.id });
      }
      select.value = selected;
      show();
    };
    select.addEventListener("change", show);

    const add = Button.create(select.parentElement!, {
      text: t("settings.exerciseTypes.newType"),
      icon: "plus",
      variant: BUTTONVARIANT.SECONDARY,
      size: BUTTONSIZE.SMALL,
    });
    Button.onClick(add, () => {
      const draft: CustomExerciseType = { id: "", name: "", parameters: [] };
      new ExerciseTypeEditorModal(this.app, draft, null, async () => {
        const saved = await saveExerciseType(this.plugin, draft, null);
        if (saved) fill(draft.id);
        return saved;
      }).open();
    });
    fill(DEFAULT_EXERCISE_TYPE_ID);
  }

  private async createExercisePage(
    exerciseName: string,
    exerciseType: string,
    tags: string[],
    folderPath: string,
  ) {
    const template =
      await this.plugin.templateGeneratorService.getExercisePageTemplate();

    const content = fillExercisePageTemplate(
      template,
      { name: exerciseName, typeId: exerciseType, muscleGroups: tags },
      new ExerciseTypeCatalog(this.plugin.settings.exerciseTypes).resolve(exerciseType)?.name,
    );

    const safeExerciseName = exerciseName.replace(
      /[\\/:"*?<>|]/g,
      "_",
    );
    const fileName = normalizePath(
      folderPath + "/" + safeExerciseName + ".md",
    );
    await this.app.vault.create(fileName, content);
  }
}
