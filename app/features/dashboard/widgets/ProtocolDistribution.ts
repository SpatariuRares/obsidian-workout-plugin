import { CONSTANTS } from "@app/constants";
import { WorkoutLogData, WorkoutProtocol, CustomProtocolConfig } from "@app/types/WorkoutLogData";
import { EmbeddedDashboardParams, ProtocolFilterCallback } from "@app/types";
import { DateUtils } from "@app/utils/DateUtils";
import { Chart, ChartConfiguration, ArcElement, PieController, Tooltip, Legend } from "chart.js";
import type WorkoutChartsPlugin from "main";
import { ChartLegendItem, FilterIndicator } from "@app/components/molecules";

// Register required Chart.js components for pie charts
Chart.register(ArcElement, PieController, Tooltip, Legend);

// Type alias for pie chart instance
type PieChart = Chart<"pie", number[], string>;

/**
 * Protocol display configuration for badges and chart colors
 */
const PROTOCOL_CONFIG: Record<string, { label: string; color: string }> = {
  [WorkoutProtocol.STANDARD]: { label: "Standard", color: "rgba(128, 128, 128, 0.7)" },
  [WorkoutProtocol.DROP_SET]: { label: "Drop Set", color: "rgba(239, 68, 68, 0.7)" },
  [WorkoutProtocol.MYO_REPS]: { label: "Myo Reps", color: "rgba(168, 85, 247, 0.7)" },
  [WorkoutProtocol.REST_PAUSE]: { label: "Rest Pause", color: "rgba(249, 115, 22, 0.7)" },
  [WorkoutProtocol.SUPERSET]: { label: "Superset", color: "rgba(59, 130, 246, 0.7)" },
  [WorkoutProtocol.TWENTYONE]: { label: "21s", color: "rgba(34, 197, 94, 0.7)" },
};

/**
 * Protocol distribution data structure
 */
interface ProtocolStats {
  protocol: string;
  label: string;
  count: number;
  percentage: number;
  color: string;
}

/**
 * Widget for displaying protocol usage distribution in the dashboard.
 * Shows a pie chart with protocol usage for the last 30 days.
 * Supports click filtering to filter dashboard by protocol.
 */
export class ProtocolDistribution {
  private static chartInstance: PieChart | null = null;
  private static currentStats: ProtocolStats[] = [];
  private static onFilterChange: ProtocolFilterCallback | null = null;

  /**
   * Renders the protocol distribution widget
   * @param container - The container element to render in
   * @param data - Workout log data
   * @param params - Dashboard parameters
   * @param plugin - Plugin instance for accessing custom protocols
   * @param onFilterChange - Callback when protocol filter changes
   */
  static render(
    container: HTMLElement,
    data: WorkoutLogData[],
    params: EmbeddedDashboardParams,
    plugin?: WorkoutChartsPlugin,
    onFilterChange?: ProtocolFilterCallback
  ): void {
    // Store callback for later use
    this.onFilterChange = onFilterChange || null;

    const widgetEl = container.createEl("div", {
      cls: "workout-dashboard-widget workout-protocol-distribution",
    });

    // Widget title
    widgetEl.createEl("h3", {
      text: CONSTANTS.WORKOUT.LABELS.DASHBOARD.PROTOCOL_DISTRIBUTION.TITLE,
      cls: "workout-widget-title",
    });

    // Subtitle showing time period
    widgetEl.createEl("div", {
      text: CONSTANTS.WORKOUT.LABELS.DASHBOARD.PROTOCOL_DISTRIBUTION.SUBTITLE,
      cls: "workout-widget-subtitle",
    });

    // Filter data for last 30 days
    const filteredData = DateUtils.filterByDaysAgo(data, 30);

    // Calculate protocol statistics
    const stats = this.calculateProtocolStats(filteredData, plugin);
    this.currentStats = stats;

    // Check if there's any data
    if (stats.length === 0 || stats.every(s => s.count === 0)) {
      widgetEl.createEl("div", {
        text: CONSTANTS.WORKOUT.LABELS.DASHBOARD.PROTOCOL_DISTRIBUTION.NO_DATA,
        cls: "workout-protocol-no-data",
      });
      return;
    }

    // Render active filter indicator if filter is set
    const activeFilter = params.activeProtocolFilter;
    if (activeFilter) {
      this.renderActiveFilterIndicator(widgetEl, activeFilter, stats);
    }

    // Create chart container
    const chartContainer = widgetEl.createEl("div", {
      cls: "workout-protocol-chart-container",
    });

    // Render pie chart with click handling
    this.renderPieChart(chartContainer, stats, activeFilter);

    // Render legend with counts and percentages (clickable)
    this.renderLegend(widgetEl, stats, activeFilter);
  }

