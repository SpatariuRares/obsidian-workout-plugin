// Mock Obsidian module first
jest.mock(
  "obsidian",
  () => ({
    Notice: jest.fn(),
    TFile: class MockTFile {},
    MarkdownPostProcessorContext: class MockMarkdownPostProcessorContext {},
    MarkdownRenderChild: class MockMarkdownRenderChild {
      constructor(public containerEl: HTMLElement) {}
    },
    Modal: class MockModal {
      constructor(public app: any) {}
      open() {}
      close() {}
    },
    Setting: jest.fn().mockImplementation(() => ({
      setName: jest.fn().mockReturnThis(),
      setDesc: jest.fn().mockReturnThis(),
      addText: jest.fn().mockReturnThis(),
      addToggle: jest.fn().mockReturnThis(),
      addButton: jest.fn().mockReturnThis(),
    })),
    App: class MockApp {},
    Plugin: class MockPlugin {},
  }),
  { virtual: true },
);

import { CodeBlockProcessorService } from "../CodeBlockProcessorService";
import type WorkoutChartsPlugin from "main";
import { DataService } from "../DataService";
import { MuscleTagService } from "@app/services/MuscleTagService";
import { EmbeddedChartView } from "@app/views/EmbeddedChartView";
import { EmbeddedTableView } from "@app/views/EmbeddedTableView";
import { EmbeddedDashboardView } from "@app/views/EmbeddedDashboardView";
import { EmbeddedTimerView } from "@app/views/EmbeddedTimerView";

