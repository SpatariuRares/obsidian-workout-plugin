import { App } from "obsidian";
import { DeleteButton } from "@app/components/atoms/DeleteButton";
import { ConfirmModal } from "@app/features/modals/common/ConfirmModal";
import { ModalBase } from "@app/features/modals/base/ModalBase";
import {
  applyBlockEdit,
  createEditButtons,
  type EditButtonsOptions,
  type EditTarget,
} from "@app/features/modals/base/components/createEditButtons";
import { dashboardBlock } from "@app/features/dashboard/dashboardBlock";
import {
  DashboardWidgetId,
  EmbeddedDashboardParams,
} from "@app/features/dashboard/types";
import {
  DASHBOARD_WIDGETS,
  resolveWidgets,
} from "@app/features/dashboard/widgets/dashboardWidgets";
import {
  createSettingControl,
  type SettingControl,
} from "@app/features/dashboard/modals/widgetSettingControl";
import { gridKey } from "@app/features/dashboard/layout/dashboardGrid";
import {
  Button,
} from "@app/components/atoms/Button";
import { t } from "@app/i18n";

/**
 * EditWidgetModal - the settings of one widget of a dashboard, opened from
 * the kebab beside its title. Update patches only the parameters changed;
 * "Remove" takes the widget out of the block (its `widgets` entry or its
 * `grid.<widget>` line).
 */
export class EditWidgetModal extends ModalBase {
  /** Each setting's form control: the value to write (undefined: leave unset) and its check */
  private readonly controls = new Map<string, SettingControl>();

  constructor(
    app: App,
    private readonly widgetId: DashboardWidgetId,
    private readonly params: EmbeddedDashboardParams,
    private readonly target: EditTarget,
  ) {
    super(app);
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.addClass("workout-modal");
    const widget = DASHBOARD_WIDGETS[this.widgetId];
    contentEl.createEl("h2", {
      text: t("dashboard.widgetModal.editTitle", { widget: widget.label() }),
    });

    const settings = widget.settings ?? [];
    const form = this.createStyledMainContainer(contentEl);
    for (const setting of settings) {
      this.controls.set(
        setting.key,
        createSettingControl(
          this,
          this.createFormGroup(form),
          setting,
          (this.params as Record<string, unknown>)[setting.key],
        ),
      );
    }
    if (settings.length === 0) {
      form.createEl("p", {
        text: t("dashboard.widgetModal.noSettings"),
        cls: "setting-item-description",
      });
    }

    const removal = this.removal();
    if (!removal) {
      // Say why there is no remove button, instead of leaving it out
      form.createEl("p", {
        text: t("dashboard.widgetModal.lastWidget"),
        cls: "setting-item-description",
      });
    }

    const options: EditButtonsOptions<EmbeddedDashboardParams> = {
      schema: dashboardBlock,
      target: this.target,
      id: this.params.id,
      collectParams: () => this.collectParams(),
      validate: () => this.validate(),
      buttonText: t("dashboard.widgetModal.update"),
      successMessage: t("dashboard.widgetModal.updated"),
      failureMessage: t("modal.notices.dashboardUpdateFailed"),
    };
    // Removing is rare: a small trash icon at the start of the bar (as in
    // the log form), and it still asks to confirm
    const start = (row: HTMLElement) => {
      if (!removal) return;
      DeleteButton.create(row, {
        label: t("dashboard.widgetModal.remove"),
        className: "workout-modal-actions-delete",
        onClick: () =>
        new ConfirmModal(
          this.app,
          t("dashboard.widgetModal.removeConfirm", {
            widget: widget.label(),
          }),
          () =>
            applyBlockEdit(
              this,
              {
                ...options,
                successMessage: t("dashboard.widgetModal.removed"),
              },
              removal,
            ),
          undefined,
          {
            confirmText: t("dashboard.widgetModal.removeConfirmButton"),
            destructive: true,
          },
        ).open(),
      });
    };

    if (settings.length > 0) {
      createEditButtons(this, form, options, start);
    } else {
      Button.createModalActions(form, { start, onCancel: () => this.close() });
    }
  }

  onClose(): void {
    this.contentEl.empty();
  }

  /** Every field's check, all run so each shows its own error */
  private validate(): boolean {
    let valid = true;
    for (const control of this.controls.values()) {
      if (control.check && !control.check()) valid = false;
    }
    return valid;
  }

  /** The widget's settings as the form has them */
  private collectParams(): EmbeddedDashboardParams {
    const params: Record<string, unknown> = {};
    for (const [key, control] of this.controls) params[key] = control.read();
    return params;
  }

  /**
   * The change that takes the widget out of the block, or null when it can't
   * go: the last widget of a list would leave a block with none, and a list
   * without `widgets` shows them all again.
   */
  private removal(): EmbeddedDashboardParams | null {
    if (this.params.layout === "grid") {
      return { [gridKey(this.widgetId)]: undefined };
    }
    const rest = resolveWidgets(this.params).filter(
      (id) => id !== this.widgetId,
    );
    return rest.length > 0 ? { widgets: rest } : null;
  }
}
