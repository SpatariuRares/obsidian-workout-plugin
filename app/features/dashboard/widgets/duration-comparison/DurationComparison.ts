import { WorkoutLogData } from "@app/types/WorkoutLogData";
import { EmbeddedDashboardParams } from "@app/features/dashboard/types";
import { WidgetContainer } from "@app/features/dashboard/ui/WidgetContainer";
import { t } from "@app/i18n";
import { TrainingHistory } from "@app/services/history/TrainingHistory";
import { Icon } from "@app/components/atoms";
import { ICONS } from "@app/constants/ui.constants";

/**
 * Number of recent workouts to display in the comparison
 */
const RECENT_WORKOUT_COUNT = 5;

/** Default rest duration between sets in seconds */
const DEFAULT_REST_BETWEEN_SETS_SECONDS = 90;

/** Threshold (% points) below which variance trend is considered improving */
const VARIANCE_IMPROVEMENT_THRESHOLD = 5;

/** Threshold (% points) above which variance trend is considered declining */
const VARIANCE_DECLINE_THRESHOLD = 5;

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
  /** First timestamp in the session */
  startTimestamp: number;
  /** Last timestamp in the session */
  endTimestamp: number;
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
  /** Change in variance over time (negative = improving) */
  varianceChange: number;
}

/**
 * Widget for displaying actual vs estimated workout duration comparison.
 * Calculates actual duration from first to last log timestamp per workout session.
 */
export class DurationComparison {
  /**
   * Renders the duration comparison widget
   * @param container - The container element to render in
   * @param data - Workout log data
   * @param _params - Dashboard parameters (unused but kept for consistency)
   * @param estimate - `setDuration`: seconds per set, from settings
   */
  static render(
    container: HTMLElement,
    data: WorkoutLogData[],
    _params: EmbeddedDashboardParams,
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
    );

    // Check if there's enough data
    if (sessions.length === 0) {
      widgetEl.createDiv({
        text: t("dashboard.durationComparison.noData"),
        cls: "workout-duration-comparison-no-data",
      });
      return;
    }

    // Render comparison table
    this.renderComparisonTable(widgetEl, sessions);

