// Main plugin file - Workout Charts for Obsidian
import { Plugin, Notice } from "obsidian";
import {
  WorkoutChartsSettings,
  DEFAULT_SETTINGS,
  WorkoutLogData,
  LogEntryInput,
} from "@app/types/WorkoutLogData";
import { WorkoutChartsSettingTab } from "@app/features/settings/WorkoutChartsSettings";
import { EmbeddedChartView } from "@app/features/charts/views/EmbeddedChartView";
import { EmbeddedTableView } from "@app/features/tables/views/EmbeddedTableView";
import { EmbeddedTimerView } from "@app/features/timer/views/EmbeddedTimerView";
import { EmbeddedDashboardView } from "@app/features/dashboard/views/EmbeddedDashboardView";
import { CommandHandlerService } from "@app/services/core/CommandHandlerService";
import { TourEngine } from "@app/features/tour/TourEngine";
import {
  openOnboarding,
  shouldShowWelcome,
} from "@app/services/onboarding/Welcome";
import { WorkoutLogFile } from "@app/services/data/WorkoutLogFile";
import { VaultLogStorage } from "@app/services/data/LogStorage";
import { CodeBlockProcessorService } from "@app/services/core/CodeBlockProcessorService";
import { ExerciseDefinitionService } from "@app/services/exercise/ExerciseDefinitionService";
import { MuscleTagService } from "@app/services/exercise/MuscleTagService";
import { ExerciseLibrary } from "@app/services/exercise/ExerciseLibrary";
import { TemplateGeneratorService } from "@app/services/templates/TemplateGeneratorService";
import { CreateLogModal } from "@app/features/modals/log/CreateLogModal";
import { ChartRenderer } from "@app/features/charts/components/ChartRenderer";
import { WorkoutPlannerAPI } from "@app/api/WorkoutPlannerAPI";
import { ParameterUtils } from "@app/utils/parameter/ParameterUtils";
import { LocalizationService, t } from "@app/i18n";
import { WorkoutEventBus } from "@app/services/events/WorkoutEventBus";
import type { LogBulkChangedPayload } from "@app/services/events/WorkoutEventTypes";
import type { WeightUnit } from "@app/utils/WeightUnitUtils";
import { TOUR_TARGETS, markTourTarget } from "@app/features/tour/tourTargets";

// Extend Window interface for WorkoutPlannerAPI
declare global {
  interface Window {
    WorkoutPlannerAPI?: WorkoutPlannerAPI;
  }
}

// ===================== MAIN PLUGIN =====================

export default class WorkoutChartsPlugin extends Plugin {
  settings!: WorkoutChartsSettings;
  public embeddedChartView!: EmbeddedChartView;
  public embeddedTableView!: EmbeddedTableView;
  public embeddedDashboardView!: EmbeddedDashboardView;
  private activeTimers: Map<string, EmbeddedTimerView> = new Map();
  private quickLogRibbonIcon: HTMLElement | null = null;
  private tourEngine: TourEngine | null = null;

  // Services
  private commandHandlerService!: CommandHandlerService;
  private workoutLogFile!: WorkoutLogFile;
  private codeBlockProcessorService!: CodeBlockProcessorService;
  private exerciseDefinitionService!: ExerciseDefinitionService;
  private muscleTagService!: MuscleTagService;
  private exerciseLibrary!: ExerciseLibrary;
  public templateGeneratorService!: TemplateGeneratorService;

  // Public API for Dataview integration
  private workoutPlannerAPI!: WorkoutPlannerAPI;

  // Event bus (Fase 1 — non ancora usato da nessuno)
  public eventBus!: WorkoutEventBus;

  // Expose createLogModalHandler for dashboard quick actions
  public get createLogModalHandler() {
    return {
      openModal: () => {
        new CreateLogModal(
          this.app,
          this,
          undefined,
          undefined,
          undefined,
          true,
        ).open();
      },
    };
  }

  /** The guided tour engine (one tour at a time, stopped on unload). */
  getTourEngine(): TourEngine {
    this.tourEngine ??= new TourEngine(this.app);
    return this.tourEngine;
  }

