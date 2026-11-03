import { App } from "obsidian";
import { InsertDashboardModal } from "@app/features/dashboard/modals/InsertDashboardModal";
import { dashboardBlock } from "@app/features/dashboard/dashboardBlock";
import { EmbeddedDashboardParams } from "@app/features/dashboard/types";
import {
  createEditButtons,
  type EditTarget,
} from "@app/features/modals/base/components/createEditButtons";
import { t } from "@app/i18n";

/**
 * EditDashboardModal - the dashboard form opened on an existing block.
 * On submit it patches only the parameters the user changed into the code
 * block, found by its ID or, without one, by its body.
 */
export class EditDashboardModal extends InsertDashboardModal {
  private readonly target: EditTarget;

  /**
   * @param where - The note the block is written in and how to find it
   * without an id, plus `noteWidth`, the dashboard's width in the note (for
   * the grid's columns)
   */
  constructor(
    app: App,
    params: EmbeddedDashboardParams,
    where: EditTarget & { noteWidth?: number },
  ) {
    super(app, params, where.noteWidth);
    this.target = where;
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
      target: this.target,
      id,
      collectParams: () => this.collectParams(),
      buttonText: this.getButtonText(),
      successMessage: this.getSuccessMessage(),
      failureMessage: t("modal.notices.dashboardUpdateFailed"),
    });
  }
}
