import type WorkoutChartsPlugin from "../../../main";
import { TFile } from "obsidian";

interface ExerciseFileError {
  file: TFile;
  fileName: string;
  errors: string[];
}

export class WidgetsFileError {
  static async render(
    container: HTMLElement,
    plugin: WorkoutChartsPlugin
  ): Promise<void> {
    const errorEl = container.createEl("div", {
      cls: "dashboard-widget  columns-2  file-errors",
    });

    errorEl.createEl("h3", {
      text: "Exercise File Errors",
      cls: "widget-title",
    });

    // Get exercise files with errors
    const fileErrors = await this.validateExerciseFiles(plugin);

    if (fileErrors.length === 0) {
      errorEl.createEl("div", {
        text: "✓ All exercise files are valid",
        cls: "file-errors-success",
      });
      return;
    }

    const listEl = errorEl.createEl("ul", {
      cls: "file-errors-list",
    });

    fileErrors.forEach((fileError) => {
      const itemEl = listEl.createEl("li", {
        cls: "file-error-item",
      });

      // File name as clickable link
      const fileNameEl = itemEl.createEl("div", {
        cls: "file-error-name",
      });

      const link = fileNameEl.createEl("a", {
        text: fileError.fileName,
        cls: "file-error-link",
      });
      link.addEventListener("click", () => {
        plugin.app.workspace.getLeaf().openFile(fileError.file);
      });

      // Error messages
      const errorsEl = itemEl.createEl("ul", {
        cls: "file-error-messages",
      });

      fileError.errors.forEach((error) => {
        errorsEl.createEl("li", {
          text: error,
          cls: "file-error-message",
        });
      });
    });
  }

  private static async validateExerciseFiles(
    plugin: WorkoutChartsPlugin
  ): Promise<ExerciseFileError[]> {
    const exerciseFolderPath = plugin.settings.exerciseFolderPath;
    if (!exerciseFolderPath) {
      return [];
    }

    const fileErrors: ExerciseFileError[] = [];

    // Get all markdown files in the exercise folder
    const allFiles = plugin.app.vault.getMarkdownFiles();
    const exerciseFiles = allFiles.filter((file) => {
      const normalizedFilePath = file.path.replace(/\\/g, "/");

      const pathsToCheck = [
        exerciseFolderPath,
        exerciseFolderPath + "/",
        exerciseFolderPath + "/Data",
        exerciseFolderPath + "/Data/",
        "theGYM/" + exerciseFolderPath,
        "theGYM/" + exerciseFolderPath + "/",
        "theGYM/" + exerciseFolderPath + "/Data",
        "theGYM/" + exerciseFolderPath + "/Data/",
      ];

      return pathsToCheck.some(
        (path) =>
          normalizedFilePath.startsWith(path) ||
          normalizedFilePath.includes(path + "/")
      );
    });

    // Validate each exercise file
    for (const file of exerciseFiles) {
      const errors = await this.validateExerciseFile(file, plugin);
      if (errors.length > 0) {
        fileErrors.push({
          file,
          fileName: file.basename,
          errors,
        });
      }
    }

    return fileErrors;
  }

  private static async validateExerciseFile(
    file: TFile,
    plugin: WorkoutChartsPlugin
  ): Promise<string[]> {
    const errors: string[] = [];

    try {
      const content = await plugin.app.vault.read(file);

      // Check if file is empty
      if (!content.trim()) {
        errors.push("⚠️ File is empty");
        return errors;
      }

      // Parse frontmatter
      const frontmatterMatch = content.match(/^---\s*\n(.*?)\n---/s);
      if (!frontmatterMatch) {
        errors.push("⚠️ No frontmatter found");
        return errors;
      }

      const frontmatter = frontmatterMatch[1];

      // Extract tags
      const tagsMatch = frontmatter.match(/tags:\s*\n((?:\s*-\s*.+\n?)*)/);
      if (!tagsMatch) {
        errors.push("⚠️ No tags found");
        return errors;
      }

      const tags = tagsMatch[1]
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.startsWith("- "))
        .map((line) => line.substring(2).trim())
        .filter((tag) => tag.length > 0);

      // Check for muscle tags
      const muscleTags = this.getMuscleTags(tags);

      if (muscleTags.length === 0) {
        errors.push("⚠️ No muscle tags found");
      } else if (muscleTags.length > 3) {
        errors.push(`⚠️ Too many muscle tags (${muscleTags.length})`);
      }
    } catch (error) {
      errors.push(`⚠️ Error reading file: ${error.message}`);
    }

    return errors;
  }

  private static getMuscleTags(tags: string[]): string[] {
    const muscleKeywords = [
      // Main muscle groups
      "chest",
      "petto",
      "pettorale",
      "back",
      "schiena",
      "dorsale",
      "shoulders",
      "spalle",
      "deltoidi",
      "biceps",
      "bicipiti",
      "triceps",
      "tricipiti",
      "legs",
      "gambe",
      "quads",
      "quadricipiti",
      "hamstrings",
      "ischiocrurali",
      "femorali",
      "glutes",
      "glutei",
      "gluteo",
      "abduttori",
      "adduttori",
      "calves",
      "polpacci",
      "abs",
      "addominali",
      "core",
      "forearms",
      "avambracci",
      "traps",
      "trapezi",
    ];

    return tags.filter((tag) => {
      const normalizedTag = tag.toLowerCase().trim();
      return muscleKeywords.some((keyword) =>
        normalizedTag.includes(keyword)
      );
    });
  }
}