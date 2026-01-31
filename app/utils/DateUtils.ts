import { CONSTANTS } from "@app/constants";
import { WorkoutLogData } from "@app/types/WorkoutLogData";

/**
 * Utility class for date operations and time period calculations
 * Centralizes date manipulation logic used across the application
 */
export class DateUtils {
  private static readonly MS_PER_DAY = 24 * 60 * 60 * 1000;

  /**
   * Extract date only (YYYY-MM-DD) from ISO datetime string
   * Handles both full ISO strings and date-only strings
   */
  static extractDateOnly(isoDate: string): string {
    return isoDate.split("T")[0];
  }

  /**
   * Format a Date object to ISO date string (YYYY-MM-DD)
   */
  static formatDate(date: Date): string {
    return date.toISOString().split("T")[0];
  }

  /**
   * Get a date N days ago from today
   */
  static getDaysAgo(days: number): Date {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date;
  }

  /**
   * Get cutoff date for a specific time frame
   */
  static getTimeFrameDate(timeFrame: "week" | "month" | "year"): Date {
    const now = new Date();
    const daysMap = {
      week: 7,
      month: 30,
      year: 365,
    };
    return new Date(now.getTime() - daysMap[timeFrame] * this.MS_PER_DAY);
  }

  /**
   * Filter workout data by date range
   */
  static filterByDateRange(
    data: WorkoutLogData[],
    cutoffDate: Date
  ): WorkoutLogData[] {
    return data.filter((d) => new Date(d.date) >= cutoffDate);
  }

  /**
   * Filter workout data by number of days ago
   */
  static filterByDaysAgo(
    data: WorkoutLogData[],
    days: number
  ): WorkoutLogData[] {
    const cutoffDate = this.getDaysAgo(days);
    return this.filterByDateRange(data, cutoffDate);
  }

  /**
   * Filter workout data by time frame
   */
  static filterByTimeFrame(
    data: WorkoutLogData[],
    timeFrame: "week" | "month" | "year"
  ): WorkoutLogData[] {
    const cutoffDate = this.getTimeFrameDate(timeFrame);
    return this.filterByDateRange(data, cutoffDate);
  }

  /**
   * Get unique dates from workout data (YYYY-MM-DD format)
   */
  static getUniqueDates(data: WorkoutLogData[]): string[] {
    const dates = new Set(data.map((d) => this.extractDateOnly(d.date)));
    return Array.from(dates).sort();
  }

  /**
   * Calculate week number relative to today (0 = current week)
   */
  static getWeekNumberFromToday(date: Date): number {
    const today = new Date();
    const diffTime = today.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / this.MS_PER_DAY);
    return Math.floor(diffDays / 7);
  }

  /**
   * Group dates by week number (0 = current week, 1 = last week, etc.)
   */
  static groupDatesByWeek(dates: string[]): Set<number> {
    return new Set(
      dates.map((dateStr) => this.getWeekNumberFromToday(new Date(dateStr)))
    );
  }

  /**
   * Check if two dates are on the same day
   */
  static isSameDay(date1: Date, date2: Date): boolean {
    return this.formatDate(date1) === this.formatDate(date2);
  }

  /**
   * Get date range as string array (YYYY-MM-DD) for the last N days
   */
  static getDateRangeForDays(days: number): string[] {
    const labels: string[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      labels.push(this.formatDate(date));
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
      return CONSTANTS.WORKOUT.TABLE.LABELS.NOT_AVAILABLE;
    }
  }

  /**
   * Format date as key (YYYY-MM-DD)
   * Used for grouping rows by date
   */
  static toDateKey(dateString: string): string {
    try {
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const day = date.getDate().toString().padStart(2, "0");
      return `${year}-${month}-${day}`;
    } catch {
      return CONSTANTS.WORKOUT.TABLE.DATE_KEYS.INVALID;
    }
  }

  /**
   * Format date as short date (DD/MM)
   * Used in spacer rows for date headers
   */
  static toShortDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      const day = date.getDate().toString().padStart(2, "0");
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      return `${day}/${month}`;
    } catch {
      return CONSTANTS.WORKOUT.TABLE.DATE_KEYS.INVALID;
    }
  }

  /**
   * Format date as full date (DD/MM/YYYY)
   * Future use for detailed views
   */
  static toFullDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      const day = date.getDate().toString().padStart(2, "0");
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return CONSTANTS.WORKOUT.TABLE.LABELS.INVALID_DATE;
    }
  }

  /**
   * Format date with specified format string
   * Supports: DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD
   * Used primarily for chart labels and display formatting
   */
  static formatDateWithFormat(
    date: string | Date,
    format: string = "DD/MM/YYYY"
  ): string {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
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
