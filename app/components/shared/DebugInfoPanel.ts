import { WorkoutLogData } from "@app/types/WorkoutLogData";

/**
 * Utility component that renders a debug block with
 * info about the filtered data and filter method.
 */
export class DebugInfoPanel {
	static render(
		container: HTMLElement,
		data: WorkoutLogData[],
		chartType: string,
		filterMethod: string
	): void {
		const debugInfo = container.createEl("div", {
			cls: "workout-charts-debug",
		});

		debugInfo.createEl("br");
		debugInfo.appendText(`Filter Method: ${filterMethod}`);
		debugInfo.createEl("br");
		debugInfo.appendText(`Data Points: ${data.length}`);
		debugInfo.createEl("br");
		debugInfo.appendText(`Chart Type: ${chartType}`);
	}
}

