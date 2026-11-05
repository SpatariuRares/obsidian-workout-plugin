import { WorkoutLogData } from "@app/types/WorkoutLogData";
import { dashboardBlock } from "@app/features/dashboard/dashboardBlock";
import { EmbeddedDashboardParams } from "@app/features/dashboard/types";
import { WidgetContainer } from "@app/features/dashboard/ui/WidgetContainer";
import { t } from "@app/i18n";
import { TrainingHistory, trendOf, type Trend } from "@app/services/history/TrainingHistory";
import { Feedback, Icon } from "@app/components/atoms";
import { CardTable } from "@app/components/molecules";
import { ICONS } from "@app/constants/ui.constants";
import { FormatUtils } from "@app/utils/FormatUtils";

/**
 * Represents a workout session with duration data
 */
interface WorkoutSession {
  /** Workout name or identifier */
  workout: string;
  /** Date of the workout */
  date: string;
  /** Actual duration calculated from first to last timestamp (in seconds) */
  actualDuration: number;
  /** Estimated duration based on set count and rest periods (in seconds) */
  estimatedDuration: number;
  /** Variance percentage: ((actual - estimated) / estimated) * 100 */
  variancePercent: number;
  /** Number of sets in the session */
  setCount: number;
}

/**
 * Variance trend data
 */
interface VarianceTrend {
  /** Trend direction: 'improving', 'declining', or 'stable' */
  direction: "improving" | "declining" | "stable";
  /** Average absolute variance (percentage) */
  averageVariance: number;
  /** Change of the variance line from the oldest to the newest session (negative = improving) */
  varianceChange: number;
}

/** Less variance is better: a falling line is improving */
const VARIANCE_DIRECTION: Record<Trend["direction"], VarianceTrend["direction"]> = {
  down: "improving",
  up: "declining",
  stable: "stable",
};

/**
 * Widget for displaying actual vs estimated workout duration comparison.
 * Calculates actual duration from first to last log timestamp per workout session.
 */
export class DurationComparison {
  /**
   * Renders the duration comparison widget
   * @param container - The container element to render in
   * @param data - Workout log data
   * @param params - `durationRecentCount` workouts compared, with
   * `durationRestSeconds` of rest between sets in the estimate
   * @param estimate - `setDuration`: seconds per set, from settings
   */
  static render(
    container: HTMLElement,
    data: WorkoutLogData[],
    params: EmbeddedDashboardParams,
    estimate: { setDuration: number },
  ): void {
    const widgetEl = WidgetContainer.create(container, {
      title: t("dashboard.durationComparison.title"),
      subtitle: t("dashboard.durationComparison.subtitle"),
      className: "workout-duration-comparison",
      isWide: true,
    });

    // Calculate workout sessions with duration data
    const sessions = this.calculateWorkoutSessions(
      data,
      estimate.setDuration,
      params.durationRestSeconds ?? dashboardBlock.defaults.durationRestSeconds,
      params.durationRecentCount ?? dashboardBlock.defaults.durationRecentCount,
    );

    // Check if there's enough data
    if (sessions.length === 0) {
      Feedback.renderEmpty(widgetEl, t("dashboard.durationComparison.noData"), {
        append: true,
      });
      return;
    }

    // Render comparison table
    this.renderComparisonTable(widgetEl, sessions);

    // Calculate and render variance trend
    if (sessions.length >= 2 && (params.durationShowTrend ?? dashboardBlock.defaults.durationShowTrend)) {
      const trend = this.calculateVarianceTrend(sessions);
      this.renderVarianceTrend(widgetEl, trend);
    }
  }

  /**
   * Named sessions with a plausible duration, compared with their estimate
   * @param data - Workout log data
   * @param setDuration - Estimated seconds per set
   * @param restSeconds - Estimated rest between two sets
   * @param recentCount - How many of the latest workouts to keep
   * @returns Array of workout sessions with duration data
   */
  private static calculateWorkoutSessions(
    data: WorkoutLogData[],
    setDuration: number,
    restSeconds: number,
    recentCount: number,
  ): WorkoutSession[] {
    return new TrainingHistory(data)
      .latestSessions(
        recentCount,
        (session) => !!session.workout && session.duration !== undefined,
      )
      .map((session) => {
        const actualDuration = session.duration ?? 0;
        // Estimate: setCount * setDuration + (setCount - 1) * rest between sets
        const setCount = session.sets.length;
        const estimatedDuration =
          setCount * setDuration + Math.max(0, setCount - 1) * restSeconds;
        const variancePercent =
          estimatedDuration > 0
            ? ((actualDuration - estimatedDuration) / estimatedDuration) * 100
            : 0;

        return {
          workout: session.workout ?? "",
          date: session.day,
          actualDuration,
          estimatedDuration,
          variancePercent,
          setCount,
        };
      });
  }

