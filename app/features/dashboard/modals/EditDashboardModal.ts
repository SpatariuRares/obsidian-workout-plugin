import { App } from "obsidian";
import { InsertDashboardModal } from "@app/features/dashboard/modals/InsertDashboardModal";
import { dashboardBlock } from "@app/features/dashboard/dashboardBlock";
import { EmbeddedDashboardParams } from "@app/features/dashboard/types";
import type { CodeBlockMatch } from "@app/services/editor/CodeBlockEditorService";
import { createEditButtons } from "@app/features/modals/base/components/createEditButtons";
import { t } from "@app/i18n";

/**
 * EditDashboardModal - the dashboard form opened on an existing block.
 * On submit it patches only the parameters the user changed into the code
 * block, found by its ID or, without one, by its body.
 */
export class EditDashboardModal extends InsertDashboardModal {
  private readonly sourcePath: string;
  private readonly matchWithoutId?: CodeBlockMatch;

  /**
   * @param where.sourcePath - The note the block is written in
   * @param where.matchWithoutId - How to find a block written without an
   * id (it gets one when saved)
   * @param where.noteWidth - Width of the dashboard in the note, for the
   * grid's columns
   */
  constructor(
    app: App,
    params: EmbeddedDashboardParams,
    where: {
      sourcePath: string;
      matchWithoutId?: CodeBlockMatch;
      noteWidth?: number;
    },
  ) {
    super(app, params, where.noteWidth);
    this.sourcePath = where.sourcePath;
    this.matchWithoutId = where.matchWithoutId;
  }

  protected getModalTitle(): string {
    return t("modal.titles.editDashboard");
  }

  protected getButtonText(): string {
    return t("modal.buttons.updateDashboard");
  }

  protected getSuccessMessage(): string {
    return t("modal.notices.dashboardUpdated");
  }

  protected createButtons(container: HTMLElement): void {
    const { id } = this.initialParams;
    createEditButtons(this, container, {
      schema: dashboardBlock,
      path: this.sourcePath,
      match: id ? { id } : (this.matchWithoutId ?? null),
      collectParams: () => this.collectParams(),
      buttonText: this.getButtonText(),
      successMessage: this.getSuccessMessage(),
      failureMessage: t("modal.notices.dashboardUpdateFailed"),
    });
  }
}
