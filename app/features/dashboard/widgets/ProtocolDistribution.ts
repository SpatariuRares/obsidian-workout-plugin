import { CONSTANTS } from "@app/constants/Constants";
import { WorkoutLogData, WorkoutProtocol, CustomProtocolConfig } from "@app/types/WorkoutLogData";
import { EmbeddedDashboardParams } from "@app/types";
import { DateUtils } from "@app/utils/DateUtils";
import { Chart, ChartConfiguration, ArcElement, PieController, Tooltip, Legend } from "chart.js";
import type WorkoutChartsPlugin from "main";

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
 */
export class ProtocolDistribution {
  private static chartInstance: PieChart | null = null;

  /**
   * Renders the protocol distribution widget
   * @param container - The container element to render in
   * @param data - Workout log data
   * @param params - Dashboard parameters
   * @param plugin - Plugin instance for accessing custom protocols
   */
  static render(
    container: HTMLElement,
    data: WorkoutLogData[],
    _params: EmbeddedDashboardParams,
    plugin?: WorkoutChartsPlugin
  ): void {
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

    // Check if there's any data
    if (stats.length === 0 || stats.every(s => s.count === 0)) {
      widgetEl.createEl("div", {
        text: CONSTANTS.WORKOUT.LABELS.DASHBOARD.PROTOCOL_DISTRIBUTION.NO_DATA,
        cls: "workout-protocol-no-data",
      });
      return;
    }

    // Create chart container
    const chartContainer = widgetEl.createEl("div", {
      cls: "workout-protocol-chart-container",
    });

    // Render pie chart
    this.renderPieChart(chartContainer, stats);

    // Render legend with counts and percentages
    this.renderLegend(widgetEl, stats);
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
   * Renders the pie chart
   * @param container - Container element for the chart
   * @param stats - Protocol statistics
   */
  private static renderPieChart(container: HTMLElement, stats: ProtocolStats[]): void {
    const canvas = container.createEl("canvas", {
      cls: "workout-protocol-chart-canvas",
    });

    // Destroy existing chart if present
    if (this.chartInstance) {
      this.chartInstance.destroy();
      this.chartInstance = null;
    }

    const config: ChartConfiguration<"pie", number[], string> = {
      type: "pie",
      data: {
        labels: stats.map((s) => s.label),
        datasets: [
          {
            data: stats.map((s) => s.count),
            backgroundColor: stats.map((s) => s.color),
            borderColor: stats.map((s) => s.color.replace("0.7", "1")),
            borderWidth: 2,
            // Add patterns for accessibility
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
            },
          },
        },
      },
    };

    this.chartInstance = new Chart(canvas, config);
  }

  /**
   * Renders the legend with counts and percentages
   * @param container - Container element
   * @param stats - Protocol statistics
   */
  private static renderLegend(container: HTMLElement, stats: ProtocolStats[]): void {
    const legendEl = container.createEl("div", {
      cls: "workout-protocol-legend",
    });

    stats.forEach((stat) => {
      const itemEl = legendEl.createEl("div", {
        cls: "workout-protocol-legend-item",
      });

      // Color indicator
      const colorEl = itemEl.createEl("span", {
        cls: "workout-protocol-legend-color",
      });
      colorEl.style.backgroundColor = stat.color;

      // Label
      itemEl.createEl("span", {
        text: stat.label,
        cls: "workout-protocol-legend-label",
      });

      // Count and percentage
      itemEl.createEl("span", {
        text: `${stat.count} (${stat.percentage.toFixed(1)}%)`,
        cls: "workout-protocol-legend-count",
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
