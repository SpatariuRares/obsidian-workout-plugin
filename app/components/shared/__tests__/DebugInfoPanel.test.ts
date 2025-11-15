/** @jest-environment jsdom */

import { DebugInfoPanel } from "@app/components/shared/DebugInfoPanel";
import type { WorkoutLogData } from "@app/types/WorkoutLogData";
import { createObsidianContainer } from "@app/components/__tests__/obsidianDomMocks";

describe("DebugInfoPanel shared component", () => {
	it("renders debug metadata about the dataset", () => {
		const parent = createObsidianContainer();
		const data: WorkoutLogData[] = [
			{
				date: "2024-01-01",
				exercise: "Bench Press",
				reps: 5,
				weight: 80,
				volume: 400,
			},
			{
				date: "2024-01-02",
				exercise: "Squat",
				reps: 5,
				weight: 100,
				volume: 500,
			},
		];

		DebugInfoPanel.render(parent, data, "volume", "last-7-days");

		const panel = parent.querySelector(".workout-charts-debug");
		expect(panel).toBeTruthy();

		const text = panel?.textContent ?? "";
		expect(text).toContain("Filter Method: last-7-days");
		expect(text).toContain("Data Points: 2");
		expect(text).toContain("Chart Type: volume");
	});
});
