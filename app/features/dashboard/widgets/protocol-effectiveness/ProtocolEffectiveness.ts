import type { WorkoutLogData } from "@app/types/WorkoutLogData";
import { dashboardBlock } from "@app/features/dashboard/dashboardBlock";
import { EmbeddedDashboardParams } from "@app/features/dashboard/types";
import { Feedback, ProtocolBadge } from "@app/components/atoms";
import { CardTable } from "@app/components/molecules";
import type { SettingsPort } from "@app/types/PluginPorts";
import { WidgetContainer } from "@app/features/dashboard/ui/WidgetContainer";
import { t } from "@app/i18n";
import {
  ProtocolCatalog,
  groupByProtocol,
} from "@app/services/protocols/ProtocolCatalog";
import { TrainingHistory } from "@app/services/history/TrainingHistory";
import { StringUtils } from "@app/utils/StringUtils";
import { FormatUtils } from "@app/utils/FormatUtils";

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
   * @param params - `protocolMinEntries`: sets a protocol needs to be compared
   * @param plugin - Plugin instance for accessing custom protocols
   */
  static render(
    container: HTMLElement,
    data: WorkoutLogData[],
    params: EmbeddedDashboardParams,
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
    const stats = this.calculateEffectivenessStats(
      data,
      plugin,
      params.protocolMinEntries ?? dashboardBlock.defaults.protocolMinEntries,
      params.protocolSortBy ?? dashboardBlock.defaults.protocolSortBy,
    );

    // Check if there's enough data
    if (stats.length === 0) {
      Feedback.renderEmpty(
        widgetEl,
        t("dashboard.protocolEffectiveness.noData"),
        { append: true },
      );
      return;
    }

    // Render stats table
    this.renderStatsTable(widgetEl, stats);

    // Render disclaimer
    widgetEl.createDiv({
      text: t("dashboard.protocolEffectiveness.disclaimer"),
      cls: "workout-protocol-effectiveness-disclaimer",
    });
  }

  /**
   * Calculates effectiveness statistics for each protocol
   * @param data - Workout log data
   * @param plugin - Plugin instance for custom protocols
   * @param minEntries - Sets a protocol needs to be compared
   * @param sortBy - The figure the table is ordered by, descending
   * @returns Array of protocol effectiveness statistics
   */
  private static calculateEffectivenessStats(
    data: WorkoutLogData[],
    plugin: SettingsPort | undefined,
    minEntries: number,
    sortBy: "progressionRate" | "avgVolumeChange" | "entryCount",
  ): ProtocolEffectivenessStats[] {
    const catalog = new ProtocolCatalog(plugin?.settings?.customProtocols);
    const history = new TrainingHistory(data);

    const protocolGroups = groupByProtocol(data);

    const stats: ProtocolEffectivenessStats[] = [];

    // Process each protocol group
    protocolGroups.forEach((entries, protocol) => {
      // Skip protocols with insufficient data
      if (entries.length < minEntries) {
        return;
      }

      const info = catalog.resolve(protocol);

      // Calculate average volume change and progression rate
      const { avgVolumeChange, progressionRate } =
        this.calculateProgressionMetrics(entries, history);

      stats.push({
        protocol,
        label: info.name,
        color: info.color,
        entryCount: entries.length,
        avgVolumeChange,
        progressionRate,
      });
    });

    // Best first, by the column the block asks for
    return stats.sort((a, b) => b[sortBy] - a[sortBy]);
  }

  /**
   * Calculates progression metrics for a set of entries: for each protocol
   * set, the average volume of up to 3 sets of the exercise before and after
   * it, and whether the next set is at the same or a higher weight. Sets are
   * in TrainingHistory's set order (training day, then timestamp), exercise
   * names matched ignoring case and spacing.
   * @param protocolEntries - Entries for a specific protocol
   * @param history - All logged sets
   * @returns Volume change percentage and progression rate
   */
  private static calculateProgressionMetrics(
    protocolEntries: WorkoutLogData[],
    history: TrainingHistory,
  ): { avgVolumeChange: number; progressionRate: number } {
    const setsByExercise = new Map<string, WorkoutLogData[]>();
    const setsOf = (exercise: string): WorkoutLogData[] => {
      const key = StringUtils.normalize(exercise);
      let sets = setsByExercise.get(key);
      if (!sets) {
        sets = history.setsOf(exercise);
        setsByExercise.set(key, sets);
      }
      return sets;
    };

    let totalVolumeChange = 0;
    let volumeChangeCount = 0;
    let progressionCount = 0;
    let comparisonCount = 0;

    protocolEntries.forEach((protocolEntry) => {
      const sets = setsOf(protocolEntry.exercise);
      const index = sets.indexOf(protocolEntry);
      if (index === -1) return;

      const before = sets.slice(Math.max(0, index - 3), index);
      const after = sets.slice(index + 1, index + 4);

      if (before.length > 0 && after.length > 0) {
        const avgVolumeBefore = this.averageVolume(before);
        const avgVolumeAfter = this.averageVolume(after);
        if (avgVolumeBefore > 0) {
          totalVolumeChange +=
            ((avgVolumeAfter - avgVolumeBefore) / avgVolumeBefore) * 100;
          volumeChangeCount++;
        }
      }

      // Weight progression: next set at the same or a higher weight
      const next = sets[index + 1];
      if (next) {
        comparisonCount++;
        if (next.weight >= protocolEntry.weight) {
          progressionCount++;
        }
      }
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

  /** Average volume of some sets (never empty) */
  private static averageVolume(sets: WorkoutLogData[]): number {
    return new TrainingHistory(sets).totalVolume() / sets.length;
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
    CardTable.create(container, {
      className: "workout-protocol-effectiveness-table",
      rows: stats,
      columns: [
        {
          label: t("dashboard.protocolEffectiveness.columnProtocol"),
          className: "workout-protocol-effectiveness-protocol-cell",
          render: (cell, stat) =>
            ProtocolBadge.create(cell, {
              text: stat.label,
              className:
                "workout-protocol-badge workout-protocol-effectiveness-badge",
              color: stat.color,
            }),
        },
        {
          label: t("dashboard.protocolEffectiveness.columnEntries"),
          className: "workout-protocol-effectiveness-entries-cell",
          render: (cell, stat) => cell.setText(stat.entryCount.toString()),
        },
        {
          label: t("dashboard.protocolEffectiveness.columnVolumeChange"),
          className: "workout-protocol-effectiveness-volume-cell",
          render: (cell, stat) => {
            cell.createSpan({
              text: FormatUtils.formatSignedPercent(stat.avgVolumeChange, 1),
              cls:
                stat.avgVolumeChange > 0
                  ? "workout-protocol-effectiveness-positive"
                  : stat.avgVolumeChange < 0
                    ? "workout-protocol-effectiveness-negative"
                    : "workout-protocol-effectiveness-neutral",
            });
          },
        },
        {
          label: t("dashboard.protocolEffectiveness.columnProgression"),
          className: "workout-protocol-effectiveness-progression-cell",
          render: (cell, stat) =>
            cell.createSpan({
              text: `${stat.progressionRate.toFixed(1)}%`,
              cls:
                stat.progressionRate >= 70
                  ? "workout-protocol-effectiveness-positive"
                  : stat.progressionRate >= 50
                    ? "workout-protocol-effectiveness-neutral"
                    : "workout-protocol-effectiveness-negative",
            }),
        },
      ],
    });
  }
}
