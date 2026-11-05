import { Feedback } from "@app/components/atoms/Feedback";
import { dashboardBlock } from "@app/features/dashboard/dashboardBlock";
import type {
  AppPort,
  SettingsPort,
  MuscleTagPort,
  ExerciseLibraryPort,
} from "@app/types/PluginPorts";
import type {
  ExerciseLibrary,
  ExercisePage,
} from "@app/services/exercise/ExerciseLibrary";
import { WidgetContainer } from "@app/features/dashboard/ui/WidgetContainer";
import { TFile } from "obsidian";
import { ListItem } from "@app/components/molecules";
import { t } from "@app/i18n";
import type { EmbeddedDashboardParams } from "@app/features/dashboard/types";
import { Icon } from "@app/components/atoms";
import { ICONS } from "@app/constants/ui.constants";

type FileErrorContext = AppPort &
  SettingsPort &
  MuscleTagPort &
  ExerciseLibraryPort;

/** What a page is checked for */
interface FileErrorRules {
  /** The most muscle tags a page may have */
  maxTags: number;
  checkSharedNames: boolean;
}

interface ExerciseFileError {
  file: TFile;
  fileName: string;
  errors: string[];
}

export class WidgetsFileError {
  static async render(
    container: HTMLElement,
    plugin: FileErrorContext,
    params: EmbeddedDashboardParams = {},
  ): Promise<void> {
    const errorEl = WidgetContainer.create(container, {
      title: t("dashboard.fileErrors.title"),
      className: "workout-file-errors",
    });

    // Get exercise files with errors
    const rules = {
      maxTags: params.fileErrorsMaxTags ?? dashboardBlock.defaults.fileErrorsMaxTags,
      checkSharedNames: params.fileErrorsCheckSharedNames ?? dashboardBlock.defaults.fileErrorsCheckSharedNames,
    };
    const allErrors = await this.validateExerciseFiles(plugin, rules);
    const fileErrors = allErrors.slice(0, params.fileErrorsMaxItems);

    if (fileErrors.length === 0) {
      Feedback.renderSuccess(
        errorEl,
        t("dashboard.fileErrors.allValid"),
        { className: "workout-feedback-success", append: true },
      );
      return;
    }

    const listEl = ListItem.createList(errorEl, {
      className: "workout-file-errors-list",
    });

    fileErrors.forEach((fileError) => {
      const itemEl = ListItem.createEmpty(
        listEl,
        "workout-file-error-item",
      );

      // File name as clickable link
      const fileNameEl = itemEl.createDiv({
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
        const item = ListItem.createText(errorsEl, {
          text: error,
          className: "workout-file-error-message",
        });
        item.prepend(Icon.create(item, { name: ICONS.STATUS.WARNING }));
      });
    });

    const hidden = allErrors.length - fileErrors.length;
    if (hidden > 0) {
      errorEl.createEl("small", {
        text: t("dashboard.fileErrors.more", { count: hidden }),
        cls: "workout-file-errors-more",
      });
    }
  }

  private static async validateExerciseFiles(
    plugin: FileErrorContext,
    rules: FileErrorRules,
  ): Promise<ExerciseFileError[]> {
    const library = plugin.getExerciseLibrary();
    const fileErrors: ExerciseFileError[] = [];

    for (const page of library.pages()) {
      const errors = await this.validatePage(page, library, plugin, rules);
      if (errors.length > 0) {
        fileErrors.push({
          file: page.file,
          fileName: page.file.basename,
          errors,
        });
      }
    }

    return fileErrors;
  }

  private static async validatePage(
    page: ExercisePage,
    library: ExerciseLibrary,
    plugin: FileErrorContext,
    rules: FileErrorRules,
  ): Promise<string[]> {
    const errors: string[] = [];

    // Tags that point to a muscle, resolved like the heat map does
    const muscleTagService = plugin.getMuscleTagService();
    const resolved = await Promise.all(
      page.tags.map((tag) => muscleTagService.musclesForTags([tag])),
    );
    const muscleTags = page.tags.filter((_, i) => resolved[i].length > 0);

    if (muscleTags.length === 0) {
      errors.push(t("dashboard.fileErrors.noTags"));
    } else if (muscleTags.length > rules.maxTags) {
      errors.push(
        t("dashboard.fileErrors.tooManyTags", {
          count: muscleTags.length,
          max: rules.maxTags,
        }),
      );
    }

    const sharing = rules.checkSharedNames
      ? library.pagesSharingAName(page)
      : [];
    if (sharing.length > 0) {
      const pages = sharing.map((other) => other.file.basename).join(", ");
      errors.push(t("dashboard.fileErrors.sharedName", { pages }));
    }

    return errors;
  }
}
