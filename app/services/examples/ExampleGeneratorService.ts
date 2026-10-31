import { gettingStartedPages } from "@app/services/examples/GettingStartedPages";
import { normalizePath, Notice, TFile, TFolder } from "obsidian";
import type {
  AppPort,
  EventBusPort,
  MuscleTagPort,
  SettingsPort,
} from "@app/types/PluginPorts";
import { announceDataPathChange } from "@app/features/settings/business/announceDataPathChange";
import { t } from "@app/i18n";
import {
  generateGettingStartedContent,
  generateExerciseContent,
  generateWorkoutContent,
  generateFeatureShowcaseContent,
  generateHIITContent,
  generateDashboardContent,
} from "@app/services/examples/exampleContentGenerator";
import { examplePaths } from "@app/services/examples/ExamplePaths";
import { logFileExists } from "@app/services/data/logFileExists";
import { generateExampleCSVData } from "@app/services/examples/exampleDataGenerator";

/** What the example flow needs from the plugin */
export type ExamplePluginPort = AppPort &
  SettingsPort &
  MuscleTagPort &
  EventBusPort;

/**
 * How `createExamples` ended:
 * - `pointed-at-examples`: no log existed, so the settings now read the example log and exercises
 * - `separate-file`: a log exists, so it and the settings were left alone
 * - `failed`: the example files could not be written
 */
export type CreateExamplesResult =
  | "pointed-at-examples"
  | "separate-file"
  | "failed";

export class ExampleGeneratorService {
  private app: ExamplePluginPort["app"];

  constructor(private plugin: ExamplePluginPort) {
    this.app = plugin.app;
  }

  /**
   * The one entry point for "create examples" (settings button, command,
   * welcome modal). Writes the examples that are missing (an existing file,
   * the log included, is never touched), then decides how the views reach them: with
   * no log at `csvLogFilePath` the settings are pointed at the example log
   * and exercises; with a real log nothing in the settings or that log
   * changes. Tells the user either way.
   */
  public async createExamples(): Promise<CreateExamplesResult> {
    // Decide before writing: the examples never count as the user's log
    const hasLog = logFileExists(this.plugin);

    if (!(await this.generateExampleFolder())) return "failed";
    if (hasLog) {
      if (
        this.plugin.settings.csvLogFilePath !== examplePaths.log()
      ) {
        new Notice(t("examples.usesSeparateLog"));
      }
      return "separate-file";
    }

    const { settings } = this.plugin;
    const previous = {
      csvLogFilePath: settings.csvLogFilePath,
      exerciseFolderPath: settings.exerciseFolderPath,
    };
    settings.csvLogFilePath = examplePaths.log();
    settings.exerciseFolderPath = examplePaths.exercises();
    await this.plugin.saveSettings();
    announceDataPathChange(
      this.plugin,
      "csvLogFilePath",
      previous.csvLogFilePath,
    );
    announceDataPathChange(
      this.plugin,
      "exerciseFolderPath",
      previous.exerciseFolderPath,
    );
    new Notice(t("examples.pointedAtExamples"));
    return "pointed-at-examples";
  }

