import { CONSTANTS } from "@app/constants/Constants";
import type WorkoutChartsPlugin from "main";
import { TFile } from "obsidian";
import { ExercisePathResolver } from "@app/utils/ExercisePathResolver";
import { FrontmatterParser } from "@app/utils/FrontmatterParser";

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
      cls: "workout-dashboard-widget  columns-2  workout-file-errors",
    });

    errorEl.createEl("h3", {
      text: CONSTANTS.WORKOUT.LABELS.DASHBOARD.FILE_ERRORS.TITLE,
      cls: "workout-widget-title",
    });

    // Get exercise files with errors
    const fileErrors = await this.validateExerciseFiles(plugin);

    if (fileErrors.length === 0) {
      errorEl.createEl("div", {
        text: `${CONSTANTS.WORKOUT.ICONS.STATUS.SUCCESS} ${CONSTANTS.WORKOUT.LABELS.DASHBOARD.FILE_ERRORS.ALL_VALID}`,
        cls: "workout-file-errors-success",
      });
      return;
    }

    const listEl = errorEl.createEl("ul", {
      cls: "workout-file-errors-list",
    });

    fileErrors.forEach((fileError) => {
      const itemEl = listEl.createEl("li", {
        cls: "workout-file-error-item",
      });

      // File name as clickable link
      const fileNameEl = itemEl.createEl("div", {
        cls: "workout-file-error-name",
      });

      const link = fileNameEl.createEl("a", {
        text: fileError.fileName,
        cls: "workout-file-error-link",
      });
      link.addEventListener("click", () => {
        plugin.app.workspace
          .getLeaf()
          .openFile(fileError.file)
          .catch(() => {
            // Silent fail - failed to open exercise file
          });
      });

      // Error messages
      const errorsEl = itemEl.createEl("ul", {
        cls: "workout-file-error-messages",
      });

      fileError.errors.forEach((error) => {
        errorsEl.createEl("li", {
          text: error,
          cls: "workout-file-error-message",
        });
      });
    });
  }

  private static async validateExerciseFiles(
    plugin: WorkoutChartsPlugin
  ): Promise<ExerciseFileError[]> {
    const fileErrors: ExerciseFileError[] = [];

    // Get all exercise files using the path resolver
    const exerciseFiles = ExercisePathResolver.findExerciseFiles(plugin);

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

      // Use FrontmatterParser to validate structure
      const validationErrors = FrontmatterParser.validateFrontmatter(content);
      if (validationErrors.length > 0) {
        return validationErrors.map(
          (err) => `${CONSTANTS.WORKOUT.ICONS.STATUS.WARNING} ${err}`
        );
      }

      // Parse tags using FrontmatterParser
      const tags = FrontmatterParser.parseTags(content);

      // Check for muscle tags
      const muscleTags = this.getMuscleTags(tags);

      if (muscleTags.length === 0) {
        errors.push(
          `${CONSTANTS.WORKOUT.ICONS.STATUS.WARNING} ${CONSTANTS.WORKOUT.LABELS.DASHBOARD.FILE_ERRORS.NO_TAGS}`
        );
      } else if (muscleTags.length > 3) {
        errors.push(
          `${CONSTANTS.WORKOUT.ICONS.STATUS.WARNING} ${CONSTANTS.WORKOUT.LABELS.DASHBOARD.FILE_ERRORS.TOO_MANY_TAGS(
            muscleTags.length
          )}`
        );
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      errors.push(
        `${CONSTANTS.WORKOUT.ICONS.STATUS.ERROR} ${CONSTANTS.WORKOUT.LABELS.DASHBOARD.FILE_ERRORS.READ_ERROR(
          errorMessage
        )}`
      );
    }

    return errors;
  }

  private static getMuscleTags(tags: string[]): string[] {
    return tags.filter((tag) => {
      const normalizedTag = tag.toLowerCase().trim();
      return CONSTANTS.WORKOUT.MUSCLES.KEYWORDS.some((keyword) => normalizedTag.includes(keyword));
    });
  }
}
