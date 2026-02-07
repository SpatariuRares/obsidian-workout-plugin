/**
 * Service for analyzing workout files to extract duration components.
 * Handles parsing of workout-timer and workout-log code blocks.
 */
import { TFile } from "obsidian";
import WorkoutChartsPlugin from "main";
import { DurationAnalysisResult } from "@app/features/duration/types";

/** Default set duration in seconds (used if not configured in settings) */
const DEFAULT_SET_DURATION = 60;

export class WorkoutFileAnalyzer {
  constructor(private plugin: WorkoutChartsPlugin) {}

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
      result.totalDuration = result.totalRestTime + result.totalSetTime;
      
      // Attempt to calculate historical duration from logs
      await this.calculateHistoricalDuration(filePath, result);
      
      result.success = true;
    } catch (error) {
      result.error =
        error instanceof Error ? error.message : "Unknown error occurred";
    }

    return result;
  }

  /**
   * Calculates duration based on historical logs from workout_logs.csv
   */
  private async calculateHistoricalDuration(
    filePath: string,
    result: DurationAnalysisResult
  ): Promise<void> {
    try {
      // Use the configured CSV log file path from settings
      const logsPath = this.plugin.settings.csvLogFilePath || "context/workout_logs.csv";
      const logsFile = this.plugin.app.vault.getAbstractFileByPath(logsPath);
      
      if (!logsFile || !(logsFile instanceof TFile)) return;

      const content = await this.plugin.app.vault.read(logsFile);
      const lines = content.split("\n");
      
      // Extract workout name from file path (basename without extension)
      const workoutName = filePath.split("/").pop()?.replace(".md", "") || "";
      
      // Map to store timestamps by date
      const sessionTimestamps: Record<string, number[]> = {};

      // Skip header row
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        // CSV format: date,exercise,reps,weight,volume,origin,workout,timestamp,...
        // We need 'workout' (col index 6) and 'timestamp' (col index 7)
        // Simple CSV parsing (assuming no commas in fields for now, or simple split)
        // The file seems to use standard CSV.
        const cols = line.split(",");
        if (cols.length < 8) continue;

        const logWorkout = cols[6]?.trim();
        // Remove quotes if present
        const cleanedWorkout = logWorkout?.replace(/^["']|["']$/g, "") || "";
        
        if (cleanedWorkout === workoutName) {
           const timestampStr = cols[7]?.trim();
           const timestamp = parseInt(timestampStr, 10);
           
           if (!isNaN(timestamp) && timestamp > 0) {
             // Date is col 0
             const dateStr = cols[0]?.split("T")[0]; // ISO format YYYY-MM-DD
             if (dateStr) {
               if (!sessionTimestamps[dateStr]) {
                 sessionTimestamps[dateStr] = [];
               }
               sessionTimestamps[dateStr].push(timestamp);
             }
           }
        }
      }

      // Find the most recent session with valid duration
      const dates = Object.keys(sessionTimestamps).sort().reverse();
      
      for (const date of dates) {
        const stamps = sessionTimestamps[date];
        if (stamps.length < 2) continue; // Need at least start and end

        const min = Math.min(...stamps);
        const max = Math.max(...stamps);
        const duration = (max - min) / 1000; // Convert ms to seconds

        // Basic validation: duration > 5 mins (300s) and < 5 hours (18000s)
        if (duration > 300 && duration < 18000) {
          result.historicalDuration = duration;
          result.lastSessionDate = date;
          break; 
        }
      }
    } catch (e) {
      console.warn("Failed to calculate historical duration", e);
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
      /[xX]\s*(\d+)(?:-(\d+))?\s*([a-zA-Z\/]+)?/i
    );

    let reps = 0;
    if (repsMatch) {
        const suffix = repsMatch[3] ? repsMatch[3].toLowerCase().trim() : "";
        // If suffix looks like time (s, sec, min), ignore it
        // Note: 'reps', 'series', etc. are fine.
        const isTime = ["s", "sec", "min", "m", "seconds", "secondi"].some(u => suffix.startsWith(u) && !suffix.startsWith("series") && !suffix.startsWith("sets"));
        
        if (!isTime) {
            const minReps = parseInt(repsMatch[1], 10);
            const maxReps = repsMatch[2] ? parseInt(repsMatch[2], 10) : minReps;
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
    if (sets > 100) sets = 1; 

    result.setCount += sets;

    // 4. Sum rest timers in this section
    const timerBlockRegex = /```workout-timer\s*([\s\S]*?)```/g;
    let timerMatch;
    let sectionTimerSum = 0;
    let timersFound = 0;

    while ((timerMatch = timerBlockRegex.exec(sectionContent)) !== null) {
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
    const fallbackSetDuration = settings.setDuration || DEFAULT_SET_DURATION;

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
