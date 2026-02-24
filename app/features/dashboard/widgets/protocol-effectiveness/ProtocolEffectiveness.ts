import { CONSTANTS } from "@app/constants";
import { WorkoutLogData, WorkoutProtocol, CustomProtocolConfig } from "@app/types/WorkoutLogData";
import { EmbeddedDashboardParams } from "@app/features/dashboard/types";
import { ProtocolBadge } from "@app/components/atoms";
import type WorkoutChartsPlugin from "main";
import { WidgetContainer } from "@app/features/dashboard/ui/WidgetContainer";
import { t } from "@app/i18n";

/**
 * Minimum number of entries required to show statistics for a protocol.
 * Ensures statistical relevance of the displayed data.
 */
const MIN_ENTRIES_FOR_STATS = 5;

/**
 * Protocol effectiveness statistics
 */
interface ProtocolEffectivenessStats {
  protocol: string;
  label: string;
  color: string;
  entryCount: number;
  avgVolumeChange: number; // Percentage change in volume
  progressionRate: number; // Percentage of sets with increased weight over time
}

/**
 * Protocol display configuration matching ProtocolDistribution
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
 * Widget for displaying protocol effectiveness analysis in the dashboard.
 * Shows volume changes and progression rates correlated with different protocols.
 */
export class ProtocolEffectiveness {
  /**
   * Renders the protocol effectiveness widget
   * @param container - The container element to render in
   * @param data - Workout log data
   * @param _params - Dashboard parameters (unused but kept for consistency)
   * @param plugin - Plugin instance for accessing custom protocols
   */
  static render(
    container: HTMLElement,
    data: WorkoutLogData[],
    _params: EmbeddedDashboardParams,
    plugin?: WorkoutChartsPlugin
  ): void {
    const widgetEl = WidgetContainer.create(container, {
      title: t("dashboard.title"),
      className: "workout-protocol-effectiveness",
      isWide: true,
    });

    // Calculate effectiveness statistics
    const stats = this.calculateEffectivenessStats(data, plugin);

    // Check if there's enough data
    if (stats.length === 0) {
      widgetEl.createEl("div", {
        text: t("dashboard.noData"),
        cls: "workout-protocol-effectiveness-no-data",
      });
      return;
    }

    // Render stats table
    this.renderStatsTable(widgetEl, stats);

    // Render disclaimer
    widgetEl.createEl("div", {
      text: t("dashboard.disclaimer"),
      cls: "workout-protocol-effectiveness-disclaimer",
    });
  }

  /**
   * Calculates effectiveness statistics for each protocol
   * @param data - Workout log data
   * @param plugin - Plugin instance for custom protocols
   * @returns Array of protocol effectiveness statistics
   */
  private static calculateEffectivenessStats(
    data: WorkoutLogData[],
    plugin?: WorkoutChartsPlugin
  ): ProtocolEffectivenessStats[] {
    // Group entries by protocol
    const protocolGroups = new Map<string, WorkoutLogData[]>();

    data.forEach((entry) => {
      const protocol = entry.protocol || WorkoutProtocol.STANDARD;
      const group = protocolGroups.get(protocol) || [];
      group.push(entry);
      protocolGroups.set(protocol, group);
    });

    const stats: ProtocolEffectivenessStats[] = [];

    // Process each protocol group
    protocolGroups.forEach((entries, protocol) => {
      // Skip protocols with insufficient data
      if (entries.length < MIN_ENTRIES_FOR_STATS) {
        return;
      }

      // Get protocol display config
      const config = this.getProtocolConfig(protocol, plugin);
      if (!config) {
        return;
      }

      // Calculate average volume change and progression rate
      const { avgVolumeChange, progressionRate } = this.calculateProgressionMetrics(entries, data);

      stats.push({
        protocol,
        label: config.label,
        color: config.color,
        entryCount: entries.length,
        avgVolumeChange,
        progressionRate,
      });
    });

    // Sort by progression rate descending
    return stats.sort((a, b) => b.progressionRate - a.progressionRate);
  }