  async onload() {
    await this.loadSettings();

    // Fase 1: inizializza event bus (non ancora usato da altri componenti)
    this.eventBus = new WorkoutEventBus();
    this.eventBus.on(
      "plugin:error",
      ({ source, error, recoverable }) => {
        if (!recoverable) {
          new Notice(`Workout Plugin [${source}]: ${error.message}`);
        }
      },
    );

    // Initialize LocalizationService (must be first - other services may use translations)
    LocalizationService.initialize(this.app);

    // Initialize ParameterUtils with weight unit
    ParameterUtils.setWeightUnit(this.settings.weightUnit);

    // Initialize embedded views
    this.embeddedChartView = new EmbeddedChartView(this);
    this.embeddedTableView = new EmbeddedTableView(this);
    this.embeddedDashboardView = new EmbeddedDashboardView(this);

    // Initialize services
    this.workoutLogFile = new WorkoutLogFile(
      new VaultLogStorage(this.app, this.settings),
      this.settings,
      this.eventBus,
    );
    this.exerciseLibrary = new ExerciseLibrary(this.app, this.settings);
    this.exerciseLibrary.watch((ref) => this.registerEvent(ref));
    this.exerciseDefinitionService = new ExerciseDefinitionService(
      this.app,
      this.settings,
      this.exerciseLibrary,
    );
    this.muscleTagService = new MuscleTagService(
      this.app,
      this.settings,
      this.exerciseLibrary,
    );
    this.templateGeneratorService = new TemplateGeneratorService(
      this.app,
      this,
    );
    this.commandHandlerService = new CommandHandlerService(
      this.app,
      this,
    );
    this.codeBlockProcessorService = new CodeBlockProcessorService(
      this,
      this,
      this.embeddedChartView,
      this.embeddedTableView,
      this.embeddedDashboardView,
      this.activeTimers,
      this.eventBus,
    );
    // Initialize and expose WorkoutPlannerAPI for Dataview integration
    this.workoutPlannerAPI = new WorkoutPlannerAPI(
      this,
      this.exerciseLibrary,
    );
    window.WorkoutPlannerAPI = this.workoutPlannerAPI;

    this.codeBlockProcessorService.registerProcessors();

    this.app.workspace.onLayoutReady(() => {
      this.commandHandlerService.registerCommands();
      void this.openGettingStartedOnFreshInstall();
    });

    this.addSettingTab(new WorkoutChartsSettingTab(this.app, this));
    this.updateQuickLogRibbon();
  }

  /**
   * Updates the ribbon icon visibility (settings.showRibbonIcon).
   * The ribbon opens CreateLogModal.
   */
  public updateQuickLogRibbon(): void {
    if (this.quickLogRibbonIcon) {
      this.quickLogRibbonIcon.remove();
      this.quickLogRibbonIcon = null;
    }
    if (!this.settings.showRibbonIcon) {
      return;
    }

    this.quickLogRibbonIcon = this.addRibbonIcon(
      "dumbbell",
      t("modal.titles.createLog"),
      () => this.createLogModalHandler.openModal(),
    );
    markTourTarget(this.quickLogRibbonIcon, TOUR_TARGETS.ribbonIcon);
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

    // 0. Stop a running guided tour (overlay, scope, frame loop, workspace events)
    this.tourEngine?.destroy();
    this.tourEngine = null;

    // 0b. Destroy event bus (before the rest, to prevent stale handlers)
    this.eventBus?.destroy();

    // 1. Clean up all active timers
    for (const timerView of this.activeTimers.values()) {
      timerView.destroy();
    }
    this.activeTimers.clear();

    // 2. Clean up embedded views (each view handles its own cleanup)
    this.embeddedChartView?.cleanup();
    this.embeddedTableView?.cleanup();
    this.embeddedDashboardView?.cleanup();

    // 3. Release the log file (de-registers cache event listeners, clears cache)
    this.workoutLogFile?.destroy();

    // 3c. Destroy muscle tag service (unregister file watcher, clear cache)
    this.muscleTagService?.destroy();

    // 3d. Cleanup LocalizationService
    LocalizationService.getInstance()?.destroy();

    // 4. Destroy all Chart.js instances (additional safety net)
    ChartRenderer.destroyAllCharts();

    // 5. Nullify service references to allow garbage collection
    this.codeBlockProcessorService = null!;
    this.commandHandlerService = null!;
    this.exerciseDefinitionService = null!;

    // 6. Remove ribbon icon if present
    if (this.quickLogRibbonIcon) {
      this.quickLogRibbonIcon.remove();
      this.quickLogRibbonIcon = null;
    }

    // 7. Remove WorkoutPlannerAPI from window
    if (window.WorkoutPlannerAPI) {
      delete window.WorkoutPlannerAPI;
    }
  }

  /** What `loadData()` returned at startup; null on a fresh install */
  private savedDataAtLoad: Partial<WorkoutChartsSettings> | null = null;

