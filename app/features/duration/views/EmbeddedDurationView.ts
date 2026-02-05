/**
 * Embedded Duration View for workout duration estimation.
 * Orchestrates duration calculation by delegating to specialized modules.
 */
import WorkoutChartsPlugin from "main";
import { BaseView } from "@app/features/common/views/BaseView";
import { EmbeddedDurationParams } from "@app/features/duration/types";
import { WorkoutFileAnalyzer } from "@app/features/duration/services/WorkoutFileAnalyzer";
import { DurationRenderer } from "@app/features/duration/renderers/DurationRenderer";
import { resolveFilePath } from "@app/utils/path-resolver";

/**
 * Thin orchestrator view for duration estimation.
 * Delegates business logic to WorkoutFileAnalyzer and rendering to DurationRenderer.
 */
export class EmbeddedDurationView extends BaseView {
  private analyzer: WorkoutFileAnalyzer;
  private renderer: DurationRenderer;

  constructor(plugin: WorkoutChartsPlugin) {
    super(plugin);
    this.analyzer = new WorkoutFileAnalyzer(plugin);
    this.renderer = new DurationRenderer();
  }

  /**
   * Creates the duration estimator display.
   * @param container - The HTML element to render into
   * @param params - Parameters from the code block
   * @param currentFilePath - Path of the file containing the code block
   */
  async createDurationEstimator(
    container: HTMLElement,
    params: EmbeddedDurationParams,
    currentFilePath: string,
  ): Promise<void> {
    this.logDebug("EmbeddedDurationView", "Creating duration estimator", {
      params,
      currentFilePath,
    });

    try {
      // Clear container
      container.empty();

      // Determine which file to analyze
      const targetPath = params.workout
        ? resolveFilePath(params.workout, currentFilePath)
        : currentFilePath;

      // Analyze the file for duration data
      const analysis = await this.analyzer.analyzeWorkoutFile(targetPath);

      // Render the duration info card
      this.renderer.renderDurationCard(container, analysis);
    } catch (error) {
      const errorObj =
        error instanceof Error ? error : new Error(String(error));
      this.handleError(container, errorObj);
    }
  }
}
