/**
 * Service for analyzing workout files to extract duration components.
 * Estimates the note's plan (readSectionPlan) as the session runs it.
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
import { setsBlock } from "@app/features/tables/setsBlock";
import { readSectionPlan } from "@app/features/session/business/sessionPlan";
import { timerRunSeconds } from "@app/features/timer/business/timerRunSeconds";
import { TrainingHistory } from "@app/services/history/TrainingHistory";
import { PathUtils } from "@app/utils/PathUtils";
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
   * Each level-2 section is estimated from its plan steps (planned sets,
   * target reps, rest), falling back to its heading and prose.
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

      const workoutName = PathUtils.noteName(filePath);

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
    return timerRunSeconds(parsed.params, this.plugin.settings);
  }

  /**
   * Adds a section to the estimate. A section with plan steps (see
   * readSectionPlan) is estimated as the session runs it: each step's
   * planned sets and target reps, and the one rest after each set. The
   * heading and prose (`### 3 sets x 10 reps`) only fill in what the blocks
   * don't plan; a section without steps (a warm-up timer, a table of a
   * whole workout) counts its timers as they run.
   */
  private analyzeSection(
    section: NoteSection,
    result: DurationAnalysisResult,
  ): void {
    const prose = readProsePlan(
      [section.heading ?? "", section.text].join("\n"),
    );
    const steps = readSectionPlan(section);

    if (steps.length > 0) {
      for (const step of steps) {
        const sets = step.sets ?? prose.sets ?? 1;
        const rest = step.rest
          ? timerRunSeconds(step.rest, this.plugin.settings)
          : 0;
        this.addSets(result, sets, step.targetReps ?? prose.reps);
        if (rest > 0) {
          result.totalRestTime += rest * sets;
          result.restPeriodCount += sets;
        }
      }
      return;
    }

    const timers = section.blocks.filter((b) => b.type === timerBlock.type);
    const tables = section.blocks.filter(
      (b) => b.type === tableBlock.type || b.type === setsBlock.type,
    );
    if (timers.length === 0 && tables.length === 0) return;

    const sets = prose.sets ?? 1;
    this.addSets(result, sets, prose.reps);
    for (const block of timers) {
      const seconds = this.timerSeconds(block.body);
      if (seconds > 0) {
        result.totalRestTime += seconds * sets;
        result.restPeriodCount += sets;
      }
    }
  }

  /**
   * Adds the time of `sets` sets: their reps at the rep duration, else the
   * default reps per set, else the set duration
   */
  private addSets(
    result: DurationAnalysisResult,
    sets: number,
    reps: number | undefined,
  ): void {
    const settings = this.plugin.settings;
    const repDuration = settings.repDuration || 5;
    const defaultReps = settings.defaultRepsPerSet || 0;
    let timePerSet = settings.setDuration || DEFAULT_SET_DURATION;
    if (reps && reps > 0) timePerSet = reps * repDuration;
    else if (defaultReps > 0) timePerSet = defaultReps * repDuration;

    result.setCount += sets;
    result.totalSetTime += sets * timePerSet;
  }
}

/** Suffixes after "x N" that make N a time, not reps */
const TIME_SUFFIXES = ["s", "sec", "min", "m", "seconds", "secondi"];

/**
 * Sets and reps written in a section's heading and prose, never in its code
 * blocks: "### 3 sets", "x 10 reps", "x 8-12" (the middle of the range);
 * "x 30 sec" is a time, not reps
 */
function readProsePlan(text: string): { sets?: number; reps?: number } {
  const plan: { sets?: number; reps?: number } = {};

  const setsMatch = text.match(/###\s*(\d+)\s*(?:serie|sets|series)/i);
  if (setsMatch) {
    const sets = parseInt(setsMatch[1], 10);
    // Guards against parsing years like 2023 as sets
    if (sets > 0 && sets <= MAX_REASONABLE_SETS) plan.sets = sets;
  }

  const repsMatch = text.match(/[xX]\s*(\d+)(?:-(\d+))?\s*([a-zA-Z/]+)?/i);
  if (repsMatch) {
    const suffix = repsMatch[3] ? StringUtils.normalize(repsMatch[3]) : "";
    const isTime = TIME_SUFFIXES.some(
      (u) =>
        suffix.startsWith(u) &&
        !suffix.startsWith("series") &&
        !suffix.startsWith("sets"),
    );
    if (!isTime) {
      const minReps = parseInt(repsMatch[1], 10);
      const maxReps = repsMatch[2] ? parseInt(repsMatch[2], 10) : minReps;
      plan.reps = (minReps + maxReps) / 2;
    }
  }

  return plan;
}
