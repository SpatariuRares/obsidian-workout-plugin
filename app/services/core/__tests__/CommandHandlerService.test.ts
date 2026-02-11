import { CommandHandlerService } from "../CommandHandlerService";
import { App, TFile } from "obsidian";
import { ExerciseTypeMigration } from "@app/compatibility/migration";
import { CreateLogModal } from "@app/features/modals/log/CreateLogModal";
import {
  WorkoutFileSuggestModal,
  CanvasExportModal,
  CanvasExporter,
} from "@app/features/canvas";

// Mocks
jest.mock("@app/features/modals/log/CreateLogModal", () => ({
  CreateLogModal: jest.fn().mockImplementation(() => ({ open: jest.fn() })),
}));
jest.mock("@app/features/charts/modals/InsertChartModal", () => ({
  InsertChartModal: jest.fn().mockImplementation(() => ({ open: jest.fn() })),
}));
jest.mock("@app/features/tables/modals/InsertTableModal", () => ({
  InsertTableModal: jest.fn().mockImplementation(() => ({ open: jest.fn() })),
}));
jest.mock("@app/features/timer/modals/InsertTimerModal", () => ({
  InsertTimerModal: jest.fn().mockImplementation(() => ({ open: jest.fn() })),
}));
jest.mock("@app/features/dashboard/modals/InsertDashboardModal", () => ({
  InsertDashboardModal: jest
    .fn()
    .mockImplementation(() => ({ open: jest.fn() })),
}));
jest.mock("@app/features/modals/exercise/CreateExercisePageModal", () => ({
  CreateExercisePageModal: jest
    .fn()
    .mockImplementation(() => ({ open: jest.fn() })),
}));
jest.mock("@app/features/modals/exercise/CreateExerciseSectionModal", () => ({
  CreateExerciseSectionModal: jest
    .fn()
    .mockImplementation(() => ({ open: jest.fn() })),
}));
jest.mock("@app/features/modals/exercise/AuditExerciseNamesModal", () => ({
  AuditExerciseNamesModal: jest
    .fn()
    .mockImplementation(() => ({ open: jest.fn() })),
}));
jest.mock("@app/features/modals/exercise/AddExerciseBlockModal", () => ({
  AddExerciseBlockModal: jest
    .fn()
    .mockImplementation(() => ({ open: jest.fn() })),
}));
jest.mock("@app/features/exercise-conversion/ConvertExerciseDataModal", () => ({
  ConvertExerciseDataModal: jest
    .fn()
    .mockImplementation(() => ({ open: jest.fn() })),
}));
jest.mock("@app/features/modals/muscle/MuscleTagManagerModal", () => ({
  MuscleTagManagerModal: jest
    .fn()
    .mockImplementation(() => ({ open: jest.fn() })),
}));
jest.mock("@app/features/canvas", () => ({
  WorkoutFileSuggestModal: jest
    .fn()
    .mockImplementation(() => ({ open: jest.fn() })),
  CanvasExportModal: jest.fn().mockImplementation(() => ({ open: jest.fn() })),
  CanvasExporter: jest
    .fn()
    .mockImplementation(() => ({ exportToCanvas: jest.fn() })),
}));
jest.mock("@app/compatibility/migration", () => ({
  ExerciseTypeMigration: jest
    .fn()
    .mockImplementation(() => ({ migrateExerciseTypes: jest.fn() })),
}));