  /** Creates the example files that do not exist yet; false when it could not be written */
  public async generateExampleFolder(): Promise<boolean> {
    const baseFolderName = t("examples.folderNames.base");
    const basePath = examplePaths.base();
    const exercisesPath = examplePaths.exercises();
    const workoutsPath = examplePaths.workouts();
    const logPath = examplePaths.logFolder();

    try {
      // Create directories
      await this.createFolderIfNotExists(basePath);
      await this.createFolderIfNotExists(exercisesPath);
      await this.createFolderIfNotExists(workoutsPath);
      await this.createFolderIfNotExists(logPath);

      await this.createFolderIfNotExists(
        examplePaths.gettingStartedFolder(),
      );
      for (const page of gettingStartedPages()) {
        await this.createFileIfMissing(
          examplePaths.gettingStartedFolder(),
          page.path.split("/").pop()!,
          page.content,
        );
      }

      // Create Getting Started File
      await this.createFileIfMissing(
        examplePaths.gettingStartedFolder(),
        `${t("examples.fileNames.gettingStarted")}.md`,
        generateGettingStartedContent(),
      );

      // Create Exercises
      const exercises: {
        name: string;
        type: string;
        tags: string[];
      }[] = [
        {
          name: t("examples.exercises.benchPress.name"),
          type: "strength",
          tags: ["chest", "triceps", "shoulders"],
        },
        {
          name: t("examples.exercises.squat.name"),
          type: "strength",
          tags: ["legs", "quads", "glutes"],
        },
        {
          name: t("examples.exercises.running.name"),
          type: "cardio",
          tags: ["cardio", "legs"],
        },
        {
          name: t("examples.exercises.plank.name"),
          type: "timed",
          tags: ["core", "abs"],
        },
        {
          name: t("examples.exercises.cycling.name"),
          type: "distance",
          tags: ["cardio", "legs"],
        },
        {
          name: t("examples.exercises.squatMultiPower.name"),
          type: "strength",
          tags: ["legs", "quads"],
        },
        {
          name: t("examples.exercises.rdl.name"),
          type: "strength",
          tags: ["legs", "hamstrings", "glutes"],
        },
        {
          name: t("examples.exercises.legPress45.name"),
          type: "strength",
          tags: ["legs", "quads"],
        },
        {
          name: t("examples.exercises.legCurlSeated.name"),
          type: "strength",
          tags: ["legs", "hamstrings"],
        },
        {
          name: t("examples.exercises.calfMachine.name"),
          type: "strength",
          tags: ["legs", "calves"],
        },
      ];

      for (const ex of exercises) {
        await this.createFileIfMissing(
          exercisesPath,
          `${ex.name}.md`,
          generateExerciseContent(ex.name, ex.type, ex.tags),
        );
      }

      // Create Workout
      await this.createFileIfMissing(
        workoutsPath,
        `${t("examples.workouts.lowerBodyA.name")}.md`,
        generateWorkoutContent(),
      );

      // Create Log File
      await this.createFileIfMissing(
        logPath,
        examplePaths.logFileName(),
        generateExampleCSVData(),
      );

      // Create Dashboard File
      await this.createFileIfMissing(
        basePath,
        `${t("examples.fileNames.dashboard")}.md`,
        generateDashboardContent(),
      );

      // Create Feature Showcase File
      await this.createFileIfMissing(
        basePath,
        `${t("examples.fileNames.featureShowcase")}.md`,
        generateFeatureShowcaseContent(),
      );

      // Create HIIT Workout
      await this.createFileIfMissing(
        workoutsPath,
        `${t("examples.fileNames.hiitCardioSession")}.md`,
        generateHIITContent(),
      );

      new Notice(
        t("examples.folderCreatedSuccess", {
          folder: baseFolderName,
        }),
      );
      return true;
    } catch {
      new Notice(t("examples.folderCreatedError"));
      return false;
    }
  }

  private async createFolderIfNotExists(path: string): Promise<void> {
    const folder = this.app.vault.getAbstractFileByPath(path);
    if (!folder) {
      await this.app.vault.createFolder(path);
    } else if (!(folder instanceof TFolder)) {
      throw new Error(`Path '${path}' exists but is not a folder.`);
    }
  }

  private async createFileIfMissing(
    folderPath: string,
    fileName: string,
    content: string,
  ): Promise<void> {
    const filePath = normalizePath(`${folderPath}/${fileName}`);
    const existingFile =
      this.app.vault.getAbstractFileByPath(filePath);

    if (!existingFile) {
      await this.app.vault.create(filePath, content);
    } else if (!(existingFile instanceof TFile)) {
      throw new Error(`Path '${filePath}' exists but is not a file.`);
    }
  }
}
