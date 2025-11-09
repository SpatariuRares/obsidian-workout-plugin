import { App, Notice } from "obsidian";
import { CreateLogModal } from "@app/modals/CreateLogModal";
import { InsertChartModal } from "@app/modals/InsertChartModal";
import { InsertTableModal } from "@app/modals/InsertTableModal";
import { InsertTimerModal } from "@app/modals/InsertTimerModal";
import { CreateExercisePageModal } from "@app/modals/CreateExercisePageModal";
import { CreateExerciseSectionModal } from "@app/modals/CreateExerciseSectionModal";
import type WorkoutChartsPlugin from "main";
import { CreateDashboardSection } from "app/modals/CreateDashboardSection";

export class CommandHandlerService {
  constructor(private app: App, private plugin: WorkoutChartsPlugin) {}

  registerCommands(): void {
    this.plugin.addCommand({
      id: "create-workout-log",
      name: "Create workout log",
      callback: () => {
        new CreateLogModal(this.app, this.plugin, undefined, undefined, () => {
          this.plugin.triggerWorkoutLogRefresh();
        }).open();
      },
    });

    this.plugin.addCommand({
      id: "create-csv-log",
      name: "Create CSV log file",
      callback: async () => {
        try {
          await this.plugin.createCSVLogFile();
          new Notice("CSV log file created successfully!");
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          new Notice(`Error creating CSV file: ${errorMessage}`);
        }
      },
    });

    this.plugin.addCommand({
      id: "insert-workout-chart",
      name: "Insert workout chart",
      callback: () => {
        new InsertChartModal(this.app, this.plugin).open();
      },
    });

    this.plugin.addCommand({
      id: "insert-workout-table",
      name: "Insert workout table",
      callback: () => {
        new InsertTableModal(this.app, this.plugin).open();
      },
    });

    this.plugin.addCommand({
      id: "insert-workout-timer",
      name: "Insert workout timer",
      callback: () => {
        new InsertTimerModal(this.app, this.plugin).open();
      },
    });

    this.plugin.addCommand({
      id: "create-exercise-page",
      name: "Create exercise page",
      callback: () => {
        new CreateExercisePageModal(this.app, this.plugin).open();
      },
    });

    this.plugin.addCommand({
      id: "create-exercise-section",
      name: "Create exercise section",
      callback: () => {
        new CreateExerciseSectionModal(this.app, this.plugin).open();
      },
    });

    this.plugin.addCommand({
      id: "create-dashboard-section",
      name: "Create dashboard section",
      callback: () => {
        new CreateDashboardSection(this.app).insert();
      },
    });
  }
}