  /**
   * The trend of the sessions' absolute variance, read from its regression
   * line (see "Trend" in CONTEXT.md): a falling line is improving.
   * @param sessions - Array of workout sessions (most recent first)
   * @returns Variance trend data; stable with fewer than two sessions
   */
  private static calculateVarianceTrend(
    sessions: WorkoutSession[],
  ): VarianceTrend {
    const variances = sessions
      .map((s) => Math.abs(s.variancePercent))
      .reverse();
    const trend = trendOf(variances);
    if (!trend) {
      return { direction: "stable", averageVariance: 0, varianceChange: 0 };
    }

    const averageVariance =
      variances.reduce((sum, v) => sum + v, 0) / variances.length;
    return {
      direction: VARIANCE_DIRECTION[trend.direction],
      averageVariance,
      varianceChange: trend.end - trend.start,
    };
  }

  /**
   * Renders the comparison table
   * @param container - Container element
   * @param sessions - Workout sessions to display
   */
  private static renderComparisonTable(
    container: HTMLElement,
    sessions: WorkoutSession[],
  ): void {
    const minutes = (seconds: number) =>
      FormatUtils.formatDuration(seconds, { precision: "m" });
    CardTable.create(container, {
      className: "workout-duration-comparison-table",
      rows: sessions,
      columns: [
        {
          label: t("dashboard.durationComparison.columnWorkout"),
          className: "workout-duration-comparison-workout-cell",
          render: (cell, session) => {
            cell.createDiv({
              text: session.workout,
              cls: "workout-duration-comparison-workout-name",
            });
            cell.createDiv({
              text: session.date,
              cls: "workout-duration-comparison-workout-date",
            });
          },
        },
        {
          label: t("dashboard.durationComparison.columnEstimated"),
          className: "workout-duration-comparison-duration-cell",
          render: (cell, session) =>
            cell.setText(minutes(session.estimatedDuration)),
        },
        {
          label: t("dashboard.durationComparison.columnActual"),
          className: "workout-duration-comparison-duration-cell",
          render: (cell, session) =>
            cell.setText(minutes(session.actualDuration)),
        },
        {
          label: t("dashboard.durationComparison.columnVariance"),
          className: "workout-duration-comparison-variance-cell",
          render: (cell, session) => {
            const off = Math.abs(session.variancePercent);
            cell.createSpan({
              text: FormatUtils.formatSignedPercent(session.variancePercent, 0),
              cls:
                off <= 10
                  ? "workout-duration-comparison-variance-good"
                  : off <= 25
                    ? "workout-duration-comparison-variance-moderate"
                    : "workout-duration-comparison-variance-poor",
            });
          },
        },
      ],
    });
  }

  /**
   * Renders the variance trend indicator
   * @param container - Container element
   * @param trend - Variance trend data
   */
  private static renderVarianceTrend(
    container: HTMLElement,
    trend: VarianceTrend,
  ): void {
    const trendEl = container.createDiv({
      cls: "workout-duration-comparison-trend",
    });

    // Title
    trendEl.createDiv({
      text: t("dashboard.durationComparison.varianceTrendTitle"),
      cls: "workout-duration-comparison-trend-title",
    });

    // Trend message with icon
    const messageEl = trendEl.createDiv({
      cls: `workout-duration-comparison-trend-message workout-duration-comparison-trend-${trend.direction}`,
    });

    // Icon based on trend direction
    const icon =
      trend.direction === "improving"
        ? ICONS.TREND.UP
        : trend.direction === "declining"
          ? ICONS.TREND.DOWN
          : ICONS.TREND.FLAT;

    Icon.create(messageEl, {
      name: icon,
      className: "workout-duration-comparison-trend-icon",
    });

    const trendText =
      trend.direction === "improving"
        ? t("dashboard.durationComparison.varianceTrendImproving")
        : trend.direction === "declining"
          ? t("dashboard.durationComparison.varianceTrendDeclining")
          : t("dashboard.durationComparison.varianceTrendStable");

    messageEl.createSpan({
      text: trendText,
      cls: "workout-duration-comparison-trend-text",
    });

    // Average variance stat
    trendEl.createDiv({
      text: t("dashboard.durationComparison.avgVarianceStat", { value: trend.averageVariance.toFixed(0) }),
      cls: "workout-duration-comparison-trend-stat",
    });
  }
}
