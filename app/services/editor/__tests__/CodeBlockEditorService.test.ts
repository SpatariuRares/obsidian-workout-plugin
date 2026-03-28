import { CodeBlockEditorService } from "../CodeBlockEditorService";
import { App, MarkdownView } from "obsidian";

describe("CodeBlockEditorService", () => {
  let app: App;
  let mockEditor: any;
  let mockView: any;
  let mockFile: any;

  beforeEach(() => {
    app = new App();
    mockFile = { path: "test.md" };
    mockEditor = {
      getValue: jest.fn(),
      setValue: jest.fn(),
    };
    mockView = {
      editor: mockEditor,
      file: mockFile,
    };
    (app.workspace.getActiveViewOfType as jest.Mock).mockReturnValue(mockView);
    (app.vault.read as jest.Mock).mockResolvedValue("");
    (app.vault.modify as jest.Mock).mockResolvedValue(undefined);
    jest.clearAllMocks();
  });

  describe("updateTargetWeight", () => {
    it("should update targetWeight for matching exercise", async () => {
      const content = `
\`\`\`workout-log
exercise: Bench Press
targetWeight: 100
\`\`\`
`;
      (app.vault.read as jest.Mock).mockResolvedValue(content);

      const result = await CodeBlockEditorService.updateTargetWeight(
        app,
        "Bench Press",
        105,
      );

      expect(result).toBe(true);
      expect(app.vault.modify).toHaveBeenCalledWith(
        mockFile,
        expect.stringContaining("targetWeight: 105"),
      );
    });

    it("should return false if no active view", async () => {
      (app.workspace.getActiveViewOfType as jest.Mock).mockReturnValue(null);
      const result = await CodeBlockEditorService.updateTargetWeight(
        app,
        "Bench Press",
        100,
      );
      expect(result).toBe(false);
    });

    it("should return false if exercise block not found", async () => {
      const content = `
\`\`\`workout-log
exercise: Squat
targetWeight: 100
\`\`\`
`;
      (app.vault.read as jest.Mock).mockResolvedValue(content);
      const result = await CodeBlockEditorService.updateTargetWeight(
        app,
        "Bench Press",
        105,
      );
      expect(result).toBe(false);
    });

    it("should return false when an error is thrown", async () => {
      (app.vault.read as jest.Mock).mockImplementation(() => {
        throw new Error("Test error");
      });

      const result = await CodeBlockEditorService.updateTargetWeight(
        app,
        "Bench Press",
        100,
      );

      expect(result).toBe(false);
    });
  });

  describe("setParameter", () => {
    it("should update existing parameter", async () => {
      const content = `
\`\`\`workout-chart
exercise: Running
type: distance
\`\`\`
`;
      (app.vault.read as jest.Mock).mockResolvedValue(content);

      const result = await CodeBlockEditorService.setParameter(
        app,
        "workout-chart",
        "Running",
        "type",
        "pace",
      );

      expect(result).toBe(true);
      expect(app.vault.modify).toHaveBeenCalledWith(
        mockFile,
        expect.stringContaining("type: pace"),
      );
    });

    it("should add new parameter if missing", async () => {
      const content = `
\`\`\`workout-chart
exercise: Running
\`\`\`
`;
      (app.vault.read as jest.Mock).mockResolvedValue(content);

      const result = await CodeBlockEditorService.setParameter(
        app,
        "workout-chart",
        "Running",
        "type",
        "distance",
      );

      expect(result).toBe(true);
      // Verify it was added
      expect(app.vault.modify).toHaveBeenCalledWith(
        mockFile,
        expect.stringContaining("type: distance"),
      );
    });

    it("should return false if no active view", async () => {
      (app.workspace.getActiveViewOfType as jest.Mock).mockReturnValue(null);

      const result = await CodeBlockEditorService.setParameter(
        app,
        "workout-chart",
        "Running",
        "type",
        "distance",
      );

      expect(result).toBe(false);
    });

    it("should return false if exercise not found", async () => {
      const content = `
\`\`\`workout-chart
exercise: Swimming
type: distance
\`\`\`
`;
      (app.vault.read as jest.Mock).mockResolvedValue(content);

      const result = await CodeBlockEditorService.setParameter(
        app,
        "workout-chart",
        "Running",
        "type",
        "pace",
      );

      expect(result).toBe(false);
    });

    it("should skip non-matching code blocks and find the correct one", async () => {
      const content = `
\`\`\`workout-chart
exercise: Swimming
type: distance
\`\`\`

\`\`\`workout-chart
exercise: Running
type: distance
\`\`\`
`;
      (app.vault.read as jest.Mock).mockResolvedValue(content);

      const result = await CodeBlockEditorService.setParameter(
        app,
        "workout-chart",
        "Running",
        "type",
        "pace",
      );

      expect(result).toBe(true);
      expect(app.vault.modify).toHaveBeenCalledWith(
        mockFile,
        expect.stringContaining("type: pace"),
      );
    });

    it("should return false when an error is thrown", async () => {
      (app.vault.read as jest.Mock).mockImplementation(() => {
        throw new Error("Test error");
      });

      const result = await CodeBlockEditorService.setParameter(
        app,
        "workout-chart",
        "Running",
        "type",
        "distance",
      );

      expect(result).toBe(false);
    });

    it("should handle boolean values", async () => {
      const content = `
\`\`\`workout-chart
exercise: Running
showTrendLine: false
\`\`\`
`;
      (app.vault.read as jest.Mock).mockResolvedValue(content);

      const result = await CodeBlockEditorService.setParameter(
        app,
        "workout-chart",
        "Running",
        "showTrendLine",
        true,
      );

      expect(result).toBe(true);
      expect(app.vault.modify).toHaveBeenCalledWith(
        mockFile,
        expect.stringContaining("showTrendLine: true"),
      );
    });

    it("should return false when code block has no closing delimiter", async () => {
      // Malformed markdown: code block never closes
      const content = `
\`\`\`workout-chart
exercise: Running
type: distance
`;
      (app.vault.read as jest.Mock).mockResolvedValue(content);

      const result = await CodeBlockEditorService.setParameter(
        app,
        "workout-chart",
        "Running",
        "newParam",
        "value",
      );

      // foundExercise is true but codeBlockEndIndex is -1
      expect(result).toBe(false);
    });
  });
});