  private async openGettingStartedOnFreshInstall(): Promise<void> {
    if (!(await shouldShowWelcome(this, this.savedDataAtLoad))) return;
    await openOnboarding(this);
  }

  async loadSettings() {
    const saved = (await this.loadData()) as Partial<WorkoutChartsSettings> | null;
    this.savedDataAtLoad = saved;
    this.settings = Object.assign({}, DEFAULT_SETTINGS, saved);
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  async getWorkoutLogData(): Promise<WorkoutLogData[]> {
    return this.workoutLogFile.read();
  }

  public clearLogDataCache(): void {
    this.workoutLogFile.clearCache();
  }

  /**
   * Get the ExerciseDefinitionService instance.
   * Used by modals and views to access exercise type definitions.
   */
  public getExerciseDefinitionService(): ExerciseDefinitionService {
    return this.exerciseDefinitionService;
  }

  /**
   * The exercise pages, found by exercise name.
   */
  public getExerciseLibrary(): ExerciseLibrary {
    return this.exerciseLibrary;
  }

  /**
   * Get the MuscleTagService instance.
   * Used by components to access custom muscle tag mappings.
   */
  public getMuscleTagService(): MuscleTagService {
    return this.muscleTagService;
  }

  /**
   * Create a new CSV log file with header
   */
  public async createCSVLogFile(): Promise<void> {
    return this.workoutLogFile.create();
  }

  /**
   * Add a new workout log entry to the CSV file
   */
  public async addWorkoutLogEntry(
    entry: LogEntryInput,
  ): Promise<void> {
    return this.workoutLogFile.add(entry);
  }

  /**
   * Update an existing workout log entry in the CSV file
   */
  public async updateWorkoutLogEntry(
    originalLog: WorkoutLogData,
    updatedEntry: LogEntryInput,
  ): Promise<void> {
    return this.workoutLogFile.update(originalLog, updatedEntry);
  }

  /**
   * Delete a workout log entry from the CSV file
   */
  public async deleteWorkoutLogEntry(
    logToDelete: WorkoutLogData,
  ): Promise<void> {
    return this.workoutLogFile.delete(logToDelete);
  }

  /**
   * Groups multiple mutations into a single coalesced event: log:* events
   * emitted inside fn() are suppressed, then one log:bulk-changed is emitted.
   */
  public async batchOperation(
    operation: LogBulkChangedPayload["operation"],
    fn: () => Promise<void>,
  ): Promise<void> {
    return this.eventBus.batch(operation, fn);
  }

  /**
   * Rename an exercise in the CSV file
   */
  public async renameExercise(
    oldName: string,
    newName: string,
  ): Promise<number> {
    return this.workoutLogFile.renameExercise(oldName, newName);
  }

  /**
   * Give logs without a weight unit the given unit
   */
  public async stampMissingWeightUnits(unit: WeightUnit): Promise<number> {
    return this.workoutLogFile.stampMissingWeightUnits(unit);
  }

  /**
   * Find the most recent log entry for a given exercise
   */
  public async findLastEntryForExercise(
    exerciseName: string,
  ): Promise<WorkoutLogData | undefined> {
    return this.workoutLogFile.findLastForExercise(exerciseName);
  }

  public getWorkoutPlannerAPI(): WorkoutPlannerAPI {
    return this.workoutPlannerAPI;
  }

  /**
   * Trigger targeted refresh of workout log views via custom workspace events.
   * Forces a global refresh of all embedded views via the event bus.
   * Emits log:bulk-changed which causes all EventAwareRenderChild instances to re-render.
   *
   * @deprecated Internal views now refresh automatically via WorkoutEventBus.
   * This method is kept for external callers (e.g. Dataview scripts) that need
   * to force a manual refresh.
   */
  public triggerWorkoutLogRefresh(): void {
    this.eventBus.emit({
      type: "log:bulk-changed",
      payload: { count: 0, operation: "other" },
    });
  }

  /**
   * Trigger refresh after muscle tag mappings change.
   *
   * Clears the MuscleTagService cache, fires a dedicated
   * "workout-planner:muscle-tags-changed" event, and also triggers a global
   * data-changed event so dashboards (which already listen for it) re-render
   * their MuscleHeatMap widget with updated tag mappings.
   */
  public triggerMuscleTagRefresh(): void {
    this.muscleTagService.clearCache();
    this.eventBus.emit({ type: "muscle-tags:changed", payload: {} });
  }
}