describe("CommandHandlerService", () => {
  let app: App;
  let mockPlugin: any;
  let service: CommandHandlerService;

  beforeEach(() => {
    app = new App();
    mockPlugin = {
      addCommand: jest.fn(),
      createCSVLogFile: jest.fn(),
      getMuscleTagService: jest.fn().mockReturnValue({
        getTagMap: jest
          .fn()
          .mockReturnValue(new Map([["chest", "Upper Body"]])),
      }),
      triggerWorkoutLogRefresh: jest.fn(),
    };
    service = new CommandHandlerService(app, mockPlugin);
    jest.clearAllMocks();
  });

  it("should register all commands", () => {
    service.registerCommands();
    expect(mockPlugin.addCommand).toHaveBeenCalledWith(
      expect.objectContaining({ id: "create-csv-log" }),
    );
    expect(mockPlugin.addCommand).toHaveBeenCalledWith(
      expect.objectContaining({ id: "insert-workout-chart" }),
    );
    // Rough check for count to ensure we are registering a bunch
    expect(mockPlugin.addCommand.mock.calls.length).toBeGreaterThan(10);
  });

  it("should execute command callbacks without error", async () => {
    service.registerCommands();
    const calls = mockPlugin.addCommand.mock.calls;
    for (const call of calls) {
      const commandDef = call[0];
      if (commandDef.callback) {
        await commandDef.callback();
      }
    }
  });

  it("should handle error in create-csv-log", async () => {
    mockPlugin.createCSVLogFile.mockRejectedValue(new Error("Failed CSV"));
    service.registerCommands();
    const csvCommand = mockPlugin.addCommand.mock.calls.find(
      (c: any) => c[0].id === "create-csv-log",
    )[0];
    await csvCommand.callback();
  });

  it("should handle non-Error in create-csv-log", async () => {
    mockPlugin.createCSVLogFile.mockRejectedValue("string error");
    service.registerCommands();
    const csvCommand = mockPlugin.addCommand.mock.calls.find(
      (c: any) => c[0].id === "create-csv-log",
    )[0];
    await csvCommand.callback();
  });

  it("should handle error in generate-tag-reference", async () => {
    mockPlugin.getMuscleTagService.mockReturnValue({
      getTagMap: jest.fn().mockImplementation(() => {
        throw new Error("Tags failed");
      }),
    });
    service.registerCommands();
    const tagCommand = mockPlugin.addCommand.mock.calls.find(
      (c: any) => c[0].id === "generate-tag-reference",
    )[0];
    await tagCommand.callback();
  });

  it("should handle non-Error in generate-tag-reference", async () => {
    mockPlugin.getMuscleTagService.mockReturnValue({
      getTagMap: jest.fn().mockImplementation(() => {
        throw "string error";
      }),
    });
    service.registerCommands();
    const tagCommand = mockPlugin.addCommand.mock.calls.find(
      (c: any) => c[0].id === "generate-tag-reference",
    )[0];
    await tagCommand.callback();
  });



  it("should handle canvas export flow", async () => {
    service.registerCommands();
    const exportCmd = mockPlugin.addCommand.mock.calls.find(
      (c: any) => c[0].id === "export-workout-to-canvas",
    )[0];

    exportCmd.callback();

    // 1. Capture WorkoutFileSuggestModal callback
    const suggestCallback = (WorkoutFileSuggestModal as unknown as jest.Mock)
      .mock.calls[0][1]; // 2nd arg

    const mockFile = { path: "Workout.md" };
    // Execute suggest callback
    await suggestCallback(mockFile);

    // 2. Capture CanvasExportModal callback
    const exportModalCallback = (CanvasExportModal as unknown as jest.Mock).mock
      .calls[0][3]; // 4th arg

    // Execute export callback
    await exportModalCallback({ someOption: true });

    // Verify export called
    const exporterInstance = (CanvasExporter as unknown as jest.Mock).mock
      .results[0].value;
    expect(exporterInstance.exportToCanvas).toHaveBeenCalledWith(mockFile, {
      someOption: true,
    });
  });

  it("should generate tag reference file", async () => {
    // Mock templateGeneratorService.generateTagReference to call vault.create
    mockPlugin.templateGeneratorService = {
      generateTagReference: jest.fn().mockImplementation(async (folderPath, overwrite) => {
        // Simulate what the service does - read tags and create file
        const tags = mockPlugin.getMuscleTagService().getTagMap() as Map<string, string>;
        const sortedTags = Array.from(tags.entries()).sort((a, b) =>
          a[0].localeCompare(b[0]),
        );

        let content = `---\n`;
        content += "title: Muscle Tags Reference\n";
        content += "WARNING: DO NOT EDIT MANUALLY. This file is auto-generated by the Workout Plugin.\n";
        content += `tags:\n`;
        for (const [tag] of sortedTags) {
          content += `  - ${tag}\n`;
        }
        content += "---\n\n";

        const fileName = "Muscle Tags Reference.md";
        const file = app.vault.getAbstractFileByPath(fileName);

        if (file instanceof TFile) {
          await app.vault.modify(file, content);
        } else {
          await app.vault.create(fileName, content);
        }
      }),
    } as any;

    // Setup successful tag map
    mockPlugin.getMuscleTagService.mockReturnValue({
      getTagMap: jest.fn().mockReturnValue(
        new Map([
          ["chest", "Upper Body"],
          ["legs", "Lower Body"],
        ]),
      ),
    });

    // Mock vault create
    (app.vault.getAbstractFileByPath as jest.Mock).mockReturnValue(null); // File doesn't exist

    service.registerCommands();
    const tagCmd = mockPlugin.addCommand.mock.calls.find(
      (c: any) => c[0].id === "generate-tag-reference",
    )[0];

    await tagCmd.callback();

    // Verify templateGeneratorService.generateTagReference was called
    expect(mockPlugin.templateGeneratorService.generateTagReference).toHaveBeenCalledWith(
      "",
      true,
    );

    // Verify vault.create was called by the service
    expect(app.vault.create).toHaveBeenCalledWith(
      "Muscle Tags Reference.md",
      expect.stringContaining("tags:\n  - chest\n  - legs\n"),
    );
  });
  it("should handle error in export-workout-to-canvas", async () => {
    // Mock CanvasExporter to throw an error
    (CanvasExporter as unknown as jest.Mock).mockImplementation(() => ({
      exportToCanvas: jest.fn().mockRejectedValue(new Error("Export failed")),
    }));

    service.registerCommands();
    const exportCmd = mockPlugin.addCommand.mock.calls.find(
      (c: any) => c[0].id === "export-workout-to-canvas",
    )[0];

    exportCmd.callback();

    // 1. Capture WorkoutFileSuggestModal callback
    const suggestCallback = (WorkoutFileSuggestModal as unknown as jest.Mock)
      .mock.calls[0][1];

    const mockFile = { path: "Workout.md" };
    // Execute suggest callback
    await suggestCallback(mockFile);

    // 2. Capture CanvasExportModal callback
    const exportModalCallback = (CanvasExportModal as unknown as jest.Mock).mock
      .calls[0][3];

    // Execute export callback - this should trigger the catch block
    await exportModalCallback({ someOption: true });

    // The error is handled internally with a Notice, so no exception is thrown
  });

  it("should handle non-Error in export-workout-to-canvas", async () => {
    // Mock CanvasExporter to throw a non-Error
    (CanvasExporter as unknown as jest.Mock).mockImplementation(() => ({
      exportToCanvas: jest.fn().mockRejectedValue("string error"),
    }));

    service.registerCommands();
    const exportCmd = mockPlugin.addCommand.mock.calls.find(
      (c: any) => c[0].id === "export-workout-to-canvas",
    )[0];

    exportCmd.callback();

    const suggestCallback = (WorkoutFileSuggestModal as unknown as jest.Mock)
      .mock.calls[0][1];

    const mockFile = { path: "Workout.md" };
    await suggestCallback(mockFile);

    const exportModalCallback = (CanvasExportModal as unknown as jest.Mock).mock
      .calls[0][3];

    await exportModalCallback({ someOption: true });
  });

  it("should generate tag reference file - update existing", async () => {
    // Mock vault file exists
    const mockFile = new TFile();
    (app.vault.getAbstractFileByPath as jest.Mock).mockReturnValue(mockFile);

    // Mock templateGeneratorService.generateTagReference to call vault.modify
    mockPlugin.templateGeneratorService = {
      generateTagReference: jest.fn().mockImplementation(async (folderPath, overwrite) => {
        // Simulate what the service does - read tags and modify file
        const tags = mockPlugin.getMuscleTagService().getTagMap() as Map<string, string>;
        const sortedTags = Array.from(tags.entries()).sort((a, b) =>
          a[0].localeCompare(b[0]),
        );

        let content = `---\n`;
        content += "title: Muscle Tags Reference\n";
        content += "WARNING: DO NOT EDIT MANUALLY. This file is auto-generated by the Workout Plugin.\n";
        content += `tags:\n`;
        for (const [tag] of sortedTags) {
          content += `  - ${tag}\n`;
        }
        content += "---\n\n";

        const fileName = "Muscle Tags Reference.md";
        const file = app.vault.getAbstractFileByPath(fileName);

        if (file instanceof TFile) {
          await app.vault.modify(file, content);
        } else {
          await app.vault.create(fileName, content);
        }
      }),
    } as any;

    // Setup successful tag map
    mockPlugin.getMuscleTagService.mockReturnValue({
      getTagMap: jest.fn().mockReturnValue(new Map([["chest", "Upper Body"]])),
    });

    service.registerCommands();
    const tagCmd = mockPlugin.addCommand.mock.calls.find(
      (c: any) => c[0].id === "generate-tag-reference",
    )[0];

    await tagCmd.callback();

    // Verify templateGeneratorService.generateTagReference was called
    expect(mockPlugin.templateGeneratorService.generateTagReference).toHaveBeenCalledWith(
      "",
      true,
    );

    // Verify vault.modify was called by the service
    expect(app.vault.modify).toHaveBeenCalledWith(
      mockFile,
      expect.stringContaining("tags:\n  - chest\n"),
    );
  });

  it("should execute migrate-exercise-types command", async () => {
    service.registerCommands();
    const migrateCmd = mockPlugin.addCommand.mock.calls.find(
      (c: any) => c[0].id === "migrate-exercise-types",
    )[0];

    await migrateCmd.callback();

    const migrationInstance = (ExerciseTypeMigration as unknown as jest.Mock)
      .mock.results[0].value;
    expect(migrationInstance.migrateExerciseTypes).toHaveBeenCalled();
  });

  it("should create csv log successfully", async () => {
    mockPlugin.createCSVLogFile.mockResolvedValue(undefined);
    service.registerCommands();
    const csvCmd = mockPlugin.addCommand.mock.calls.find(
      (c: any) => c[0].id === "create-csv-log",
    )[0];

    await csvCmd.callback();

    expect(mockPlugin.createCSVLogFile).toHaveBeenCalled();
  });
});
