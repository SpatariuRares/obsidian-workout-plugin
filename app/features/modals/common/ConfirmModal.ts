import { App } from "obsidian";
import { ModalBase } from "@app/features/modals/base/ModalBase";
import { Button } from "@app/components/atoms";
import { t } from "@app/i18n";

/**
 * Simple confirmation modal
 */
export class ConfirmModal extends ModalBase {
  private message: string;
  private onConfirm: () => void;
  private onCancel?: () => void;

  constructor(
    app: App,
    message: string,
    onConfirm: () => void,
    onCancel?: () => void,
  ) {
    super(app);
    this.message = message;
    this.onConfirm = onConfirm;
    this.onCancel = onCancel;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();

    contentEl.addClass("workout-modal");

    // Title
    contentEl.createEl("h2", {
      text: t("modal.confirmAction"),
    });

    // Message
    contentEl.createEl("p", { text: this.message });

    // Button container
    const buttonContainer = Button.createContainer(contentEl);

    // Cancel button using Button atom
    const cancelBtn = Button.create(buttonContainer, {
      text: t("modal.buttons.cancel"),
      ariaLabel: t("modal.buttons.cancel"),
      variant: "warning",
    });
    Button.onClick(cancelBtn, () => {
      if (this.onCancel) {
        this.onCancel();
      }
      this.close();
    });

    // Confirm button using Button atom
    const confirmBtn = Button.create(buttonContainer, {
      text: t("modal.buttons.confirm"),
      ariaLabel: t("modal.buttons.confirm"),
      variant: "primary",
    });
    Button.onClick(confirmBtn, () => {
      this.onConfirm();
      this.close();
    });

    // Focus on cancel button by default (safer)
    cancelBtn.focus();
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}
