import { App } from "obsidian";
import { ModalBase } from "@app/features/modals/base/ModalBase";
import { MODAL_BUTTONS, MODAL_LABELS } from "@app/constants";
import { Button } from "@app/components/atoms";

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
    onCancel?: () => void
  ) {
    super(app);
    this.message = message;
    this.onConfirm = onConfirm;
    this.onCancel = onCancel;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();

    contentEl.addClass("workout-charts-modal");

    // Title
    contentEl.createEl("h2", { text: MODAL_LABELS.CONFIRM_ACTION });

    // Message
    contentEl.createEl("p", { text: this.message });

    // Button container
    const buttonContainer = contentEl.createEl("div", {
      cls: "modal-button-container",
    });

    // Cancel button using Button atom
    const cancelBtn = Button.create(buttonContainer, {
      text: MODAL_BUTTONS.CANCEL,
      ariaLabel: MODAL_BUTTONS.CANCEL,
    });
    Button.onClick(cancelBtn, () => {
      if (this.onCancel) {
        this.onCancel();
      }
      this.close();
    });

    // Confirm button using Button atom
    const confirmBtn = Button.create(buttonContainer, {
      text: MODAL_BUTTONS.CONFIRM,
      className: "mod-cta",
      ariaLabel: MODAL_BUTTONS.CONFIRM,
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
