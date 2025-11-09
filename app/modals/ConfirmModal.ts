import { App } from "obsidian";
import { ModalBase } from "@app/modals/base/ModalBase";

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
    contentEl.createEl("h2", { text: "Confirm action" });

    // Message
    contentEl.createEl("p", { text: this.message });

    // Button container
    const buttonContainer = contentEl.createEl("div", {
      cls: "modal-button-container",
    });

    // Cancel button
    const cancelBtn = buttonContainer.createEl("button", { text: "Cancel" });
    cancelBtn.addEventListener("click", () => {
      if (this.onCancel) {
        this.onCancel();
      }
      this.close();
    });

    // Confirm button
    const confirmBtn = buttonContainer.createEl("button", {
      text: "Confirm",
      cls: "mod-cta",
    });
    confirmBtn.addEventListener("click", () => {
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
