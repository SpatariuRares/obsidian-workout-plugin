import { DashboardCalculations } from "@app/components/dashboard/DashboardCalculations";
import { WorkoutLogData } from "@app/types/WorkoutLogData";

// Helper to create mock workout data
const createMockLog = (
	date: string,
	exercise: string,
	volume: number,
	weight: number,
	workout?: string,
	timestamp?: number

): WorkoutLogData => ({
	date,
	exercise,
	reps: 10,
	weight,
	volume,
	origine: "test",
	workout: workout || "Test Workout",
	notes: "",
	timestamp,
});

describe("DashboardCalculations", () => {
	describe("calculateSummaryMetrics", () => {
		it("should calculate total workouts correctly", () => {
			const today = new Date();
			const data: WorkoutLogData[] = [
				createMockLog(today.toISOString(), "Squat", 1000, 100, "Lower A"),
				createMockLog(today.toISOString(), "Squat", 1200, 120, "Lower A"),
				createMockLog(
					new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
					"Bench",
					800,
					80,
					"Upper A"
				),
			];

			const result = DashboardCalculations.calculateSummaryMetrics(data);
			expect(result.totalWorkouts).toBe(2);
		});

		it("should calculate total volume correctly", () => {
			const today = new Date();
			const data: WorkoutLogData[] = [
				createMockLog(today.toISOString(), "Squat", 1000, 100),
				createMockLog(today.toISOString(), "Bench", 800, 80),
			];

			const result = DashboardCalculations.calculateSummaryMetrics(data);
			expect(result.totalVolume).toBe(1800);
		});

		it("should calculate personal records count", () => {
			const today = new Date();
			const data: WorkoutLogData[] = [
				createMockLog(today.toISOString(), "Squat", 1000, 100),
				createMockLog(today.toISOString(), "Squat", 1200, 120),
				createMockLog(today.toISOString(), "Bench", 800, 80),
				createMockLog(today.toISOString(), "Deadlift", 1500, 150),
			];

			const result = DashboardCalculations.calculateSummaryMetrics(data);
			expect(result.personalRecords).toBe(3); // 3 unique exercises
		});

		it("should calculate current streak correctly", () => {
			const today = new Date();
			const data: WorkoutLogData[] = [
				// This week (week 0)
				createMockLog(today.toISOString(), "Squat", 1000, 100),
				// Last week (week 1)
				createMockLog(
					new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
					"Bench",
					800,
					80
				),
				// 2 weeks ago (week 2)
				createMockLog(
					new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString(),
					"Deadlift",
					1500,
					150
				),
			];

			const result = DashboardCalculations.calculateSummaryMetrics(data);
			expect(result.currentStreak).toBe(3);
		});

		it("should handle empty data", () => {
			const result = DashboardCalculations.calculateSummaryMetrics([]);
			expect(result.totalWorkouts).toBe(0);
			expect(result.totalVolume).toBe(0);
			expect(result.personalRecords).toBe(0);
			expect(result.currentStreak).toBe(0);
		});

		it("should break streak when week is missing", () => {
			const today = new Date();
			const data: WorkoutLogData[] = [
				// This week (week 0)
				createMockLog(today.toISOString(), "Squat", 1000, 100),
				// Skip week 1
				// 2 weeks ago (week 2)
				createMockLog(
					new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString(),
					"Bench",
					800,
					80
				),
			];

			const result = DashboardCalculations.calculateSummaryMetrics(data);
			expect(result.currentStreak).toBe(1); // Only current week
		});
	});

	describe("calculatePeriodStats", () => {
		it("should calculate stats for specified period", () => {
			const today = new Date();
			const data: WorkoutLogData[] = [
				// 5 days ago
				createMockLog(
					new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
					"Squat",
					1000,
					100,
					"Lower A"
				),
				createMockLog(
					new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
					"Bench",
					800,
					80,
					"Lower A"
				),
				// 3 days ago
				createMockLog(
					new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
					"Deadlift",
					1500,
					150,
					"Upper A"
				),
				// 60 days ago (outside period)
				createMockLog(
					new Date(today.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString(),
					"Old Exercise",
					500,
					50,
					"Old Workout"
				),
			];

			const result = DashboardCalculations.calculatePeriodStats(data, 30);
			expect(result.workouts).toBe(2);
			expect(result.volume).toBe(3300);
			expect(result.avgVolume).toBe(1650);
		});

		it("should handle empty period", () => {
			const today = new Date();
			const data: WorkoutLogData[] = [
				createMockLog(
					new Date(today.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString(),
					"Old Exercise",
					500,
					50
				),
			];

			const result = DashboardCalculations.calculatePeriodStats(data, 30);
			expect(result.workouts).toBe(0);
			expect(result.volume).toBe(0);
			expect(result.avgVolume).toBe(0);
		});

		it("should calculate average volume correctly", () => {
			const today = new Date();
			const data: WorkoutLogData[] = [
				createMockLog(
					new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
					"Squat",
					1000,
					100,
					"Lower A"
				),
				createMockLog(
					new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
					"Bench",
					2000,
					200,
					"Upper A"
				),
			];

			const result = DashboardCalculations.calculatePeriodStats(data, 30);
			expect(result.avgVolume).toBe(1500); // (1000 + 2000) / 2
		});

		it("should handle zero division for avgVolume", () => {
			const result = DashboardCalculations.calculatePeriodStats([], 30);
			expect(result.avgVolume).toBe(0);
		});
	});

	describe("prepareVolumeTrendData", () => {
		it("should prepare volume trend data for specified days", () => {
			const today = new Date();
			const data: WorkoutLogData[] = [
				createMockLog(
					new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
					"Squat",
					1000,
					100
				),
				createMockLog(
					new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
					"Bench",
					800,
					80
				),
			];

			const result = DashboardCalculations.prepareVolumeTrendData(data, 7);
			expect(result.labels.length).toBe(7);
			expect(result.data.length).toBe(7);
		});

		it("should fill missing days with zero", () => {
			const today = new Date();
			const data: WorkoutLogData[] = [
				createMockLog(
					new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
					"Squat",
					1000,
					100
				),
			];

			const result = DashboardCalculations.prepareVolumeTrendData(data, 7);
			// Most days should be 0, only one day should have volume
			const nonZeroDays = result.data.filter((v) => v > 0);
			expect(nonZeroDays.length).toBeLessThanOrEqual(1);
		});

		it("should aggregate multiple logs on same day", () => {
			const today = new Date();
			const dateStr = new Date(
				today.getTime() - 2 * 24 * 60 * 60 * 1000
			).toISOString();
			const data: WorkoutLogData[] = [
				createMockLog(dateStr, "Squat", 1000, 100),
				createMockLog(dateStr, "Bench", 800, 80),
			];

			const result = DashboardCalculations.prepareVolumeTrendData(data, 7);
			// One of the days should have combined volume
			const maxVolume = Math.max(...result.data);
			expect(maxVolume).toBe(1800);
		});

		it("should handle empty data", () => {
			const result = DashboardCalculations.prepareVolumeTrendData([], 7);
			expect(result.labels.length).toBe(7);
			expect(result.data.every((v) => v === 0)).toBe(true);
		});
	});

	describe("calculateMuscleGroupVolume", () => {
		it("should return top 5 exercises by volume", () => {
			const today = new Date();
			const data: WorkoutLogData[] = [
				createMockLog(today.toISOString(), "Squat", 2000, 200),
				createMockLog(today.toISOString(), "Bench", 1800, 180),
				createMockLog(today.toISOString(), "Deadlift", 1600, 160),
				createMockLog(today.toISOString(), "Row", 1400, 140),
				createMockLog(today.toISOString(), "Press", 1200, 120),
				createMockLog(today.toISOString(), "Curl", 1000, 100),
			];

			const result = DashboardCalculations.calculateMuscleGroupVolume(data);
			expect(result.length).toBe(5);
			expect(result[0][0]).toBe("Squat");
			expect(result[0][1]).toBe(2000);
		});

		it("should handle less than 5 exercises", () => {
			const today = new Date();
			const data: WorkoutLogData[] = [
				createMockLog(today.toISOString(), "Squat", 1000, 100),
				createMockLog(today.toISOString(), "Bench", 800, 80),
			];

			const result = DashboardCalculations.calculateMuscleGroupVolume(data);
			expect(result.length).toBe(2);
		});

		it("should aggregate volumes for same exercise", () => {
			const today = new Date();
			const data: WorkoutLogData[] = [
				createMockLog(today.toISOString(), "Squat", 1000, 100),
				createMockLog(today.toISOString(), "Squat", 1000, 100),
			];

			const result = DashboardCalculations.calculateMuscleGroupVolume(data);
			expect(result[0][1]).toBe(2000);
		});

		it("should handle empty data", () => {
			const result = DashboardCalculations.calculateMuscleGroupVolume([]);
			expect(result).toEqual([]);
		});
	});

	describe("getRecentWorkouts", () => {
		it("should return recent workouts sorted by date", () => {
			const today = new Date();
			const data: WorkoutLogData[] = [
				createMockLog(
					new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
					"Squat",
					1000,
					100,
					"Lower A"
				),
				createMockLog(
					new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
					"Bench",
					800,
					80,
					"Upper A"
				),
				createMockLog(
					new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
					"Deadlift",
					1500,
					150,
					"Lower B"
				),
			];

			const result = DashboardCalculations.getRecentWorkouts(data, 5);
			expect(result.length).toBe(3);
			expect(result[0].workout).toBe("Lower B"); // Most recent
		});

		it("should limit results to specified limit", () => {
			const today = new Date();
			const data: WorkoutLogData[] = [
				createMockLog(
					new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
					"Squat",
					1000,
					100,
					"Lower A"
				),
				createMockLog(
					new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
					"Bench",
					800,
					80,
					"Upper A"
				),
				createMockLog(
					new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
					"Deadlift",
					1500,
					150,
					"Lower B"
				),
			];

			const result = DashboardCalculations.getRecentWorkouts(data, 2);
			expect(result.length).toBe(2);
		});

		it("should aggregate volume for same workout on same date", () => {
			const today = new Date();
			const dateStr = new Date(
				today.getTime() - 1 * 24 * 60 * 60 * 1000
			).toISOString();
			const data: WorkoutLogData[] = [
				createMockLog(dateStr, "Squat", 1000, 100, "Lower A"),
				createMockLog(dateStr, "Leg Press", 800, 80, "Lower A"),
			];

			const result = DashboardCalculations.getRecentWorkouts(data, 5);
			expect(result.length).toBe(1);
			expect(result[0].totalVolume).toBe(1800);
		});

		it("should handle empty data", () => {
			const result = DashboardCalculations.getRecentWorkouts([], 5);
			expect(result).toEqual([]);
		});

		it("should handle undefined workout names", () => {
			const today = new Date();
			const data: WorkoutLogData[] = [
				{
					date: today.toISOString(),
					exercise: "Squat",
					reps: 10,
					weight: 100,
					volume: 1000,
					origine: "test",
					workout: undefined,
					timestamp: today.getTime(),
				},
			];

			const result = DashboardCalculations.getRecentWorkouts(data, 5);
			expect(result.length).toBe(1);
			expect(result[0].workout).toBeUndefined();
		});
	});
});
