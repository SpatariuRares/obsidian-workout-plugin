/**
 * Service for analyzing workout files to extract duration components.
 * Handles parsing of workout-timer and workout-log code blocks.
 */
import { TFile } from "obsidian";
import { DurationAnalysisResult } from "@app/features/duration/types";
import { StringUtils } from "@app/utils/StringUtils";
import { ErrorUtils } from "@app/utils/ErrorUtils";
import { TrainingHistory } from "@app/services/history/TrainingHistory";
import type {
  AppPort,
  SettingsPort,
  WorkoutDataPort,
} from "@app/types/PluginPorts";

/** Default set duration in seconds (used if not configured in settings) */
const DEFAULT_SET_DURATION = 60;

/** Maximum reasonable set count (guards against parsing years like 2023 as sets) */
const MAX_REASONABLE_SETS = 100;

export class WorkoutFileAnalyzer {
  constructor(
    private plugin: AppPort &
      SettingsPort &
      Pick<WorkoutDataPort, "getWorkoutLogData">,
  ) {}

  /**
   * Analyzes a workout file to extract duration components.
   * Scans for workout-timer blocks to sum rest times and
   * counts sets from workout-log blocks.
   * @param filePath - Path to the workout file to analyze
   * @returns Analysis result with duration breakdown
   */
  /**
   * Analyzes a workout file to extract duration components.
   * Scans for workout-timer and workout-log blocks within exercise sections.
   * Multiplies component durations by the number of sets found (in headers or limits).
   * @param filePath - Path to the workout file to analyze
   * @returns Analysis result with duration breakdown
   */
  async analyzeWorkoutFile(
    filePath: string,
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
      const file =
        this.plugin.app.vault.getAbstractFileByPath(filePath);

      if (!file || !(file instanceof TFile)) {
        result.error = `File not found: ${filePath}`;
        return result;
      }

      // Read file content
      const content = await this.plugin.app.vault.read(file);

      // Split content into sections by H2 headers to process exercises independently
      const sections = content.split(/^##\s+/m);

      for (const section of sections) {
        // Skip empty sections
        if (!section.trim()) continue;
        this.analyzeSection(section, result);
      }

      // If no sets found but we analyzed something, ensure consistency
      if (result.setCount === 0 && result.totalDuration === 0) {
        // If absolutely nothing found, success might be false or true with 0?
        // Let's assume minimum 1 set if we didn't error out,
        // similar to previous logic, but only if we failed to find specific sets
        // Actually, if sections were empty, result is 0.
        // Let's keep 0 if 0.
      } else if (result.setCount === 0) {
        result.setCount = 1;
      }

      // Calculate total duration (SetTime is already accumulated in analyzeSection)
      result.totalDuration =
        result.totalRestTime + result.totalSetTime;

      // Attempt to calculate historical duration from logs
      await this.calculateHistoricalDuration(filePath, result);

      result.success = true;
    } catch (error) {
      result.error = ErrorUtils.getErrorMessage(error);
    }

    return result;
  }

  /**
   * Calculates duration from the first and last set of the latest session
   */
  private async calculateHistoricalDuration(
    filePath: string,
    result: DurationAnalysisResult,
  ): Promise<void> {
    try {
      const logs = await this.plugin.getWorkoutLogData();

      // Extract workout name from file path (basename without extension)
      const workoutName =
        filePath.split("/").pop()?.replace(".md", "") || "";

      // Most recent session with a plausible duration
      const latest = new TrainingHistory(logs)
        .sessions({ workout: workoutName })
        .filter((session) => session.duration !== undefined)
        .pop();
      if (latest) {
        result.historicalDuration = latest.duration;
        result.lastSessionDate = latest.day;
      }
    } catch {
      return;
    }
  }

