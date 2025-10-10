import { WorkoutLogData } from "../types/WorkoutLogData";

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
}
