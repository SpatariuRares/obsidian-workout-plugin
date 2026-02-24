import { App, Notice, TFile } from "obsidian";
import { t } from "@app/i18n";
import { InsertChartModal } from "@app/features/charts/modals/InsertChartModal";
import { InsertTableModal } from "@app/features/tables/modals/InsertTableModal";
import { InsertTimerModal } from "@app/features/timer";
import { InsertDashboardModal } from "@app/features/dashboard/modals/InsertDashboardModal";
import { CreateExercisePageModal } from "@app/features/modals/exercise/CreateExercisePageModal";
import { CreateExerciseSectionModal } from "@app/features/modals/exercise/CreateExerciseSectionModal";
import { AuditExerciseNamesModal } from "@app/features/modals/exercise/AuditExerciseNamesModal";
import { ErrorUtils } from "@app/utils/ErrorUtils";
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
      name: t("commands.createCsvLog"),
      callback: async () => {
        try {
          await this.plugin.createCSVLogFile();
          new Notice(t("messages.success.csvCreated"));
        } catch (error) {
          const errorMessage = ErrorUtils.getErrorMessage(error);
          new Notice(`Error creating CSV file: ${errorMessage}`);
        }
      },
    });

    this.plugin.addCommand({
      id: "insert-workout-chart",
      name: t("modal.titles.insertChart"),
      callback: () => {
        new InsertChartModal(this.app, this.plugin).open();
      },
    });

    this.plugin.addCommand({
      id: "insert-workout-table",
      name: t("commands.insertTable"),
      callback: () => {
        new InsertTableModal(this.app, this.plugin).open();
      },
    });

    this.plugin.addCommand({
      id: "insert-workout-timer",
      name: t("modal.titles.insertTimer"),
      callback: () => {
        new InsertTimerModal(this.app, this.plugin).open();
      },
    });

    this.plugin.addCommand({
      id: "create-exercise-page",
      name: t("modal.buttons.createExercise"),
      callback: () => {
        new CreateExercisePageModal(this.app, this.plugin).open();
      },
    });

    this.plugin.addCommand({
      id: "create-exercise-section",
      name: t("modal.titles.createExerciseSection"),
      callback: () => {
        new CreateExerciseSectionModal(this.app, this.plugin).open();
      },
    });

    this.plugin.addCommand({
      id: "insert-workout-dashboard",
      name: t("modal.titles.insertDashboard"),
      callback: () => {
        new InsertDashboardModal(this.app).open();
      },
    });

    this.plugin.addCommand({
      id: "insert-workout-duration",
      name: t("modal.titles.insertDuration"),
      callback: () => {
        CodeGenerator.generateDurationCode();
      },
    });

    this.plugin.addCommand({
      id: "audit-exercise-names",
      name: t("commands.auditExerciseNames"),
      callback: () => {
        new AuditExerciseNamesModal(this.app, this.plugin).open();
      },
    });

    this.plugin.addCommand({
      id: "add-exercise-block",
      name: t("commands.addExerciseBlock"),
      callback: () => {
        new AddExerciseBlockModal(this.app, this.plugin).open();
      },
    });

    this.plugin.addCommand({
      id: "export-workout-to-canvas",
      name: t("commands.exportWorkoutToCanvas"),
      callback: () => {
        new WorkoutFileSuggestModal(this.app, async (file) => {
          new CanvasExportModal(
            this.app,
            this.plugin,
            file,
            async (options) => {
              try {
                const exporter = new CanvasExporter(this.app, this.plugin);
                const canvasPath = await exporter.exportToCanvas(file, options);
                new Notice(`${t("modal.notices.canvasExported")} (${canvasPath})`);
              } catch (error) {
                const errorMessage = ErrorUtils.getErrorMessage(error);
                new Notice(`${t("modal.notices.canvasExportError")}${errorMessage}`);
              }
            },
          ).open();
        }).open();
      },
    });

    this.plugin.addCommand({
      id: "migrate-exercise-types",
      name: t("commands.migrateExerciseTypes"),
      callback: async () => {
        await new ExerciseTypeMigration(this.plugin).migrateExerciseTypes();
      },
    });

    this.plugin.addCommand({
      id: "convert-exercise-data",
      name: t("commands.convertExercise"),
      callback: () => {
        new ConvertExerciseDataModal(this.app, this.plugin).open();
      },
    });

    this.plugin.addCommand({
      id: "manage-muscle-tags",
      name: t("commands.manageMuscleTags"),
      callback: () => {
        new MuscleTagManagerModal(this.app, this.plugin).open();
      },
    });

    this.plugin.addCommand({
      id: "generate-tag-reference",
      name: t("commands.generateTagReference"),
      callback: async () => {
        try {
          await this.plugin.templateGeneratorService.generateTagReference(
            "",
            true,
          );

          const fileName = "Muscle Tags Reference.md";
          const file = this.app.vault.getAbstractFileByPath(fileName);

          if (file instanceof TFile) {
            await this.app.workspace.getLeaf(true).openFile(file);
          }

          new Notice(t("messages.tagReferenceGenerated"));
        } catch (error) {
          const errorMessage = ErrorUtils.getErrorMessage(error);
          new Notice(`${t("messages.errors.tagReferenceFailed")}${errorMessage}`);
        }
      },
    });
  }
}
