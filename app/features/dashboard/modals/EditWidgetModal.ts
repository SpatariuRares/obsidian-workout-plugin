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
  type WidgetSetting,
} from "@app/features/dashboard/widgets/dashboardWidgets";
import { gridKey } from "@app/features/dashboard/layout/dashboardGrid";
import {
  Button,
  BUTTONVARIANT,
} from "@app/components/atoms/Button";
import { t } from "@app/i18n";
import {
  AdjustField,
  ChipGroup,
  parseNumber,
} from "@app/components/molecules";

interface SettingControl {
  read: () => unknown;
  /** Shows what to fix under the field; false keeps Update from writing */
  check?: () => boolean;
}

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
        this.createControl(this.createFormGroup(form), setting),
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

    const actions = Button.createModalActions(form);
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
    if (removal) {
      DeleteButton.create(actions, {
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
    }

    if (settings.length > 0) {
      createEditButtons(this, actions, options);
    } else {
      const cancel = Button.create(actions, {
        text: t("modal.buttons.cancel"),
        variant: BUTTONVARIANT.SECONDARY,
        ariaLabel: t("modal.buttons.cancel"),
      });
      Button.onClick(cancel, () => this.close());
    }
  }

  onClose(): void {
    this.contentEl.empty();
  }

  /**
   * The control for one setting, opened on the block's value (or the
   * default). Its reader gives the value to write, or undefined when it is
   * the default, so a setting left alone is not written into the block; its
   * check shows under the field what Update can't write.
   */
  private createControl(
    group: HTMLElement,
    setting: WidgetSetting,
  ): SettingControl {
    const current = (this.params as Record<string, unknown>)[setting.key];

    if (setting.kind === "number") {
      const fallback = (dashboardBlock.defaults as Record<string, unknown>)[
        setting.key
      ];
      // No default: the setting is a limit that may stay unset ("All")
      const optional = typeof fallback !== "number";
      const field = AdjustField.createField(group, {
        label: setting.label(),
        value:
          typeof current === "number"
            ? current
            : typeof fallback === "number"
              ? fallback
              : undefined,
        min: setting.min,
        max: setting.max,
        step: setting.step,
        unit: setting.unit?.(),
        suggestion: optional ? t("dashboard.widgetModal.all") : undefined,
      });
      const typed = () => parseNumber(field.input.value);
      return {
        read: () => {
          const value = typed();
          return Number.isFinite(value) && value !== fallback ? value : undefined;
        },
        check: () => {
          const value = typed();
          const empty = field.input.value.trim() === "";
          // The form's max is for a new value: one the block already
          // holds (written by hand) stays writable
          const valid = empty
            ? optional
            : value === current ||
              (Number.isInteger(value) &&
                value >= setting.min &&
                value <= setting.max);
          field.setError(
            valid
              ? undefined
              : t("dashboard.widgetModal.numberRange", {
                  min: setting.min,
                  max: setting.max,
                }),
          );
          return valid;
        },
      };
    }

    if (setting.kind === "choice") {
      let picked = typeof current === "string" ? current : setting.default;
      ChipGroup.create(group, {
        label: setting.label(),
        options: setting.options.map((o) => ({ id: o.value, label: o.label() })),
        selected: picked,
        className: "workout-widget-setting-chips",
        onPick: (id) => {
          picked = id;
        },
      });
      return { read: () => (picked === setting.default ? undefined : picked) };
    }

    if (setting.kind === "toggle") {
      // The group itself is the checkbox row (no group nested in a group)
      group.addClass("workout-charts-checkbox-group");
      const box = this.createCheckbox(
        group,
        setting.label(),
        typeof current === "boolean" ? current : setting.default,
      );
      return {
        read: () => (box.checked === setting.default ? undefined : box.checked),
      };
    }

    const chips = ChipGroup.createMulti(group, {
      label: setting.label(),
      options: setting.options.map((o) => ({ id: o.value, label: o.label() })),
      selected: Array.isArray(current)
        ? (current as string[])
        : setting.options.map((o) => o.value),
      className: "workout-widget-setting-chips",
    });
    return {
      // Every option is the default, written as nothing
      read: () => {
        const picked = chips.picked();
        return picked.length === setting.options.length ? undefined : picked;
      },
      // None would be an empty widget: removing it is the way to hide it
      check: () => {
        const valid = chips.picked().length > 0;
        chips.setError(valid ? undefined : t("dashboard.widgetModal.pickOne"));
        return valid;
      },
    };
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
