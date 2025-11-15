// Refactored CreateExercisePageModal using reusable components
import { App, Notice, TFile } from "obsidian";
import type WorkoutChartsPlugin from "main";
import { ModalBase } from "@app/modals/base/ModalBase";
import { ExerciseAutocomplete } from "@app/modals/components/ExerciseAutocomplete";
import {
  MODAL_TITLES,
  MODAL_BUTTONS,
  MODAL_LABELS,
  MODAL_PLACEHOLDERS,
  MODAL_NOTICES,
  MODAL_CODE_BLOCKS,
} from "@app/constants/ModalConstants";
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
    contentEl.createEl("h2", { text: MODAL_TITLES.CREATE_EXERCISE_PAGE });

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
      MODAL_LABELS.TAGS,
      MODAL_PLACEHOLDERS.TAGS
    );

    // Folder path input
    const folderInput = this.createTextField(
      formContainer,
      MODAL_LABELS.FOLDER_PATH,
      MODAL_PLACEHOLDERS.FOLDER_PATH,
      this.plugin.settings.exerciseFolderPath
    );

    // Buttons container
    const buttonsContainer = this.createButtonsSection(formContainer);

    // Create button using Button atom
    const createBtn = Button.create(buttonsContainer, {
      text: MODAL_BUTTONS.CREATE_EXERCISE,
      className: "workout-charts-btn workout-charts-btn-primary",
      ariaLabel: MODAL_BUTTONS.CREATE_EXERCISE,
    });

    // Cancel button using Button atom
    const cancelBtn = Button.create(buttonsContainer, {
      text: MODAL_BUTTONS.CANCEL,
      className: "workout-charts-btn workout-charts-btn-warning",
      ariaLabel: MODAL_BUTTONS.CANCEL,
    });

    // Event listeners using Button helper
    Button.onClick(cancelBtn, () => this.close());

    Button.onClick(createBtn, () => {
      const exerciseName = exerciseElements.exerciseInput.value.trim();
      const tags = tagsInput.value.trim();
      const folderPath = folderInput.value.trim();

      if (!exerciseName) {
        new Notice(MODAL_NOTICES.EXERCISE_PAGE_NAME_REQUIRED);
        return;
      }

      this.createExercisePage(exerciseName, tags, folderPath)
        .then(() => {
          this.close();
          new Notice(MODAL_NOTICES.EXERCISE_PAGE_CREATED);
        })
        .catch((error) => {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          new Notice(`${MODAL_NOTICES.EXERCISE_PAGE_ERROR}${errorMessage}`);
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

\`\`\`${MODAL_CODE_BLOCKS.TABLE}
exercise: ${exerciseName}
\`\`\`

### grafico

\`\`\`${MODAL_CODE_BLOCKS.CHART}
exercise: ${exerciseName}
\`\`\`
`;

    // Create file path
    const safeExerciseName = exerciseName.replace(/[\\/:"*?<>|]/g, "_");
    const fileName = folderPath
      ? `${folderPath}/${safeExerciseName}.md`
      : `${safeExerciseName}.md`;

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
