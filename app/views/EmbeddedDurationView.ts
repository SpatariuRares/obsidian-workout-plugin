/**
 * Embedded Duration View for workout duration estimation.
 * Calculates total rest time + total set time to provide estimated workout duration.
 */
import { TFile, normalizePath } from "obsidian";
import WorkoutChartsPlugin from "main";
import { BaseView } from "@app/views/BaseView";
import { EmbeddedDurationParams, DurationAnalysisResult } from "@app/types";
import { CONSTANTS } from "@app/constants/Constants";

/** Default set duration in seconds (used if not configured in settings) */
const DEFAULT_SET_DURATION = 45;

export class EmbeddedDurationView extends BaseView {
  constructor(plugin: WorkoutChartsPlugin) {
    super(plugin);
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
    currentFilePath: string
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
        ? this.resolveFilePath(params.workout, currentFilePath)
        : currentFilePath;

      // Analyze the file for duration data
      const analysis = await this.analyzeWorkoutFile(targetPath);

      // Render the duration info card
      this.renderDurationCard(container, analysis, params.debug);
    } catch (error) {
      const errorObj =
        error instanceof Error ? error : new Error(String(error));
      this.handleError(container, errorObj);
    }
  }

  /**
   * Resolves a relative or absolute file path.
   * @param path - The path specified in the workout parameter
   * @param currentFilePath - The current file's path for relative resolution
   */
  private resolveFilePath(path: string, currentFilePath: string): string {
    // If it's already an absolute path (starts from root), use it directly
    if (path.startsWith("/")) {
      return normalizePath(path.slice(1)); // Remove leading slash for Obsidian
    }

    // Add .md extension if not present
    const pathWithExtension = path.endsWith(".md") ? path : `${path}.md`;

    // Resolve relative to current file's directory
    const currentDir = currentFilePath.substring(
      0,
      currentFilePath.lastIndexOf("/")
    );
    if (currentDir) {
      return normalizePath(`${currentDir}/${pathWithExtension}`);
    }

    return normalizePath(pathWithExtension);
  }

  /**
   * Analyzes a workout file to extract duration components.
   * Scans for workout-timer blocks to sum rest times and
   * counts exercises to estimate set time.
   */
  private async analyzeWorkoutFile(
    filePath: string
  ): Promise<DurationAnalysisResult> {
    const result: DurationAnalysisResult = {
      totalRestTime: 0,
      restPeriodCount: 0,
      setCount: 0,
      totalSetTime: 0,
      totalDuration: 0,
      workoutPath: filePath,
      success: false,
    };

    try {
      // Get the file
      const file = this.plugin.app.vault.getAbstractFileByPath(filePath);

      if (!file || !(file instanceof TFile)) {
        result.error = `File not found: ${filePath}`;
        return result;
      }

      // Read file content
      const content = await this.plugin.app.vault.read(file);

      // Parse workout-timer blocks for rest durations
      const timerBlockRegex =
        /```workout-timer\s*([\s\S]*?)```/g;
      let timerMatch;

      while ((timerMatch = timerBlockRegex.exec(content)) !== null) {
        const blockContent = timerMatch[1];
        const durationMatch = blockContent.match(/duration:\s*(\d+)/);

        if (durationMatch) {
          const duration = parseInt(durationMatch[1], 10);
          if (!isNaN(duration) && duration > 0) {
            result.totalRestTime += duration;
            result.restPeriodCount++;
          }
        }
      }

      // Count sets from workout-log blocks
      // Each workout-log block represents at least one set location
      // For simplicity, we count the number of timer blocks as a proxy for sets
      // (since typically there's a timer between each exercise/set group)
      // A more accurate count would require analyzing the actual log data

      // For now, estimate sets as restPeriodCount (each rest period = 1 set group)
      // If no timers found, default to 1 set
      result.setCount = result.restPeriodCount > 0 ? result.restPeriodCount : 1;

      // Calculate set time using settings or default
      const setDuration = this.plugin.settings.setDuration || DEFAULT_SET_DURATION;
      result.totalSetTime = result.setCount * setDuration;

      // Calculate total duration
      result.totalDuration = result.totalRestTime + result.totalSetTime;
      result.success = true;

      this.logDebug("EmbeddedDurationView", "Analysis complete", result);
    } catch (error) {
      result.error =
        error instanceof Error ? error.message : "Unknown error occurred";
    }

    return result;
  }

  /**
   * Renders the duration info card with the analysis results.
   * Uses an info card style distinct from the timer countdown display.
   */
  private renderDurationCard(
    container: HTMLElement,
    analysis: DurationAnalysisResult,
    debug?: boolean
  ): void {
    const card = container.createEl("div", {
      cls: "workout-duration-card",
    });

    // Header with icon
    const header = card.createEl("div", {
      cls: "workout-duration-header",
    });

    header.createEl("span", {
      cls: "workout-duration-icon",
      text: "⏱️",
    });

    header.createEl("span", {
      cls: "workout-duration-title",
      text: "Estimated duration",
    });

    // Handle error state
    if (!analysis.success) {
      const errorDiv = card.createEl("div", {
        cls: "workout-duration-error",
        text: analysis.error || "Unable to analyze workout file",
      });
      return;
    }

    // Main duration display
    const mainDisplay = card.createEl("div", {
      cls: "workout-duration-main",
    });

    mainDisplay.createEl("span", {
      cls: "workout-duration-value",
      text: this.formatDuration(analysis.totalDuration),
    });

    // Breakdown section
    const breakdown = card.createEl("div", {
      cls: "workout-duration-breakdown",
    });

    // Rest time row
    const restRow = breakdown.createEl("div", {
      cls: "workout-duration-row",
    });
    restRow.createEl("span", {
      cls: "workout-duration-label",
      text: "Rest time",
    });
    restRow.createEl("span", {
      cls: "workout-duration-detail",
      text: this.formatDuration(analysis.totalRestTime),
    });

    // Set time row
    const setRow = breakdown.createEl("div", {
      cls: "workout-duration-row",
    });
    setRow.createEl("span", {
      cls: "workout-duration-label",
      text: "Set time",
    });
    setRow.createEl("span", {
      cls: "workout-duration-detail",
      text: `${this.formatDuration(analysis.totalSetTime)} (${analysis.setCount} sets)`,
    });

    // Debug info (if enabled)
    if (debug) {
      const debugSection = card.createEl("div", {
        cls: "workout-duration-debug",
      });

      debugSection.createEl("div", {
        cls: "workout-duration-debug-title",
        text: "Debug info",
      });

      const debugContent = debugSection.createEl("pre", {
        cls: "workout-duration-debug-content",
      });
      debugContent.textContent = JSON.stringify(
        {
          workoutPath: analysis.workoutPath,
          restPeriodCount: analysis.restPeriodCount,
          setCount: analysis.setCount,
          setDuration: this.plugin.settings.setDuration || DEFAULT_SET_DURATION,
        },
        null,
        2
      );
    }
  }

  /**
   * Formats seconds into a human-readable duration string.
   * @param seconds - Total seconds
   * @returns Formatted string like "5m 30s" or "1h 15m"
   */
  private formatDuration(seconds: number): string {
    if (seconds < 60) {
      return `${seconds}s`;
    }

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      if (minutes > 0) {
        return `${hours}h ${minutes}m`;
      }
      return `${hours}h`;
    }

    if (secs > 0) {
      return `${minutes}m ${secs}s`;
    }
    return `${minutes}m`;
  }
}
