/** @jest-environment jsdom */

import { LogCallouts } from "@app/components/organism/LogCallouts";
import {
  createObsidianContainer,
  attachObsidianHelpers,
} from "@app/components/__tests__/obsidianDomMocks";
import type WorkoutChartsPlugin from "main";
import { WorkoutLogData, WorkoutProtocol } from "@app/types/WorkoutLogData";

// Mock CreateLogModal
jest.mock("@app/features/modals/CreateLogModal", () => ({
  CreateLogModal: jest.fn().mockImplementation(() => ({
    open: jest.fn(),
  })),
}));

// Mock createButtonsSection - use attachObsidianHelpers to properly mock
jest.mock("@app/features/modals/base/utils/createButtonsSection", () => {
  // Need to require inside factory to avoid hoisting issues
  const { attachObsidianHelpers: attach } = jest.requireActual(
    "@app/components/__tests__/obsidianDomMocks",
  );
  return {
    createButtonsSection: jest.fn((parent: HTMLElement) => {
      const div = attach(document.createElement("div"));
      parent.appendChild(div);
      return div;
    }),
  };
});

// Import after mocking
import { CreateLogModal } from "@app/features/modals/CreateLogModal";

const createMockPlugin = (activeFile?: {
  basename: string;
}): WorkoutChartsPlugin => {
  return {
    app: {
      workspace: {
        getActiveViewOfType: jest
          .fn()
          .mockReturnValue(activeFile ? { file: activeFile } : null),
      },
    },
    triggerWorkoutLogRefresh: jest.fn(),
  } as unknown as WorkoutChartsPlugin;
};

