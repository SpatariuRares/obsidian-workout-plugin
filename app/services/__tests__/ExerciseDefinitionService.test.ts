import { ExerciseDefinitionService } from "../ExerciseDefinitionService";
import { App, TFile, TFolder, parseYaml } from "obsidian";
import { WorkoutChartsSettings } from "@app/types/WorkoutLogData";

// Mock constant resolving to avoid dependency on real constant implementation
jest.mock("@app/constants/exerciseTypes.constants", () => ({
  getExerciseTypeById: jest.fn(),
  DEFAULT_EXERCISE_TYPE_ID: "strength",
}));
import { getExerciseTypeById } from "@app/constants/exerciseTypes.constants";

// Mock ParameterUtils
jest.mock("@app/utils/ParameterUtils", () => ({
  ParameterUtils: {
    validateParam: jest.fn().mockReturnValue({ isValid: true }),
    validateParams: jest.fn().mockReturnValue({ isValid: true, errors: [] }),
  },
}));
import { ParameterUtils } from "@app/utils/ParameterUtils";

describe("ExerciseDefinitionService", () => {
  let app: App;
  let service: ExerciseDefinitionService;
  let mockSettings: WorkoutChartsSettings;

  beforeEach(() => {
    app = new App();
    mockSettings = {
      exerciseFolderPath: "Exercises",
    } as any;
    service = new ExerciseDefinitionService(app, mockSettings);
    jest.clearAllMocks();

    // Default mock for getExerciseTypeById
    (getExerciseTypeById as jest.Mock).mockImplementation((id) => {
      if (id === "strength")
        return {
          id: "strength",
          parameters: [{ key: "weight", type: "number" }],
        };
      if (id === "cardio")
        return {
          id: "cardio",
          parameters: [{ key: "duration", type: "number" }],
        };
      return undefined;
    });

    // Reset parseYaml to default simple implementation (including array support)
    (parseYaml as jest.Mock).mockImplementation((yaml: string) => {
      if (!yaml || !yaml.trim()) return null;
      const result: any = {};
      const lines = yaml.split("\n");
      let currentKey: string | null = null;
      let currentArray: string[] | null = null;

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        if (trimmed.startsWith("-")) {
          if (currentKey && currentArray !== null) {
            const value = trimmed.slice(1).trim();
            if (value) currentArray.push(value);
          }
          continue;
        }

        const colonIndex = trimmed.indexOf(":");
        if (colonIndex > 0) {
          if (currentKey && currentArray !== null) {
            result[currentKey] = currentArray;
          }
          const key = trimmed.slice(0, colonIndex).trim();
          const value = trimmed.slice(colonIndex + 1).trim();

          if (value) {
            result[key] = value;
            currentKey = null;
            currentArray = null;
          } else {
            currentKey = key;
            currentArray = [];
          }
        }
      }
      if (currentKey && currentArray !== null) {
        result[currentKey] = currentArray;
      }
      return Object.keys(result).length > 0 ? result : null;
    });
  });

  describe("getExerciseDefinition", () => {
    it("should return undefined if exercise not found", async () => {
      // Setup empty folder
      const mockFolder = new TFolder();
      mockFolder.children = [];
      (app.vault.getAbstractFileByPath as jest.Mock).mockReturnValue(
        mockFolder,
      );

      const result = await service.getExerciseDefinition("Unknown Exercise");
      expect(result).toBeUndefined();
    });

    it("should return definition if found in folder", async () => {
      // Setup folder with one file
      const mockFolder = new TFolder();
      const mockFile = new TFile();
      mockFile.extension = "md";
      mockFile.basename = "Bench Press";
      mockFolder.children = [mockFile];

      (app.vault.getAbstractFileByPath as jest.Mock).mockReturnValue(
        mockFolder,
      );

      // Setup file content with frontmatter
      const fileContent = `---
nome_esercizio: Bench Press
exercise_type: strength
tags:
  - chest
---
# Content`;
      (app.vault.read as jest.Mock).mockResolvedValue(fileContent);

      const result = await service.getExerciseDefinition("Bench Press");

      expect(result).toBeDefined();
      expect(result?.name).toBe("Bench Press");
      expect(result?.typeId).toBe("strength");
      expect(result?.muscleGroups).toContain("chest");
    });

    it("should support 'type' alias in frontmatter", async () => {
      const mockFolder = new TFolder();
      const mockFile = new TFile();
      mockFile.extension = "md";
      mockFile.basename = "Run";
      mockFolder.children = [mockFile];

      (app.vault.getAbstractFileByPath as jest.Mock).mockReturnValue(
        mockFolder,
      );
      (app.vault.read as jest.Mock).mockResolvedValue(`---
type: cardio
---`);

      const result = await service.getExerciseDefinition("Run");
      expect(result?.typeId).toBe("cardio");
    });

    it("should default to strength if type missing", async () => {
      const mockFolder = new TFolder();
      const mockFile = new TFile();
      mockFile.extension = "md";
      mockFile.basename = "Mystery";
      mockFolder.children = [mockFile];

      (app.vault.getAbstractFileByPath as jest.Mock).mockReturnValue(
        mockFolder,
      );
      (app.vault.read as jest.Mock).mockResolvedValue(`---
---`);
      const result = await service.getExerciseDefinition("Mystery");
      expect(result?.typeId).toBe("strength");
    });

    it("should use cache on subsequent calls", async () => {
      const mockFolder = new TFolder();
      const mockFile = new TFile();
      mockFile.extension = "md";
      mockFile.basename = "Push Up";
      mockFolder.children = [mockFile];

      (app.vault.getAbstractFileByPath as jest.Mock).mockReturnValue(
        mockFolder,
      );
      (app.vault.read as jest.Mock).mockResolvedValue(
        "---\nexercise_type: strength\n---",
      );

      await service.getExerciseDefinition("Push Up");
      await service.getExerciseDefinition("Push Up");

      expect(app.vault.read).toHaveBeenCalledTimes(1);
    });

    it("should ignore files dependent on file read error", async () => {
      const mockFolder = new TFolder();
      const mockFile = new TFile();
      mockFile.extension = "md";
      mockFile.basename = "Broken";
      mockFile.path = "Broken.md";
      mockFolder.children = [mockFile];

      (app.vault.getAbstractFileByPath as jest.Mock).mockReturnValue(
        mockFolder,
      );
      (app.vault.read as jest.Mock).mockRejectedValue(
        new Error("File Read Error"),
      );

      const result = await service.getAllExerciseDefinitions();
      expect(result.length).toBe(0);
    });

    it("should ignore non-markdown files", async () => {
      const mockFolder = new TFolder();
      const mockFile = new TFile();
      mockFile.extension = "csv"; // Not md
      mockFolder.children = [mockFile];

      (app.vault.getAbstractFileByPath as jest.Mock).mockReturnValue(
        mockFolder,
      );

      const result = await service.getAllExerciseDefinitions();
      expect(result.length).toBe(0);
    });
  });

  describe("saveExerciseDefinition", () => {
    it("should creating new file if it does not exist", async () => {
      (app.vault.getAbstractFileByPath as jest.Mock).mockReturnValue(null);

      const def = {
        name: "New Exercise",
        typeId: "cardio",
        muscleGroups: ["legs"],
        customParameters: [
          { key: "incline", type: "number", label: "Incline", required: false },
        ],
      };

      await service.saveExerciseDefinition(def as any);

      expect(app.vault.create).toHaveBeenCalledWith(
        expect.stringContaining("New Exercise.md"),
        expect.stringContaining("exercise_type: cardio"),
      );
      expect(app.vault.create).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining("incline"),
      );
    });

    it("should update existing file frontmatter", async () => {
      const mockFile = new TFile();
      (app.vault.getAbstractFileByPath as jest.Mock).mockReturnValue(mockFile);

      const def = {
        name: "Existing Exercise",
        typeId: "strength",
        customParameters: [{ key: "tempo", type: "string" }],
      };

      await service.saveExerciseDefinition(def as any);

      expect(app.fileManager.processFrontMatter).toHaveBeenCalledWith(
        mockFile,
        expect.any(Function),
      );

      // Verify callback logic
      const callback = (app.fileManager.processFrontMatter as jest.Mock).mock
        .calls[0][1];
      const frontmatter: any = {};
      callback(frontmatter);
      expect(frontmatter.exercise_type).toBe("strength");
      expect(frontmatter.parameters).toBeDefined();
    });

    it("should remove parameters if null/empty in update", async () => {
      const mockFile = new TFile();
      (app.vault.getAbstractFileByPath as jest.Mock).mockReturnValue(mockFile);

      const def = {
        name: "Existing Exercise",
        typeId: "strength",
      };

      await service.saveExerciseDefinition(def as any);

      const callback = (app.fileManager.processFrontMatter as jest.Mock).mock
        .calls[0][1];
      const frontmatter: any = { parameters: [{ key: "old" }] };
      callback(frontmatter);
      expect(frontmatter.parameters).toBeUndefined();
    });
  });

  describe("start to end parsing complex parameters", () => {
    it("should parse custom parameters correctly", async () => {
      const mockFolder = new TFolder();
      const mockFile = new TFile();
      mockFile.extension = "md";
      mockFile.basename = "Complex";
      mockFolder.children = [mockFile];

      (app.vault.getAbstractFileByPath as jest.Mock).mockReturnValue(
        mockFolder,
      );

      const content = `---
exercise_type: strength
parameters:
  - key:  incline 
    label: Incline Level
    type: number
    min: 0
    max: 15
    unit: "%"
    required: true
    default: 0
---`;
      (app.vault.read as jest.Mock).mockResolvedValue(content);

      (parseYaml as jest.Mock).mockReturnValue({
        exercise_type: "strength",
        parameters: [
          {
            key: "incline",
            label: "Incline Level",
            type: "number",
            min: 0,
            max: 15,
            unit: "%",
            required: true,
            default: 0,
          },
        ],
      });

      const result = await service.getExerciseDefinition("Complex");

      expect(result?.customParameters).toHaveLength(1);
      const param = result?.customParameters![0];
      expect(param?.key).toBe("incline");
      expect(param?.label).toBe("Incline Level");
      expect(param?.min).toBe(0);
      expect(param?.max).toBe(15);
      expect(param?.unit).toBe("%");
      expect(param?.required).toBe(true);
      expect(param?.default).toBe(0);
    });

    it("should skip invalid parameters", async () => {
      const mockFolder = new TFolder();
      const mockFile = new TFile();
      mockFile.extension = "md";
      mockFile.basename = "InvalidParams";
      mockFolder.children = [mockFile];

      (app.vault.getAbstractFileByPath as jest.Mock).mockReturnValue(
        mockFolder,
      );
      const content = `---
parameters:
  - key: "bad_param"
    type: number
  - key: "valid_param"
    type: number
---`;
      (app.vault.read as jest.Mock).mockResolvedValue(content);

      (parseYaml as jest.Mock).mockReturnValue({
        parameters: [
          { key: "bad_param", type: "number" },
          { key: "valid_param", type: "number" },
        ],
      });

      // Mock validation failure for specific key
      (ParameterUtils.validateParam as jest.Mock).mockImplementation((p) => {
        if (p.key === "bad_param") return { isValid: false, error: "Bad" };
        return { isValid: true };
      });

      const result = await service.getExerciseDefinition("InvalidParams");
      // Should skip bad_param
      expect(result?.customParameters).toHaveLength(1);
      expect(result?.customParameters![0].key).toBe("valid_param");

      // Reset mock
      (ParameterUtils.validateParam as jest.Mock).mockReturnValue({
        isValid: true,
      });
    });
  });

  describe("getParametersForExercise", () => {
    it("should return strength parameters for unknown exercise", async () => {
      // Mock return resolving to nothing
      (app.vault.getAbstractFileByPath as jest.Mock).mockReturnValue(
        new TFolder(),
      ); // empty folder

      const params = await service.getParametersForExercise("Unknown");

      expect(params).toEqual([{ key: "weight", type: "number" }]); // From mocked DEFAULT strength
    });

    it("should combine type params and custom params", async () => {
      // Mock finding specific exercise
      const mockFolder = new TFolder();
      const mockFile = new TFile();
      mockFile.extension = "md";
      mockFile.basename = "Custom";
      mockFolder.children = [mockFile];
      (app.vault.getAbstractFileByPath as jest.Mock).mockReturnValue(
        mockFolder,
      );
      (app.vault.read as jest.Mock).mockResolvedValue(`---
exercise_type: strength
parameters:
  - key: extra
    type: string
---`);

      (parseYaml as jest.Mock).mockReturnValue({
        exercise_type: "strength",
        parameters: [{ key: "extra", type: "string" }],
      });

      const params = await service.getParametersForExercise("Custom");

      expect(params).toHaveLength(2); // 1 from strength (weight) + 1 custom (extra)
      expect(params[0].key).toBe("weight");
      expect(params[1].key).toBe("extra");
    });

    it("should return default params if type ID is invalid", async () => {
      const mockFolder = new TFolder();
      const mockFile = new TFile();
      mockFile.extension = "md";
      mockFile.basename = "BadType";
      mockFolder.children = [mockFile];
      (app.vault.getAbstractFileByPath as jest.Mock).mockReturnValue(
        mockFolder,
      );
      (app.vault.read as jest.Mock).mockResolvedValue(`---
exercise_type: non_existent_type
---`);

      const params = await service.getParametersForExercise("BadType");
      expect(params).toEqual([{ key: "weight", type: "number" }]);
    });
  });

  describe("getExerciseType", () => {
    it("should return default type for unknown exercise", async () => {
      const type = await service.getExerciseType("Unknown");
      expect(type.id).toBe("strength");
    });

    it("should return correct type definition", async () => {
      const mockFolder = new TFolder();
      const mockFile = new TFile();
      mockFile.extension = "md";
      mockFile.basename = "CardioEx";
      mockFolder.children = [mockFile];
      (app.vault.getAbstractFileByPath as jest.Mock).mockReturnValue(
        mockFolder,
      );
      (app.vault.read as jest.Mock).mockResolvedValue(`---
exercise_type: cardio
---`);

      const type = await service.getExerciseType("CardioEx");
      expect(type.id).toBe("cardio");
    });
  });

  describe("getAllExerciseDefinitions", () => {
    it("should return all definitions", async () => {
      const mockFolder = new TFolder();
      const f1 = new TFile();
      f1.extension = "md";
      f1.basename = "A";
      const f2 = new TFile();
      f2.extension = "md";
      f2.basename = "B";
      mockFolder.children = [f1, f2];

      (app.vault.getAbstractFileByPath as jest.Mock).mockReturnValue(
        mockFolder,
      );
      (app.vault.read as jest.Mock).mockResolvedValue("--- \n ---");

      const results = await service.getAllExerciseDefinitions();
      expect(results).toHaveLength(2);
    });

    it("should return empty array if folder does not exist", async () => {
      (app.vault.getAbstractFileByPath as jest.Mock).mockReturnValue(null);
      const results = await service.getAllExerciseDefinitions();
      expect(results).toEqual([]);
    });
  });
});
