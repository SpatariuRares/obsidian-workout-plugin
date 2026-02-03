import { CodeBlockEditorService } from "../CodeBlockEditorService";
import { App, MarkdownView } from "obsidian";

describe("CodeBlockEditorService", () => {
  let app: App;
  let mockEditor: any;
  let mockView: any;

  beforeEach(() => {
    app = new App();
    mockEditor = {
      getValue: jest.fn(),
      setValue: jest.fn(),
    };
    mockView = {
      editor: mockEditor,
    };
    (app.workspace.getActiveViewOfType as jest.Mock).mockReturnValue(mockView);
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
      mockEditor.getValue.mockReturnValue(content);

      const result = await CodeBlockEditorService.updateTargetWeight(
        app,
        "Bench Press",
        105,
      );

      expect(result).toBe(true);
      expect(mockEditor.setValue).toHaveBeenCalledWith(
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
      mockEditor.getValue.mockReturnValue(content);
      const result = await CodeBlockEditorService.updateTargetWeight(
        app,
        "Bench Press",
        105,
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
      mockEditor.getValue.mockReturnValue(content);

      const result = await CodeBlockEditorService.setParameter(
        app,
        "workout-chart",
        "Running",
        "type",
        "pace",
      );

      expect(result).toBe(true);
      expect(mockEditor.setValue).toHaveBeenCalledWith(
        expect.stringContaining("type: pace"),
      );
    });

    it("should add new parameter if missing", async () => {
      const content = `
\`\`\`workout-chart
exercise: Running
\`\`\`
`;
      mockEditor.getValue.mockReturnValue(content);

      const result = await CodeBlockEditorService.setParameter(
        app,
        "workout-chart",
        "Running",
        "type",
        "distance",
      );

      expect(result).toBe(true);
      // Verify it was added
      expect(mockEditor.setValue).toHaveBeenCalledWith(
        expect.stringContaining("type: distance"),
      );
    });
  });
});
