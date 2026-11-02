import { App } from "obsidian";
import { InsertDashboardModal } from "@app/features/dashboard/modals/InsertDashboardModal";
import { dashboardBlock } from "@app/features/dashboard/dashboardBlock";
import { EmbeddedDashboardParams } from "@app/features/dashboard/types";
import { createEditButtons } from "@app/features/modals/base/components/createEditButtons";
import { t } from "@app/i18n";

/**
 * EditDashboardModal - the dashboard form opened on an existing block.
 * On submit it patches only the parameters the user changed into the code
 * block, found by its ID or, without one, by its line.
 */
export class EditDashboardModal extends InsertDashboardModal {
  /**
   * @param fenceLine - Line of the block's opening fence, to find a block
   * written without an id (it gets one when saved)
   */
  constructor(
    app: App,
    params: EmbeddedDashboardParams,
    private readonly fenceLine?: number,
  ) {
    super(app, params);
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
      match: id
        ? { id }
        : this.fenceLine !== undefined
          ? { line: this.fenceLine }
          : null,
      collectParams: () => this.collectParams(),
      buttonText: this.getButtonText(),
      successMessage: this.getSuccessMessage(),
      failureMessage: t("modal.notices.dashboardUpdateFailed"),
    });
  }
}
