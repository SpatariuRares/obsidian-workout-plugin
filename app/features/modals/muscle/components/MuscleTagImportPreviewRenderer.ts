import { Button, BUTTONVARIANT } from "@app/components/atoms";
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
  constructor(private readonly container: HTMLElement) {}

  render(options: RenderImportPreviewOptions): void {
    this.container.empty();
    DomUtils.setCssProps(this.container, { display: "block" });

    this.container.createEl("h4", {
      text: t("modal.notices.muscleTagImportPreview", {
        count: options.tags.size,
      }),
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
    const errorContainer = this.container.createDiv({
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
    // Merge keeps the tags already there, so it is the primary action;
    // Replace overwrites them
    Button.createModalActions(this.container, {
      className: "workout-tag-form-buttons",
      primary: {
        text: t("modal.importMerge"),
        ariaLabel: t("modal.importMergeAriaLabel"),
        onClick: options.onMerge,
      },
      others: [
        {
          text: t("modal.importReplace"),
          ariaLabel: t("modal.importReplaceAriaLabel"),
          variant: BUTTONVARIANT.WARNING,
          onClick: options.onReplace,
        },
      ],
      onCancel: options.onCancel,
    });
  }
}
