// Refactored CreateExercisePageModal using reusable components
import { CONSTANTS } from "@app/constants/Constants";
import { App, normalizePath, Notice, TFile } from "obsidian";
import type WorkoutChartsPlugin from "main";
import { ModalBase } from "@app/features/modals/base/ModalBase";
import { ExerciseAutocomplete } from "@app/features/modals/components/ExerciseAutocomplete";
import { Button } from "@app/components/atoms";

export class CreateExercisePageModal extends ModalBase {
  private exerciseName?: string;

  constructor(
    app: App,
    private plugin: WorkoutChartsPlugin,
    exerciseName?: string
  ) {
    super(app);
    this.exerciseName = exerciseName;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.addClass("workout-charts-modal");

    // Add modal title
    contentEl.createEl("h2", { text: CONSTANTS.WORKOUT.MODAL.TITLES.CREATE_EXERCISE_PAGE });

    // Create form container
    const formContainer = contentEl.createEl("div", {
      cls: "workout-charts-form",
    });

    // Exercise autocomplete using reusable component
    const { elements: exerciseElements } = ExerciseAutocomplete.create(
      this,
      formContainer,
      this.plugin,
      this.exerciseName
    );

    // Tags input
    const tagsInput = this.createTextField(
      formContainer,
      CONSTANTS.WORKOUT.MODAL.LABELS.TAGS,
      CONSTANTS.WORKOUT.MODAL.PLACEHOLDERS.TAGS
    );

    // Folder path input
    const folderInput = this.createTextField(
      formContainer,
      CONSTANTS.WORKOUT.MODAL.LABELS.FOLDER_PATH,
      CONSTANTS.WORKOUT.MODAL.PLACEHOLDERS.FOLDER_PATH,
      this.plugin.settings.exerciseFolderPath
    );

    // Buttons container
    const buttonsContainer = this.createButtonsSection(formContainer);

    // Create button using Button atom
    const createBtn = Button.create(buttonsContainer, {
      text: CONSTANTS.WORKOUT.MODAL.BUTTONS.CREATE_EXERCISE,
      className: "workout-charts-btn workout-charts-btn-primary",
      ariaLabel: CONSTANTS.WORKOUT.MODAL.BUTTONS.CREATE_EXERCISE,
    });

    // Cancel button using Button atom
    const cancelBtn = Button.create(buttonsContainer, {
      text: CONSTANTS.WORKOUT.MODAL.BUTTONS.CANCEL,
      className: "workout-charts-btn workout-charts-btn-warning",
      ariaLabel: CONSTANTS.WORKOUT.MODAL.BUTTONS.CANCEL,
    });

    // Event listeners using Button helper
    Button.onClick(cancelBtn, () => this.close());

    Button.onClick(createBtn, () => {
      const exerciseName = exerciseElements.exerciseInput.value.trim();
      const tags = tagsInput.value.trim();
      const folderPath = folderInput.value.trim();

      if (!exerciseName) {
        new Notice(CONSTANTS.WORKOUT.MODAL.NOTICES.EXERCISE_PAGE_NAME_REQUIRED);
        return;
      }

      this.createExercisePage(exerciseName, tags, folderPath)
        .then(() => {
          this.close();
          new Notice(CONSTANTS.WORKOUT.MODAL.NOTICES.EXERCISE_PAGE_CREATED);
        })
        .catch((error) => {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          new Notice(`${CONSTANTS.WORKOUT.MODAL.NOTICES.EXERCISE_PAGE_ERROR}${errorMessage}`);
        });
    });

    // Focus on exercise input
    exerciseElements.exerciseInput.focus();
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }

  private async createExercisePage(
    exerciseName: string,
    tags: string,
    folderPath: string
  ) {
    // Parse tags
    const tagList = tags
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);

    // Create frontmatter
    const frontmatter = `---
nome_esercizio: ${exerciseName}
tags:
${tagList.map((tag) => `  - ${tag}`).join("\n")}
---`;

    // Create content
    const content = `${frontmatter}

# Descrizione


# Tecnica di Esecuzione



# Note di Sicurezza

-

# Log delle Performance

\`\`\`${CONSTANTS.WORKOUT.MODAL.CODE_BLOCKS.TABLE}
exercise: ${exerciseName}
\`\`\`

### grafico

\`\`\`${CONSTANTS.WORKOUT.MODAL.CODE_BLOCKS.CHART}
exercise: ${exerciseName}
\`\`\`
`;

    // Create file path
    const safeExerciseName = exerciseName.replace(/[\\/:"*?<>|]/g, "_");
    const fileName = normalizePath(folderPath + "/" + safeExerciseName + ".md");
    // Create the file
    await this.app.vault.create(fileName, content);

    // Open the newly created file
    const abstractFile = this.app.vault.getAbstractFileByPath(fileName);
    if (abstractFile && abstractFile instanceof TFile) {
      const leaf = this.app.workspace.getLeaf();
      await leaf.openFile(abstractFile);
    }
  }
}
