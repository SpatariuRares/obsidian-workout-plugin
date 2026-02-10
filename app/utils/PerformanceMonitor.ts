/**
 * @fileoverview Lightweight performance monitoring utility.
 *
 * Measures execution time of critical paths (startup, data loading, rendering, refresh).
 * Output goes to console.debug — visible only when DevTools is open.
 *
 * Usage:
 *   PerformanceMonitor.start("renderTable");
 *   // ... work ...
 *   PerformanceMonitor.end("renderTable"); // logs "[PERF] renderTable: 12.34ms"
 *
 * Or use the async helper:
 *   const result = await PerformanceMonitor.measure("loadCSV", () => loadData());
 *
 * @module PerformanceMonitor
 */

interface PerfEntry {
  label: string;
  duration: number;
  timestamp: number;
}

export class PerformanceMonitor {
  private static marks = new Map<string, number>();
  private static history: PerfEntry[] = [];
  private static readonly MAX_HISTORY = 100;
  private static enabled = true;

  /**
   * Enable or disable performance monitoring.
   * When disabled, start/end/measure are no-ops.
   */
  static setEnabled(value: boolean): void {
    this.enabled = value;
  }

  /**
   * Start a named timing mark.
   */
  static start(label: string): void {
    if (!this.enabled) return;
    this.marks.set(label, performance.now());
  }

  /**
   * End a named timing mark and log the duration.
   * @returns duration in ms, or -1 if no matching start was found
   */
  static end(label: string): number {
    if (!this.enabled) return -1;

    const start = this.marks.get(label);
    if (start === undefined) return -1;

    const duration = performance.now() - start;
    this.marks.delete(label);

    this.record(label, duration);
    return duration;
  }

  /**
   * Measure an async operation.
   * @returns the result of the callback
   */
  static async measure<T>(
    label: string,
    fn: () => Promise<T>,
  ): Promise<T> {
    this.start(label);
    try {
      return await fn();
    } finally {
      this.end(label);
    }
  }

  /**
   * Measure a synchronous operation.
   * @returns the result of the callback
   */
  static measureSync<T>(label: string, fn: () => T): T {
    this.start(label);
    try {
      return fn();
    } finally {
      this.end(label);
    }
  }

  /**
   * Get recent performance entries.
   */
  static getHistory(): readonly PerfEntry[] {
    return this.history;
  }

  /**
   * Get a summary of all recorded measurements, grouped by label.
   */
  static getSummary(): Map<string, { count: number; avg: number; min: number; max: number; total: number }> {
    const summary = new Map<string, { count: number; avg: number; min: number; max: number; total: number }>();

    for (const entry of this.history) {
      const existing = summary.get(entry.label);
      if (existing) {
        existing.count++;
        existing.total += entry.duration;
        existing.avg = existing.total / existing.count;
        existing.min = Math.min(existing.min, entry.duration);
        existing.max = Math.max(existing.max, entry.duration);
      } else {
        summary.set(entry.label, {
          count: 1,
          avg: entry.duration,
          min: entry.duration,
          max: entry.duration,
          total: entry.duration,
        });
      }
    }

    return summary;
  }

  /**
   * Print a formatted summary table to console.
   */
  static printSummary(): void {
    const summary = this.getSummary();
    if (summary.size === 0) {
      return;
    }

    const rows: Record<string, string | number>[] = [];
    for (const [label, stats] of summary) {
      rows.push({
        Label: label,
        Count: stats.count,
        "Avg (ms)": +stats.avg.toFixed(2),
        "Min (ms)": +stats.min.toFixed(2),
        "Max (ms)": +stats.max.toFixed(2),
        "Total (ms)": +stats.total.toFixed(2),
      });
    }

  }

  /**
   * Clear all history and active marks.
   */
  static clear(): void {
    this.marks.clear();
    this.history = [];
  }

  private static record(label: string, duration: number): void {
    this.history.push({ label, duration, timestamp: Date.now() });

    // Trim history if too large
    if (this.history.length > this.MAX_HISTORY) {
      this.history = this.history.slice(-this.MAX_HISTORY);
    }
  }
}
