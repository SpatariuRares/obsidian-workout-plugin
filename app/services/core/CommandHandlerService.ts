import { CONSTANTS } from "@app/constants";
import { App, Notice, TFile } from "obsidian";
import { CreateLogModal } from "@app/features/modals/log/CreateLogModal";
import { InsertChartModal } from "@app/features/charts/modals/InsertChartModal";
import { InsertTableModal } from "@app/features/tables/modals/InsertTableModal";
import { InsertTimerModal } from "@app/features/timer";
import { InsertDashboardModal } from "@app/features/dashboard/modals/InsertDashboardModal";
import { CreateExercisePageModal } from "@app/features/modals/exercise/CreateExercisePageModal";
import { CreateExerciseSectionModal } from "@app/features/modals/exercise/CreateExerciseSectionModal";
import { AuditExerciseNamesModal } from "@app/features/modals/exercise/AuditExerciseNamesModal";
import { AddExerciseBlockModal } from "@app/features/modals/exercise/AddExerciseBlockModal";
import { ConvertExerciseDataModal } from "@app/features/exercise-conversion/ConvertExerciseDataModal";
import { MuscleTagManagerModal } from "@app/features/modals/muscle/MuscleTagManagerModal";
import {
  CanvasExporter,
  WorkoutFileSuggestModal,
  CanvasExportModal,
} from "@app/features/canvas";
import { ExerciseTypeMigration } from "@app/compatibility/migration";
import type WorkoutChartsPlugin from "main";
import { CodeGenerator } from "@app/features/modals/components/CodeGenerator";

export class CommandHandlerService {
  constructor(
    private app: App,
    private plugin: WorkoutChartsPlugin,
  ) {}