    // Calculate and render variance trend
    if (sessions.length >= 2) {
      const trend = this.calculateVarianceTrend(sessions);
      this.renderVarianceTrend(widgetEl, trend);
    }
  }

  /**
   * Named sessions with a plausible duration, compared with their estimate
   * @param data - Workout log data
   * @param setDuration - Estimated seconds per set
   * @returns Array of workout sessions with duration data
   */
  private static calculateWorkoutSessions(
    data: WorkoutLogData[],
    setDuration: number,
  ): WorkoutSession[] {
    const sessions: WorkoutSession[] = [];

    new TrainingHistory(data).sessions().forEach((session) => {
      if (!session.workout || session.duration === undefined) {
        return;
      }

      const actualDuration = session.duration;

      // Calculate estimated duration
      // Estimate: setCount * setDuration + (setCount - 1) * 90 seconds rest between sets
      const setCount = session.sets.length;
      const estimatedDuration =
        setCount * setDuration +
        Math.max(0, setCount - 1) * DEFAULT_REST_BETWEEN_SETS_SECONDS;

      // Calculate variance percentage
      const variancePercent =
        estimatedDuration > 0
          ? ((actualDuration - estimatedDuration) /
              estimatedDuration) *
            100
          : 0;

      sessions.push({
        workout: session.workout,
        date: session.day,
        actualDuration,
        estimatedDuration,
        variancePercent,
        startTimestamp: session.start ?? 0,
        endTimestamp: session.end ?? 0,
        setCount,
      });
    });

    // Sort by start timestamp descending (most recent first) and take top N
    return sessions
      .sort((a, b) => b.startTimestamp - a.startTimestamp)
      .slice(0, RECENT_WORKOUT_COUNT);
  }

  /**
   * Calculates the variance trend over recent workouts
   * @param sessions - Array of workout sessions (most recent first)
   * @returns Variance trend data
   */
  private static calculateVarianceTrend(
    sessions: WorkoutSession[],
  ): VarianceTrend {
    if (sessions.length < 2) {
      return {
        direction: "stable",
        averageVariance: 0,
        varianceChange: 0,
      };
    }

    // Calculate average absolute variance
    const totalVariance = sessions.reduce(
      (sum, s) => sum + Math.abs(s.variancePercent),
      0,
    );
    const averageVariance = totalVariance / sessions.length;

    // Calculate variance change (compare older half vs newer half)
    // Sessions are ordered most recent first
    const midpoint = Math.floor(sessions.length / 2);
    const recentSessions = sessions.slice(0, midpoint);
    const olderSessions = sessions.slice(midpoint);

    const recentAvg =
      recentSessions.reduce(
        (sum, s) => sum + Math.abs(s.variancePercent),
        0,
      ) / recentSessions.length;
    const olderAvg =
      olderSessions.reduce(
        (sum, s) => sum + Math.abs(s.variancePercent),
        0,
      ) / olderSessions.length;

    // Positive change means variance increased (getting worse)
    // Negative change means variance decreased (getting better)
    const varianceChange = recentAvg - olderAvg;

    let direction: "improving" | "declining" | "stable";
    if (varianceChange < -VARIANCE_IMPROVEMENT_THRESHOLD) {
      direction = "improving";
    } else if (varianceChange > VARIANCE_DECLINE_THRESHOLD) {
      direction = "declining";
    } else {
      direction = "stable";
    }

    return {
      direction,
      averageVariance,
      varianceChange,
    };
  }

  /**
   * Formats duration in seconds to a human-readable string
   * @param seconds - Duration in seconds
   * @returns Formatted string (e.g., "45m" or "1h 15m")
   */
  private static formatDuration(seconds: number): string {
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) {
      return `${minutes}${t("dashboard.durationComparison.minutesSuffix")}`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    const hoursText = `${hours}${t("dashboard.durationComparison.hoursSuffix")}`;
    if (remainingMinutes === 0) {
      return hoursText;
    }
    // minutesSuffix carries its own leading space (" min")
    return `${hoursText} ${remainingMinutes}${t("dashboard.durationComparison.minutesSuffix")}`;
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
    const tableContainer = container.createDiv({
      cls: "workout-duration-comparison-table-container",
    });

    const table = tableContainer.createEl("table", {
      // On phones each row becomes a card (CSS reads each cell's data-label)
      cls: "workout-duration-comparison-table workout-card-table",
    });

    // Header
    const thead = table.createEl("thead");
    const headerRow = thead.createEl("tr");

    headerRow.createEl("th", {
      text: t("dashboard.durationComparison.columnWorkout"),
    });
    headerRow.createEl("th", {
      text: t("dashboard.durationComparison.columnEstimated"),
    });
    headerRow.createEl("th", {
      text: t("dashboard.durationComparison.columnActual"),
    });
    headerRow.createEl("th", {
      text: t("dashboard.durationComparison.columnVariance"),
    });

    // Body
    const tbody = table.createEl("tbody");

    sessions.forEach((session) => {
      const row = tbody.createEl("tr");

      // Workout name and date
      const workoutCell = row.createEl("td", {
        cls: "workout-duration-comparison-workout-cell",
      });
      workoutCell.createDiv({
        text: session.workout,
        cls: "workout-duration-comparison-workout-name",
      });
      workoutCell.createDiv({
        text: session.date,
        cls: "workout-duration-comparison-workout-date",
      });

      // Estimated duration
      row.createEl("td", {
        text: this.formatDuration(session.estimatedDuration),
        cls: "workout-duration-comparison-duration-cell",
        attr: { "data-label": t("dashboard.durationComparison.columnEstimated") },
      });

      // Actual duration
      row.createEl("td", {
        text: this.formatDuration(session.actualDuration),
        cls: "workout-duration-comparison-duration-cell",
        attr: { "data-label": t("dashboard.durationComparison.columnActual") },
      });

      // Variance
      const varianceCell = row.createEl("td", {
        cls: "workout-duration-comparison-variance-cell",
        attr: { "data-label": t("dashboard.durationComparison.columnVariance") },
      });

      const varianceSign = session.variancePercent >= 0 ? "+" : "";
      const varianceClass =
        Math.abs(session.variancePercent) <= 10
          ? "workout-duration-comparison-variance-good"
          : Math.abs(session.variancePercent) <= 25
            ? "workout-duration-comparison-variance-moderate"
            : "workout-duration-comparison-variance-poor";

      varianceCell.createSpan({
        text: `${varianceSign}${session.variancePercent.toFixed(0)}%`,
        cls: varianceClass,
      });
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
