/**
 * Service for analyzing workout files to extract duration components.
 * Handles parsing of workout-timer and workout-log code blocks.
 */
import { TFile } from "obsidian";
import WorkoutChartsPlugin from "main";
import { DurationAnalysisResult } from "@app/features/duration/types";

/** Default set duration in seconds (used if not configured in settings) */
const DEFAULT_SET_DURATION = 45;

export class WorkoutFileAnalyzer {
  constructor(private plugin: WorkoutChartsPlugin) {}

  /**
   * Analyzes a workout file to extract duration components.
   * Scans for workout-timer blocks to sum rest times and
   * counts sets from workout-log blocks.
   * @param filePath - Path to the workout file to analyze
   * @returns Analysis result with duration breakdown
   */
  async analyzeWorkoutFile(filePath: string): Promise<DurationAnalysisResult> {
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
      this.parseTimerBlocks(content, result);

      // Count sets from workout-log blocks
      this.parseLogBlocks(content, result);

      // If no workout-log blocks found, default to 1 set
      if (result.setCount === 0) {
        result.setCount = 1;
      }

      // Calculate set time using settings or default
      const setDuration =
        this.plugin.settings.setDuration || DEFAULT_SET_DURATION;
      result.totalSetTime = result.setCount * setDuration;

      // Calculate total duration
      result.totalDuration = result.totalRestTime + result.totalSetTime;
      result.success = true;
    } catch (error) {
      result.error =
        error instanceof Error ? error.message : "Unknown error occurred";
    }

    return result;
  }

  /**
   * Parses workout-timer blocks to extract rest durations.
   */
  private parseTimerBlocks(
    content: string,
    result: DurationAnalysisResult,
  ): void {
    const timerBlockRegex = /```workout-timer\s*([\s\S]*?)```/g;
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
  }

  /**
   * Parses workout-log blocks to count sets.
   * Each workout-log block can have an optional 'limit' parameter indicating expected sets.
   * If no limit is specified, count as 1 set per block.
   */
  private parseLogBlocks(
    content: string,
    result: DurationAnalysisResult,
  ): void {
    const logBlockRegex = /```workout-log\s*([\s\S]*?)```/g;
    let logMatch;

    while ((logMatch = logBlockRegex.exec(content)) !== null) {
      const blockContent = logMatch[1];
      const limitMatch = blockContent.match(/limit:\s*(\d+)/);

      if (limitMatch) {
        const limit = parseInt(limitMatch[1], 10);
        if (!isNaN(limit) && limit > 0) {
          result.setCount += limit;
        } else {
          // Invalid limit, count as 1 set
          result.setCount += 1;
        }
      } else {
        // No limit specified, count as 1 set per block
        result.setCount += 1;
      }
    }
  }
}
