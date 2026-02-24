import { CONSTANTS } from "@app/constants";
import { Button } from "@app/components/atoms";
import { DomUtils } from "@app/utils/DomUtils";
import { t } from "@app/i18n";

interface RenderImportPreviewOptions {
  tags: Map<string, string>;
  errors: string[];
  onCancel: () => void;
  onMerge: () => void;
  onReplace: () => void;
}

const PREVIEW_ROWS_LIMIT = 10;
const PREVIEW_ERRORS_LIMIT = 3;

export class MuscleTagImportPreviewRenderer {
  constructor(private readonly container: HTMLElement) { }

  render(options: RenderImportPreviewOptions): void {
    this.container.empty();
    DomUtils.setCssProps(this.container, { display: "block" });

    this.container.createEl("h4", {
      text: CONSTANTS.WORKOUT.MODAL.NOTICES.MUSCLE_TAG_IMPORT_PREVIEW(
        options.tags.size,
      ),
    });

    if (options.errors.length > 0) {
      this.renderErrors(options.errors);
    }

    this.renderPreviewTable(options.tags);
    this.renderButtons(options);
  }

  hide(): void {
    this.container.empty();
    DomUtils.setCssProps(this.container, { display: "none" });
  }

  private renderErrors(errors: string[]): void {
    const errorContainer = this.container.createEl("div", {
      cls: "workout-tag-import-errors",
    });
    const errorHeader = errorContainer.createEl("p", {
      text: `! ${errors.length} tag(s) skipped:`,
      cls: "workout-tag-import-error-header",
    });
    DomUtils.setCssProps(errorHeader, { color: "var(--text-error)" });

    for (const error of errors.slice(0, PREVIEW_ERRORS_LIMIT)) {
      errorContainer.createEl("p", {
        text: `- ${error}`,
        cls: "workout-tag-import-error-item",
      });
    }

    if (errors.length > PREVIEW_ERRORS_LIMIT) {
      errorContainer.createEl("p", {
        text: `...and ${errors.length - PREVIEW_ERRORS_LIMIT} more`,
        cls: "workout-tag-import-error-more",
      });
    }
  }

  private renderPreviewTable(tags: Map<string, string>): void {
    const previewTable = this.container.createEl("table", {
      cls: "workout-tag-table workout-tag-import-table",
    });

    const thead = previewTable.createEl("thead");
    const headerRow = thead.createEl("tr");
    headerRow.createEl("th", { text: t("modal.tag") });
    headerRow.createEl("th", {
      text: t("modal.muscleGroup"),
    });

    const tbody = previewTable.createEl("tbody");
    let count = 0;
    for (const [tag, muscleGroup] of tags) {
      if (count >= PREVIEW_ROWS_LIMIT) {
        break;
      }

      const row = tbody.createEl("tr");
      row.createEl("td", { text: tag });
      row.createEl("td", { text: muscleGroup });
      count++;
    }

    if (tags.size > PREVIEW_ROWS_LIMIT) {
      const moreRow = tbody.createEl("tr");
      const moreCell = moreRow.createEl("td", {
        attr: { colspan: "2" },
        text: `...and ${tags.size - PREVIEW_ROWS_LIMIT} more tags`,
        cls: "workout-tag-import-more",
      });
      DomUtils.setCssProps(moreCell, {
        fontStyle: "italic",
        textAlign: "center",
      });
    }
  }

  private renderButtons(options: RenderImportPreviewOptions): void {
    const buttonContainer = this.container.createEl("div", {
      cls: "workout-tag-form-buttons",
    });

    const cancelButton = Button.create(buttonContainer, {
      text: t("modal.buttons.cancel"),
      variant: "secondary",
      ariaLabel: t("modal.buttons.cancel"),
    });
    Button.onClick(cancelButton, options.onCancel);

    const mergeButton = Button.create(buttonContainer, {
      text: t("modal.importMerge"),
      variant: "secondary",
      ariaLabel: "Merge: add new tags only, keep existing",
    });
    Button.onClick(mergeButton, options.onMerge);

    const replaceButton = Button.create(buttonContainer, {
      text: t("modal.importReplace"),
      variant: "warning",
      ariaLabel: "Replace: overwrite all existing tags",
    });
    Button.onClick(replaceButton, options.onReplace);
  }
}
