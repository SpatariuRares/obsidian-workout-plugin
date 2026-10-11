import type { WorkoutLogData } from "@app/types/WorkoutLogData";
import { EmbeddedDashboardParams } from "@app/features/dashboard/types";
import { ProtocolBadge } from "@app/components/atoms";
import type { SettingsPort } from "@app/types/PluginPorts";
import { WidgetContainer } from "@app/features/dashboard/ui/WidgetContainer";
import { t } from "@app/i18n";
import {
  ProtocolCatalog,
  protocolId,
} from "@app/services/protocols/ProtocolCatalog";

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
    plugin?: SettingsPort,
  ): void {
    const widgetEl = WidgetContainer.create(container, {
      title: t("dashboard.protocolEffectiveness.title"),
      // Uses all history (it compares before and after); the distribution
      // next to it covers only the last 30 days
      subtitle: t("dashboard.protocolEffectiveness.subtitle"),
      className: "workout-protocol-effectiveness",
      isWide: true,
    });

    // Calculate effectiveness statistics
    const stats = this.calculateEffectivenessStats(data, plugin);

    // Check if there's enough data
    if (stats.length === 0) {
      widgetEl.createEl("div", {
        text: t("dashboard.protocolEffectiveness.noData"),
        cls: "workout-protocol-effectiveness-no-data",
      });
      return;
    }

    // Render stats table
    this.renderStatsTable(widgetEl, stats);

    // Render disclaimer
    widgetEl.createEl("div", {
      text: t("dashboard.protocolEffectiveness.disclaimer"),
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
    plugin?: SettingsPort,
  ): ProtocolEffectivenessStats[] {
    const catalog = new ProtocolCatalog(plugin?.settings?.customProtocols);

    // Group entries by protocol
    const protocolGroups = new Map<string, WorkoutLogData[]>();

    data.forEach((entry) => {
      const protocol = protocolId(entry.protocol);
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

      const info = catalog.resolve(protocol);

      // Calculate average volume change and progression rate
      const { avgVolumeChange, progressionRate } =
        this.calculateProgressionMetrics(entries, data);

      stats.push({
        protocol,
        label: info.name,
        color: info.color,
        entryCount: entries.length,
        avgVolumeChange,
        progressionRate,
      });
    });

    // Sort by progression rate descending
    return stats.sort(
      (a, b) => b.progressionRate - a.progressionRate,
    );
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
    allData: WorkoutLogData[],
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
          (e) => e.timestamp === protocolTimestamp,
        );

        if (protocolIndex === -1) {
          return;
        }

        // Get average volume of entries before this one (up to 3 previous)
        const beforeEntries = allExerciseEntries.slice(
          Math.max(0, protocolIndex - 3),
          protocolIndex,
        );

        // Get average volume of entries after this one (up to 3 next)
        const afterEntries = allExerciseEntries.slice(
          protocolIndex + 1,
          Math.min(allExerciseEntries.length, protocolIndex + 4),
        );

        if (beforeEntries.length > 0 && afterEntries.length > 0) {
          const avgVolumeBefore =
            this.calculateAverageVolume(beforeEntries);
          const avgVolumeAfter =
            this.calculateAverageVolume(afterEntries);

          if (avgVolumeBefore > 0) {
            const volumeChange =
              ((avgVolumeAfter - avgVolumeBefore) / avgVolumeBefore) *
              100;
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

    const avgVolumeChange =
      volumeChangeCount > 0
        ? totalVolumeChange / volumeChangeCount
        : 0;
    const progressionRate =
      comparisonCount > 0
        ? (progressionCount / comparisonCount) * 100
        : 0;

    return { avgVolumeChange, progressionRate };
  }

  /**
   * Calculates average volume from entries
   * @param entries - Workout entries
   * @returns Average volume
   */
  private static calculateAverageVolume(
    entries: WorkoutLogData[],
  ): number {
    if (entries.length === 0) return 0;
    const totalVolume = entries.reduce(
      (sum, e) => sum + (e.volume || 0),
      0,
    );
    return totalVolume / entries.length;
  }

  /**
   * Renders the statistics table
   * @param container - Container element
   * @param stats - Protocol effectiveness statistics
   */
  private static renderStatsTable(
    container: HTMLElement,
    stats: ProtocolEffectivenessStats[],
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
      text: t("dashboard.protocolEffectiveness.columnProtocol"),
    });
    headerRow.createEl("th", {
      text: t("dashboard.protocolEffectiveness.columnEntries"),
    });
    headerRow.createEl("th", {
      text: t("dashboard.protocolEffectiveness.columnVolumeChange"),
    });
    headerRow.createEl("th", {
      text: t("dashboard.protocolEffectiveness.columnProgression"),
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
      const volumeClass =
        stat.avgVolumeChange > 0
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
      const progressionClass =
        stat.progressionRate >= 70
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
