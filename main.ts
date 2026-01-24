// Main plugin file - Workout Charts for Obsidian
import { Plugin, MarkdownView } from "obsidian";
import {
  WorkoutChartsSettings,
  DEFAULT_SETTINGS,
  WorkoutLogData,
  CSVWorkoutLogEntry,
} from "@app/types/WorkoutLogData";
import { WorkoutChartsSettingTab } from "@app/features/settings/WorkoutChartsSettings";
import { EmbeddedChartView } from "@app/views/EmbeddedChartView";
import { EmbeddedTableView } from "@app/views/EmbeddedTableView";
import { EmbeddedTimerView } from "@app/views/EmbeddedTimerView";
import { EmbeddedDashboardView } from "@app/views/EmbeddedDashboardView";
import { CommandHandlerService } from "@app/services/CommandHandlerService";
import { DataService } from "@app/services/DataService";
import { CodeBlockProcessorService } from "@app/services/CodeBlockProcessorService";
import { CreateLogModal } from "@app/features/modals/CreateLogModal";
import { ChartRenderer } from "@app/features/charts/components/ChartRenderer";

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
      },
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
      this.activeTimers,
    );

    // Register services
    this.commandHandlerService.registerCommands();
    this.codeBlockProcessorService.registerProcessors();

    // Add settings tab
    this.addSettingTab(new WorkoutChartsSettingTab(this.app, this));
  }

  onunload() {
    /**
     * PLUGIN LIFECYCLE CLEANUP
     *
     * Order of operations:
     * 1. Clean up active timers (component-level cleanup)
     * 2. Clean up embedded views (calls their cleanup methods which handle internal resources)
     * 3. Clear data cache (release memory from cached workout data)
     * 4. Destroy all Chart.js instances (additional safety net for chart cleanup)
     * 5. Nullify service references (release references to allow garbage collection)
     *
     * This prevents memory leaks from:
     * - Chart.js instances accumulating in memory
     * - Event listeners not being properly removed (zombie listeners)
     * - Cached data consuming excessive memory
     * - Service references preventing garbage collection
     */

    // 1. Clean up all active timers
    for (const timerView of this.activeTimers.values()) {
      timerView.destroy();
    }
    this.activeTimers.clear();

    // 2. Clean up embedded views (each view handles its own cleanup)
    this.embeddedChartView?.cleanup();
    this.embeddedTableView?.cleanup();
    this.embeddedDashboardView?.cleanup();

    // 3. Clear data service cache to release memory
    this.dataService?.clearLogDataCache();

    // 4. Destroy all Chart.js instances (additional safety net)
    ChartRenderer.destroyAllCharts();

    // 5. Nullify service references to allow garbage collection
    this.codeBlockProcessorService = null!;
    this.commandHandlerService = null!;
  }

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
    entry: Omit<CSVWorkoutLogEntry, "timestamp">,
  ): Promise<void> {
    return this.dataService.addWorkoutLogEntry(entry);
  }

  /**
   * Update an existing workout log entry in the CSV file
   */
  public async updateWorkoutLogEntry(
    originalLog: WorkoutLogData,
    updatedEntry: Omit<CSVWorkoutLogEntry, "timestamp">,
  ): Promise<void> {
    return this.dataService.updateWorkoutLogEntry(originalLog, updatedEntry);
  }

  /**
   * Delete a workout log entry from the CSV file
   */
  public async deleteWorkoutLogEntry(
    logToDelete: WorkoutLogData,
  ): Promise<void> {
    return this.dataService.deleteWorkoutLogEntry(logToDelete);
  }

  /**
   * Rename an exercise in the CSV file
   */
  public async renameExercise(
    oldName: string,
    newName: string,
  ): Promise<number> {
    return this.dataService.renameExercise(oldName, newName);
  }

  /**
   * Trigger refresh of workout log views using proper Obsidian APIs
   *
   * This method refreshes all markdown views to update workout-log code blocks
   * after data changes. It uses Obsidian's public APIs instead of undocumented
   * or plugin-specific triggers.
   *
   * Process:
   * 1. Clear data cache to force fresh data load
   * 2. Iterate through all markdown views
   * 3. Trigger editor refresh to re-render code blocks
   * 4. Trigger metadata cache update to notify other plugins
   */
  public triggerWorkoutLogRefresh(): void {
    // Clear cache first to ensure fresh data on next render
    this.clearLogDataCache();

    // Iterate through all markdown leaves using Obsidian's workspace API
    this.app.workspace.iterateRootLeaves((leaf) => {
      // Only process markdown views
      if (leaf.view instanceof MarkdownView) {
        const view = leaf.view;

        // Refresh the editor to re-render code blocks
        if (view?.editor) {
          view.editor.refresh();
        }

        // Trigger metadata cache update to notify other components
        // This is the proper Obsidian API for signaling content changes
        if (view.file) {
          this.app.metadataCache.trigger("changed", view.file);
        }
      }
    });
  }
}