describe("CodeBlockProcessorService - Parameter Parsing", () => {
  let service: CodeBlockProcessorService;
  let mockPlugin: WorkoutChartsPlugin;
  let mockDataService: DataService;
  let mockChartView: EmbeddedChartView;
  let mockTableView: EmbeddedTableView;
  let mockDashboardView: EmbeddedDashboardView;
  let activeTimers: Map<string, EmbeddedTimerView>;
  let mockMuscleTagService: MuscleTagService;

  beforeEach(() => {
    // Create minimal mocks
    mockPlugin = {} as WorkoutChartsPlugin;
    mockDataService = {} as DataService;
    mockChartView = {} as EmbeddedChartView;
    mockTableView = {} as EmbeddedTableView;
    mockDashboardView = {} as EmbeddedDashboardView;
    activeTimers = new Map();
    mockMuscleTagService = {
      getTagMap: jest.fn().mockReturnValue(new Map()),
    } as unknown as MuscleTagService;

    service = new CodeBlockProcessorService(
      mockPlugin,
      mockDataService,
      mockChartView,
      mockTableView,
      mockDashboardView,
      activeTimers,
      mockMuscleTagService,
    );
  });

  describe("parseCodeBlockParams", () => {
    it("should parse valid number parameters correctly", () => {
      const source = "duration: 60\nreps: 10";
      // Use type assertion to access private method for testing
      const result = (service as any).parseCodeBlockParams(source);

      expect(result.duration).toBe(60);
      expect(result.reps).toBe(10);
    });

    it("should parse zero as a valid number", () => {
      const source = "duration: 0\nweight: 0";
      const result = (service as any).parseCodeBlockParams(source);

      expect(result.duration).toBe(0);
      expect(result.weight).toBe(0);
    });

    it("should parse boolean parameters correctly", () => {
      const source = "exactMatch: true\nautoStart: false";
      const result = (service as any).parseCodeBlockParams(source);

      expect(result.exactMatch).toBe(true);
      expect(result.autoStart).toBe(false);
    });

    it("should treat empty string as string, not convert to 0", () => {
      const source = "exercise: \nworkout: ";
      const result = (service as any).parseCodeBlockParams(source);

      expect(result.exercise).toBe("");
      expect(result.workout).toBe("");
      expect(typeof result.exercise).toBe("string");
      expect(typeof result.workout).toBe("string");
    });

    it("should treat whitespace-only values as strings", () => {
      const source = "exercise:   \nworkout:  \t ";
      const result = (service as any).parseCodeBlockParams(source);

      // After trim(), these should be empty strings
      expect(result.exercise).toBe("");
      expect(result.workout).toBe("");
    });

    it("should parse string parameters correctly", () => {
      const source = "exercise: Bench Press\nworkout: Push Day";
      const result = (service as any).parseCodeBlockParams(source);

      expect(result.exercise).toBe("Bench Press");
      expect(result.workout).toBe("Push Day");
      expect(typeof result.exercise).toBe("string");
      expect(typeof result.workout).toBe("string");
    });

    it("should handle negative numbers correctly", () => {
      const source = "offset: -5\nvalue: -10.5";
      const result = (service as any).parseCodeBlockParams(source);

      expect(result.offset).toBe(-5);
      expect(result.value).toBe(-10.5);
    });

    it("should handle decimal numbers correctly", () => {
      const source = "weight: 72.5\nduration: 90.25";
      const result = (service as any).parseCodeBlockParams(source);

      expect(result.weight).toBe(72.5);
      expect(result.duration).toBe(90.25);
    });

    it("should ignore lines starting with #", () => {
      const source = "# This is a comment\nexercise: Squat\n# Another comment";
      const result = (service as any).parseCodeBlockParams(source);

      expect(result.exercise).toBe("Squat");
      expect(Object.keys(result).length).toBe(1);
    });

    it("should ignore empty lines", () => {
      const source = "\n\nexercise: Deadlift\n\n\nreps: 5\n\n";
      const result = (service as any).parseCodeBlockParams(source);

      expect(result.exercise).toBe("Deadlift");
      expect(result.reps).toBe(5);
      expect(Object.keys(result).length).toBe(2);
    });

    it("should handle lines without colons gracefully", () => {
      const source = "exercise: Squat\ninvalid line without colon\nreps: 5";
      const result = (service as any).parseCodeBlockParams(source);

      expect(result.exercise).toBe("Squat");
      expect(result.reps).toBe(5);
      expect(Object.keys(result).length).toBe(2);
    });

    it("should handle mixed parameter types", () => {
      const source = `exercise: Bench Press
duration: 60
autoStart: true
weight: 100.5
exactMatch: false
workout: `;
      const result = (service as any).parseCodeBlockParams(source);

      expect(result.exercise).toBe("Bench Press");
      expect(result.duration).toBe(60);
      expect(result.autoStart).toBe(true);
      expect(result.weight).toBe(100.5);
      expect(result.exactMatch).toBe(false);
      expect(result.workout).toBe("");
      expect(typeof result.workout).toBe("string");
    });

    it("should handle values with multiple words after colon", () => {
      const source =
        "exercise: Barbell Bench Press Heavy\nworkout: Monday Push Day";
      const result = (service as any).parseCodeBlockParams(source);

      expect(result.exercise).toBe("Barbell Bench Press Heavy");
      expect(result.workout).toBe("Monday Push Day");
    });

    it("should handle scientific notation numbers", () => {
      const source = "value: 1e3\nsmall: 1e-2";
      const result = (service as any).parseCodeBlockParams(source);

      expect(result.value).toBe(1000);
      expect(result.small).toBe(0.01);
    });

    it("should parse array syntax with single value", () => {
      const source = "protocol: [drop_set]";
      const result = (service as any).parseCodeBlockParams(source);

      expect(Array.isArray(result.protocol)).toBe(true);
      expect(result.protocol).toEqual(["drop_set"]);
    });

    it("should parse array syntax with multiple values", () => {
      const source = "protocol: [drop_set, myo_reps, rest_pause]";
      const result = (service as any).parseCodeBlockParams(source);

      expect(Array.isArray(result.protocol)).toBe(true);
      expect(result.protocol).toEqual(["drop_set", "myo_reps", "rest_pause"]);
    });

    it("should trim whitespace from array values", () => {
      const source = "protocol: [  drop_set  ,   myo_reps   ]";
      const result = (service as any).parseCodeBlockParams(source);

      expect(result.protocol).toEqual(["drop_set", "myo_reps"]);
    });

    it("should filter out empty array values", () => {
      const source = "protocol: [drop_set, , myo_reps, ]";
      const result = (service as any).parseCodeBlockParams(source);

      expect(result.protocol).toEqual(["drop_set", "myo_reps"]);
    });

    it("should handle empty array", () => {
      const source = "protocol: []";
      const result = (service as any).parseCodeBlockParams(source);

      expect(Array.isArray(result.protocol)).toBe(true);
      expect(result.protocol).toEqual([]);
    });

    it("should parse string value when not using array syntax", () => {
      const source = "protocol: drop_set";
      const result = (service as any).parseCodeBlockParams(source);

      expect(typeof result.protocol).toBe("string");
      expect(result.protocol).toBe("drop_set");
    });

    it("should handle mixed array and non-array parameters", () => {
      const source = `exercise: Squat
protocol: [drop_set, myo_reps]
exactMatch: true
limit: 10`;
      const result = (service as any).parseCodeBlockParams(source);

      expect(result.exercise).toBe("Squat");
      expect(Array.isArray(result.protocol)).toBe(true);
      expect(result.protocol).toEqual(["drop_set", "myo_reps"]);
      expect(result.exactMatch).toBe(true);
      expect(result.limit).toBe(10);
    });
  });
});