  /**
   * Analyzes a single section for sets, timers, and logs.
   */
  private analyzeSection(
    sectionContent: string,
    result: DurationAnalysisResult,
  ): void {
    const hasTimer = /```workout-timer/.test(sectionContent);
    const hasLog = /```workout-log/.test(sectionContent);

    // Skip parsing if section has no workout components
    if (!hasTimer && !hasLog) return;

    let sets = 0;

    // 1. Try to find "### X serie" or "### X sets" in headers
    // Also look for reps pattern: "x 10 reps" or "x 8-12 reps"
    const headerMatch = sectionContent.match(
      /###\s*(\d+)\s*(?:serie|sets|series)/i,
    );

    // Reps parsing: look for "x N" or "x N-M"
    // We capture the suffix to check if it's a time unit (s, sec, min) to avoid false positives
    const repsMatch = sectionContent.match(
      /[xX]\s*(\d+)(?:-(\d+))?\s*([a-zA-Z/]+)?/i,
    );

    let reps = 0;
    if (repsMatch) {
      const suffix = repsMatch[3]
        ? StringUtils.normalize(repsMatch[3])
        : "";
      // If suffix looks like time (s, sec, min), ignore it
      // Note: 'reps', 'series', etc. are fine.
      const isTime = [
        "s",
        "sec",
        "min",
        "m",
        "seconds",
        "secondi",
      ].some(
        (u) =>
          suffix.startsWith(u) &&
          !suffix.startsWith("series") &&
          !suffix.startsWith("sets"),
      );

      if (!isTime) {
        const minReps = parseInt(repsMatch[1], 10);
        const maxReps = repsMatch[2]
          ? parseInt(repsMatch[2], 10)
          : minReps;
        reps = (minReps + maxReps) / 2;
      }
    }

    if (headerMatch) {
      sets = parseInt(headerMatch[1], 10);
    }

    // 2. Fallback to workout-log limit if sets not found
    if (sets === 0) {
      const limitMatch = sectionContent.match(/limit:\s*(\d+)/);
      if (limitMatch) {
        sets = parseInt(limitMatch[1], 10);
      }
    }

    // 3. Default to 1 set if nothing found
    if (sets === 0) sets = 1;

    // Add checks to prevent unreasonable set counts (e.g. year 2023)
    if (sets > MAX_REASONABLE_SETS) sets = 1;

    result.setCount += sets;

    // 4. Sum rest timers in this section
    const timerBlockRegex = /```workout-timer\s*([\s\S]*?)```/g;
    let timerMatch;
    let sectionTimerSum = 0;
    let timersFound = 0;

    while (
      (timerMatch = timerBlockRegex.exec(sectionContent)) !== null
    ) {
      const blockContent = timerMatch[1];
      const durationMatch = blockContent.match(/duration:\s*(\d+)/);

      if (durationMatch) {
        const duration = parseInt(durationMatch[1], 10);
        if (!isNaN(duration) && duration > 0) {
          sectionTimerSum += duration;
          timersFound++;
        }
      }
    }

    if (sectionTimerSum > 0) {
      // Multiply total section rest by number of sets
      result.totalRestTime += sectionTimerSum * sets;
      // If we found multiple timers in a section (e.g. superset),
      // we might count them as 1 "rest period" per set logically,
      // or just sum them up. Current logic sums them.
      result.restPeriodCount += timersFound * sets;
    }

    // 5. Calculate execution time
    // Logic:
    // - If reps known: Sets * Reps * RepDuration
    // - If reps unknown but defaultReps > 0: Sets * DefaultReps * RepDuration
    // - Fallback: Sets * SetDuration

    let timePerSet = 0;
    const settings = this.plugin.settings;
    const repDuration = settings.repDuration || 5;
    const defaultReps = settings.defaultRepsPerSet || 0;
    const fallbackSetDuration =
      settings.setDuration || DEFAULT_SET_DURATION;

    // Prioritize specific reps found in text
    if (reps > 0) {
      timePerSet = reps * repDuration;
    }
    // Then use default reps if configured (and not 0)
    else if (defaultReps > 0) {
      timePerSet = defaultReps * repDuration;
    }
    // Finally fallback to fixed set duration
    else {
      timePerSet = fallbackSetDuration;
    }

    result.totalSetTime += sets * timePerSet;
  }
}
