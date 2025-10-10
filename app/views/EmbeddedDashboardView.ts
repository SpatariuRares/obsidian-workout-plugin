import { WorkoutLogData } from "../types/WorkoutLogData";
import type WorkoutChartsPlugin from "../../main";
import { BaseView } from "./BaseView";
import { UIComponents, DataFilter, WidgetsFileError } from "../components";
import {
  EmbeddedDashboardParams,
  SummaryWidget,
  QuickStatsCards,
  VolumeAnalytics,
  RecentWorkouts,
  QuickActions,
  MuscleHeatMap,
  MuscleTagsWidget
} from "../components";

/**
 * Dashboard View for displaying comprehensive workout analytics
 * Phase 1: Core dashboard with summary widgets, volume analytics, and quick stats
 */
export class EmbeddedDashboardView extends BaseView {
  constructor(plugin: WorkoutChartsPlugin) {
    super(plugin);
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
        this.plugin.settings.debugMode
      );
      let filteredData = filterResult.filteredData;

      // Handle no filtered data
      if (filteredData.length === 0) {
        loadingIndicator.remove();
        this.handleNoFilteredData(
          container,
          params,
          params.title || "Dashboard",
          logData,
          "dashboard" as any
        );
        return;
      }

      // Remove loading indicator
      loadingIndicator.remove();

      // Create dashboard layout
      await this.renderDashboard(container, filteredData, params);

      // Debug information
      this.renderDebugInfo(
        container,
        filteredData,
        "dashboard",
        filterResult.filterMethodUsed,
        this.plugin.settings.debugMode
      );

      const endTime = performance.now();
      this.logDebug(
        "EmbeddedDashboardView",
        `Dashboard created in ${(endTime - startTime).toFixed(2)}ms`
      );
    } catch (error) {
      this.handleError(container, error as Error, "createDashboard");
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

    // Summary Widget Section
    SummaryWidget.render(gridEl, data, params);

    // Quick Stats Cards Section
    QuickStatsCards.render(gridEl, data, params);

    // Muscle Heat Map Section (Priority: CRITICAL)
    await MuscleHeatMap.render(gridEl, data, params, this.plugin);

    // Volume Analytics Section
    VolumeAnalytics.render(gridEl, data, params);


    // Recent Workouts Section
    RecentWorkouts.render(gridEl, data, params);

    // Quick Actions Panel
    QuickActions.render(gridEl, params, this.plugin);


    // Exercise File Errors Widget
    await WidgetsFileError.render(gridEl, this.plugin);

    // Muscle Tags Widget (Available muscle groups reference)
    MuscleTagsWidget.render(gridEl, params);
  }

}
