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

    const { cancel } = Button.createModalActions(contentEl, {
      primary: {
        text: this.options.confirmText ?? t("modal.buttons.confirm"),
        variant: this.options.destructive
          ? BUTTONVARIANT.DANGER
          : BUTTONVARIANT.PRIMARY,
        onClick: () => {
          void this.onConfirm();
          this.close();
        },
      },
      onCancel: () => {
        this.onCancel?.();
        this.close();
      },
    });

    // Focus on cancel button by default (safer)
    cancel?.focus();
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}
