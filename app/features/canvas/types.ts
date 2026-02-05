/**
 * Layout options for canvas export
 */
export type CanvasLayoutType = "horizontal" | "vertical" | "grouped";

/**
 * Options for canvas export
 */
export interface CanvasExportOptions {
  /** Layout type: horizontal flow, vertical flow, or grouped by muscle */
  layout: CanvasLayoutType;
  /** Whether to include timer durations on nodes */
  includeDurations: boolean;
  /** Whether to include last performance stats on nodes */
  includeStats: boolean;
  /** Whether to connect superset exercises with edges */
  connectSupersets: boolean;
}
