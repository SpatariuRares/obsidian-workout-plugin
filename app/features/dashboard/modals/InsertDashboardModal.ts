import { App, MarkdownView } from "obsidian";
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
import { GridEditor } from "@app/features/dashboard/ui/GridEditor";
import {
  columnsForWidth,
  gridColumns,
  gridParams,
  gridPlacements,
  minColumnsOf,
} from "@app/features/dashboard/layout/dashboardGrid";
import {
  autoPack,
  fitColumns,
  Placement,
  readingOrder,
} from "@app/features/dashboard/layout/gridLayout";
import { ICONS } from "@app/constants/ui.constants";
import { generateCodeBlockId } from "@app/utils/IdUtils";
import {
  createSettingControl,
  type SettingControl,
} from "@app/features/dashboard/modals/widgetSettingControl";
import { t } from "@app/i18n";

/**
 * Widget settings the dashboard form shows too (as the widget's menu draws
 * them), each only while its widget is on the dashboard
 */
const FORM_SETTINGS = [
  ["recentWorkouts", "recentWorkoutsLimit"],
  ["volume", "volumeTrendDays"],
] as const;

interface FormSetting {
  widget: DashboardWidgetId;
  key: string;
  group: HTMLElement;
  control: SettingControl;
}

/**
 * The dashboard form: title, period, and the widgets, either as a list
 * (which ones, in what order) or as a grid (each widget in its cells).
 * Opens on `initialParams`, so the edit modal reuses it as is.
 */
export class InsertDashboardModal extends BaseInsertModal {
  /** Every widget, in the order the form shows them */
  private order: DashboardWidgetId[];
  private shown: Set<DashboardWidgetId>;
  private titleInput!: HTMLInputElement;
  private dateRangeInput!: HTMLInputElement;
  private formSettings: FormSetting[] = [];
  private listEl!: HTMLElement;
  private gridAreaEl!: HTMLElement;
  private widgetsHintEl!: HTMLElement;
  /** The document listeners of a drag in progress */
  private dragListeners: AbortController | null = null;
  private layout: "list" | "grid";
  /** Grid layout: the widgets on the grid */
  protected placements: Placement[] = [];
  /** Grid layout: the columns the grid is made for */
  protected gridColumns = 2;
  /** Whether the columns come from the note's width (else the user types them) */
  private columnsMeasured = false;
  /**
   * Until the user changes the grid, the form gives back the block's own
   * grid: opening a grid in a note of another width (refitted on screen)
   * and saving a title must not rewrite it
   */
  private gridTouched = false;
  private gridEditor: GridEditor | null = null;

  /**
   * @param noteWidth - The width of the note the dashboard lives in, for
   * the grid's columns; measured from the active note when not given
   */
  constructor(
    app: App,
    protected readonly initialParams: EmbeddedDashboardParams = {},
    private readonly noteWidth?: number,
  ) {
    super(app);
    this.layout = initialParams.layout === "grid" ? "grid" : "list";
    const shown = resolveWidgets(initialParams);
    this.shown = new Set(shown);
    this.order = [
      ...shown,
      ...DASHBOARD_WIDGET_IDS.filter((id) => !this.shown.has(id)),
    ];
  }

  onClose(): void {
    this.dragListeners?.abort();
    this.gridEditor?.destroy();
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
    const layoutSelect = this.createSelect(
      this.createFormGroup(widgets),
      t("dashboard.modal.layout"),
      [
        { text: t("dashboard.modal.layoutList"), value: "list" },
        { text: t("dashboard.modal.layoutGrid"), value: "grid" },
      ],
    );
    layoutSelect.addClass("workout-dashboard-layout");
    layoutSelect.value = this.layout;
    layoutSelect.addEventListener("change", () =>
      this.setLayout(layoutSelect.value === "grid" ? "grid" : "list"),
    );
    this.widgetsHintEl = widgets.createEl("p", {
      cls: "setting-item-description",
    });
    this.listEl = widgets.createDiv({
      cls: "workout-dashboard-widget-list",
    });
    this.gridAreaEl = widgets.createDiv({
      cls: "workout-dashboard-grid-area",
    });
    this.setUpGrid(params);

    this.formSettings = [];
    for (const [widget, key] of FORM_SETTINGS) {
      const setting = DASHBOARD_WIDGETS[widget].settings?.find(
        (s) => s.key === key,
      );
      if (!setting) continue;
      const group = this.createFormGroup(widgets);
      this.formSettings.push({
        widget,
        key,
        group,
        control: createSettingControl(this, group, setting, params[key]),
      });
    }
    this.renderWidgets();
  }

  protected canInsert(): boolean {
    return this.validateSettings();
  }

  /**
   * Each shown setting's check, all run so each shows its own error; false
   * keeps the form from writing
   */
  protected validateSettings(): boolean {
    let valid = true;
    for (const { group, control } of this.formSettings) {
      if (!group.hidden && control.check && !control.check()) valid = false;
    }
    return valid;
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
    const grid = this.layout === "grid";
    const params: EmbeddedDashboardParams = {
      title: this.titleInput.value.trim() || undefined,
      dateRange: readNumber(this.dateRangeInput, 0),
      widgets: grid || isDefault ? undefined : widgets,
      layout: grid ? "grid" : undefined,
      ...this.gridLines(grid),
    };
    const settings = params as Record<string, unknown>;
    for (const { key, control } of this.formSettings) {
      settings[key] = control.read();
    }
    return params;
  }

