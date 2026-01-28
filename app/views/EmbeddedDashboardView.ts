import { CONSTANTS } from "@app/constants/Constants";
import { WorkoutLogData, WorkoutProtocol } from "@app/types/WorkoutLogData";
import type WorkoutChartsPlugin from "main";
import { BaseView } from "@app/views/BaseView";
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
} from "@app/features/dashboard/widgets";
import { MuscleHeatMap } from "@app/features/dashboard/ui";
import { EmbeddedDashboardParams } from "@app/types";
import { VIEW_TYPES } from "@app/types/ViewTypes";

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

  constructor(plugin: WorkoutChartsPlugin) {
    super(plugin);
  }

  /**
   * Cleanup method to be called during plugin unload.
   * Clears any internal state and ensures proper resource cleanup to prevent memory leaks.
   */
  public cleanup(): void {
    try {
      this.logDebug(
        "EmbeddedDashboardView",
        "Cleaning up dashboard view resources",
      );

      // Clear stored state to prevent memory leaks
      this.currentContainer = null;
      this.currentData = [];
      this.currentParams = {};

      // Clean up protocol distribution chart
      ProtocolDistribution.cleanup();

      this.logDebug(
        "EmbeddedDashboardView",
        "Dashboard view cleanup completed",
      );
    } catch {
      return;
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
    const startTime = performance.now();
    this.logDebug("EmbeddedDashboardView", "Creating dashboard", { params });

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

      // Debug information
      const endTime = performance.now();
      this.logDebug(
        "EmbeddedDashboardView",
        `Dashboard created in ${(endTime - startTime).toFixed(2)}ms`,
      );
    } catch (error) {
      this.handleError(container, error as Error);
    }
  }

  /**
   * Handles protocol filter change from pie chart click
   * Re-renders the dashboard with the new filter applied
   * @param protocol - Protocol to filter by, or null to clear filter
   */
  private handleProtocolFilterChange = (protocol: string | null): void => {
    this.logDebug("EmbeddedDashboardView", "Protocol filter changed", {
      protocol,
    });

    // Update params with new filter
    const newParams: EmbeddedDashboardParams = {
      ...this.currentParams,
      activeProtocolFilter: protocol,
    };

    // Re-render dashboard with updated filter
    if (this.currentContainer && this.currentData.length > 0) {
      void this.createDashboard(this.currentContainer, this.currentData, newParams);
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

    // Summary Widget Section (Full Width) - uses filtered data
    SummaryWidget.render(gridEl, displayData, params);

    // Quick Stats Cards Section (Full Width) - uses filtered data
    QuickStatsCards.render(gridEl, displayData, params);

    // Muscle Heat Map Section (Left Column previously) - uses filtered data
    await MuscleHeatMap.render(gridEl, displayData, params, this.plugin);

    // Volume Analytics Section (Right Column previously) - uses filtered data
    VolumeAnalytics.render(gridEl, displayData, params);

    // Recent Workouts Section (Right Column previously) - uses filtered data
    RecentWorkouts.render(gridEl, displayData, params);
    
    // Protocol Distribution Section (Right Column previously)
    // Uses original data for the pie chart, but passes the active filter for highlighting
    ProtocolDistribution.render(
      gridEl,
      data,
      params,
      this.plugin,
      this.handleProtocolFilterChange,
    );

    // Protocol Effectiveness Section (Right Column previously) - uses all data for statistical analysis
    ProtocolEffectiveness.render(gridEl, data, params, this.plugin);

    // Duration Comparison Section (Right Column previously) - uses all data for duration analysis
    DurationComparison.render(gridEl, data, params);

    // Quick Actions Panel (Right Column previously)
    QuickActions.render(gridEl, params, this.plugin);

    // Exercise File Errors Widget (Right Column previously)
    await WidgetsFileError.render(gridEl, this.plugin);

    // Muscle Tags Widget (Right Column previously)
    MuscleTagsWidget.render(gridEl, params);
  }
}
