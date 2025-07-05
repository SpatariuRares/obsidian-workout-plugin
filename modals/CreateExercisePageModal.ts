// Modal for creating a new exercise page
import WorkoutChartsPlugin from "main";
import { App, Modal, Notice, TFile } from "obsidian";

export class CreateExercisePageModal extends Modal {
  constructor(app: App, private plugin: WorkoutChartsPlugin) {
    super(app);
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.addClass("workout-charts-modal");

    // Add modal title
    const titleEl = contentEl.createEl("h2", { text: "Create Exercise Page" });

    // Create form container
    const formContainer = contentEl.createEl("div", {
      cls: "workout-charts-form",
    });

    // Exercise name input
    const exerciseContainer = formContainer.createEl("div", {
      cls: "workout-charts-form-group",
    });
    const exerciseLabel = exerciseContainer.createEl("label", {
      text: "Exercise Name:",
    });
    const exerciseInput = exerciseContainer.createEl("input", { type: "text" });
    exerciseInput.placeholder = "e.g., Pullover Machine";

    // Tags input
    const tagsContainer = formContainer.createEl("div", {
      cls: "workout-charts-form-group",
    });
    const tagsLabel = tagsContainer.createEl("label", {
      text: "Tags (comma separated):",
    });
    const tagsInput = tagsContainer.createEl("input", { type: "text" });
    tagsInput.placeholder =
      "e.g., spalle, deltoidi, laterali, isolamento, macchina";

    // Folder path input
    const folderContainer = formContainer.createEl("div", {
      cls: "workout-charts-form-group",
    });
    const folderLabel = folderContainer.createEl("label", {
      text: "Folder Path (optional):",
    });
    const folderInput = folderContainer.createEl("input", { type: "text" });
    folderInput.placeholder = "e.g., Exercises or leave empty for root";
    folderInput.value = this.plugin.settings.exerciseFolderPath;

    // Buttons container
    const buttonsContainer = formContainer.createEl("div", {
      cls: "workout-charts-buttons",
    });

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
      const exerciseName = exerciseInput.value.trim();
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
    exerciseInput.focus();
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
