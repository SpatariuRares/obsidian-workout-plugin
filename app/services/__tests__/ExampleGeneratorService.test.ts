import { ExampleGeneratorService } from "../ExampleGeneratorService";
import { App, TFolder, TFile } from "obsidian";

// Mocks are automatically picked up from __mocks__/obsidian.ts due to jest module mapping

describe("ExampleGeneratorService", () => {
  let app: App;
  let service: ExampleGeneratorService;

  beforeEach(() => {
    app = new App();
    service = new ExampleGeneratorService(app);
    jest.clearAllMocks();
  });

  describe("generateExampleFolder", () => {
    it("should create folders and files when they do not exist", async () => {
      // Setup: getAbstractFileByPath returns null (files don't exist)
      (app.vault.getAbstractFileByPath as jest.Mock).mockReturnValue(null);

      await service.generateExampleFolder(false);

      // Verify folders creation
      expect(app.vault.createFolder).toHaveBeenCalledWith("The gym examples");
      expect(app.vault.createFolder).toHaveBeenCalledWith(
        "The gym examples/Exercises",
      );
      expect(app.vault.createFolder).toHaveBeenCalledWith(
        "The gym examples/Workouts",
      );
      expect(app.vault.createFolder).toHaveBeenCalledWith(
        "The gym examples/Log",
      );

      // Verify files creation (checking a few key files)
      expect(app.vault.create).toHaveBeenCalledWith(
        expect.stringContaining("Getting Started.md"),
        expect.any(String),
      );
      expect(app.vault.create).toHaveBeenCalledWith(
        expect.stringContaining("Bench Press.md"),
        expect.any(String),
      );
      expect(app.vault.create).toHaveBeenCalledWith(
        expect.stringContaining("workout_logs.csv"),
        expect.any(String),
      );
    });

    it("should not overwrite existing files if overwrite is false", async () => {
      // Setup: files exist
      const mockFile = new TFile();
      (app.vault.getAbstractFileByPath as jest.Mock).mockReturnValue(mockFile);

      await service.generateExampleFolder(false);

      // Verify modify was NOT called
      expect(app.vault.modify).not.toHaveBeenCalled();
      // createFolder checks existence first, so it might be called if we only return file for file checks
      // But here we return mockFile for everything including folders, which might check instanceof TFolder
    });

    it("should overwrite existing files if overwrite is true", async () => {
      // Setup: getAbstractFileByPath returns a TFile
      // Note: createFolderIfNotExists checks for TFolder.
      // We need to carefully mock getAbstractFileByPath to return TFolder for folders and TFile for files
      // or simpler: just verify modify is called for files

      (app.vault.getAbstractFileByPath as jest.Mock).mockImplementation(
        (path: string) => {
          if (path.endsWith(".md") || path.endsWith(".csv")) {
            return new TFile();
          }
          return new TFolder();
        },
      );

      await service.generateExampleFolder(true);

      expect(app.vault.modify).toHaveBeenCalled();
    });

    it("should handle error when creating folder fails", async () => {
      (app.vault.createFolder as jest.Mock).mockRejectedValue(
        new Error("Failed"),
      );

      // Should not throw, but catch and probably show Notice (which is mocked)
      await expect(service.generateExampleFolder(false)).resolves.not.toThrow();
    });
  });
});
