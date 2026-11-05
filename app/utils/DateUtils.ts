import { t } from "@app/i18n";
import { WorkoutLogData } from "@app/types/WorkoutLogData";
import {
  localDay,
  trainingDay,
} from "@app/services/history/TrainingHistory";

/** Local day, month (both two digits) and year of a date */
function dateParts(date: string | Date): {
  day: string;
  month: string;
  year: number;
} {
  const d = new Date(date);
  return {
    day: String(d.getDate()).padStart(2, "0"),
    month: String(d.getMonth() + 1).padStart(2, "0"),
    year: d.getFullYear(),
  };
}

/**
 * Utility class for date operations and time period calculations
 * Centralizes date manipulation logic used across the application
 */
export class DateUtils {
  /**
   * The rows of "the last N days": today and the previous N days, the
   * boundary day counted whole (cut at local midnight, by training day).
   * The one rule for `dateRange` and the dashboard periods.
   */
  static lastDays<T extends Pick<WorkoutLogData, "date">>(
    rows: T[],
    days: number,
  ): T[] {
    const start = new Date();
    start.setDate(start.getDate() - days);
    const firstDay = localDay(start);
    return rows.filter((row) => {
      const day = trainingDay(row.date ?? "");
      return /^\d{4}-\d{2}-\d{2}$/.test(day) && day >= firstDay;
    });
  }

  /**
   * Get date range as string array (YYYY-MM-DD) for the last N days
   */
  static getDateRangeForDays(days: number): string[] {
    const labels: string[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      labels.push(localDay(date));
    }
    return labels;
  }

  /**
   * Format date as time (HH:MM)
   * Used in table cells for workout time
   */
  static toTime(dateString: string): string {
    try {
      const date = new Date(dateString);
      const hours = date.getHours().toString().padStart(2, "0");
      const minutes = date.getMinutes().toString().padStart(2, "0");
      return `${hours}:${minutes}`;
    } catch {
      return t("table.notAvailable");
    }
  }

  /**
   * Format date as short date (DD/MM)
   * Used in spacer rows for date headers
   */
  static toShortDate(dateString: string): string {
    const { day, month } = dateParts(dateString);
    return `${day}/${month}`;
  }

  /**
   * Format date with specified format string
   * Supports: DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD
   * Used primarily for chart labels and display formatting
   */
  static formatDateWithFormat(
    date: string | Date,
    format: string = "DD/MM/YYYY",
  ): string {
    const { day, month, year } = dateParts(date);
    switch (format) {
      case "YYYY-MM-DD":
        return `${year}-${month}-${day}`;
      case "MM/DD/YYYY":
        return `${month}/${day}/${year}`;
      case "DD/MM/YYYY":
      default:
        return `${day}/${month}/${year}`;
    }
  }
}
