import { App } from "obsidian";
import { BaseInsertModal } from "@app/features/modals/base/BaseInsertModal";
import { dashboardBlock } from "@app/features/dashboard/dashboardBlock";
import {
  DASHBOARD_WIDGET_IDS,
  DashboardWidgetId,
  EmbeddedDashboardParams,
} from "@app/features/dashboard/types";
import {
  DASHBOARD_WIDGETS,
  resolveWidgets,
} from "@app/features/dashboard/widgets/dashboardWidgets";
import {
  Button,
  BUTTONVARIANT,
  BUTTONSIZE,
} from "@app/components/atoms/Button";
import { Icon } from "@app/components/atoms/Icon";
import { ICONS } from "@app/constants/ui.constants";
import { generateCodeBlockId } from "@app/utils/IdUtils";
import { t } from "@app/i18n";

/** Widgets whose own setting the form shows only while they are ticked */
const WIDGET_SETTINGS = {
  recentWorkoutsLimit: "recentWorkouts",
  volumeTrendDays: "volume",
} as const satisfies Partial<
  Record<keyof EmbeddedDashboardParams, DashboardWidgetId>
>;

/**
 * The dashboard form: title, period, which widgets to show and in what
 * order. Opens on `initialParams`, so the edit modal reuses it as is.
 */
export class InsertDashboardModal extends BaseInsertModal {
  /** Every widget, in the order the form shows them */
  private order: DashboardWidgetId[];
  private shown: Set<DashboardWidgetId>;
  private titleInput!: HTMLInputElement;
  private dateRangeInput!: HTMLInputElement;
  private settingInputs = {} as Record<
    keyof typeof WIDGET_SETTINGS,
    HTMLInputElement
  >;
  private listEl!: HTMLElement;
  /** The document listeners of a drag in progress */
  private dragListeners: AbortController | null = null;

  constructor(
    app: App,
    protected readonly initialParams: EmbeddedDashboardParams = {},
  ) {
    super(app);
    const shown = resolveWidgets(initialParams);
    this.shown = new Set(shown);
    this.order = [
      ...shown,
      ...DASHBOARD_WIDGET_IDS.filter((id) => !this.shown.has(id)),
    ];
  }

  onClose(): void {
    this.dragListeners?.abort();
    super.onClose();
  }

  protected getModalTitle(): string {
    return t("modal.titles.insertDashboard");
  }

  protected getButtonText(): string {
    return t("modal.buttons.insertDashboard");
  }

  protected getSuccessMessage(): string {
    return t("modal.notices.dashboardInserted");
  }

  protected createConfigurationSections(
    container: HTMLElement,
  ): void {
    // Long list: the buttons stay at the bottom of the modal (see _form.scss)
    container.addClass("workout-dashboard-form");
    const params = this.initialParams;
    const general = this.createSection(
      container,
      t("general.dashboard"),
    );
    this.titleInput = this.createTextField(
      general,
      t("modal.customTitle"),
      "",
      params.title ?? "",
    );
    this.dateRangeInput = this.createNumberInput(
      this.createFormGroup(general),
      t("modal.dateRange"),
      params.dateRange?.toString() ?? "",
      0,
      undefined,
      t("dashboard.modal.allHistory"),
    );

    const widgets = this.createSection(
      container,
      t("dashboard.modal.widgets"),
    );
    widgets.createEl("p", {
      text: t("dashboard.modal.widgetsHint"),
      cls: "setting-item-description",
    });
    this.listEl = widgets.createDiv({
      cls: "workout-dashboard-widget-list",
    });

    this.settingInputs = {
      recentWorkoutsLimit: this.createNumberInput(
        this.createFormGroup(widgets),
        t("dashboard.modal.recentWorkoutsLimit"),
        String(
          params.recentWorkoutsLimit ??
            dashboardBlock.defaults.recentWorkoutsLimit,
        ),
        1,
      ),
      volumeTrendDays: this.createNumberInput(
        this.createFormGroup(widgets),
        t("dashboard.modal.volumeTrendDays"),
        String(
          params.volumeTrendDays ??
            dashboardBlock.defaults.volumeTrendDays,
        ),
        1,
      ),
    };
    this.renderWidgetList();
  }

  protected generateCode(): string {
    return dashboardBlock.serialize({
      id: generateCodeBlockId(),
      ...this.collectParams(),
    });
  }

  /**
   * The block parameters the form describes. `widgets` and the widget
   * settings are left out while they match the defaults, so a dashboard
   * left as it is also gets the widgets of later versions.
   */
  protected collectParams(): EmbeddedDashboardParams {
    const widgets = this.order.filter((id) => this.shown.has(id));
    const isDefault =
      widgets.length === DASHBOARD_WIDGET_IDS.length &&
      widgets.every((id, i) => id === DASHBOARD_WIDGET_IDS[i]);
    const params: EmbeddedDashboardParams = {
      title: this.titleInput.value.trim() || undefined,
      dateRange: readNumber(this.dateRangeInput, 0),
      widgets: isDefault ? undefined : widgets,
    };
    for (const key of Object.keys(
      WIDGET_SETTINGS,
    ) as (keyof typeof WIDGET_SETTINGS)[]) {
      const value = readNumber(this.settingInputs[key], 1);
      params[key] =
        value === dashboardBlock.defaults[key] ? undefined : value;
    }
    return params;
  }

