import { CSVColumnService } from "../CSVColumnService";
import { App, TFile } from "obsidian";
import {
  WorkoutChartsSettings,
  STANDARD_CSV_COLUMNS,
} from "@app/types/WorkoutLogData";
import * as WorkoutLogDataModule from "@app/types/WorkoutLogData";

// Mock dependencies
jest.mock("obsidian");
jest.mock("@app/types/WorkoutLogData", () => ({
  ...jest.requireActual("@app/types/WorkoutLogData"),
  parseCSVLogFile: jest.fn(),
  entriesToCSVContent: jest.fn(),
}));

describe("CSVColumnService", () => {
  let service: CSVColumnService;
  let mockApp: App;
  let mockSettings: WorkoutChartsSettings;
  let mockVault: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockVault = {
      getAbstractFileByPath: jest.fn(),
      read: jest.fn(),
      process: jest.fn(),
    };

    mockApp = {
      vault: mockVault,
    } as unknown as App;

    mockSettings = {
      csvLogFilePath: "folder/workout_log.csv",
    } as WorkoutChartsSettings;

    service = new CSVColumnService(mockApp, mockSettings);
  });

  describe("getCSVColumns", () => {
    it("should return standard columns if file not found", async () => {
      mockVault.getAbstractFileByPath.mockReturnValue(null);

      const columns = await service.getCSVColumns();

      expect(columns).toEqual(expect.arrayContaining(STANDARD_CSV_COLUMNS));
    });

    it("should return standard columns if file is empty", async () => {
      const mockFile = new TFile();
      mockVault.getAbstractFileByPath.mockReturnValue(mockFile);
      mockVault.read.mockResolvedValue("");

      const columns = await service.getCSVColumns();

      expect(columns).toEqual(expect.arrayContaining(STANDARD_CSV_COLUMNS));
    });

    it("should return columns from file header", async () => {
      const mockFile = new TFile();
      mockVault.getAbstractFileByPath.mockReturnValue(mockFile);
      mockVault.read.mockResolvedValue(
        "Date,Exercise,CustomCol\n2023-01-01,Pushups,10",
      );

      const columns = await service.getCSVColumns();

      expect(columns).toEqual(["Date", "Exercise", "CustomCol"]);
    });

    it("should handle quoted column names", async () => {
      const mockFile = new TFile();
      mockVault.getAbstractFileByPath.mockReturnValue(mockFile);
      mockVault.read.mockResolvedValue(
        '"Date","Exercise name","Custom,Col"\n...',
      );

      const columns = await service.getCSVColumns();

      expect(columns).toEqual(["Date", "Exercise name", "Custom,Col"]);
    });
  });

  describe("ensureColumnExists", () => {
    it("should return early if column is standard", async () => {
      await service.ensureColumnExists("Date");
      expect(mockVault.process).not.toHaveBeenCalled();
    });

    it("should return early if file does not exist", async () => {
      mockVault.getAbstractFileByPath.mockReturnValue(null);
      await service.ensureColumnExists("NewCol");
      expect(mockVault.process).not.toHaveBeenCalled();
    });

    it("should return early if column already exists in file", async () => {
      const mockFile = new TFile();
      mockVault.getAbstractFileByPath.mockReturnValue(mockFile);
      // Mock reading the file to check headers
      mockVault.read.mockResolvedValue("Date,Exercise,ExistingCol\n...");

      await service.ensureColumnExists("ExistingCol");

      expect(mockVault.process).not.toHaveBeenCalled();
    });

    it("should add column if it does not exist", async () => {
      const mockFile = new TFile();
      mockVault.getAbstractFileByPath.mockReturnValue(mockFile);
      mockVault.read.mockResolvedValue("Date,Exercise\nVal1,Val2");

      // Mock process implementation to simulate content update
      mockVault.process.mockImplementation(async (file: any, callback: any) => {
        const content = "Date,Exercise\nVal1,Val2";
        const newContent = await callback(content);
        return newContent;
      });

      (WorkoutLogDataModule.parseCSVLogFile as jest.Mock).mockReturnValue([
        { Date: "Val1", Exercise: "Val2" },
      ]);
      (WorkoutLogDataModule.entriesToCSVContent as jest.Mock).mockReturnValue(
        "new content",
      );

      const onInvalidate = jest.fn();
      await service.ensureColumnExists("NewCol", onInvalidate);

      expect(mockVault.process).toHaveBeenCalled();

      // Check that entriesToCSVContent was called with the new column list
      const expectedNewColumns = ["NewCol"]; // since standard cols are filtered out in the implementation logic before passing to entriesToCSVContent?
      // Actually implementation filters EXISTING Custom cols, and adds new one.
      // Date, Exercise are standard. So existing custom is empty.

      expect(WorkoutLogDataModule.entriesToCSVContent).toHaveBeenCalledWith(
        expect.anything(),
        expect.arrayContaining(["NewCol"]),
      );

      expect(onInvalidate).toHaveBeenCalled();
    });
  });

  describe("getCustomColumns", () => {
    it("should return only non-standard columns", async () => {
      const mockFile = new TFile();
      mockVault.getAbstractFileByPath.mockReturnValue(mockFile);

      // Header has STANDARD columns + Custom1 + Custom2
      const header = [...STANDARD_CSV_COLUMNS, "Custom1", "Custom2"].join(",");
      mockVault.read.mockResolvedValue(header);

      const customCols = await service.getCustomColumns();

      expect(customCols).toEqual(["Custom1", "Custom2"]);
    });
  });

  describe("parseCSVLine", () => {
    it("should parse simple comma-separated values", () => {
      const line = "val1,val2,val3";
      expect(service.parseCSVLine(line)).toEqual(["val1", "val2", "val3"]);
    });

    it("should handle quoted values containing commas", () => {
      const line = '"val1, part2",val2,"val3"';
      expect(service.parseCSVLine(line)).toEqual([
        "val1, part2",
        "val2",
        "val3",
      ]);
    });

    it("should handle empty fields", () => {
      const line = "val1,,val3,";
      expect(service.parseCSVLine(line)).toEqual(["val1", "", "val3", ""]);
    });
  });
});
