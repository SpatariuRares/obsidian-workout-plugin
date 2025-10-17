import { TrendIndicators, FilterResult } from "@app/types/CommonTypes";

export interface EmbeddedChartParams {
	type?: "volume" | "weight" | "reps";
	chartType?: "exercise" | "workout";
	exercise?: string;
	exercisePath?: string;
	workout?: string;
	workoutPath?: string;
	dateRange?: number;
	showTrendLine?: boolean;
	showTrend?: boolean;
	showStats?: boolean;
	title?: string;
	height?: string;
	limit?: number;
	exactMatch?: boolean;
	debug?: boolean;
}

export interface ChartDataset {
	label: string;
	data: number[];
	borderColor?: string;
	backgroundColor?: string;
	tension?: number;
	fill?: boolean;
	pointRadius?: number;
	pointHoverRadius?: number;
	borderDash?: number[];
	borderWidth?: number;
	pointBackgroundColor?: string;
	pointBorderColor?: string;
}

export interface ChartData {
	labels: string[];
	datasets: ChartDataset[];
	volumeData: number[];
	trendIndicators: TrendIndicators;
	filterResult: FilterResult;
	params: EmbeddedChartParams;
}
