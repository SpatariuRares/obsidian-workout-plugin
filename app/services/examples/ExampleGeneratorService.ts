import { App, normalizePath, Notice, TFolder } from "obsidian";
import { t } from "@app/i18n";
import {
  generateGettingStartedContent,
  generateExerciseContent,
  generateWorkoutContent,
  generateFeatureShowcaseContent,
  generateHIITContent,
  generateDashboardContent,
} from "@app/services/examples/exampleContentGenerator";
import { generateExampleCSVData } from "@app/services/examples/exampleDataGenerator";

export class ExampleGeneratorService {
  constructor(private app: App) {}

  public async generateExampleFolder(
    overwrite: boolean = false,
  ): Promise<void> {
    const baseFolderName = t("examples.folderNames.base");
    const basePath = normalizePath(baseFolderName);
    const exercisesPath = normalizePath(
      `${baseFolderName}/${t("examples.folderNames.exercises")}`,
    );
    const workoutsPath = normalizePath(
      `${baseFolderName}/${t("examples.folderNames.workouts")}`,
    );
    const logPath = normalizePath(
      `${baseFolderName}/${t("examples.folderNames.log")}`,
    );

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
      const exercises: { name: string; type: string; tags: string[]; overwrite?: boolean }[] = [
        { name: t("examples.exercises.benchPress.name"), type: "strength", tags: ["chest", "triceps", "shoulders"], overwrite: true },
        { name: t("examples.exercises.squat.name"), type: "strength", tags: ["legs", "quads", "glutes"] },
        { name: t("examples.exercises.running.name"), type: "cardio", tags: ["cardio", "legs"] },
        { name: t("examples.exercises.plank.name"), type: "timed", tags: ["core", "abs"] },
        { name: t("examples.exercises.cycling.name"), type: "distance", tags: ["cardio", "legs"] },
        { name: t("examples.exercises.squatMultiPower.name"), type: "strength", tags: ["legs", "quads"] },
        { name: t("examples.exercises.rdl.name"), type: "strength", tags: ["legs", "hamstrings", "glutes"] },
        { name: t("examples.exercises.legPress45.name"), type: "strength", tags: ["legs", "quads"] },
        { name: t("examples.exercises.legCurlSeated.name"), type: "strength", tags: ["legs", "hamstrings"] },
        { name: t("examples.exercises.calfMachine.name"), type: "strength", tags: ["legs", "calves"] },
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

      // Create Log File
      await this.createOrUpdateFile(
        logPath,
        "workout_logs.csv",
        generateExampleCSVData(),
        overwrite,
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
        t("examples.folderCreatedSuccess", { folder: baseFolderName }),
      );
    } catch {
      new Notice(t("examples.folderCreatedError"));
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
    const existingFile = this.app.vault.getAbstractFileByPath(filePath);

    if (existingFile && !overwrite) {
      return;
    }

    if (existingFile) {
      await this.app.vault.modify(existingFile as any, content);
    } else {
      await this.app.vault.create(filePath, content);
    }
  }
}