  /** `columns` and the `grid.<widget>` lines: the block's own until touched */
  private gridLines(grid: boolean): EmbeddedDashboardParams {
    if (!grid) return { columns: undefined, ...gridParams([]) };
    if (!this.gridTouched) {
      return {
        columns: this.initialParams.columns,
        ...gridParams(gridPlacements(this.initialParams)),
      };
    }
    return {
      columns: this.gridColumns,
      ...gridParams(this.placements),
    };
  }

  /**
   * The grid's columns (from the note's width, or typed in when it can't be
   * measured or fits only one) and, for a grid block, its widgets in them
   */
  private setUpGrid(params: EmbeddedDashboardParams): void {
    const width = this.noteWidth ?? measureNoteWidth(this.app);
    const measured =
      width !== undefined
        ? columnsForWidth(width, this.contentEl)
        : 0;
    const saved = gridPlacements(params);
    const savedColumns =
      params.layout === "grid" ? gridColumns(params, saved) : 0;
    // One column (a phone, a narrow pane) is no grid to edit, and a grid is
    // never narrowed to the note: those cases use the saved columns (or 2)
    // and the user can change them
    this.gridColumns =
      measured > 1
        ? Math.max(measured, savedColumns)
        : savedColumns || 2;
    this.columnsMeasured =
      measured > 1 && this.gridColumns === measured;
    this.placements = fitColumns(saved, this.gridColumns);
  }

  /**
   * List → grid: the ticked widgets, in order, packed at their minimum
   * width. Grid → list: the placed widgets in reading order, ticked.
   */
  private setLayout(layout: "list" | "grid"): void {
    if (layout === this.layout) return;
    this.gridTouched = true;
    if (layout === "grid") {
      this.placements = autoPack(
        this.order
          .filter((id) => this.shown.has(id))
          .map((id) => ({ id, width: minColumnsOf(id), height: 1 })),
        this.gridColumns,
      );
    } else {
      const placed = readingOrder(this.placements).map(
        (p) => p.id as DashboardWidgetId,
      );
      this.shown = new Set(placed);
      this.order = [
        ...placed,
        ...this.order.filter((id) => !this.shown.has(id)),
      ];
    }
    this.layout = layout;
    this.renderWidgets();
  }

  /** Shows the list or the grid editor, whichever the layout is */
  private renderWidgets(): void {
    const grid = this.layout === "grid";
    this.listEl.hidden = grid;
    this.gridAreaEl.hidden = !grid;
    // One line above the widgets: in a grid, the columns come first
    this.widgetsHintEl.setText(
      grid
        ? [
            this.columnsMeasured
              ? t("dashboard.modal.gridColumnsMeasured", {
                  columns: String(this.gridColumns),
                })
              : "",
            t("dashboard.modal.gridHint"),
          ]
            .filter(Boolean)
            .join(" ")
        : t("dashboard.modal.widgetsHint"),
    );
    if (grid) this.renderGrid();
    else this.renderWidgetList();
  }

  private renderGrid(): void {
    this.gridEditor?.destroy();
    this.gridAreaEl.empty();
    if (!this.columnsMeasured) {
      const columnsInput = this.createNumberInput(
        this.createFormGroup(this.gridAreaEl),
        t("dashboard.modal.gridColumns"),
        String(this.gridColumns),
        1,
        12,
      );
      columnsInput.addClass("workout-dashboard-grid-columns");
      columnsInput.addEventListener("change", () => {
        const columns = readNumber(columnsInput, 1);
        if (!columns || columns > 12) return;
        this.gridColumns = Math.floor(columns);
        this.gridTouched = true;
        this.placements = fitColumns(
          this.placements,
          this.gridColumns,
        );
        this.gridEditor?.update({
          columns: this.gridColumns,
          placements: this.placements,
        });
      });
    }
    this.gridEditor = new GridEditor(this.gridAreaEl.createDiv(), {
      columns: this.gridColumns,
      placements: this.placements,
      onChange: (placements) => {
        this.placements = placements;
        this.gridTouched = true;
        this.updateWidgetSettings();
      },
    });
    this.updateWidgetSettings();
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

  /** A widget's setting shows only while that widget is on the dashboard */
  private updateWidgetSettings(): void {
    for (const { widget, group } of this.formSettings) {
      group.hidden =
        this.layout === "grid"
          ? !this.placements.some((p) => p.id === widget)
          : !this.shown.has(widget);
    }
  }
}

/**
 * The width of the active note's content (readable line width included),
 * or undefined when there is no note to measure
 */
function measureNoteWidth(app: App): number | undefined {
  const view = app.workspace.getActiveViewOfType(MarkdownView);
  const content = view?.contentEl?.querySelector(
    ".markdown-preview-sizer, .cm-sizer",
  );
  const width = content?.getBoundingClientRect().width ?? 0;
  return width > 0 ? width : undefined;
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