  /**
   * Gets protocol display configuration
   * @param protocol - Protocol identifier
   * @param plugin - Plugin instance for custom protocols
   * @returns Protocol config or null if not found
   */
  private static getProtocolConfig(
    protocol: string,
    plugin?: WorkoutChartsPlugin
  ): { label: string; color: string } | null {
    // Check built-in protocols
    if (PROTOCOL_CONFIG[protocol]) {
      return PROTOCOL_CONFIG[protocol];
    }

    // Check custom protocols
    if (plugin?.settings?.customProtocols) {
      const customProtocol = plugin.settings.customProtocols.find(
        (p: CustomProtocolConfig) => p.id === protocol
      );
      if (customProtocol) {
        return {
          label: customProtocol.name,
          color: this.hexToRgba(customProtocol.color, 0.7),
        };
      }
    }

    return null;
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
   * Calculates progression metrics for a set of entries
   * Compares volume before and after using a protocol for each exercise
   * @param protocolEntries - Entries for a specific protocol
   * @param allData - All workout data for comparison
   * @returns Volume change percentage and progression rate
   */
  private static calculateProgressionMetrics(
    protocolEntries: WorkoutLogData[],
    allData: WorkoutLogData[]
  ): { avgVolumeChange: number; progressionRate: number } {
    // Group entries by exercise
    const exerciseGroups = new Map<string, WorkoutLogData[]>();
    protocolEntries.forEach((entry) => {
      const group = exerciseGroups.get(entry.exercise) || [];
      group.push(entry);
      exerciseGroups.set(entry.exercise, group);
    });

    let totalVolumeChange = 0;
    let volumeChangeCount = 0;
    let progressionCount = 0;
    let comparisonCount = 0;

    // For each exercise, compare protocol entries with surrounding entries
    exerciseGroups.forEach((entries, exercise) => {
      // Get all entries for this exercise, sorted by timestamp
      const allExerciseEntries = allData
        .filter((e) => e.exercise === exercise)
        .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

      if (allExerciseEntries.length < 2) {
        return;
      }

      // For each protocol entry, find entries before and after
      entries.forEach((protocolEntry) => {
        const protocolTimestamp = protocolEntry.timestamp || 0;
        const protocolIndex = allExerciseEntries.findIndex(
          (e) => e.timestamp === protocolTimestamp
        );

        if (protocolIndex === -1) {
          return;
        }

        // Get average volume of entries before this one (up to 3 previous)
        const beforeEntries = allExerciseEntries.slice(
          Math.max(0, protocolIndex - 3),
          protocolIndex
        );

        // Get average volume of entries after this one (up to 3 next)
        const afterEntries = allExerciseEntries.slice(
          protocolIndex + 1,
          Math.min(allExerciseEntries.length, protocolIndex + 4)
        );

        if (beforeEntries.length > 0 && afterEntries.length > 0) {
          const avgVolumeBefore = this.calculateAverageVolume(beforeEntries);
          const avgVolumeAfter = this.calculateAverageVolume(afterEntries);

          if (avgVolumeBefore > 0) {
            const volumeChange = ((avgVolumeAfter - avgVolumeBefore) / avgVolumeBefore) * 100;
            totalVolumeChange += volumeChange;
            volumeChangeCount++;
          }
        }

        // Check for weight progression (next entry at same or higher weight)
        if (protocolIndex < allExerciseEntries.length - 1) {
          const nextEntry = allExerciseEntries[protocolIndex + 1];
          comparisonCount++;
          if (nextEntry.weight >= protocolEntry.weight) {
            progressionCount++;
          }
        }
      });
    });

    const avgVolumeChange = volumeChangeCount > 0 ? totalVolumeChange / volumeChangeCount : 0;
    const progressionRate = comparisonCount > 0 ? (progressionCount / comparisonCount) * 100 : 0;

    return { avgVolumeChange, progressionRate };
  }

  /**
   * Calculates average volume from entries
   * @param entries - Workout entries
   * @returns Average volume
   */
  private static calculateAverageVolume(entries: WorkoutLogData[]): number {
    if (entries.length === 0) return 0;
    const totalVolume = entries.reduce((sum, e) => sum + (e.volume || 0), 0);
    return totalVolume / entries.length;
  }

  /**
   * Renders the statistics table
   * @param container - Container element
   * @param stats - Protocol effectiveness statistics
   */
  private static renderStatsTable(
    container: HTMLElement,
    stats: ProtocolEffectivenessStats[]
  ): void {
    const tableContainer = container.createEl("div", {
      cls: "workout-protocol-effectiveness-table-container",
    });

    const table = tableContainer.createEl("table", {
      cls: "workout-protocol-effectiveness-table",
    });

    // Header
    const thead = table.createEl("thead");
    const headerRow = thead.createEl("tr");

    headerRow.createEl("th", {
      text: t("dashboard.columnProtocol"),
    });
    headerRow.createEl("th", {
      text: t("dashboard.columnEntries"),
    });
    headerRow.createEl("th", {
      text: t("dashboard.columnVolumeChange"),
    });
    headerRow.createEl("th", {
      text: t("dashboard.columnProgression"),
    });

    // Body
    const tbody = table.createEl("tbody");

    stats.forEach((stat) => {
      const row = tbody.createEl("tr");

      // Protocol badge
      const protocolCell = row.createEl("td", {
        cls: "workout-protocol-effectiveness-protocol-cell",
      });
      ProtocolBadge.create(protocolCell, {
        text: stat.label,
        className: "workout-protocol-effectiveness-badge",
        color: stat.color,
      });

      // Entry count
      row.createEl("td", {
        text: stat.entryCount.toString(),
        cls: "workout-protocol-effectiveness-entries-cell",
      });

      // Volume change with indicator
      const volumeCell = row.createEl("td", {
        cls: "workout-protocol-effectiveness-volume-cell",
      });
      const volumeSign = stat.avgVolumeChange >= 0 ? "+" : "";
      const volumeClass = stat.avgVolumeChange > 0
        ? "workout-protocol-effectiveness-positive"
        : stat.avgVolumeChange < 0
        ? "workout-protocol-effectiveness-negative"
        : "workout-protocol-effectiveness-neutral";
      volumeCell.createEl("span", {
        text: `${volumeSign}${stat.avgVolumeChange.toFixed(1)}%`,
        cls: volumeClass,
      });

      // Progression rate with indicator
      const progressionCell = row.createEl("td", {
        cls: "workout-protocol-effectiveness-progression-cell",
      });
      const progressionClass = stat.progressionRate >= 70
        ? "workout-protocol-effectiveness-positive"
        : stat.progressionRate >= 50
        ? "workout-protocol-effectiveness-neutral"
        : "workout-protocol-effectiveness-negative";
      progressionCell.createEl("span", {
        text: `${stat.progressionRate.toFixed(1)}%`,
        cls: progressionClass,
      });
    });
  }
}
