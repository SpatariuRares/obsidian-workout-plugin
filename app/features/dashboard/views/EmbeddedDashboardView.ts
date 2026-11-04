import { Platform } from "obsidian";
import { WorkoutLogData } from "@app/types/WorkoutLogData";
import {
  BaseView,
  renderInvalidParams,
} from "@app/features/common/views/BaseView";
import {
  DASHBOARD_WIDGETS,
  DashboardWidgetContext,
  resolveWidgets,
} from "@app/features/dashboard/widgets/dashboardWidgets";
import {
  DashboardViewState,
  DashboardWidgetId,
  EmbeddedDashboardParams,
  ProtocolFilterCallback,
} from "@app/features/dashboard/types";
import {
  cellProps,
  columnsForWidth,
  gridColumns,
  gridPlacements,
  gridProblemMessages,
} from "@app/features/dashboard/layout/dashboardGrid";
import {
  fitColumns,
  Placement,
} from "@app/features/dashboard/layout/gridLayout";
import { DashboardActionSelect } from "@app/features/dashboard/ui/DashboardActionSelect";
import { WidgetActionSelect } from "@app/features/dashboard/ui/WidgetActionSelect";
import { getElementScopedId } from "@app/utils/IdUtils";
import { VIEW_TYPES } from "@app/types/ViewTypes";
import { DomUtils } from "@app/utils/DomUtils";
import { DataFilter } from "@app/services/data/DataFilter";
import { t } from "@app/i18n";
import { protocolId } from "@app/services/protocols/ProtocolCatalog";
import {
  TOUR_TARGETS,
  markTourTarget,
} from "@app/features/tour/tourTargets";

/**
 * Dashboard View for displaying comprehensive workout analytics
 * Phase 1: Core dashboard with summary widgets, volume analytics, and quick stats
 * Supports protocol filtering via click interaction on pie chart
 */
export class EmbeddedDashboardView extends BaseView {
  /**
   * One resize watcher per dashboard (keyed by its code block element), so
   * rendering one dashboard never stops another from following its width
   */
  private resizeWatchers = new Map<
    HTMLElement,
    { observer: ResizeObserver; timer: number | null }
  >();

  /**
   * Cleanup method to be called during plugin unload.
   * Clears any internal state and ensures proper resource cleanup to prevent memory leaks.
   */
  public cleanup(): void {
    try {
      // Clean up resize observers
      for (const container of [...this.resizeWatchers.keys()]) {
        this.stopWatching(container);
      }
    } catch {
      return;
    }
  }

  /**
   * Load dashboard data from the plugin. Filtering is centralized in DataFilter.
   */
  async loadDashboardData(
    params: EmbeddedDashboardParams,
  ): Promise<WorkoutLogData[]> {
    const logData = (await this.plugin.getWorkoutLogData()) || [];
    return DataFilter.filterRows(logData, params);
  }

  /**
   * Refresh a dashboard by clearing cache, reloading data, and re-rendering.
   * Symmetric with EmbeddedTableView.refreshTable() and EmbeddedChartView.refreshChart().
   */
  async refreshDashboard(
    container: HTMLElement,
    params: EmbeddedDashboardParams,
    state: DashboardViewState = {},
  ): Promise<void> {
    const freshData = await this.loadDashboardData(params);
    container.empty();
    if (freshData.length > 0) {
      await this.createDashboard(container, freshData, params, state);
    }
  }

  /**
   * Creates a workout dashboard with summary widgets and analytics
   */
  async createDashboard(
    container: HTMLElement,
    logData: WorkoutLogData[],
    params: EmbeddedDashboardParams,
    state: DashboardViewState = {},
  ): Promise<void> {
    try {
      // Clear container
      container.empty();

      // Show loading indicator
      const loadingIndicator = this.showLoadingIndicator(container);

      // Handle empty data
      if (this.handleEmptyData(container, logData)) {
        return;
      }

      // Filter data based on parameters
      const filterResult = this.filterData(logData, params);
      const filteredData = filterResult.filteredData;

      // Handle no filtered data
      if (filteredData.length === 0) {
        loadingIndicator.remove();
        this.handleNoFilteredData(
          container,
          params,
          params.title || t("general.dashboard"),
          VIEW_TYPES.DASHBOARD,
        );
        return;
      }

      // Remove loading indicator
      loadingIndicator.remove();

      // Create dashboard layout
      // Re-render this dashboard (and only this one) on pie chart clicks
      const onProtocolFilterChange = (protocol: string | null) => {
        void this.createDashboard(container, logData, params, {
          ...state,
          activeProtocolFilter: protocol,
        });
      };

      await this.renderDashboard(
        container,
        filteredData,
        params,
        state,
        onProtocolFilterChange,
      );
    } catch (error) {
      this.handleError(container, error);
    }
  }

