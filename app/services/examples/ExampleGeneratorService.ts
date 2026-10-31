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
 * - `cancelled`: the user declined to overwrite the existing example folder
 * - `failed`: the example files could not be written
 */
export type CreateExamplesResult =
  | "pointed-at-examples"
  | "separate-file"
  | "cancelled"
  | "failed";

export class ExampleGeneratorService {
  private app: ExamplePluginPort["app"];

  constructor(private plugin: ExamplePluginPort) {
    this.app = plugin.app;
  }

  /**
   * The one entry point for "create examples" (settings button, command,
   * welcome modal). Asks `confirmOverwrite` when the example folder already
   * exists, writes the examples, then decides how the views reach them: with
   * no log at `csvLogFilePath` the settings are pointed at the example log
   * and exercises; with a real log nothing in the settings or that log
   * changes. Tells the user either way.
   */
  public async createExamples(
    confirmOverwrite: () => Promise<boolean>,
  ): Promise<CreateExamplesResult> {
    const overwrite = this.exampleFolderExists();
    if (overwrite && !(await confirmOverwrite())) return "cancelled";

    // Decide before writing: the examples never count as the user's log
    const hasLog = logFileExists(this.plugin);

    if (!(await this.generateExampleFolder(overwrite))) return "failed";
    if (hasLog) {
      if (this.plugin.settings.csvLogFilePath !== examplePaths.log()) {
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

  /** Whether the (localized) example folder already exists in the vault */
  public exampleFolderExists(): boolean {
    return (
      this.app.vault.getAbstractFileByPath(
        examplePaths.base(),
      ) instanceof TFolder
    );
  }

  /** Writes the example folder; false when it could not be written */
  public async generateExampleFolder(
    overwrite: boolean = false,
  ): Promise<boolean> {
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

      // Create Getting Started File
      await this.createOrUpdateFile(
        basePath,
        `${t("examples.fileNames.gettingStarted")}.md`,
        generateGettingStartedContent(),
        overwrite,
      );

      // Create Exercises
      const exercises: {
        name: string;
        type: string;
        tags: string[];
        overwrite?: boolean;
      }[] = [
        {
          name: t("examples.exercises.benchPress.name"),
          type: "strength",
          tags: ["chest", "triceps", "shoulders"],
          overwrite: true,
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
        await this.createOrUpdateFile(
          exercisesPath,
          `${ex.name}.md`,
          generateExerciseContent(ex.name, ex.type, ex.tags),
          ex.overwrite ? overwrite : false,
        );
      }

      // Create Workout
      await this.createOrUpdateFile(
        workoutsPath,
        `${t("examples.workouts.lowerBodyA.name")}.md`,
        generateWorkoutContent(),
        overwrite,
      );

      // Create Log File. Never over the log the settings read: after
      // "try with example data" that is the user's own log.
      const logIsActive =
        normalizePath(this.plugin.settings.csvLogFilePath) ===
        examplePaths.log();
      await this.createOrUpdateFile(
        logPath,
        examplePaths.logFileName(),
        generateExampleCSVData(),
        overwrite && !logIsActive,
      );

      // Create Dashboard File
      await this.createOrUpdateFile(
        basePath,
        `${t("examples.fileNames.dashboard")}.md`,
        generateDashboardContent(),
        overwrite,
      );

      // Create Feature Showcase File
      await this.createOrUpdateFile(
        basePath,
        `${t("examples.fileNames.featureShowcase")}.md`,
        generateFeatureShowcaseContent(),
        overwrite,
      );

      // Create HIIT Workout
      await this.createOrUpdateFile(
        workoutsPath,
        `${t("examples.fileNames.hiitCardioSession")}.md`,
        generateHIITContent(),
        overwrite,
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

  private async createOrUpdateFile(
    folderPath: string,
    fileName: string,
    content: string,
    overwrite: boolean,
  ): Promise<void> {
    const filePath = normalizePath(`${folderPath}/${fileName}`);
    const existingFile =
      this.app.vault.getAbstractFileByPath(filePath);

    if (!existingFile) {
      await this.app.vault.create(filePath, content);
    } else if (!(existingFile instanceof TFile)) {
      throw new Error(`Path '${filePath}' exists but is not a file.`);
    } else if (overwrite) {
      await this.app.vault.modify(existingFile, content);
    }
  }
}