describe("LogCallouts organism", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("renderCsvNoDataMessage", () => {
    it("renders no data message with create button", () => {
      const container = createObsidianContainer();
      const plugin = createMockPlugin();

      LogCallouts.renderCsvNoDataMessage(container, plugin, "Squat");

      expect(container.querySelector(".workout-log-no-data")).toBeTruthy();
      expect(
        container.querySelector(".workout-log-no-data-title"),
      ).toBeTruthy();
      expect(container.querySelector(".add-log-button")).toBeTruthy();
    });

    it("renders without exercise name", () => {
      const container = createObsidianContainer();
      const plugin = createMockPlugin();

      LogCallouts.renderCsvNoDataMessage(container, plugin);

      expect(container.querySelector(".workout-log-no-data")).toBeTruthy();
      expect(container.querySelector(".add-log-button")).toBeTruthy();
    });

    it("opens CreateLogModal when button is clicked", () => {
      const container = createObsidianContainer();
      const plugin = createMockPlugin({ basename: "TestPage" });

      LogCallouts.renderCsvNoDataMessage(container, plugin, "Deadlift");

      const button = container.querySelector(
        ".add-log-button",
      ) as HTMLButtonElement;
      expect(button).toBeTruthy();

      button.click();

      expect(CreateLogModal).toHaveBeenCalledWith(
        plugin.app,
        plugin,
        "Deadlift",
        "[[TestPage]]",
        expect.any(Function),
      );
    });

    it("uses triggerWorkoutLogRefresh as default callback when no active file", () => {
      const container = createObsidianContainer();
      const plugin = createMockPlugin();

      LogCallouts.renderCsvNoDataMessage(container, plugin, "Bench");

      const button = container.querySelector(
        ".add-log-button",
      ) as HTMLButtonElement;
      button.click();

      // Get the callback that was passed to CreateLogModal
      const mockCalls = (CreateLogModal as jest.Mock).mock.calls;
      expect(mockCalls.length).toBe(1);

      // Callback should be a function
      const callback = mockCalls[0][4];
      expect(typeof callback).toBe("function");

      // Call the callback and verify it calls triggerWorkoutLogRefresh
      callback();
      expect(plugin.triggerWorkoutLogRefresh).toHaveBeenCalled();
    });
  });

  describe("renderAddLogButton", () => {
    it("does not render button when currentPageLink is empty", () => {
      const container = createObsidianContainer();
      const plugin = createMockPlugin();

      LogCallouts.renderAddLogButton(container, "Squat", "", plugin);

      expect(container.querySelector(".workout-btn-primary")).toBeNull();
    });

    it("renders add log button with currentPageLink", () => {
      const container = createObsidianContainer();
      const plugin = createMockPlugin();

      LogCallouts.renderAddLogButton(
        container,
        "Squat",
        "[[WorkoutPage]]",
        plugin,
      );

      const button = container.querySelector(".workout-btn-primary");
      expect(button).toBeTruthy();
    });

    it("opens CreateLogModal when button is clicked", () => {
      const container = createObsidianContainer();
      const plugin = createMockPlugin();

      LogCallouts.renderAddLogButton(container, "Squat", "[[Page]]", plugin);

      const button = container.querySelector(
        ".workout-btn-primary",
      ) as HTMLButtonElement;
      button.click();

      expect(CreateLogModal).toHaveBeenCalledWith(
        plugin.app,
        plugin,
        "Squat",
        "[[Page]]",
        undefined,
        undefined,
      );
    });

    it("opens CreateLogModal with prefill data from latest entry", () => {
      const container = createObsidianContainer();
      const plugin = createMockPlugin();
      const latestEntry: WorkoutLogData = {
        date: "2024-01-15",
        exercise: "Squat",
        reps: 10,
        weight: 100,
        volume: 1000,
        origine: "test",
        workout: "Leg Day",
        timestamp: new Date("2024-01-15T10:30:00").getTime(),
        notes: "Felt good",
        protocol: WorkoutProtocol.DROP_SET,
        customFields: { tempo: "2-1-2" },
      };

      LogCallouts.renderAddLogButton(
        container,
        "Squat",
        "[[Page]]",
        plugin,
        undefined,
        undefined,
        latestEntry,
      );

      const button = container.querySelector(
        ".workout-btn-primary",
      ) as HTMLButtonElement;
      button.click();

      expect(CreateLogModal).toHaveBeenCalledWith(
        plugin.app,
        plugin,
        "Squat",
        "[[Page]]",
        undefined,
        {
          exercise: "Squat",
          weight: 100,
          reps: 10,
          workout: "Leg Day",
          notes: "Felt good",
          protocol: WorkoutProtocol.DROP_SET,
          customFields: { tempo: "2-1-2" },
        },
      );
    });

    it("calls onLogCreated callback when provided", () => {
      const container = createObsidianContainer();
      const plugin = createMockPlugin();
      const onLogCreated = jest.fn();

      LogCallouts.renderAddLogButton(
        container,
        "Squat",
        "[[Page]]",
        plugin,
        onLogCreated,
      );

      const button = container.querySelector(
        ".workout-btn-primary",
      ) as HTMLButtonElement;
      button.click();

      expect(CreateLogModal).toHaveBeenCalledWith(
        plugin.app,
        plugin,
        "Squat",
        "[[Page]]",
        onLogCreated,
        undefined,
      );
    });

    it("handles latestEntry with undefined workout and notes", () => {
      const container = createObsidianContainer();
      const plugin = createMockPlugin();
      const latestEntry: WorkoutLogData = {
        date: "2024-01-15",
        exercise: "Squat",
        reps: 10,
        weight: 100,
        volume: 1000,
        origine: "test",
        workout: undefined as unknown as string,
        timestamp: new Date("2024-01-15T10:30:00").getTime(),
        notes: undefined as unknown as string,
        protocol: WorkoutProtocol.DROP_SET,
        customFields: undefined,
      };

      LogCallouts.renderAddLogButton(
        container,
        "Squat",
        "[[Page]]",
        plugin,
        undefined,
        undefined,
        latestEntry,
      );

      const button = container.querySelector(
        ".workout-btn-primary",
      ) as HTMLButtonElement;
      button.click();

      expect(CreateLogModal).toHaveBeenCalledWith(
        plugin.app,
        plugin,
        "Squat",
        "[[Page]]",
        undefined,
        {
          exercise: "Squat",
          weight: 100,
          reps: 10,
          workout: "",
          notes: "",
          protocol: WorkoutProtocol.DROP_SET,
          customFields: undefined,
        },
      );
    });
  });

  describe("renderCreateLogButtonForExercise", () => {
    it("renders create log button for exercise", () => {
      const container = createObsidianContainer();
      const plugin = createMockPlugin({ basename: "TestExercise" });

      LogCallouts.renderCreateLogButtonForExercise(
        container,
        "Bench Press",
        plugin,
      );

      expect(
        container.querySelector(".create-log-button-container"),
      ).toBeTruthy();
      expect(container.querySelector(".create-log-button")).toBeTruthy();
    });

    it("opens CreateLogModal when button is clicked", () => {
      const container = createObsidianContainer();
      const plugin = createMockPlugin({ basename: "ExercisePage" });

      LogCallouts.renderCreateLogButtonForExercise(
        container,
        "Deadlift",
        plugin,
      );

      const button = container.querySelector(
        ".create-log-button",
      ) as HTMLButtonElement;
      button.click();

      expect(CreateLogModal).toHaveBeenCalledWith(
        plugin.app,
        plugin,
        "Deadlift",
        "[[ExercisePage]]",
        expect.any(Function),
      );
    });
  });

  describe("renderNoMatchMessage", () => {
    it("renders no match info message", () => {
      const container = createObsidianContainer();

      LogCallouts.renderNoMatchMessage(container);

      expect(container.querySelector(".workout-log-no-match")).toBeTruthy();
    });
  });
});