  /**
   * Renders the active filter indicator with clear button
   * @param container - Container element
   * @param activeFilter - Currently active protocol filter
   * @param stats - Protocol statistics for label lookup
   */
  private static renderActiveFilterIndicator(
    container: HTMLElement,
    activeFilter: string,
    stats: ProtocolStats[]
  ): void {
    const activeStat = stats.find(s => s.protocol === activeFilter);
    const filterLabel = activeStat?.label || activeFilter;

    FilterIndicator.create(container, {
      label: CONSTANTS.WORKOUT.LABELS.DASHBOARD.PROTOCOL_DISTRIBUTION.FILTER_ACTIVE,
      filterValue: filterLabel,
      color: activeStat?.color,
      clearText: CONSTANTS.WORKOUT.LABELS.DASHBOARD.PROTOCOL_DISTRIBUTION.CLEAR_FILTER,
      className: "workout-protocol-filter-indicator",
      onClear: () => this.handleFilterChange(null),
    });
  }

  /**
   * Calculates protocol usage statistics from workout data
   * @param data - Filtered workout data
   * @param plugin - Plugin instance for custom protocols
   * @returns Array of protocol statistics
   */
  private static calculateProtocolStats(
    data: WorkoutLogData[],
    plugin?: WorkoutChartsPlugin
  ): ProtocolStats[] {
    // Count occurrences of each protocol
    const protocolCounts = new Map<string, number>();

    data.forEach((entry) => {
      const protocol = entry.protocol || WorkoutProtocol.STANDARD;
      protocolCounts.set(protocol, (protocolCounts.get(protocol) || 0) + 1);
    });

    const totalSets = data.length;
    const stats: ProtocolStats[] = [];

    // Process built-in protocols
    Object.entries(PROTOCOL_CONFIG).forEach(([protocol, config]) => {
      const count = protocolCounts.get(protocol) || 0;
      if (count > 0) {
        stats.push({
          protocol,
          label: config.label,
          count,
          percentage: totalSets > 0 ? (count / totalSets) * 100 : 0,
          color: config.color,
        });
      }
    });

    // Process custom protocols
    if (plugin?.settings?.customProtocols) {
      plugin.settings.customProtocols.forEach((customProtocol: CustomProtocolConfig) => {
        const count = protocolCounts.get(customProtocol.id) || 0;
        if (count > 0) {
          stats.push({
            protocol: customProtocol.id,
            label: customProtocol.name,
            count,
            percentage: totalSets > 0 ? (count / totalSets) * 100 : 0,
            color: this.hexToRgba(customProtocol.color, 0.7),
          });
        }
      });
    }

    // Sort by count descending
    return stats.sort((a, b) => b.count - a.count);
  }

