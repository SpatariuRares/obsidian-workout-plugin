export interface EmbeddedDashboardParams {
	title?: string;
	dateRange?: number; // Days to include in analytics
	showSummary?: boolean;
	showQuickStats?: boolean;
	showVolumeAnalytics?: boolean;
	showRecentWorkouts?: boolean;
	showQuickActions?: boolean;
	recentWorkoutsLimit?: number;
	volumeTrendDays?: number;
	/** Active protocol filter for dashboard-wide filtering */
	activeProtocolFilter?: string | null;
}

/**
 * Callback type for protocol filter changes in dashboard
 */
export type ProtocolFilterCallback = (protocol: string | null) => void;

export interface MuscleHeatMapOptions {
	timeFrame: "week" | "month" | "year";
	view: "front" | "back";
}
