import { TrendCalculator } from "@app/components/data/TrendCalculator";

describe("TrendCalculator", () => {
	describe("getTrendIndicators", () => {
		it("should return insufficient data message when volumeData has less than 2 points", () => {
			const result = TrendCalculator.getTrendIndicators(0, [100]);
			expect(result.trendDirection).toBe("insuff. data");
			expect(result.trendColor).toBe("var(--text-muted, #888)");
			expect(result.trendIcon).toBe("·");
		});

		it("should return insufficient data message for empty array", () => {
			const result = TrendCalculator.getTrendIndicators(0, []);
			expect(result.trendDirection).toBe("insuff. data");
			expect(result.trendColor).toBe("var(--text-muted, #888)");
			expect(result.trendIcon).toBe("·");
		});

		it("should return increasing trend when slope is above threshold", () => {
			const volumeData = [100, 110, 120, 130];
			const averageVolume = 115;
			const slopeThreshold = Math.max(0.05 * averageVolume, 1); // 5.75
			const slope = 10; // Well above threshold

			const result = TrendCalculator.getTrendIndicators(slope, volumeData);
			expect(result.trendDirection).toBe("in aumento");
			expect(result.trendColor).toBe("var(--color-green, #4CAF50)");
			expect(result.trendIcon).toBe("↗️");
		});

		it("should return decreasing trend when slope is below negative threshold", () => {
			const volumeData = [130, 120, 110, 100];
			const averageVolume = 115;
			const slopeThreshold = Math.max(0.05 * averageVolume, 1); // 5.75
			const slope = -10; // Well below -threshold

			const result = TrendCalculator.getTrendIndicators(slope, volumeData);
			expect(result.trendDirection).toBe("in diminuzione");
			expect(result.trendColor).toBe("var(--color-red, #F44336)");
			expect(result.trendIcon).toBe("↘️");
		});

		it("should return stable trend when slope is within threshold range", () => {
			const volumeData = [100, 101, 100, 101];
			const slope = 0.5; // Very small slope

			const result = TrendCalculator.getTrendIndicators(slope, volumeData);
			expect(result.trendDirection).toBe("stabile");
			expect(result.trendColor).toBe("var(--color-accent, #FFC107)");
			expect(result.trendIcon).toBe("→");
		});

		it("should return stable trend when slope is exactly zero", () => {
			const volumeData = [100, 100, 100, 100];
			const slope = 0;

			const result = TrendCalculator.getTrendIndicators(slope, volumeData);
			expect(result.trendDirection).toBe("stabile");
			expect(result.trendColor).toBe("var(--color-accent, #FFC107)");
			expect(result.trendIcon).toBe("→");
		});

		it("should use minimum threshold of 1 for small average volumes", () => {
			const volumeData = [2, 3, 2, 3]; // Average = 2.5
			// Threshold = Math.max(0.05 * 2.5, 1) = 1
			const slope = 1.5; // Above threshold of 1

			const result = TrendCalculator.getTrendIndicators(slope, volumeData);
			expect(result.trendDirection).toBe("in aumento");
		});

		it("should handle large volume data correctly", () => {
			const volumeData = [1000, 1100, 1200, 1300];
			const averageVolume = 1150;
			const slopeThreshold = Math.max(0.05 * averageVolume, 1); // 57.5
			const slope = 100; // Well above threshold

			const result = TrendCalculator.getTrendIndicators(slope, volumeData);
			expect(result.trendDirection).toBe("in aumento");
		});

		it("should handle negative volume values", () => {
			const volumeData = [-100, -90, -80, -70];
			const slope = 10; // Positive slope

			const result = TrendCalculator.getTrendIndicators(slope, volumeData);
			expect(result.trendDirection).toBe("in aumento");
		});

		it("should calculate threshold based on average volume", () => {
			const volumeData = [100, 200]; // Average = 150
			// Threshold = Math.max(0.05 * 150, 1) = 7.5
			const slope = 8; // Above 7.5

			const result = TrendCalculator.getTrendIndicators(slope, volumeData);
			expect(result.trendDirection).toBe("in aumento");
		});

		it("should return stable for slope just below positive threshold", () => {
			const volumeData = [100, 200]; // Average = 150
			// Threshold = Math.max(0.05 * 150, 1) = 7.5
			const slope = 7; // Below 7.5

			const result = TrendCalculator.getTrendIndicators(slope, volumeData);
			expect(result.trendDirection).toBe("stabile");
		});

		it("should return stable for slope just above negative threshold", () => {
			const volumeData = [100, 200]; // Average = 150
			// Threshold = Math.max(0.05 * 150, 1) = 7.5
			const slope = -7; // Above -7.5

			const result = TrendCalculator.getTrendIndicators(slope, volumeData);
			expect(result.trendDirection).toBe("stabile");
		});

		it("should handle mixed positive and negative values", () => {
			const volumeData = [-50, 0, 50, 100];
			const slope = 50; // Positive trend

			const result = TrendCalculator.getTrendIndicators(slope, volumeData);
			expect(result.trendDirection).toBe("in aumento");
		});

		it("should handle very small slopes correctly", () => {
			const volumeData = [1000, 1000.1, 1000.2, 1000.3];
			const slope = 0.1; // Very small positive slope

			const result = TrendCalculator.getTrendIndicators(slope, volumeData);
			expect(result.trendDirection).toBe("stabile");
		});

		it("should return decreasing for slope at exactly negative threshold", () => {
			const volumeData = [100, 200]; // Average = 150
			// Threshold = Math.max(0.05 * 150, 1) = 7.5
			const slope = -7.5; // Exactly at -threshold (edge case)

			const result = TrendCalculator.getTrendIndicators(slope, volumeData);
			// The condition is slope < -threshold, so -7.5 < -7.5 is false
			expect(result.trendDirection).toBe("stabile");
		});

		it("should return increasing for slope at exactly positive threshold", () => {
			const volumeData = [100, 200]; // Average = 150
			// Threshold = Math.max(0.05 * 150, 1) = 7.5
			const slope = 7.5; // Exactly at threshold (edge case)

			const result = TrendCalculator.getTrendIndicators(slope, volumeData);
			// The condition is slope > threshold, so 7.5 > 7.5 is false
			expect(result.trendDirection).toBe("stabile");
		});
	});
});
