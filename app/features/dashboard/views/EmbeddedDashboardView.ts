import { WorkoutLogData } from "@app/types/WorkoutLogData";
import type { WorkoutPluginContext } from "@app/types/PluginPorts";
import { BaseView } from "@app/features/common/views/BaseView";
import {
  DASHBOARD_WIDGETS,
  DashboardWidgetContext,
  resolveWidgets,
} from "@app/features/dashboard/widgets/dashboardWidgets";
import {
  EmbeddedDashboardParams,
  ProtocolFilterCallback,
} from "@app/features/dashboard/types";
import { DashboardActionSelect } from "@app/features/dashboard/ui/DashboardActionSelect";
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
  /** ResizeObserver for bento layout recalculation */
  private resizeObserver: ResizeObserver | null = null;
  /** Debounce timer for resize recalculation */
  private resizeTimer: number | null = null;

  constructor(plugin: WorkoutPluginContext) {
    super(plugin);
  }

  /**
   * Cleanup method to be called during plugin unload.
   * Clears any internal state and ensures proper resource cleanup to prevent memory leaks.
   */
  public cleanup(): void {
    try {
      // Clean up resize observer
      this.destroyResizeObserver();
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
  ): Promise<void> {
    const freshData = await this.loadDashboardData(params);
    container.empty();
    if (freshData.length > 0) {
      await this.createDashboard(container, freshData, params);
    }
  }

  /**
   * Creates a workout dashboard with summary widgets and analytics
   */
  async createDashboard(
    container: HTMLElement,
    logData: WorkoutLogData[],
    params: EmbeddedDashboardParams,
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
        void this.createDashboard(container, logData, {
          ...params,
          activeProtocolFilter: protocol,
        });
      };

      await this.renderDashboard(
        container,
        filteredData,
        params,
        onProtocolFilterChange,
      );
    } catch (error) {
      this.handleError(container, error as Error);
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
    DashboardActionSelect.render(headerEl, this.plugin.app, params);

    // Create dashboard grid layout
    const gridEl = dashboardEl.createDiv({
      cls: "workout-dashboard-grid",
    });

    // Apply protocol filter if set (for widgets that support it)
    const activeProtocolFilter = params.activeProtocolFilter;
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
      onProtocolFilterChange,
      history: async () =>
        (await this.plugin.getWorkoutLogData()) || [],
    };
    for (const id of resolveWidgets(params)) {
      await DASHBOARD_WIDGETS[id].render(ctx);
    }

    // Apply bento layout and observe for resize
    this.applyBentoLayout(gridEl);
    this.observeGridResize(gridEl);
  }

  /**
   * Observes the grid element for size changes and recalculates bento layout.
   * Debounced to avoid excessive recalculations during smooth resizing.
   */
  private observeGridResize(gridEl: HTMLElement): void {
    this.destroyResizeObserver();

    let lastWidth = gridEl.getBoundingClientRect().width;

    this.resizeObserver = new ResizeObserver((entries) => {
      const newWidth = entries[0]?.contentRect.width ?? 0;
      // Only recalculate when width changes (height changes are from our own span updates)
      if (Math.abs(newWidth - lastWidth) < 1) return;
      lastWidth = newWidth;

      if (this.resizeTimer) window.clearTimeout(this.resizeTimer);
      this.resizeTimer = window.setTimeout(() => {
        this.applyBentoLayout(gridEl);
      }, 150);
    });

    this.resizeObserver.observe(gridEl);
  }

  private destroyResizeObserver(): void {
    if (this.resizeTimer) {
      window.clearTimeout(this.resizeTimer);
      this.resizeTimer = null;
    }
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
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
