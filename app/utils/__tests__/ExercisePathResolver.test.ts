import { ExercisePathResolver } from "@app/utils/ExercisePathResolver";
import { TFile } from "obsidian";
import type WorkoutChartsPlugin from "main";

// Mock TFile class
class MockTFile {
	path: string;
	basename: string;

	constructor(path: string) {
		this.path = path;
		this.basename = path.split("/").pop()?.replace(".md", "") || "";
	}
}

// Mock Plugin
const createMockPlugin = (
	exerciseFolderPath: string,
	files: string[],
	debugMode = false
): WorkoutChartsPlugin => {
	const mockFiles = files.map((path) => new MockTFile(path));

	return {
		settings: {
			exerciseFolderPath,
			debugMode,
		},
		app: {
			vault: {
				getMarkdownFiles: () => mockFiles as TFile[],
			},
		},
	} as unknown as WorkoutChartsPlugin;
};

describe("ExercisePathResolver", () => {
	describe("getExerciseFolderPaths", () => {
		it("should generate all possible paths for base path", () => {
			const paths = ExercisePathResolver.getExerciseFolderPaths("Esercizi");
			expect(paths).toEqual([
				"Esercizi",
				"Esercizi/",
				"Esercizi/Data",
				"Esercizi/Data/",
				"theGYM/Esercizi",
				"theGYM/Esercizi/",
				"theGYM/Esercizi/Data",
				"theGYM/Esercizi/Data/",
			]);
		});

		it("should handle empty base path", () => {
			const paths = ExercisePathResolver.getExerciseFolderPaths("");
			expect(paths).toEqual([
				"",
				"/",
				"/Data",
				"/Data/",
				"theGYM/",
				"theGYM//",
				"theGYM//Data",
				"theGYM//Data/",
			]);
		});

		it("should handle path with spaces", () => {
			const paths = ExercisePathResolver.getExerciseFolderPaths("My Exercises");
			expect(paths).toContain("My Exercises/Data");
			expect(paths).toContain("theGYM/My Exercises/Data/");
		});
	});

	describe("normalizeFilePath", () => {
		it("should convert backslashes to forward slashes", () => {
			expect(ExercisePathResolver.normalizeFilePath("C:\\Users\\file.md")).toBe(
				"C:/Users/file.md"
			);
		});

		it("should handle mixed slashes", () => {
			expect(ExercisePathResolver.normalizeFilePath("path\\to/file.md")).toBe(
				"path/to/file.md"
			);
		});

		it("should handle paths with only forward slashes", () => {
			expect(ExercisePathResolver.normalizeFilePath("path/to/file.md")).toBe(
				"path/to/file.md"
			);
		});

		it("should handle empty path", () => {
			expect(ExercisePathResolver.normalizeFilePath("")).toBe("");
		});

		it("should handle Windows-style paths", () => {
			expect(
				ExercisePathResolver.normalizeFilePath(
					"theGYM\\Esercizi\\Data\\Squat.md"
				)
			).toBe("theGYM/Esercizi/Data/Squat.md");
		});
	});

	describe("isInExerciseFolder", () => {
		const mockFile1 = new MockTFile("theGYM/Esercizi/Data/Squat.md") as TFile;
		const mockFile2 = new MockTFile("Esercizi/Data/Bench Press.md") as TFile;
		const mockFile3 = new MockTFile("Other/Notes/Random.md") as TFile;
		const mockFile4 = new MockTFile("theGYM/Esercizi/Deadlift.md") as TFile;

		it("should return true for file in theGYM/Esercizi/Data", () => {
			expect(
				ExercisePathResolver.isInExerciseFolder(mockFile1, "Esercizi")
			).toBe(true);
		});

		it("should return true for file in Esercizi/Data", () => {
			expect(
				ExercisePathResolver.isInExerciseFolder(mockFile2, "Esercizi")
			).toBe(true);
		});

		it("should return false for file outside exercise folder", () => {
			expect(
				ExercisePathResolver.isInExerciseFolder(mockFile3, "Esercizi")
			).toBe(false);
		});

		it("should return true for file in theGYM/Esercizi (no Data subfolder)", () => {
			expect(
				ExercisePathResolver.isInExerciseFolder(mockFile4, "Esercizi")
			).toBe(true);
		});

		it("should handle Windows-style paths in file", () => {
			const windowsFile = new MockTFile(
				"theGYM\\Esercizi\\Data\\Squat.md"
			) as TFile;
			expect(
				ExercisePathResolver.isInExerciseFolder(windowsFile, "Esercizi")
			).toBe(true);
		});

		it("should return false when file path does not match any pattern", () => {
			const otherFile = new MockTFile("Notes/Daily/2024-01-15.md") as TFile;
			expect(
				ExercisePathResolver.isInExerciseFolder(otherFile, "Esercizi")
			).toBe(false);
		});
	});

	describe("findExerciseFiles", () => {
		it("should find all exercise files in configured folder", () => {
			const plugin = createMockPlugin("Esercizi", [
				"theGYM/Esercizi/Data/Squat.md",
				"theGYM/Esercizi/Data/Bench Press.md",
				"Esercizi/Data/Deadlift.md",
				"Other/Notes/Random.md",
			]);

			const files = ExercisePathResolver.findExerciseFiles(plugin);
			expect(files).toHaveLength(3);
			expect(files.map((f) => f.basename)).toContain("Squat");
			expect(files.map((f) => f.basename)).toContain("Bench Press");
			expect(files.map((f) => f.basename)).toContain("Deadlift");
		});

		it("should return empty array when exerciseFolderPath is not set", () => {
			const plugin = createMockPlugin("", [
				"theGYM/Esercizi/Data/Squat.md",
				"Esercizi/Data/Bench Press.md",
			]);

			const files = ExercisePathResolver.findExerciseFiles(plugin);
			expect(files).toEqual([]);
		});

		it("should return empty array when no files match", () => {
			const plugin = createMockPlugin("Esercizi", [
				"Other/Notes/Random.md",
				"Daily/2024-01-15.md",
			]);

			const files = ExercisePathResolver.findExerciseFiles(plugin);
			expect(files).toEqual([]);
		});

		it("should handle mixed path separators", () => {
			const plugin = createMockPlugin("Esercizi", [
				"theGYM\\Esercizi\\Data\\Squat.md",
				"Esercizi/Data/Bench Press.md",
			]);

			const files = ExercisePathResolver.findExerciseFiles(plugin);
			expect(files).toHaveLength(2);
		});
	});

	describe("findExerciseFile", () => {
		const files = [
			"theGYM/Esercizi/Data/Squat.md",
			"theGYM/Esercizi/Data/Bench Press.md",
			"theGYM/Esercizi/Data/Hip Thrust.md",
			"Other/Notes/Random.md",
		];

		it("should find file by exact name match", () => {
			const plugin = createMockPlugin("Esercizi", files);
			const file = ExercisePathResolver.findExerciseFile("Squat", plugin);

			expect(file).toBeDefined();
			expect(file?.basename).toBe("Squat");
		});

		it("should find file by case-insensitive match", () => {
			const plugin = createMockPlugin("Esercizi", files);
			const file = ExercisePathResolver.findExerciseFile("squat", plugin);

			expect(file).toBeDefined();
			expect(file?.basename).toBe("Squat");
		});

		it("should find file by partial name match (filename contains search)", () => {
			const plugin = createMockPlugin("Esercizi", files);
			const file = ExercisePathResolver.findExerciseFile("Bench", plugin);

			expect(file).toBeDefined();
			expect(file?.basename).toBe("Bench Press");
		});

		it("should find file by fuzzy match (search contains filename)", () => {
			const plugin = createMockPlugin("Esercizi", files);
			const file = ExercisePathResolver.findExerciseFile(
				"Hip Thrust Barbell",
				plugin
			);

			expect(file).toBeDefined();
			expect(file?.basename).toBe("Hip Thrust");
		});

		it("should return undefined when exerciseFolderPath is not set", () => {
			const plugin = createMockPlugin("", files);
			const file = ExercisePathResolver.findExerciseFile("Squat", plugin);

			expect(file).toBeUndefined();
		});

		it("should return undefined when exercise not found", () => {
			const plugin = createMockPlugin("Esercizi", files);
			const file = ExercisePathResolver.findExerciseFile(
				"Nonexistent Exercise",
				plugin
			);

			expect(file).toBeUndefined();
		});

		it("should not find files outside exercise folder", () => {
			const plugin = createMockPlugin("Esercizi", files);
			const file = ExercisePathResolver.findExerciseFile("Random", plugin);

			expect(file).toBeUndefined();
		});

		it("should handle multi-word exercise names with spaces", () => {
			const plugin = createMockPlugin("Esercizi", files);
			const file = ExercisePathResolver.findExerciseFile(
				"bench press",
				plugin
			);

			expect(file).toBeDefined();
			expect(file?.basename).toBe("Bench Press");
		});
	});

	describe("getExerciseNames", () => {
		it("should return sorted list of exercise names", () => {
			const plugin = createMockPlugin("Esercizi", [
				"theGYM/Esercizi/Data/Squat.md",
				"theGYM/Esercizi/Data/Bench Press.md",
				"Esercizi/Data/Deadlift.md",
				"Esercizi/Data/Hip Thrust.md",
			]);

			const names = ExercisePathResolver.getExerciseNames(plugin);
			expect(names).toEqual([
				"Bench Press",
				"Deadlift",
				"Hip Thrust",
				"Squat",
			]);
		});

		it("should return empty array when exerciseFolderPath is not set", () => {
			const plugin = createMockPlugin("", [
				"theGYM/Esercizi/Data/Squat.md",
			]);

			const names = ExercisePathResolver.getExerciseNames(plugin);
			expect(names).toEqual([]);
		});

		it("should return empty array when no exercise files exist", () => {
			const plugin = createMockPlugin("Esercizi", [
				"Other/Notes/Random.md",
			]);

			const names = ExercisePathResolver.getExerciseNames(plugin);
			expect(names).toEqual([]);
		});

		it("should handle duplicate basenames correctly", () => {
			const plugin = createMockPlugin("Esercizi", [
				"theGYM/Esercizi/Data/Squat.md",
				"Esercizi/Squat.md",
			]);

			const names = ExercisePathResolver.getExerciseNames(plugin);
			// Both files have same basename, so we should see it twice
			expect(names).toEqual(["Squat", "Squat"]);
		});
	});

	// Note: debugPathResolution functionality has been removed/refactored
	// These tests are kept as placeholders for future debug logging implementation
	describe.skip("debugPathResolution", () => {
		// Mock console.log to test debug output
		let consoleSpy: jest.SpyInstance;

		beforeEach(() => {
			consoleSpy = jest.spyOn(console, "log").mockImplementation();
		});

		afterEach(() => {
			consoleSpy.mockRestore();
		});

		it("should log debug information when debugMode is enabled", () => {
			const plugin = createMockPlugin(
				"Esercizi",
				[
					"theGYM/Esercizi/Data/Squat.md",
					"Esercizi/Data/Bench Press.md",
				],
				true
			);


			expect(consoleSpy).toHaveBeenCalledWith(
				"TestContext: Exercise folder path:",
				"Esercizi"
			);
			expect(consoleSpy).toHaveBeenCalledWith(
				"TestContext: Total markdown files:",
				2
			);
			expect(consoleSpy).toHaveBeenCalledWith(
				"TestContext: Filtered exercise files:",
				2
			);
		});

		it("should not log when debugMode is disabled", () => {
			const plugin = createMockPlugin(
				"Esercizi",
				["theGYM/Esercizi/Data/Squat.md"],
				false
			);


			expect(consoleSpy).not.toHaveBeenCalled();
		});

		it("should log paths to check", () => {
			const plugin = createMockPlugin(
				"Esercizi",
				["theGYM/Esercizi/Data/Squat.md"],
				true
			);


			expect(consoleSpy).toHaveBeenCalledWith(
				"TestContext: Paths to check:",
				[
					"Esercizi",
					"Esercizi/",
					"Esercizi/Data",
					"Esercizi/Data/",
					"theGYM/Esercizi",
					"theGYM/Esercizi/",
					"theGYM/Esercizi/Data",
					"theGYM/Esercizi/Data/",
				]
			);
		});

		it("should log exercise file paths", () => {
			const plugin = createMockPlugin(
				"Esercizi",
				[
					"theGYM/Esercizi/Data/Squat.md",
					"Esercizi/Data/Bench Press.md",
				],
				true
			);


			expect(consoleSpy).toHaveBeenCalledWith(
				"TestContext: Exercise files:",
				[
					"theGYM/Esercizi/Data/Squat.md",
					"Esercizi/Data/Bench Press.md",
				]
			);
		});
	});
});
