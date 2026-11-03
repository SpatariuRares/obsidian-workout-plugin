import { App, setIcon } from "obsidian";
import { ConfirmModal } from "@app/features/modals/common/ConfirmModal";
import { ICONS } from "@app/constants/ui.constants";
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

/**
 * EditWidgetModal - the settings of one widget of a dashboard, opened from
 * the kebab beside its title. Update patches only the parameters changed;
 * "Remove" takes the widget out of the block (its `widgets` entry or its
 * `grid.<widget>` line).
 */
export class EditWidgetModal extends ModalBase {
  /** Each setting's form control, read as the value to write (undefined: leave unset) */
  private readonly readers = new Map<string, () => unknown>();

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
    contentEl.createEl("h2", { text: widget.label() });

    const settings = widget.settings ?? [];
    const form = this.createStyledMainContainer(contentEl);
    for (const setting of settings) {
      this.readers.set(
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

    const actions = Button.createModalActions(form);
    const options: EditButtonsOptions<EmbeddedDashboardParams> = {
      schema: dashboardBlock,
      target: this.target,
      id: this.params.id,
      collectParams: () => this.collectParams(),
      buttonText: t("dashboard.widgetModal.update"),
      successMessage: t("dashboard.widgetModal.updated"),
      failureMessage: t("modal.notices.dashboardUpdateFailed"),
    };
    // Removing is rare: a small trash icon at the start of the bar (as in
    // the log form), and it still asks to confirm
    const removal = this.removal();
    if (removal) {
      const remove = actions.createEl("button", {
        cls: "clickable-icon workout-log-delete",
        attr: {
          type: "button",
          "aria-label": t("dashboard.widgetModal.remove"),
        },
      });
      setIcon(remove, ICONS.ACTIONS.DELETE);
      remove.addEventListener("click", () =>
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
      );
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
   * the default, so a setting left alone is not written into the block.
   */
  private createControl(
    group: HTMLElement,
    setting: WidgetSetting,
  ): () => unknown {
    const current = (this.params as Record<string, unknown>)[setting.key];

    if (setting.kind === "number") {
      const fallback = (dashboardBlock.defaults as Record<string, unknown>)[
        setting.key
      ];
      const input = this.createNumberInput(
        group,
        setting.label(),
        typeof current === "number"
          ? String(current)
          : typeof fallback === "number"
            ? String(fallback)
            : "",
        setting.min,
        setting.max,
      );
      return () => {
        const typed = Number(input.value.trim());
        const valid =
          input.value.trim() !== "" &&
          Number.isFinite(typed) &&
          typed >= setting.min &&
          (setting.max === undefined || typed <= setting.max);
        return valid && typed !== fallback ? typed : undefined;
      };
    }

    if (setting.kind === "choice") {
      const select = this.createSelect(
        group,
        setting.label(),
        setting.options.map((o) => ({ text: o.label(), value: o.value })),
      );
      select.value =
        typeof current === "string" ? current : setting.default;
      return () =>
        select.value === setting.default ? undefined : select.value;
    }

    if (setting.kind === "toggle") {
      const box = this.createCheckbox(
        this.createCheckboxGroup(group),
        setting.label(),
        typeof current === "boolean" ? current : setting.default,
      );
      return () => (box.checked === setting.default ? undefined : box.checked);
    }

    group.createEl("label", {
      text: setting.label(),
      cls: "workout-form-field-label",
    });
    const checked = new Set(
      Array.isArray(current)
        ? current
        : setting.options.map((o) => o.value),
    );
    const boxes = setting.options.map((option) => ({
      value: option.value,
      box: this.createCheckbox(
        this.createCheckboxGroup(group),
        option.label(),
        checked.has(option.value),
      ),
    }));
    return () => {
      const picked = boxes.filter((b) => b.box.checked).map((b) => b.value);
      // Every option, or none (a table with nothing in it): the default
      return picked.length === 0 || picked.length === boxes.length
        ? undefined
        : picked;
    };
  }

  /** The widget's settings as the form has them */
  private collectParams(): EmbeddedDashboardParams {
    const params: Record<string, unknown> = {};
    for (const [key, read] of this.readers) params[key] = read();
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
