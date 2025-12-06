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
}
