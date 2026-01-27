import { CONSTANTS } from "@app/constants/Constants";
import { WorkoutLogData } from "@app/types/WorkoutLogData";
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
} from "@app/features/dashboard/widgets";
import { MuscleHeatMap } from "@app/features/dashboard/ui";
import { EmbeddedDashboardParams } from "@app/types";
import { VIEW_TYPES } from "@app/types/ViewTypes";

/**
 * Dashboard View for displaying comprehensive workout analytics
 * Phase 1: Core dashboard with summary widgets, volume analytics, and quick stats
 */
export class EmbeddedDashboardView extends BaseView {
  constructor(plugin: WorkoutChartsPlugin) {
    super(plugin);
  }

  /**
   * Cleanup method to be called during plugin unload.
   * Clears any internal state and ensures proper resource cleanup to prevent memory leaks.
   * Currently, the dashboard does not maintain long-lived resources (event listeners or timers),
   * but this method provides a consistent interface for future extensions.
   */
  public cleanup(): void {
    try {
      this.logDebug("EmbeddedDashboardView", "Cleaning up dashboard view resources");

      // Currently no internal state to clear, but method is here for:
      // 1. Consistency with other view cleanup patterns
      // 2. Future-proofing if dashboard adds stateful components
      // 3. Plugin lifecycle compliance

      this.logDebug("EmbeddedDashboardView", "Dashboard view cleanup completed");
    } catch (error) {
      console.error("Error during EmbeddedDashboardView cleanup:", error);
    }
  }

  /**
   * Creates a workout dashboard with summary widgets and analytics
   */
  async createDashboard(
    container: HTMLElement,
    logData: WorkoutLogData[],
    params: EmbeddedDashboardParams
  ): Promise<void> {
    const startTime = performance.now();
    this.logDebug("EmbeddedDashboardView", "Creating dashboard", { params });

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
      const filterResult = this.filterData(
        logData,
        params,
      );
      const filteredData = filterResult.filteredData;

      // Handle no filtered data
      if (filteredData.length === 0) {
        loadingIndicator.remove();
        this.handleNoFilteredData(
          container,
          params,
          params.title || CONSTANTS.WORKOUT.UI.LABELS.DASHBOARD,
          VIEW_TYPES.DASHBOARD
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
        `Dashboard created in ${(endTime - startTime).toFixed(2)}ms`
      );
    } catch (error) {
      this.handleError(container, error as Error);
    }
  }

  /**
   * Renders the main dashboard layout with widgets and analytics
   */
  private async renderDashboard(
    container: HTMLElement,
    data: WorkoutLogData[],
    params: EmbeddedDashboardParams
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

    // Summary Widget Section (Full Width)
    SummaryWidget.render(gridEl, data, params);

    // Quick Stats Cards Section (Full Width)
    QuickStatsCards.render(gridEl, data, params);

    // Create Main Columns Container
    const mainColumnsEl = gridEl.createEl("div", {
      cls: "workout-dashboard-columns",
    });

    // Left Column (Heatmap)
    const leftCol = mainColumnsEl.createEl("div", {
      cls: "workout-dashboard-column-left",
    });

    // Right Column (Analytics & Others)
    const rightCol = mainColumnsEl.createEl("div", {
      cls: "workout-dashboard-column-right",
    });

    // Muscle Heat Map Section (Left Column)
    await MuscleHeatMap.render(leftCol, data, params, this.plugin);

    // Volume Analytics Section (Right Column)
    VolumeAnalytics.render(rightCol, data, params);

    // Protocol Distribution Section (Right Column)
    ProtocolDistribution.render(rightCol, data, params, this.plugin);

    // Recent Workouts Section (Right Column)
    RecentWorkouts.render(rightCol, data, params);

    // Quick Actions Panel (Right Column)
    QuickActions.render(rightCol, params, this.plugin);

    // Exercise File Errors Widget (Right Column)
    await WidgetsFileError.render(rightCol, this.plugin);

    // Muscle Tags Widget (Right Column)
    MuscleTagsWidget.render(rightCol, params);
  }
}