  /**
   * Converts hex color to rgba
   * @param hex - Hex color string
   * @param alpha - Alpha value (0-1)
   * @returns RGBA color string
   */
  private static hexToRgba(hex: string, alpha: number): string {
    const cleanHex = hex.replace("#", "");
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  /**
   * Renders the pie chart with click handling for filtering
   * @param container - Container element for the chart
   * @param stats - Protocol statistics
   * @param activeFilter - Currently active filter (for visual highlighting)
   */
  private static renderPieChart(
    container: HTMLElement,
    stats: ProtocolStats[],
    activeFilter?: string | null
  ): void {
    const canvas = container.createEl("canvas", {
      cls: "workout-protocol-chart-canvas",
    });

    // Destroy existing chart if present
    if (this.chartInstance) {
      this.chartInstance.destroy();
      this.chartInstance = null;
    }

    // Adjust colors based on active filter (dim non-active slices)
    const backgroundColors = stats.map((s) => {
      if (activeFilter && s.protocol !== activeFilter) {
        // Dim non-active slices
        return s.color.replace("0.7", "0.3");
      }
      return s.color;
    });

    const borderColors = stats.map((s) => {
      if (activeFilter && s.protocol === activeFilter) {
        // Highlight active slice border
        return s.color.replace("0.7", "1");
      }
      return s.color.replace("0.7", "0.8");
    });

    const borderWidths = stats.map((s) => {
      return activeFilter && s.protocol === activeFilter ? 4 : 2;
    });

    const config: ChartConfiguration<"pie", number[], string> = {
      type: "pie",
      data: {
        labels: stats.map((s) => s.label),
        datasets: [
          {
            data: stats.map((s) => s.count),
            backgroundColor: backgroundColors,
            borderColor: borderColors,
            borderWidth: borderWidths,
            hoverOffset: 8,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            display: false, // We render our own legend
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const stat = stats[context.dataIndex];
                return `${stat.label}: ${stat.count} ${CONSTANTS.WORKOUT.LABELS.DASHBOARD.PROTOCOL_DISTRIBUTION.SETS_LABEL} (${stat.percentage.toFixed(1)}${CONSTANTS.WORKOUT.LABELS.DASHBOARD.PROTOCOL_DISTRIBUTION.PERCENT_LABEL})`;
              },
              afterLabel: () => {
                return CONSTANTS.WORKOUT.LABELS.DASHBOARD.PROTOCOL_DISTRIBUTION.CLICK_TO_FILTER;
              },
            },
          },
        },
        onClick: (_event, elements) => {
          if (elements.length > 0) {
            const index = elements[0].index;
            const clickedProtocol = stats[index].protocol;

            // Toggle filter: if clicking same protocol, clear filter
            if (activeFilter === clickedProtocol) {
              this.handleFilterChange(null);
            } else {
              this.handleFilterChange(clickedProtocol);
            }
          }
        },
        onHover: (event, elements) => {
          const canvas = event.native?.target as HTMLCanvasElement | undefined;
          if (canvas) {
            canvas.style.cursor = elements.length > 0 ? "pointer" : "default";
          }
        },
      },
    };

    this.chartInstance = new Chart(canvas, config);
  }

  /**
   * Handles filter change and triggers callback
   * @param protocol - Protocol to filter by, or null to clear
   */
  private static handleFilterChange(protocol: string | null): void {
    if (this.onFilterChange) {
      this.onFilterChange(protocol);
    }
  }

  /**
   * Renders the legend with counts and percentages (clickable for filtering)
   * @param container - Container element
   * @param stats - Protocol statistics
   * @param activeFilter - Currently active filter (for visual highlighting)
   */
  private static renderLegend(
    container: HTMLElement,
    stats: ProtocolStats[],
    activeFilter?: string | null
  ): void {
    const legendEl = container.createEl("div", {
      cls: "workout-protocol-legend",
    });

    stats.forEach((stat) => {
      const isActive = activeFilter === stat.protocol;
      const isDimmed = !!(activeFilter && !isActive);

      ChartLegendItem.create(legendEl, {
        color: stat.color,
        label: stat.label,
        value: `${stat.count} (${stat.percentage.toFixed(1)}%)`,
        className: "workout-protocol-legend-item",
        tooltip: CONSTANTS.WORKOUT.LABELS.DASHBOARD.PROTOCOL_DISTRIBUTION.CLICK_TO_FILTER,
        isActive,
        isDimmed,
        onClick: () => {
          // Toggle filter: if clicking same protocol, clear filter
          if (isActive) {
            this.handleFilterChange(null);
          } else {
            this.handleFilterChange(stat.protocol);
          }
        },
      });
    });
  }

  /**
   * Destroys the chart instance to prevent memory leaks
   */
  static cleanup(): void {
    if (this.chartInstance) {
      this.chartInstance.destroy();
      this.chartInstance = null;
    }
  }
}
