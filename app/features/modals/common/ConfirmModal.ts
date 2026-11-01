import { App } from "obsidian";
import { ModalBase } from "@app/features/modals/base/ModalBase";
import { Button, BUTTONVARIANT } from "@app/components/atoms";
import { t } from "@app/i18n";

export interface ConfirmOptions {
  /** Defaults to "Confirm action" */
  title?: string;
  /** Text of the confirm button, naming the action ("Delete"); defaults to "Confirm" */
  confirmText?: string;
  /** The action destroys data: the confirm button is red */
  destructive?: boolean;
}

/**
 * Simple confirmation modal
 */
export class ConfirmModal extends ModalBase {
  private message: string;
  private onConfirm: () => void | Promise<void>;
  private onCancel?: () => void;

  constructor(
    app: App,
    message: string,
    onConfirm: () => void | Promise<void>,
    onCancel?: () => void,
    private options: ConfirmOptions = {},
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
      text: this.options.title ?? t("modal.confirmAction"),
    });

    // Message
    contentEl.createEl("p", { text: this.message });

    // Button container
    const buttonContainer = Button.createContainer(contentEl);

    // Cancel button using Button atom
    const cancelBtn = Button.create(buttonContainer, {
      text: t("modal.buttons.cancel"),
      ariaLabel: t("modal.buttons.cancel"),
      variant: BUTTONVARIANT.SECONDARY,
    });
    Button.onClick(cancelBtn, () => {
      if (this.onCancel) {
        this.onCancel();
      }
      this.close();
    });

    // Confirm button using Button atom
    const confirmText = this.options.confirmText ?? t("modal.buttons.confirm");
    const confirmBtn = Button.create(buttonContainer, {
      text: confirmText,
      ariaLabel: confirmText,
      variant: this.options.destructive
        ? BUTTONVARIANT.DANGER
        : BUTTONVARIANT.PRIMARY,
    });
    Button.onClick(confirmBtn, () => {
      void this.onConfirm();
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