  /**
   * Filters data by protocol
   * @param data - Workout data to filter
   * @param protocol - Protocol to filter by
   * @returns Filtered data
   */
  private filterByProtocol(
    data: WorkoutLogData[],
    protocol: string,
  ): WorkoutLogData[] {
    const wanted = protocolId(protocol);
    return data.filter(
      (entry) => protocolId(entry.protocol) === wanted,
    );
  }

  /**
   * Renders the main dashboard layout with widgets and analytics
   */
  private async renderDashboard(
    container: HTMLElement,
    data: WorkoutLogData[],
    params: EmbeddedDashboardParams,
    state: DashboardViewState,
    onProtocolFilterChange: ProtocolFilterCallback,
  ): Promise<void> {
    // Create main dashboard container
    const dashboardEl = container.createDiv({
      cls: "workout-dashboard",
    });
    markTourTarget(dashboardEl, TOUR_TARGETS.dashboard);

    // Title (if any) and the menu to edit the block
    const headerEl = dashboardEl.createDiv({
      cls: params.title
        ? "workout-dashboard-header workout-dashboard-header-titled"
        : "workout-dashboard-header",
    });
    if (params.title) {
      headerEl.createEl("h2", {
        text: params.title,
        cls: "workout-dashboard-title",
      });
    }
    if (state.sourcePath !== undefined) {
      DashboardActionSelect.render(headerEl, this.plugin.app, params, {
        sourcePath: state.sourcePath,
        matchWithoutId: state.matchWithoutId,
        noteWidth: () => dashboardEl.getBoundingClientRect().width,
      });
    }

    // Grid layout: each widget in its cells; a broken grid shows why instead
    const placements =
      params.layout === "grid" ? gridPlacements(params) : null;
    const savedColumns =
      placements && gridColumns(params, placements);
    if (placements && savedColumns) {
      const problems = gridProblemMessages(placements, savedColumns);
      if (problems.length > 0) {
        renderInvalidParams(dashboardEl, problems);
        return;
      }
    }

    if (placements && placements.length === 0) {
      dashboardEl.createEl("p", {
        text: t("dashboard.grid.empty"),
        cls: "setting-item-description",
      });
      return;
    }

    // Create dashboard grid layout
    const gridEl = dashboardEl.createDiv({
      cls: placements
        ? "workout-dashboard-grid is-inventory"
        : "workout-dashboard-grid",
    });

    // Apply protocol filter if set (for widgets that support it)
    const { activeProtocolFilter } = state;
    const displayData = activeProtocolFilter
      ? this.filterByProtocol(data, activeProtocolFilter)
      : data;

    const ctx: DashboardWidgetContext = {
      grid: gridEl,
      data: displayData,
      periodData: data,
      params,
      plugin: this.plugin,
      dashboardId: getElementScopedId(container),
      activeProtocolFilter: activeProtocolFilter ?? null,
      onProtocolFilterChange,
      history: async () =>
        (await this.plugin.getWorkoutLogData()) || [],
    };
    const ids = placements
      ? placements.map((p) => p.id as DashboardWidgetId)
      : resolveWidgets(params);
    for (const id of ids) {
      const drawn = gridEl.children.length;
      await DASHBOARD_WIDGETS[id].render(ctx);
      // Tag what the widget drew, so the grid can place it
      for (const el of Array.from(gridEl.children).slice(drawn)) {
        (el as HTMLElement).dataset.widget = id;
        if (state.sourcePath !== undefined) {
          WidgetActionSelect.render(
            el as HTMLElement,
            this.plugin.app,
            id,
            params,
            {
              sourcePath: state.sourcePath,
              matchWithoutId: state.matchWithoutId,
            },
          );
        }
      }
    }

    // Lay the widgets out now and again whenever the width changes
    const layout =
      placements && savedColumns
        ? () => this.applyGridLayout(gridEl, placements, savedColumns)
        : () => this.applyBentoLayout(gridEl);
    layout();
    this.observeGridResize(container, gridEl, layout);
  }

