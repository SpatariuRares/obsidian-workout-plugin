/**
 * Service for analyzing workout files to extract duration components.
 * Handles parsing of workout-timer and workout-log code blocks.
 */
import { TFile } from "obsidian";
import { DurationAnalysisResult } from "@app/features/duration/types";
import { StringUtils } from "@app/utils/StringUtils";
import { ErrorUtils } from "@app/utils/ErrorUtils";
import {
  readWorkoutNote,
  type NoteSection,
} from "@app/services/notes/WorkoutNote";
import { tableBlock } from "@app/features/tables/tableBlock";
import { timerBlock } from "@app/features/timer/timerBlock";
import { resolveTimer } from "@app/features/timer/business/resolveTimer";
import { TIMER_TYPE } from "@app/features/timer/types";
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

      // Each level-2 section is one exercise
      for (const section of readWorkoutNote(content).sections) {
        this.analyzeSection(section, result);
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

  /** Seconds a workout-timer block runs for; 0 for stopwatches and broken blocks */
  private timerSeconds(body: string): number {
    const parsed = timerBlock.parse(body);
    if (parsed.errors.length > 0) return 0;
    const { params, error } = resolveTimer(parsed.params, this.plugin.settings);
    if (error || params.type === TIMER_TYPE.STOPWATCH) return 0;
    const duration = params.duration ?? 0;
    return params.type === TIMER_TYPE.INTERVAL
      ? duration * (params.rounds ?? 1)
      : duration;
  }

  /**
   * Analyzes a single section for sets, timers, and logs.
   */
  private analyzeSection(
    section: NoteSection,
    result: DurationAnalysisResult,
  ): void {
    const timers = section.blocks.filter((b) => b.type === timerBlock.type);
    const logs = section.blocks.filter((b) => b.type === tableBlock.type);

    // Skip parsing if section has no workout components
    if (timers.length === 0 && logs.length === 0) return;

    // Sets and reps are read from the heading and prose, never from code blocks
    const sectionContent = [section.heading ?? "", section.text].join("\n");

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
      const limit = logs
        .map((log) => tableBlock.parse(log.body).params.limit)
        .find((value) => value !== undefined);
      if (limit) sets = limit;
    }

    // 3. Default to 1 set if nothing found
    if (sets === 0) sets = 1;

    // Add checks to prevent unreasonable set counts (e.g. year 2023)
    if (sets > MAX_REASONABLE_SETS) sets = 1;

    result.setCount += sets;

    // 4. Sum rest timers in this section, as each timer runs (preset,
    // defaults, rounds); a block with invalid values shows an error instead
    // of a timer, so it doesn't count
    let sectionTimerSum = 0;
    let timersFound = 0;
    for (const block of timers) {
      const seconds = this.timerSeconds(block.body);
      if (seconds > 0) {
        sectionTimerSum += seconds;
        timersFound++;
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