  registerCommands(): void {

    this.plugin.addCommand({
      id: "create-csv-log",
      name: CONSTANTS.WORKOUT.COMMANDS.CREATE_CSV,
      callback: async () => {
        try {
          await this.plugin.createCSVLogFile();
          new Notice(CONSTANTS.WORKOUT.MESSAGES.SUCCESS.CSV_CREATED);
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          new Notice(`Error creating CSV file: ${errorMessage}`);
        }
      },
    });

    this.plugin.addCommand({
      id: "insert-workout-chart",
      name: CONSTANTS.WORKOUT.MODAL.TITLES.INSERT_CHART,
      callback: () => {
        new InsertChartModal(this.app, this.plugin).open();
      },
    });

    this.plugin.addCommand({
      id: "insert-workout-table",
      name: CONSTANTS.WORKOUT.COMMANDS.INSERT_TABLE,
      callback: () => {
        new InsertTableModal(this.app, this.plugin).open();
      },
    });

    this.plugin.addCommand({
      id: "insert-workout-timer",
      name: CONSTANTS.WORKOUT.MODAL.TITLES.INSERT_TIMER,
      callback: () => {
        new InsertTimerModal(this.app, this.plugin).open();
      },
    });

    this.plugin.addCommand({
      id: "create-exercise-page",
      name: CONSTANTS.WORKOUT.MODAL.BUTTONS.CREATE_EXERCISE,
      callback: () => {
        new CreateExercisePageModal(this.app, this.plugin).open();
      },
    });

    this.plugin.addCommand({
      id: "create-exercise-section",
      name: CONSTANTS.WORKOUT.MODAL.TITLES.CREATE_EXERCISE_SECTION,
      callback: () => {
        new CreateExerciseSectionModal(this.app, this.plugin).open();
      },
    });

    this.plugin.addCommand({
      id: "insert-workout-dashboard",
      name: CONSTANTS.WORKOUT.MODAL.TITLES.INSERT_DASHBOARD,
      callback: () => {
        new InsertDashboardModal(this.app).open();
      },
    });

    this.plugin.addCommand({
      id: "insert-workout-duration",
      name: CONSTANTS.WORKOUT.MODAL.TITLES.INSERT_DURATION,
      callback: () => {
        CodeGenerator.generateDurationCode();
      },
    });

    this.plugin.addCommand({
      id: "audit-exercise-names",
      name: CONSTANTS.WORKOUT.COMMANDS.AUDIT_EXERCISE_NAMES,
      callback: () => {
        new AuditExerciseNamesModal(this.app, this.plugin).open();
      },
    });

    this.plugin.addCommand({
      id: "add-exercise-block",
      name: CONSTANTS.WORKOUT.COMMANDS.ADD_EXERCISE_BLOCK,
      callback: () => {
        new AddExerciseBlockModal(this.app, this.plugin).open();
      },
    });

    this.plugin.addCommand({
      id: "export-workout-to-canvas",
      name: CONSTANTS.WORKOUT.COMMANDS.EXPORT_WORKOUT_TO_CANVAS,
      callback: () => {
        new WorkoutFileSuggestModal(this.app, async (file) => {
          // Open the canvas export options modal
          new CanvasExportModal(
            this.app,
            this.plugin,
            file,
            async (options) => {
              try {
                const exporter = new CanvasExporter(this.app, this.plugin);
                const canvasPath = await exporter.exportToCanvas(file, options);
                new Notice(
                  `${CONSTANTS.WORKOUT.MODAL.NOTICES.CANVAS_EXPORTED} (${canvasPath})`,
                );
              } catch (error) {
                const errorMessage =
                  error instanceof Error ? error.message : String(error);
                new Notice(
                  `${CONSTANTS.WORKOUT.MODAL.NOTICES.CANVAS_EXPORT_ERROR}${errorMessage}`,
                );
              }
            },
          ).open();
        }).open();
      },
    });

    this.plugin.addCommand({
      id: "migrate-exercise-types",
      name: CONSTANTS.WORKOUT.COMMANDS.MIGRATE_EXERCISE_TYPES,
      callback: async () => {
        await new ExerciseTypeMigration(this.plugin).migrateExerciseTypes();
      },
    });

    this.plugin.addCommand({
      id: "convert-exercise-data",
      name: CONSTANTS.WORKOUT.COMMANDS.CONVERT_EXERCISE,
      callback: () => {
        new ConvertExerciseDataModal(this.app, this.plugin).open();
      },
    });

    this.plugin.addCommand({
      id: "manage-muscle-tags",
      name: CONSTANTS.WORKOUT.COMMANDS.MANAGE_MUSCLE_TAGS,
      callback: () => {
        new MuscleTagManagerModal(this.app, this.plugin).open();
      },
    });

    this.plugin.addCommand({
      id: "generate-tag-reference",
      name: CONSTANTS.WORKOUT.COMMANDS.GENERATE_TAG_REFERENCE,
      callback: async () => {
        try {
          const tags = this.plugin.getMuscleTagService().getTagMap();
          const sortedTags = Array.from(tags.entries()).sort((a, b) =>
            a[0].localeCompare(b[0]),
          );

          let content = `---\n`;
          content += "title: Muscle Tags Reference\n";
          content +=
            "WARNING: DO NOT EDIT MANUALLY. This file is auto-generated by the Workout Plugin.\n";
          content += `tags:\n`;
          for (const [tag] of sortedTags) {
            content += `  - ${tag}\n`;
          }
          content += "---\n\n";

          const fileName = "Muscle Tags Reference.md";
          let file = this.app.vault.getAbstractFileByPath(fileName);

          if (file instanceof TFile) {
            await this.app.vault.modify(file, content);
          } else {
            file = await this.app.vault.create(fileName, content);
          }

          if (file instanceof TFile) {
            await this.app.workspace.getLeaf(true).openFile(file);
          }

          new Notice(
            CONSTANTS.WORKOUT.MESSAGES.SUCCESS.TAG_REFERENCE_GENERATED,
          );
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          new Notice(
            CONSTANTS.WORKOUT.MESSAGES.ERRORS.TAG_REFERENCE_FAILED(
              errorMessage,
            ),
          );
        }
      },
    });
  }
}
