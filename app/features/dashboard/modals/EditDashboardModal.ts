import { App, Notice } from "obsidian";
import { InsertDashboardModal } from "@app/features/dashboard/modals/InsertDashboardModal";
import { dashboardBlock } from "@app/features/dashboard/dashboardBlock";
import { EmbeddedDashboardParams } from "@app/features/dashboard/types";
import {
  CodeBlockEditorService,
  CodeBlockMatch,
} from "@app/services/editor/CodeBlockEditorService";
import { generateCodeBlockId } from "@app/utils/IdUtils";
import { changedParams } from "@app/services/codeblocks/CodeBlockSchema";
import { Button, BUTTONVARIANT } from "@app/components/atoms/Button";
import { t } from "@app/i18n";

/**
 * EditDashboardModal - the dashboard form opened on an existing block.
 * On submit it patches only the parameters the user changed into the code
 * block, found by its ID or, without one, by its line.
 */
export class EditDashboardModal extends InsertDashboardModal {
  /** The form as it opened, to tell which parameters the user changed */
  private formAtOpen: EmbeddedDashboardParams = {};

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

  protected createConfigurationSections(
    container: HTMLElement,
  ): void {
    super.createConfigurationSections(container);
    this.formAtOpen = this.collectParams();
  }

  protected createButtons(container: HTMLElement): void {
    const updateBtn = Button.create(container, {
      text: this.getButtonText(),
      variant: BUTTONVARIANT.PRIMARY,
      ariaLabel: this.getButtonText(),
    });
    const cancelBtn = Button.create(container, {
      text: t("modal.buttons.cancel"),
      variant: BUTTONVARIANT.SECONDARY,
      ariaLabel: t("modal.buttons.cancel"),
    });

    Button.onClick(cancelBtn, () => this.close());

    Button.onClick(updateBtn, () => {
      const id = this.initialParams.id;
      const match: CodeBlockMatch | null = id
        ? { id }
        : this.fenceLine !== undefined
          ? { line: this.fenceLine }
          : null;
      if (!match) {
        new Notice(t("modal.notices.dashboardUpdateFailed"));
        this.close();
        return;
      }

      const changes = changedParams(
        this.formAtOpen,
        this.collectParams(),
      );
      // So the next edit finds it by id
      if (!id) changes.id = generateCodeBlockId();

      void CodeBlockEditorService.patchCodeBlock(
        this.app,
        dashboardBlock,
        match,
        changes,
      ).then((success) => {
        new Notice(
          success
            ? this.getSuccessMessage()
            : t("modal.notices.dashboardUpdateFailed"),
        );
      });

      this.close();
    });
  }
}
