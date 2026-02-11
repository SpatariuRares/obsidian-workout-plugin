import { CONSTANTS } from "@app/constants";
import { WorkoutLogData, WorkoutProtocol } from "@app/types/WorkoutLogData";
import type WorkoutChartsPlugin from "main";
import { BaseView } from "@app/features/common/views/BaseView";
import {
  SummaryWidget,
  QuickStatsCards,
  VolumeAnalytics,
  RecentWorkouts,
  QuickActions,
  MuscleTagsWidget,
  WidgetsFileError,
  ProtocolDistribution,
  ProtocolEffectiveness,
  DurationComparison,
  MuscleHeatMap,
} from "@app/features/dashboard/widgets";
import { EmbeddedDashboardParams } from "@app/features/dashboard/types";
import { VIEW_TYPES } from "@app/types/ViewTypes";
import { DomUtils } from "@app/utils/DomUtils";
import { PerformanceMonitor } from "@app/utils/PerformanceMonitor";

/**
 * Dashboard View for displaying comprehensive workout analytics
 * Phase 1: Core dashboard with summary widgets, volume analytics, and quick stats
 * Supports protocol filtering via click interaction on pie chart
 */
export class EmbeddedDashboardView extends BaseView {
  /** Container element for re-rendering */
  private currentContainer: HTMLElement | null = null;
  /** Original unfiltered data for re-rendering */
  private currentData: WorkoutLogData[] = [];
  /** Current dashboard parameters */
  private currentParams: EmbeddedDashboardParams = {};
  /** ResizeObserver for bento layout recalculation */
  private resizeObserver: ResizeObserver | null = null;
  /** Debounce timer for resize recalculation */
  private resizeTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(plugin: WorkoutChartsPlugin) {
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

      // Clear stored state to prevent memory leaks
      this.currentContainer = null;
      this.currentData = [];
      this.currentParams = {};

      // Clean up protocol distribution chart
      ProtocolDistribution.cleanup();
    } catch {
      return;
    }
  }

  /**
   * Load dashboard data from the plugin, applying dateRange filter if present.
   */
  async loadDashboardData(
    params: EmbeddedDashboardParams,
  ): Promise<WorkoutLogData[]> {
    let logData = (await this.plugin.getWorkoutLogData()) || [];
    if (params.dateRange) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - (params.dateRange as number));
      logData = logData.filter((d) => new Date(d.date) >= cutoffDate);
    }
    return logData;
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
    PerformanceMonitor.start("dashboard:createDashboard");

    // Store state for potential re-rendering (e.g., protocol filter changes)
    this.currentContainer = container;
    this.currentData = logData;
    this.currentParams = params;

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
          params.title || CONSTANTS.WORKOUT.UI.LABELS.DASHBOARD,
          VIEW_TYPES.DASHBOARD,
        );
        return;
      }

      // Remove loading indicator
      loadingIndicator.remove();

      // Create dashboard layout
      await this.renderDashboard(container, filteredData, params);

      PerformanceMonitor.end("dashboard:createDashboard");
    } catch (error) {
      PerformanceMonitor.end("dashboard:createDashboard");
      this.handleError(container, error as Error);
    }
  }

  /**
   * Handles protocol filter change from pie chart click
   * Re-renders the dashboard with the new filter applied
   * @param protocol - Protocol to filter by, or null to clear filter
   */
  private handleProtocolFilterChange = (protocol: string | null): void => {
    // Update params with new filter
    const newParams: EmbeddedDashboardParams = {
      ...this.currentParams,
      activeProtocolFilter: protocol,
    };

    // Re-render dashboard with updated filter
    if (this.currentContainer && this.currentData.length > 0) {
      void this.createDashboard(
        this.currentContainer,
        this.currentData,
        newParams,
      );
    }
  };

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
    return data.filter((entry) => {
      const entryProtocol = entry.protocol || WorkoutProtocol.STANDARD;
      return entryProtocol.toLowerCase() === protocol.toLowerCase();
    });
  }

  /**
   * Renders the main dashboard layout with widgets and analytics
   */
  private async renderDashboard(
    container: HTMLElement,
    data: WorkoutLogData[],
    params: EmbeddedDashboardParams,
  ): Promise<void> {
    // Create main dashboard container
    const dashboardEl = container.createEl("div", {
      cls: "workout-dashboard",
    });

    // Add dashboard title if provided
    if (params.title) {
      dashboardEl.createEl("h2", {
        text: params.title,
        cls: "workout-dashboard-title",
      });
    }

    // Create dashboard grid layout
    const gridEl = dashboardEl.createEl("div", {
      cls: "workout-dashboard-grid",
    });

    // Apply protocol filter if set (for widgets that support it)
    const activeProtocolFilter = params.activeProtocolFilter;
    const displayData = activeProtocolFilter
      ? this.filterByProtocol(data, activeProtocolFilter)
      : data;

    PerformanceMonitor.start("dashboard:widget:summary");
    SummaryWidget.render(gridEl, displayData, params);
    PerformanceMonitor.end("dashboard:widget:summary");

    PerformanceMonitor.start("dashboard:widget:quickStats");
    QuickStatsCards.render(gridEl, displayData, params);
    PerformanceMonitor.end("dashboard:widget:quickStats");

    PerformanceMonitor.start("dashboard:widget:muscleHeatMap");
    await MuscleHeatMap.render(gridEl, displayData, params, this.plugin);
    PerformanceMonitor.end("dashboard:widget:muscleHeatMap");

    PerformanceMonitor.start("dashboard:widget:volumeAnalytics");
    VolumeAnalytics.render(gridEl, displayData, params);
    PerformanceMonitor.end("dashboard:widget:volumeAnalytics");

    PerformanceMonitor.start("dashboard:widget:recentWorkouts");
    RecentWorkouts.render(gridEl, displayData, params);
    PerformanceMonitor.end("dashboard:widget:recentWorkouts");

    PerformanceMonitor.start("dashboard:widget:protocolDistribution");
    ProtocolDistribution.render(
      gridEl,
      data,
      params,
      this.plugin,
      this.handleProtocolFilterChange,
    );
    PerformanceMonitor.end("dashboard:widget:protocolDistribution");

    PerformanceMonitor.start("dashboard:widget:protocolEffectiveness");
    ProtocolEffectiveness.render(gridEl, data, params, this.plugin);
    PerformanceMonitor.end("dashboard:widget:protocolEffectiveness");

    PerformanceMonitor.start("dashboard:widget:durationComparison");
    DurationComparison.render(gridEl, data, params);
    PerformanceMonitor.end("dashboard:widget:durationComparison");

    PerformanceMonitor.start("dashboard:widget:quickActions");
    QuickActions.render(gridEl, params, this.plugin);
    PerformanceMonitor.end("dashboard:widget:quickActions");

    PerformanceMonitor.start("dashboard:widget:fileErrors");
    await WidgetsFileError.render(gridEl, this.plugin);
    PerformanceMonitor.end("dashboard:widget:fileErrors");

    PerformanceMonitor.start("dashboard:widget:muscleTags");
    MuscleTagsWidget.render(gridEl, params, this.plugin);
    PerformanceMonitor.end("dashboard:widget:muscleTags");

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

      if (this.resizeTimer) clearTimeout(this.resizeTimer);
      this.resizeTimer = setTimeout(() => {
        this.applyBentoLayout(gridEl);
      }, 150);
    });

    this.resizeObserver.observe(gridEl);
  }

  private destroyResizeObserver(): void {
    if (this.resizeTimer) {
      clearTimeout(this.resizeTimer);
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
      parseFloat(style.getPropertyValue("--workout-grid-row-height")) || 10;
    const gap = parseFloat(style.rowGap) || 16;

    // Temporarily use auto rows + align-items: start so each widget
    // renders at its natural content height (not stretched to row height)
    DomUtils.setCssProps(gridEl, { gridAutoRows: "auto", alignItems: "start" });
    void gridEl.offsetHeight;

    const widgets = Array.from(
      gridEl.querySelectorAll<HTMLElement>(".workout-dashboard-widget"),
    );

    // Measure natural heights and compute row spans
    const spans: number[] = [];
    for (let i = 0; i < widgets.length; i++) {
      const contentHeight = widgets[i].getBoundingClientRect().height;
      spans.push(Math.ceil((contentHeight + gap) / (rowHeight + gap)));
    }

    // Restore grid settings and apply spans
    DomUtils.setCssProps(gridEl, { gridAutoRows: "", alignItems: "" });
    for (let i = 0; i < widgets.length; i++) {
      DomUtils.setCssProps(widgets[i], { gridRowEnd: `span ${spans[i]}` });
    }
  }
}
