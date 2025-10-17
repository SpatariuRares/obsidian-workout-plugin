// Main plugin file - Workout Charts for Obsidian
import { Plugin, MarkdownView, Notice } from "obsidian";
import {
  WorkoutChartsSettings,
  DEFAULT_SETTINGS,
  WorkoutLogData,
  CSVWorkoutLogEntry,
} from "@app/types/WorkoutLogData";
import { WorkoutChartsSettingTab } from "@app/settings/WorkoutChartsSettings";
import { EmbeddedChartView } from "@app/views/EmbeddedChartView";
import { EmbeddedTableView } from "@app/views/EmbeddedTableView";
import { EmbeddedTimerView } from "@app/views/EmbeddedTimerView";
import { EmbeddedDashboardView } from "@app/views/EmbeddedDashboardView";
import { CommandHandlerService } from "@app/services/CommandHandlerService";
import { DataService } from "@app/services/DataService";
import { CodeBlockProcessorService } from "@app/services/CodeBlockProcessorService";
import { CreateLogModal } from "@app/modals/CreateLogModal";

// ===================== MAIN PLUGIN =====================

export default class WorkoutChartsPlugin extends Plugin {
  settings!: WorkoutChartsSettings;
  public embeddedChartView!: EmbeddedChartView;
  public embeddedTableView!: EmbeddedTableView;
  public embeddedDashboardView!: EmbeddedDashboardView;
  private activeTimers: Map<string, EmbeddedTimerView> = new Map();

  // Services
  private commandHandlerService!: CommandHandlerService;
  private dataService!: DataService;
  private codeBlockProcessorService!: CodeBlockProcessorService;

  // Expose createLogModalHandler for dashboard quick actions
  public get createLogModalHandler() {
    return {
      openModal: () => {
        new CreateLogModal(this.app, this, undefined, undefined, () => {
          this.triggerWorkoutLogRefresh();
        }).open();
      }
    };
  }

  async onload() {
    await this.loadSettings();

    // Initialize embedded views
    this.embeddedChartView = new EmbeddedChartView(this);
    this.embeddedTableView = new EmbeddedTableView(this);
    this.embeddedDashboardView = new EmbeddedDashboardView(this);

    // Initialize services
    this.dataService = new DataService(this.app, this.settings);
    this.commandHandlerService = new CommandHandlerService(this.app, this);
    this.codeBlockProcessorService = new CodeBlockProcessorService(
      this,
      this.dataService,
      this.embeddedChartView,
      this.embeddedTableView,
      this.embeddedDashboardView,
      this.activeTimers
    );

    // Register services
    this.commandHandlerService.registerCommands();
    this.codeBlockProcessorService.registerProcessors();

    // Add settings tab
    this.addSettingTab(new WorkoutChartsSettingTab(this.app, this));
  }

  onunload() { }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  async getWorkoutLogData(filterParams?: {
    exercise?: string;
    workout?: string;
    exactMatch?: boolean;
  }): Promise<WorkoutLogData[]> {
    return this.dataService.getWorkoutLogData(filterParams);
  }

  public clearLogDataCache(): void {
    this.dataService.clearLogDataCache();
  }

  /**
   * Create a new CSV log file with header
   */
  public async createCSVLogFile(): Promise<void> {
    return this.dataService.createCSVLogFile();
  }

  /**
   * Add a new workout log entry to the CSV file
   */
  public async addWorkoutLogEntry(
    entry: Omit<CSVWorkoutLogEntry, "timestamp">
  ): Promise<void> {
    return this.dataService.addWorkoutLogEntry(entry);
  }

  /**
   * Update an existing workout log entry in the CSV file
   */
  public async updateWorkoutLogEntry(
    originalLog: WorkoutLogData,
    updatedEntry: Omit<CSVWorkoutLogEntry, "timestamp">
  ): Promise<void> {
    return this.dataService.updateWorkoutLogEntry(originalLog, updatedEntry);
  }

  /**
   * Delete a workout log entry from the CSV file
   */
  public async deleteWorkoutLogEntry(
    logToDelete: WorkoutLogData
  ): Promise<void> {
    return this.dataService.deleteWorkoutLogEntry(logToDelete);
  }

  public triggerWorkoutLogRefresh(): void {
    // Clear cache first
    this.clearLogDataCache();

    // Trigger dataview refresh if available (for compatibility)
    if (this.app.workspace.trigger) {
      this.app.workspace.trigger("dataview:refresh-views");
    }

    // Force refresh of all markdown views that contain workout-log code blocks
    const leaves = this.app.workspace.getLeavesOfType("markdown");
    leaves.forEach((leaf) => {
      if (leaf.view instanceof MarkdownView) {
        const view = leaf.view;
        if (view?.editor) {
          // Trigger a refresh by updating the view
          view.editor.refresh();

          // Only trigger raw event if file path is valid
          if (view.file && view.file.path && typeof view.file.path === 'string') {
            // Extra safety: ensure the path looks valid
            if (view.file.path.length > 0 && !view.file.path.includes('undefined')) {
              this.app.vault.trigger("raw", view.file.path);
            }
          }
        }
      }
    });
  }
}
