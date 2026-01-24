import { CONSTANTS } from "@app/constants/Constants";
import { App, Notice } from "obsidian";
import { CreateLogModal } from "@app/features/modals/CreateLogModal";
import { InsertChartModal } from "@app/features/modals/InsertChartModal";
import { InsertTableModal } from "@app/features/modals/InsertTableModal";
import { InsertTimerModal } from "@app/features/modals/InsertTimerModal";
import { InsertDashboardModal } from "@app/features/modals/InsertDashboardModal";
import { CreateExercisePageModal } from "@app/features/modals/CreateExercisePageModal";
import { CreateExerciseSectionModal } from "@app/features/modals/CreateExerciseSectionModal";
import { AuditExerciseNamesModal } from "@app/features/modals/AuditExerciseNamesModal";
import { AddExerciseBlockModal } from "@app/features/modals/AddExerciseBlockModal";
import type WorkoutChartsPlugin from "main";

export class CommandHandlerService {
  constructor(private app: App, private plugin: WorkoutChartsPlugin) { }

  registerCommands(): void {
    this.plugin.addCommand({
      id: "create-workout-log",
      name: CONSTANTS.WORKOUT.MODAL.TITLES.CREATE_LOG,
      callback: () => {
        new CreateLogModal(this.app, this.plugin, undefined, undefined, () => {
          this.plugin.triggerWorkoutLogRefresh();
        }).open();
      },
    });

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
        new InsertTimerModal(this.app).open();
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
  }
}
