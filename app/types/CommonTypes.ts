import { WorkoutLogData } from "@app/types/WorkoutLogData";

export interface TrendIndicators {
	trendDirection: string;
	trendColor: string;
	trendIcon: string;
}

export interface FilterResult {
	filteredData: WorkoutLogData[];
	filterMethodUsed: string;
	titlePrefix: string;
}

export interface CodeBlockContext {
	source: string;
	el: HTMLElement;
	[key: string]: unknown;
}