  /**
   * Places each widget in its cells. The columns follow the dashboard's
   * width: as saved when they all fit (wider cells when there is room),
   * otherwise the widgets are packed again in reading order.
   */
  private applyGridLayout(
    gridEl: HTMLElement,
    placements: Placement[],
    savedColumns: number,
  ): void {
    // Phones always stack, landscape included
    const available = Platform.isPhone
      ? 1
      : columnsForWidth(gridEl.getBoundingClientRect().width, gridEl);
    const columns = Math.min(available, savedColumns);
    const fitted = fitColumns(placements, columns);

    DomUtils.setCssProps(gridEl, {
      "--workout-grid-columns": String(columns),
    });
    for (const el of Array.from(gridEl.children) as HTMLElement[]) {
      const cell = fitted.find((p) => p.id === el.dataset.widget);
      if (!cell) continue;
      DomUtils.setCssProps(el, cellProps(cell));
    }
  }

  /**
   * Observes the grid element for size changes and lays it out again.
   * Debounced to avoid excessive recalculations during smooth resizing.
   */
  private observeGridResize(
    container: HTMLElement,
    gridEl: HTMLElement,
    layout: () => void,
  ): void {
    // A re-render of this dashboard replaces its watcher
    this.stopWatching(container);

    let lastWidth = gridEl.getBoundingClientRect().width;
    const watcher = {
      timer: null as number | null,
      observer: new ResizeObserver((entries) => {
        // The note was closed or the block re-rendered elsewhere
        if (!gridEl.isConnected) {
          this.stopWatching(container);
          return;
        }
        const newWidth = entries[0]?.contentRect.width ?? 0;
        // Only recalculate when width changes (height changes are from our own span updates)
        if (Math.abs(newWidth - lastWidth) < 1) return;
        lastWidth = newWidth;

        if (watcher.timer) window.clearTimeout(watcher.timer);
        watcher.timer = window.setTimeout(layout, 150);
      }),
    };
    watcher.observer.observe(gridEl);
    this.resizeWatchers.set(container, watcher);
  }

  private stopWatching(container: HTMLElement): void {
    const watcher = this.resizeWatchers.get(container);
    if (!watcher) return;
    if (watcher.timer) window.clearTimeout(watcher.timer);
    watcher.observer.disconnect();
    this.resizeWatchers.delete(container);
  }

  /**
   * Measures each widget's natural content height and sets grid-row span
   * to create a masonry-like bento grid with no wasted vertical space.
   *
   * Temporarily switches grid to auto rows so widgets render at natural
   * height before measuring - prevents overflow containers from clipping
   * content during measurement.
   */
  private applyBentoLayout(gridEl: HTMLElement): void {
    const style = getComputedStyle(gridEl);
    const rowHeight =
      parseFloat(
        style.getPropertyValue("--workout-grid-row-height"),
      ) || 10;
    const gap = parseFloat(style.rowGap) || 16;

    // Temporarily use auto rows + align-items: start so each widget
    // renders at its natural content height (not stretched to row height)
    DomUtils.setCssProps(gridEl, {
      gridAutoRows: "auto",
      alignItems: "start",
    });
    void gridEl.offsetHeight;

    const widgets = Array.from(
      gridEl.querySelectorAll<HTMLElement>(
        ".workout-dashboard-widget",
      ),
    );

    // Measure natural heights and compute row spans
    const spans: number[] = [];
    for (let i = 0; i < widgets.length; i++) {
      const contentHeight = widgets[i].getBoundingClientRect().height;
      spans.push(
        Math.ceil((contentHeight + gap) / (rowHeight + gap)),
      );
    }

    // Restore grid settings and apply spans
    DomUtils.setCssProps(gridEl, {
      gridAutoRows: "",
      alignItems: "",
    });
    // A CSS variable, not an inline grid-row-end: the phone layout
    // (one column, auto rows) must be able to ignore the span
    for (let i = 0; i < widgets.length; i++) {
      DomUtils.setCssProps(widgets[i], {
        "--workout-widget-row-end": `span ${spans[i]}`,
      });
    }
  }
}
