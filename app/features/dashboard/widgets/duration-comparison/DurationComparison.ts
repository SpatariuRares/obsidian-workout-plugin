import { CONSTANTS } from "@app/constants";
import { WorkoutLogData } from "@app/types/WorkoutLogData";
import { EmbeddedDashboardParams } from "@app/features/dashboard/types";
import { WidgetContainer } from "@app/features/dashboard/ui/WidgetContainer";

/**
 * Number of recent workouts to display in the comparison
 */
const RECENT_WORKOUT_COUNT = 5;

/**
 * Minimum number of entries needed to consider a workout session
 * (need at least 2 entries to calculate actual duration)
 */
const MIN_ENTRIES_FOR_SESSION = 2;

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
   */
  static render(
    container: HTMLElement,
    data: WorkoutLogData[],
    _params: EmbeddedDashboardParams
  ): void {
    const widgetEl = WidgetContainer.create(container, {
      title: CONSTANTS.WORKOUT.LABELS.DASHBOARD.DURATION_COMPARISON.TITLE,
      subtitle: CONSTANTS.WORKOUT.LABELS.DASHBOARD.DURATION_COMPARISON.SUBTITLE,
      className: "workout-duration-comparison",
      isWide: true,
    });

    // Calculate workout sessions with duration data
    const sessions = this.calculateWorkoutSessions(data);

    // Check if there's enough data
    if (sessions.length === 0) {
      widgetEl.createEl("div", {
        text: CONSTANTS.WORKOUT.LABELS.DASHBOARD.DURATION_COMPARISON.NO_DATA,
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
   * Calculates workout sessions from log data
   * Groups entries by workout name and date, then calculates durations
   * @param data - Workout log data
   * @returns Array of workout sessions with duration data
   */
  private static calculateWorkoutSessions(data: WorkoutLogData[]): WorkoutSession[] {
    // Group entries by workout and date
    const sessionGroups = new Map<string, WorkoutLogData[]>();

    data.forEach((entry) => {
      if (!entry.timestamp || !entry.workout) {
        return;
      }

      // Create a key combining workout name and date
      const sessionKey = `${entry.workout}|${entry.date}`;
      const group = sessionGroups.get(sessionKey) || [];
      group.push(entry);
      sessionGroups.set(sessionKey, group);
    });

    const sessions: WorkoutSession[] = [];

    sessionGroups.forEach((entries, key) => {
      // Need at least 2 entries to calculate actual duration
      if (entries.length < MIN_ENTRIES_FOR_SESSION) {
        return;
      }

      // Sort entries by timestamp
      const sortedEntries = entries.sort(
        (a, b) => (a.timestamp || 0) - (b.timestamp || 0)
      );

      const firstEntry = sortedEntries[0];
      const lastEntry = sortedEntries[sortedEntries.length - 1];

      const startTimestamp = firstEntry.timestamp || 0;
      const endTimestamp = lastEntry.timestamp || 0;

      // Calculate actual duration in seconds
      const actualDuration = Math.round((endTimestamp - startTimestamp) / 1000);

      // Skip if actual duration is 0 or negative (invalid data)
      if (actualDuration <= 0) {
        return;
      }

      // Calculate estimated duration
      // Estimate: setCount * 45 seconds per set + (setCount - 1) * 90 seconds rest between sets
      const setCount = entries.length;
      const setDuration = 45; // Default set duration in seconds
      const restDuration = 90; // Default rest between sets in seconds
      const estimatedDuration =
        setCount * setDuration + Math.max(0, setCount - 1) * restDuration;

      // Calculate variance percentage
      const variancePercent =
        estimatedDuration > 0
          ? ((actualDuration - estimatedDuration) / estimatedDuration) * 100
          : 0;

      const [workout, date] = key.split("|");

      sessions.push({
        workout,
        date,
        actualDuration,
        estimatedDuration,
        variancePercent,
        startTimestamp,
        endTimestamp,
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
  private static calculateVarianceTrend(sessions: WorkoutSession[]): VarianceTrend {
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
      0
    );
    const averageVariance = totalVariance / sessions.length;

    // Calculate variance change (compare older half vs newer half)
    // Sessions are ordered most recent first
    const midpoint = Math.floor(sessions.length / 2);
    const recentSessions = sessions.slice(0, midpoint);
    const olderSessions = sessions.slice(midpoint);

    const recentAvg =
      recentSessions.reduce((sum, s) => sum + Math.abs(s.variancePercent), 0) /
      recentSessions.length;
    const olderAvg =
      olderSessions.reduce((sum, s) => sum + Math.abs(s.variancePercent), 0) /
      olderSessions.length;

    // Positive change means variance increased (getting worse)
    // Negative change means variance decreased (getting better)
    const varianceChange = recentAvg - olderAvg;

    let direction: "improving" | "declining" | "stable";
    if (varianceChange < -5) {
      direction = "improving";
    } else if (varianceChange > 5) {
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
      return `${minutes}${CONSTANTS.WORKOUT.LABELS.DASHBOARD.DURATION_COMPARISON.MINUTES_SUFFIX}`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) {
      return `${hours}h`;
    }
    return `${hours}h ${remainingMinutes}${CONSTANTS.WORKOUT.LABELS.DASHBOARD.DURATION_COMPARISON.MINUTES_SUFFIX}`;
  }

  /**
   * Renders the comparison table
   * @param container - Container element
   * @param sessions - Workout sessions to display
   */
  private static renderComparisonTable(
    container: HTMLElement,
    sessions: WorkoutSession[]
  ): void {
    const tableContainer = container.createEl("div", {
      cls: "workout-duration-comparison-table-container",
    });

    const table = tableContainer.createEl("table", {
      cls: "workout-duration-comparison-table",
    });

    // Header
    const thead = table.createEl("thead");
    const headerRow = thead.createEl("tr");

    headerRow.createEl("th", {
      text: CONSTANTS.WORKOUT.LABELS.DASHBOARD.DURATION_COMPARISON.COLUMN_WORKOUT,
    });
    headerRow.createEl("th", {
      text: CONSTANTS.WORKOUT.LABELS.DASHBOARD.DURATION_COMPARISON.COLUMN_ESTIMATED,
    });
    headerRow.createEl("th", {
      text: CONSTANTS.WORKOUT.LABELS.DASHBOARD.DURATION_COMPARISON.COLUMN_ACTUAL,
    });
    headerRow.createEl("th", {
      text: CONSTANTS.WORKOUT.LABELS.DASHBOARD.DURATION_COMPARISON.COLUMN_VARIANCE,
    });

    // Body
    const tbody = table.createEl("tbody");

    sessions.forEach((session) => {
      const row = tbody.createEl("tr");

      // Workout name and date
      const workoutCell = row.createEl("td", {
        cls: "workout-duration-comparison-workout-cell",
      });
      workoutCell.createEl("div", {
        text: session.workout,
        cls: "workout-duration-comparison-workout-name",
      });
      workoutCell.createEl("div", {
        text: session.date,
        cls: "workout-duration-comparison-workout-date",
      });

      // Estimated duration
      row.createEl("td", {
        text: this.formatDuration(session.estimatedDuration),
        cls: "workout-duration-comparison-duration-cell",
      });

      // Actual duration
      row.createEl("td", {
        text: this.formatDuration(session.actualDuration),
        cls: "workout-duration-comparison-duration-cell",
      });

      // Variance
      const varianceCell = row.createEl("td", {
        cls: "workout-duration-comparison-variance-cell",
      });

      const varianceSign = session.variancePercent >= 0 ? "+" : "";
      const varianceClass =
        Math.abs(session.variancePercent) <= 10
          ? "workout-duration-comparison-variance-good"
          : Math.abs(session.variancePercent) <= 25
          ? "workout-duration-comparison-variance-moderate"
          : "workout-duration-comparison-variance-poor";

      varianceCell.createEl("span", {
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
    trend: VarianceTrend
  ): void {
    const trendEl = container.createEl("div", {
      cls: "workout-duration-comparison-trend",
    });

    // Title
    trendEl.createEl("div", {
      text: CONSTANTS.WORKOUT.LABELS.DASHBOARD.DURATION_COMPARISON.VARIANCE_TREND_TITLE,
      cls: "workout-duration-comparison-trend-title",
    });

    // Trend message with icon
    const messageEl = trendEl.createEl("div", {
      cls: `workout-duration-comparison-trend-message workout-duration-comparison-trend-${trend.direction}`,
    });

    // Icon based on trend direction
    const icon =
      trend.direction === "improving"
        ? "↗"
        : trend.direction === "declining"
        ? "↘"
        : "→";

    messageEl.createEl("span", {
      text: icon,
      cls: "workout-duration-comparison-trend-icon",
    });

    const trendText =
      trend.direction === "improving"
        ? CONSTANTS.WORKOUT.LABELS.DASHBOARD.DURATION_COMPARISON.VARIANCE_TREND_IMPROVING
        : trend.direction === "declining"
        ? CONSTANTS.WORKOUT.LABELS.DASHBOARD.DURATION_COMPARISON.VARIANCE_TREND_DECLINING
        : CONSTANTS.WORKOUT.LABELS.DASHBOARD.DURATION_COMPARISON.VARIANCE_TREND_STABLE;

    messageEl.createEl("span", {
      text: trendText,
      cls: "workout-duration-comparison-trend-text",
    });

    // Average variance stat
    trendEl.createEl("div", {
      text: `Avg variance: ±${trend.averageVariance.toFixed(0)}%`,
      cls: "workout-duration-comparison-trend-stat",
    });
  }
}