  private renderWidgetList(): void {
    this.listEl.empty();
    this.order.forEach((id, index) => {
      const label = DASHBOARD_WIDGETS[id].label();
      const row = this.listEl.createDiv({
        cls: "workout-dashboard-widget-row",
      });
      row.dataset.widget = id;
      row.classList.toggle("is-hidden-widget", !this.shown.has(id));

      // Drag by the grip (mouse and touch); the arrows do it by keyboard
      const grip = row.createSpan({
        cls: "workout-dashboard-widget-grip",
      });
      Icon.create(grip, { name: ICONS.ACTIONS.DRAG });
      grip.addEventListener("pointerdown", (event) =>
        this.dragRow(row, grip, event),
      );

      const checkbox = this.createCheckbox(
        row,
        label,
        this.shown.has(id),
        `workout-dashboard-widget-${id}`,
      );
      checkbox.addEventListener("change", () => {
        if (checkbox.checked) this.shown.add(id);
        else this.shown.delete(id);
        row.classList.toggle("is-hidden-widget", !checkbox.checked);
        this.updateWidgetSettings();
      });

      const moves = [
        {
          by: -1,
          icon: ICONS.ACTIONS.MOVE_UP,
          text: t("dashboard.modal.moveUp", { widget: label }),
        },
        {
          by: 1,
          icon: ICONS.ACTIONS.MOVE_DOWN,
          text: t("dashboard.modal.moveDown", { widget: label }),
        },
      ];
      moves.forEach((move, side) => {
        const target = index + move.by;
        const button = Button.create(row, {
          icon: move.icon,
          variant: BUTTONVARIANT.SECONDARY,
          size: BUTTONSIZE.SMALL,
          ariaLabel: move.text,
          disabled: target < 0 || target >= this.order.length,
        });
        Button.onClick(button, () => {
          [this.order[index], this.order[target]] = [
            this.order[target],
            this.order[index],
          ];
          this.renderWidgetList();
          // Keep the keyboard on the moved widget: the same arrow, or the
          // other one when it reached the end of the list
          const buttons = Array.from(
            this.listEl.children[target].querySelectorAll("button"),
          );
          (buttons[side].disabled
            ? buttons[1 - side]
            : buttons[side]
          ).focus();
        });
      });
    });
    this.updateWidgetSettings();
  }

  /**
   * Moves the row under the pointer while it is dragged by its grip, then
   * reads the new order from the list. The listeners sit on the document:
   * moving the row in the DOM drops any pointer capture on the grip.
   */
  private dragRow(
    row: HTMLElement,
    grip: HTMLElement,
    event: PointerEvent,
  ): void {
    event.preventDefault();
    const doc = grip.ownerDocument;
    // Aborted on drop or when the modal closes mid-drag
    this.dragListeners?.abort();
    const listeners = new AbortController();
    this.dragListeners = listeners;
    const { signal } = listeners;
    row.addClass("is-dragging");

    const onMove = (move: PointerEvent) => {
      const rows = Array.from(this.listEl.children) as HTMLElement[];
      const before = rows.find((other) => {
        if (other === row) return false;
        const box = other.getBoundingClientRect();
        return move.clientY < box.top + box.height / 2;
      });
      if (row.nextElementSibling !== (before ?? null)) {
        this.listEl.insertBefore(row, before ?? null);
      }
    };
    const onEnd = () => {
      listeners.abort();
      this.order = (
        Array.from(this.listEl.children) as HTMLElement[]
      ).map((el) => el.dataset.widget as DashboardWidgetId);
      this.renderWidgetList();
    };
    doc.addEventListener("pointermove", onMove, { signal });
    doc.addEventListener("pointerup", onEnd, { signal });
    doc.addEventListener("pointercancel", onEnd, { signal });
  }

  /** A widget's setting shows only while that widget is ticked */
  private updateWidgetSettings(): void {
    for (const [key, widget] of Object.entries(WIDGET_SETTINGS)) {
      const group = this.settingInputs[
        key as keyof typeof WIDGET_SETTINGS
      ]?.closest<HTMLElement>(".workout-charts-form-group");
      if (group) group.hidden = !this.shown.has(widget);
    }
  }
}

/** The number typed in, or undefined when empty or below `min` */
function readNumber(
  input: HTMLInputElement,
  min: number,
): number | undefined {
  const value = input.value.trim();
  if (value === "") return undefined;
  const num = Number(value);
  return Number.isFinite(num) && num >= min ? num : undefined;
}
