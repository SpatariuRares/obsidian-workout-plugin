import { Feedback } from "@app/components/atoms/Feedback";
import type WorkoutChartsPlugin from "main";
import { WidgetContainer } from "@app/features/dashboard/ui/WidgetContainer";
import { TFile } from "obsidian";
import { ExercisePathResolver } from "@app/utils/exercise/ExercisePathResolver";
import { FrontmatterParser } from "@app/utils/frontmatter/FrontmatterParser";
import { ListItem } from "@app/components/molecules";
import { StringUtils, ErrorUtils } from "@app/utils";
import { t } from "@app/i18n";

interface ExerciseFileError {
  file: TFile;
  fileName: string;
  errors: string[];
}

export class WidgetsFileError {
  static async render(
    container: HTMLElement,
    plugin: WorkoutChartsPlugin,
  ): Promise<void> {
    const errorEl = WidgetContainer.create(container, {
      title: t("dashboard.fileErrors.title"),
      className: "workout-file-errors",
    });

    // Get exercise files with errors
    const fileErrors = await this.validateExerciseFiles(plugin);

    if (fileErrors.length === 0) {
      Feedback.renderSuccess(
        errorEl,
        `${t("icons.status.success")} ${t("dashboard.fileErrors.allValid")}`,
        { className: "workout-feedback-success", append: true },
      );
      return;
    }

    const listEl = ListItem.createList(errorEl, {
      className: "workout-file-errors-list",
    });

    fileErrors.forEach((fileError) => {
      const itemEl = ListItem.createEmpty(listEl, "workout-file-error-item");

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

      // Error messages (nested list)
      const errorsEl = ListItem.createList(itemEl, {
        className: "workout-file-error-messages",
      });

      fileError.errors.forEach((error) => {
        ListItem.createText(errorsEl, {
          text: error,
          className: "workout-file-error-message",
        });
      });
    });
  }

  private static async validateExerciseFiles(
    plugin: WorkoutChartsPlugin,
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
    plugin: WorkoutChartsPlugin,
  ): Promise<string[]> {
    const errors: string[] = [];

    try {
      const content = await plugin.app.vault.read(file);

      // Use FrontmatterParser to validate structure
      const validationErrors = FrontmatterParser.validateFrontmatter(content);
      if (validationErrors.length > 0) {
        return validationErrors.map(
          (err) => `${t("icons.status.warning")} ${err}`,
        );
      }

      // Parse tags using FrontmatterParser
      const tags = FrontmatterParser.parseTags(content);

      // Check for muscle tags using MuscleTagService
      const tagMap = plugin.getMuscleTagService().getTagMap();
      const muscleTags = this.getMuscleTags(tags, tagMap);

      if (muscleTags.length === 0) {
        errors.push(
          `${t("icons.status.warning")} ${t("dashboard.fileErrors.noTags")}`,
        );
      } else if (muscleTags.length > 3) {
        errors.push(
          `${t("icons.status.warning")} ${t("dashboard.fileErrors.tooManyTags", { count: muscleTags.length })}`,
        );
      }
    } catch (error) {
      const errorMessage = ErrorUtils.getErrorMessage(error);
      errors.push(
        t("dashboard.fileErrors.readError", { message: errorMessage }),
      );
    }

    return errors;
  }

  private static getMuscleTags(
    tags: string[],
    tagMap: Map<string, string>,
  ): string[] {
    return tags.filter((tag) => {
      const normalizedTag = StringUtils.normalize(tag);
      return tagMap.has(normalizedTag);
    });
  }
}
