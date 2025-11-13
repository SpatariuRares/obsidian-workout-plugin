// Refactored CreateExercisePageModal using reusable components
import { App, Notice, TFile } from "obsidian";
import type WorkoutChartsPlugin from "main";
import { ModalBase } from "@app/modals/base/ModalBase";
import { ExerciseAutocomplete } from "@app/modals/components/ExerciseAutocomplete";

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
    contentEl.createEl("h2", { text: "Create exercise page" });

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
    const tagsContainer = this.createFormGroup(formContainer);
    const tagsInput = this.createTextInput(
      tagsContainer,
      "Tags (comma separated):",
      "e.g., spalle, deltoidi, laterali, isolamento, macchina"
    );

    // Folder path input
    const folderContainer = this.createFormGroup(formContainer);
    const folderInput = this.createTextInput(
      folderContainer,
      "Folder Path (optional):",
      "e.g., Exercises or leave empty for root",
      this.plugin.settings.exerciseFolderPath
    );

    // Buttons container
    const buttonsContainer = this.createButtonsSection(formContainer);

    // Create button
    const createBtn = buttonsContainer.createEl("button", {
      text: "Create exercise page",
      cls: "workout-charts-btn workout-charts-btn-primary",
    });

    // Cancel button
    const cancelBtn = buttonsContainer.createEl("button", {
      text: "Cancel",
      cls: "workout-charts-btn workout-charts-btn-warning",
    });

    // Event listeners
    cancelBtn.addEventListener("click", () => this.close());

    createBtn.addEventListener("click", () => {
      const exerciseName = exerciseElements.exerciseInput.value.trim();
      const tags = tagsInput.value.trim();
      const folderPath = folderInput.value.trim();

      if (!exerciseName) {
        new Notice("Please enter an exercise name");
        return;
      }

      this.createExercisePage(exerciseName, tags, folderPath)
        .then(() => {
          this.close();
          new Notice("Exercise page created successfully!");
        })
        .catch((error) => {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          new Notice(`Error creating exercise page: ${errorMessage}`);
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

\`\`\`workout-log
exercise: ${exerciseName}
\`\`\`

### grafico

\`\`\`workout-chart
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
