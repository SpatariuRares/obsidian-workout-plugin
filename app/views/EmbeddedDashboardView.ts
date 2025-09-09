import { WorkoutLogData } from "../types/WorkoutLogData";
import type WorkoutChartsPlugin from "../../main";
import { BaseView } from "./BaseView";
import { UIComponents, DataFilter, ChartRenderer } from "../components";
import { EmbeddedDashboardParams, EmbeddedChartParams } from "../components/types";
import { ChartDataset } from "../components/types";

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
      const filterResult = this.filterData(logData, params, this.plugin.settings.debugMode);
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
        filterResult.filterMethod,
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
      cls: "workout-dashboard"
    });

    // Add dashboard title if provided
    if (params.title) {
      dashboardEl.createEl("h2", {
        text: params.title,
        cls: "workout-dashboard-title"
      });
    }

    // Create dashboard grid layout
    const gridEl = dashboardEl.createEl("div", {
      cls: "workout-dashboard-grid"
    });

    // Summary Widget Section
    await this.renderSummaryWidget(gridEl, data, params);

    // Quick Stats Cards Section
    await this.renderQuickStatsCards(gridEl, data, params);

    // Volume Analytics Section
    await this.renderVolumeAnalytics(gridEl, data, params);

    // Recent Workouts Section
    await this.renderRecentWorkouts(gridEl, data, params);

    // Quick Actions Panel
    await this.renderQuickActions(gridEl, params);
  }

  /**
   * Renders summary widget with key metrics
   */
  private async renderSummaryWidget(
    container: HTMLElement,
    data: WorkoutLogData[],
    params: EmbeddedDashboardParams
  ): Promise<void> {
    const widgetEl = container.createEl("div", {
      cls: "dashboard-widget summary-widget"
    });

    widgetEl.createEl("h3", {
      text: "Summary",
      cls: "widget-title"
    });

    const summaryEl = widgetEl.createEl("div", {
      cls: "summary-grid"
    });

    // Calculate summary metrics
    const metrics = this.calculateSummaryMetrics(data);

    // Total workouts
    this.createSummaryCard(summaryEl, "Total Workouts", metrics.totalWorkouts.toString(), "🏋️");

    // Current streak
    this.createSummaryCard(summaryEl, "Current Streak", `${metrics.currentStreak} days`, "🔥");

    // Total volume
    this.createSummaryCard(summaryEl, "Total Volume", `${metrics.totalVolume.toLocaleString()} kg`, "📊");

    // Personal Records
    this.createSummaryCard(summaryEl, "Personal Records", metrics.personalRecords.toString(), "🏆");
  }

  /**
   * Renders quick stats cards for different time periods
   */
  private async renderQuickStatsCards(
    container: HTMLElement,
    data: WorkoutLogData[],
    params: EmbeddedDashboardParams
  ): Promise<void> {
    const cardsEl = container.createEl("div", {
      cls: "dashboard-widget stats-cards"
    });

    cardsEl.createEl("h3", {
      text: "Quick Stats",
      cls: "widget-title"
    });

    const statsGrid = cardsEl.createEl("div", {
      cls: "stats-grid"
    });

    // Calculate stats for different periods
    const weekStats = this.calculatePeriodStats(data, 7);
    const monthStats = this.calculatePeriodStats(data, 30);
    const yearStats = this.calculatePeriodStats(data, 365);

    // Week stats
    this.createStatsCard(statsGrid, "This Week", weekStats, "📅");

    // Month stats
    this.createStatsCard(statsGrid, "This Month", monthStats, "📆");

    // Year stats
    this.createStatsCard(statsGrid, "This Year", yearStats, "🗓️");
  }

  /**
   * Renders volume analytics with charts
   */
  private async renderVolumeAnalytics(
    container: HTMLElement,
    data: WorkoutLogData[],
    params: EmbeddedDashboardParams
  ): Promise<void> {
    const analyticsEl = container.createEl("div", {
      cls: "dashboard-widget volume-analytics"
    });

    analyticsEl.createEl("h3", {
      text: "Volume Analytics",
      cls: "widget-title"
    });

    // Create chart container
    const chartContainer = analyticsEl.createEl("div", {
      cls: "dashboard-chart-container"
    });

    // Prepare volume trend data
    const volumeTrendData = this.prepareVolumeTrendData(data, 30); // Last 30 days

    // Create volume trend chart
    ChartRenderer.renderChart(
      chartContainer,
      volumeTrendData.labels,
      [
        {
          label: "Daily Volume (kg)",
          data: volumeTrendData.data,
        },
      ],
      {
        type: "volume",
        title: "Volume Trend (Last 30 Days)",
      }
    );

    // Volume by muscle group breakdown
    const muscleGroupEl = analyticsEl.createEl("div", {
      cls: "muscle-group-breakdown"
    });

    const muscleGroupData = this.calculateMuscleGroupVolume(data);
    this.renderMuscleGroupBreakdown(muscleGroupEl, muscleGroupData);
  }

  /**
   * Renders recent workouts list
   */
  private async renderRecentWorkouts(
    container: HTMLElement,
    data: WorkoutLogData[],
    params: EmbeddedDashboardParams
  ): Promise<void> {
    const recentEl = container.createEl("div", {
      cls: "dashboard-widget recent-workouts"
    });

    recentEl.createEl("h3", {
      text: "Recent Workouts",
      cls: "widget-title"
    });

    // Get recent workouts (last 5)
    const recentWorkouts = this.getRecentWorkouts(data, 5);

    const listEl = recentEl.createEl("ul", {
      cls: "recent-workouts-list"
    });

    recentWorkouts.forEach(workout => {
      const itemEl = listEl.createEl("li", {
        cls: "recent-workout-item"
      });

      itemEl.createEl("div", {
        text: workout.date,
        cls: "workout-date"
      });

      itemEl.createEl("div", {
        text: workout.workout || "Workout",
        cls: "workout-name"
      });

      itemEl.createEl("div", {
        text: `${workout.totalVolume.toLocaleString()} kg`,
        cls: "workout-volume"
      });
    });
  }

  /**
   * Renders quick actions panel
   */
  private async renderQuickActions(
    container: HTMLElement,
    params: EmbeddedDashboardParams
  ): Promise<void> {
    const actionsEl = container.createEl("div", {
      cls: "dashboard-widget quick-actions"
    });

    actionsEl.createEl("h3", {
      text: "Quick Actions",
      cls: "widget-title"
    });

    const buttonsEl = actionsEl.createEl("div", {
      cls: "action-buttons"
    });

    // Add workout log button
    const addLogBtn = buttonsEl.createEl("button", {
      text: "Add Workout Log",
      cls: "action-button primary"
    });

    addLogBtn.addEventListener("click", () => {
      this.plugin.createLogModalHandler.openModal();
    });

    // View all exercises button
    const viewExercisesBtn = buttonsEl.createEl("button", {
      text: "View Exercises",
      cls: "action-button secondary"
    });

    viewExercisesBtn.addEventListener("click", () => {
      // Navigate to exercises folder
      if (this.plugin.app.workspace.getActiveFile()) {
        this.plugin.app.workspace.openLinkText(
          this.plugin.settings.exerciseFolderPath,
          "",
          false
        );
      }
    });
  }

  /**
   * Helper methods for calculations
   */
  private calculateSummaryMetrics(data: WorkoutLogData[]) {
    const uniqueWorkouts = new Set(data.map(d => `${d.date}-${d.workout}`)).size;
    const totalVolume = data.reduce((sum, d) => sum + d.volume, 0);
    
    // Calculate current streak (simplified)
    const uniqueDates = [...new Set(data.map(d => d.date))].sort();
    let currentStreak = 0;
    const today = new Date().toISOString().split('T')[0];
    
    for (let i = uniqueDates.length - 1; i >= 0; i--) {
      const daysDiff = Math.floor(
        (new Date(today).getTime() - new Date(uniqueDates[i]).getTime()) / 
        (1000 * 60 * 60 * 24)
      );
      
      if (daysDiff === currentStreak) {
        currentStreak++;
      } else {
        break;
      }
    }

    // Calculate personal records (exercises with max weight)
    const exerciseMaxWeights = new Map<string, number>();
    data.forEach(d => {
      const currentMax = exerciseMaxWeights.get(d.exercise) || 0;
      if (d.weight > currentMax) {
        exerciseMaxWeights.set(d.exercise, d.weight);
      }
    });

    return {
      totalWorkouts: uniqueWorkouts,
      currentStreak,
      totalVolume: Math.round(totalVolume),
      personalRecords: exerciseMaxWeights.size
    };
  }

  private calculatePeriodStats(data: WorkoutLogData[], days: number) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const periodData = data.filter(d => new Date(d.date) >= cutoffDate);
    const uniqueWorkouts = new Set(periodData.map(d => `${d.date}-${d.workout}`)).size;
    const totalVolume = periodData.reduce((sum, d) => sum + d.volume, 0);
    const avgVolume = uniqueWorkouts > 0 ? totalVolume / uniqueWorkouts : 0;

    return {
      workouts: uniqueWorkouts,
      volume: Math.round(totalVolume),
      avgVolume: Math.round(avgVolume)
    };
  }

  private prepareVolumeTrendData(data: WorkoutLogData[], days: number) {
    const labels: string[] = [];
    const volumeData: number[] = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      labels.push(dateStr);
      
      const dayVolume = data
        .filter(d => d.date === dateStr)
        .reduce((sum, d) => sum + d.volume, 0);
      
      volumeData.push(dayVolume);
    }

    return { labels, data: volumeData };
  }

  private calculateMuscleGroupVolume(data: WorkoutLogData[]) {
    // This is a simplified version - in reality you'd want a mapping of exercises to muscle groups
    const exerciseVolumes = new Map<string, number>();
    
    data.forEach(d => {
      const current = exerciseVolumes.get(d.exercise) || 0;
      exerciseVolumes.set(d.exercise, current + d.volume);
    });

    return Array.from(exerciseVolumes.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5); // Top 5 exercises by volume
  }

  private renderMuscleGroupBreakdown(container: HTMLElement, data: [string, number][]) {
    container.createEl("h4", { text: "Top Exercises by Volume" });
    
    const listEl = container.createEl("ul", { cls: "muscle-group-list" });
    
    data.forEach(([exercise, volume]) => {
      const itemEl = listEl.createEl("li", { cls: "muscle-group-item" });
      
      itemEl.createEl("span", {
        text: exercise,
        cls: "exercise-name"
      });
      
      itemEl.createEl("span", {
        text: `${volume.toLocaleString()} kg`,
        cls: "exercise-volume"
      });
    });
  }

  private getRecentWorkouts(data: WorkoutLogData[], limit: number) {
    const workoutMap = new Map<string, {
      date: string;
      workout: string | undefined;
      totalVolume: number;
    }>();

    data.forEach(d => {
      const key = `${d.date}-${d.workout || 'default'}`;
      const existing = workoutMap.get(key);
      
      if (existing) {
        existing.totalVolume += d.volume;
      } else {
        workoutMap.set(key, {
          date: d.date,
          workout: d.workout,
          totalVolume: d.volume
        });
      }
    });

    return Array.from(workoutMap.values())
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);
  }

  private createSummaryCard(container: HTMLElement, title: string, value: string, icon: string) {
    const cardEl = container.createEl("div", { cls: "summary-card" });
    
    cardEl.createEl("div", {
      text: icon,
      cls: "card-icon"
    });
    
    cardEl.createEl("div", {
      text: value,
      cls: "card-value"
    });
    
    cardEl.createEl("div", {
      text: title,
      cls: "card-title"
    });
  }

  private createStatsCard(container: HTMLElement, title: string, stats: any, icon: string) {
    const cardEl = container.createEl("div", { cls: "stats-card" });
    
    cardEl.createEl("div", {
      text: icon,
      cls: "card-icon"
    });
    
    cardEl.createEl("h4", {
      text: title,
      cls: "card-title"
    });
    
    const statsEl = cardEl.createEl("div", { cls: "card-stats" });
    
    statsEl.createEl("div", {
      text: `${stats.workouts} workouts`,
      cls: "stat-item"
    });
    
    statsEl.createEl("div", {
      text: `${stats.volume.toLocaleString()} kg`,
      cls: "stat-item"
    });
    
    statsEl.createEl("div", {
      text: `${stats.avgVolume.toLocaleString()} avg`,
      cls: "stat-item"
    });
  }
}