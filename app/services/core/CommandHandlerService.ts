import { App, Notice, TFile } from "obsidian";
import { runAddMissingBlockIds } from "@app/utils/BlockIdMigration";
import { t } from "@app/i18n";
import { InsertChartModal } from "@app/features/charts/modals/InsertChartModal";
import { InsertTableModal } from "@app/features/tables/modals/InsertTableModal";
import { InsertTimerModal } from "@app/features/timer/modals/InsertTimerModal";
import { InsertDashboardModal } from "@app/features/dashboard/modals/InsertDashboardModal";
import { CreateExercisePageModal } from "@app/features/modals/exercise/CreateExercisePageModal";
import { CreateExerciseSectionModal } from "@app/features/modals/exercise/CreateExerciseSectionModal";
import { AuditExerciseNamesModal } from "@app/features/modals/exercise/AuditExerciseNamesModal";
import { ErrorUtils } from "@app/utils/ErrorUtils";
import { AddExerciseBlockModal } from "@app/features/modals/exercise/AddExerciseBlockModal";
import { ConvertExerciseDataModal } from "@app/features/exercise-conversion/ConvertExerciseDataModal";
import { ImportWorkoutsModal } from "@app/features/import/modals/ImportWorkoutsModal";
import { MuscleTagManagerModal } from "@app/features/modals/muscle/MuscleTagManagerModal";
import { CanvasExporter } from "@app/features/canvas/business/CanvasExporter";
import { WorkoutFileSuggestModal } from "@app/features/canvas/modals/WorkoutFileSuggestModal";
import { CanvasExportModal } from "@app/features/canvas/modals/CanvasExportModal";
import { ExerciseTypeMigration } from "@app/compatibility/migration";
import type {
  WorkoutPluginContext,
  CommandRegistryPort,
  WorkoutAPIPort,
  TemplateGeneratorPort,
  TourPort,
} from "@app/types/PluginPorts";
import {
  createExampleNotes,
  openGettingStartedGuide,
} from "@app/services/examples/GettingStartedGuide";
import { startGuidedTour } from "@app/features/tour/startGuidedTour";
import type { InsertCommandKind } from "@app/services/events/WorkoutEventTypes";
import { durationBlock } from "@app/features/duration/durationBlock";

type CommandHandlerPlugin = WorkoutPluginContext & CommandRegistryPort & WorkoutAPIPort & TemplateGeneratorPort & TourPort;

export class CommandHandlerService {
  constructor(
    private app: App,
    private plugin: CommandHandlerPlugin,
  ) {}

  /** Tells the guided tour that an "Insert workout ..." command ran. */
  private emitInsert(kind: InsertCommandKind): void {
    this.plugin.eventBus.emit({ type: "command:insert", payload: { kind } });
  }

  registerCommands(): void {
    this.plugin.addCommand({
      id: "create-workout-log",
      name: t("modal.titles.createLog"),
      callback: () => {
        this.plugin.createLogModalHandler.openModal();
      },
    });

    this.plugin.addCommand({
      id: "create-csv-log",
      name: t("commands.createCsvLog"),
      callback: async () => {
        try {
          await this.plugin.createCSVLogFile();
          new Notice(t("messages.success.csvCreated"));
        } catch (error) {
          const errorMessage = ErrorUtils.getErrorMessage(error);
          new Notice(t("messages.errors.csvCreateError", { error: errorMessage }));
        }
      },
    });

    this.plugin.addCommand({
      id: "create-example-notes",
      name: t("commands.createExampleNotes"),
      callback: async () => {
        await createExampleNotes(this.plugin);
      },
    });

    this.plugin.addCommand({
      id: "start-tour",
      name: t("commands.startTour"),
      callback: async () => {
        await startGuidedTour(this.plugin, { source: "command" });
      },
    });

    this.plugin.addCommand({
      id: "open-getting-started-guide",
      name: t("commands.openGettingStartedGuide"),
      callback: async () => {
        await openGettingStartedGuide(this.plugin);
      },
    });

    this.plugin.addCommand({
      id: "insert-workout-chart",
      name: t("modal.titles.insertChart"),
      callback: () => {
        this.emitInsert("chart");
        new InsertChartModal(this.app, this.plugin).open();
      },
    });

    this.plugin.addCommand({
      id: "insert-workout-table",
      name: t("commands.insertTable"),
      callback: () => {
        this.emitInsert("table");
        new InsertTableModal(this.app, this.plugin).open();
      },
    });

    this.plugin.addCommand({
      id: "insert-workout-timer",
      name: t("modal.titles.insertTimer"),
      callback: () => {
        this.emitInsert("timer");
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
        this.emitInsert("dashboard");
        new InsertDashboardModal(this.app).open();
      },
    });

    this.plugin.addCommand({
      id: "insert-workout-duration",
      name: t("modal.titles.insertDuration"),
      editorCallback: (editor) => {
        this.emitInsert("duration");
        editor.replaceRange(
          durationBlock.serialize({}) + "\n\n",
          editor.getCursor(),
        );
        new Notice(t("messages.codeInserted"));
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
        new WorkoutFileSuggestModal(this.app, (file) => {
          new CanvasExportModal(
            this.app,
            this.plugin,
            file,
            async (options) => {
              try {
                const exporter = new CanvasExporter(
                  this.app,
                  this.plugin.getWorkoutPlannerAPI(),
                  this.plugin.getMuscleTagService(),
                  this.plugin.getExerciseLibrary(),
                );
                const canvasPath = await exporter.exportToCanvas(
                  file,
                  options,
                );
                new Notice(
                  t("modal.notices.canvasExported", { path: canvasPath }),
                );
              } catch (error) {
                const errorMessage =
                  ErrorUtils.getErrorMessage(error);
                new Notice(
                  t("modal.notices.canvasExportError", { error: errorMessage }),
                );
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
        await new ExerciseTypeMigration(
          this.plugin,
        ).migrateExerciseTypes();
      },
    });

    this.plugin.addCommand({
      id: "import-strong-hevy",
      name: t("commands.importWorkouts"),
      callback: () => {
        new ImportWorkoutsModal(this.app, this.plugin).open();
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
      id: "add-missing-block-ids",
      name: t("commands.addMissingBlockIds"),
      callback: async () => {
        try {
          const { totalAdded, modifiedFiles } =
            await runAddMissingBlockIds(this.app);
          if (totalAdded === 0) {
            new Notice(t("messages.success.noBlockIdsNeeded"));
          } else {
            new Notice(
              t("messages.success.blockIdsAdded", {
                count: totalAdded,
                files: modifiedFiles,
              }),
            );
          }
        } catch (error) {
          const errorMessage = ErrorUtils.getErrorMessage(error);
          new Notice(t("messages.errors.blockIdsError", { error: errorMessage }));
        }
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
          new Notice(
            t("messages.errors.tagReferenceFailed", { error: errorMessage }),
          );
        }
      },
    });
  }
}
