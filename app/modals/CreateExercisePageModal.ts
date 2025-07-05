// Refactored CreateExercisePageModal using reusable components
import { App, Notice, TFile } from "obsidian";
import type WorkoutChartsPlugin from "../../main";
import { ModalBase } from "./base/ModalBase";
import { ExerciseAutocomplete } from "./components/ExerciseAutocomplete";

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

  async onOpen() {
    const { contentEl } = this;
    contentEl.addClass("workout-charts-modal");

    // Add modal title
    const titleEl = contentEl.createEl("h2", { text: "Create Exercise Page" });

    // Create form container
    const formContainer = contentEl.createEl("div", {
      cls: "workout-charts-form",
    });

    // Exercise autocomplete using reusable component
    const { elements: exerciseElements } = await ExerciseAutocomplete.create(
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

    // Cancel button
    const cancelBtn = buttonsContainer.createEl("button", {
      text: "Cancel",
      cls: "workout-charts-btn workout-charts-btn-warning",
    });

    // Create button
    const createBtn = buttonsContainer.createEl("button", {
      text: "Create Exercise Page",
      cls: "workout-charts-btn workout-charts-btn-primary",
    });

    // Event listeners
    cancelBtn.addEventListener("click", () => this.close());

    createBtn.addEventListener("click", async () => {
      const exerciseName = exerciseElements.exerciseInput.value.trim();
      const tags = tagsInput.value.trim();
      const folderPath = folderInput.value.trim();

      if (!exerciseName) {
        new Notice("Please enter an exercise name");
        return;
      }

      try {
        await this.createExercisePage(exerciseName, tags, folderPath);
        this.close();
        new Notice("Exercise page created successfully!");
      } catch (error) {
        new Notice(`Error creating exercise page: ${error.message}`);
      }
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
    const file = this.app.vault.getAbstractFileByPath(fileName) as TFile;
    if (file) {
      const leaf = this.app.workspace.getLeaf();
      await leaf.openFile(file);
    }
  }
}
