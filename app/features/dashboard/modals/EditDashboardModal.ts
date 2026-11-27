import { App } from "obsidian";
import { InsertDashboardModal } from "@app/features/dashboard/modals/InsertDashboardModal";
import {
  applyBlockEdit,
  changesSince,
  type EditTarget,
} from "@app/features/modals/base/components/createEditButtons";
import { dashboardBlock } from "@app/features/dashboard/dashboardBlock";
import { EmbeddedDashboardParams } from "@app/features/dashboard/types";
import { t } from "@app/i18n";

/**
 * EditDashboardModal - the dashboard form opened on an existing block.
 * On submit it patches only the parameters the user changed into the code
 * block, found by its ID or, without one, by its body.
 */
export class EditDashboardModal extends InsertDashboardModal {
  private readonly target: EditTarget;
  private formAtOpen?: EmbeddedDashboardParams;

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
    this.quickSubmit = true;
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

  protected createConfigurationSections(container: HTMLElement): void {
    super.createConfigurationSections(container);
    // Snapshot after the prefill so only what the user changes is patched
    this.formAtOpen = this.collectParams();
    this.refreshHeader();
  }

  protected submit(): void {
    if (!this.checkForm()) return;
    const formNow = this.collectParams();
    const changes = changesSince(this.formAtOpen ?? formNow, formNow, this.target);
    applyBlockEdit(
      this,
      {
        schema: dashboardBlock,
        target: this.target,
        id: this.initialParams.id,
        successMessage: this.getSuccessMessage(),
        failureMessage: t("modal.notices.dashboardUpdateFailed"),
      },
      changes,
    );
  }
}
