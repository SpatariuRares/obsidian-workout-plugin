/** @jest-environment jsdom */

import { GoToExerciseButton } from "@app/features/tables/ui/GoToExerciseButton";
import { createObsidianContainer } from "@app/components/__tests__/obsidianDomMocks";
import { Button } from "@app/components/atoms";

jest.mock("@app/components/atoms", () => ({
  Button: {
    create: jest.fn(),
    onClick: jest.fn(),
  },
}));

describe("GoToExerciseButton", () => {
  let mockApp: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockApp = {
      vault: {
        getFiles: jest.fn().mockReturnValue([]),
      },
      workspace: {
        getLeaf: jest.fn().mockReturnValue({
          openFile: jest.fn(),
        }),
      },
    };
  });

  it("renders a button with correct props", () => {
    const container = createObsidianContainer();
    const mockBtn = document.createElement("button");
    (Button.create as jest.Mock).mockReturnValue(mockBtn);

    const result = GoToExerciseButton.render(container, {
      exerciseName: "Bench Press",
      app: mockApp,
    });

    expect(Button.create).toHaveBeenCalledWith(
      container,
      expect.objectContaining({
        className: "workout-btn-secondary",
      }),
    );
    expect(Button.onClick).toHaveBeenCalledWith(
      mockBtn,
      expect.any(Function),
      undefined,
    );
    expect(result).toBe(mockBtn);
  });

  it("passes abort signal to onClick", () => {
    const container = createObsidianContainer();
    const mockBtn = document.createElement("button");
    (Button.create as jest.Mock).mockReturnValue(mockBtn);
    const controller = new AbortController();

    GoToExerciseButton.render(
      container,
      { exerciseName: "Bench Press", app: mockApp },
      controller.signal,
    );

    expect(Button.onClick).toHaveBeenCalledWith(
      mockBtn,
      expect.any(Function),
      controller.signal,
    );
  });

  it("navigates to exercise file on click", () => {
    const container = createObsidianContainer();
    const mockBtn = document.createElement("button");
    (Button.create as jest.Mock).mockReturnValue(mockBtn);

    const mockFile = { basename: "Bench Press" };
    mockApp.vault.getFiles.mockReturnValue([mockFile]);
    const mockLeaf = { openFile: jest.fn() };
    mockApp.workspace.getLeaf.mockReturnValue(mockLeaf);

    GoToExerciseButton.render(container, {
      exerciseName: "Bench Press",
      app: mockApp,
    });

    // Get the click handler and invoke it
    const clickHandler = (Button.onClick as jest.Mock).mock.calls[0][1];
    clickHandler();

    expect(mockApp.vault.getFiles).toHaveBeenCalled();
    expect(mockLeaf.openFile).toHaveBeenCalledWith(mockFile);
  });

  it("handles .md extension in exercise name", () => {
    const container = createObsidianContainer();
    const mockBtn = document.createElement("button");
    (Button.create as jest.Mock).mockReturnValue(mockBtn);

    const mockFile = { basename: "bench press" };
    mockApp.vault.getFiles.mockReturnValue([mockFile]);
    const mockLeaf = { openFile: jest.fn() };
    mockApp.workspace.getLeaf.mockReturnValue(mockLeaf);

    GoToExerciseButton.render(container, {
      exerciseName: "Bench Press.md",
      app: mockApp,
    });

    const clickHandler = (Button.onClick as jest.Mock).mock.calls[0][1];
    clickHandler();

    expect(mockLeaf.openFile).toHaveBeenCalledWith(mockFile);
  });

  it("does not open file when exercise not found", () => {
    const container = createObsidianContainer();
    const mockBtn = document.createElement("button");
    (Button.create as jest.Mock).mockReturnValue(mockBtn);

    mockApp.vault.getFiles.mockReturnValue([]);

    GoToExerciseButton.render(container, {
      exerciseName: "Nonexistent",
      app: mockApp,
    });

    const clickHandler = (Button.onClick as jest.Mock).mock.calls[0][1];
    clickHandler();

    expect(mockApp.workspace.getLeaf).not.toHaveBeenCalled();
  });
});
