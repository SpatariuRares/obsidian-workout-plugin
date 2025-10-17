// import { FilterResult } from "./CommonTypes";
// import { WorkoutLogData } from "./WorkoutLogData";
import { WorkoutLogData, FilterResult } from "@app/types";

export interface EmbeddedTableParams {
	exercise?: string;
	exercisePath?: string;
	workout?: string;
	workoutPath?: string;
	dateRange?: number; // Days to look back for filtering
	limit?: number;
	exactMatch?: boolean;
	searchByName?: boolean;
	showAddButton?: boolean;
	buttonText?: string;
	columns?: string[] | string;
	debug?: boolean;
}

export interface TableRow {
	displayRow: string[];
	originalDate: string;
	dateKey: string;
	originalLog?: WorkoutLogData;
}

export interface TableData {
	headers: string[];
	rows: TableRow[];
	totalRows: number;
	filterResult: FilterResult;
	params: EmbeddedTableParams;
}
