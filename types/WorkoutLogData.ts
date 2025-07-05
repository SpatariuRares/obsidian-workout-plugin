// Types and utilities for workout log data
import { TFile } from "obsidian";

/**
 * Represents a single workout log entry.
 */
export interface WorkoutLogData {
  date: string;
  exercise: string;
  reps: number;
  weight: number;
  volume: number;
  file: TFile;
  origine?: string; // Added for workout filtering
  workout?: string; // Added for workout filtering
}

/**
 * Plugin settings interface.
 */
export interface WorkoutChartsSettings {
  logFolderPath: string;
  exerciseFolderPath: string;
  defaultExercise: string;
  chartType: "volume" | "weight" | "reps";
  dateRange: number; // days
  showTrendLine: boolean;
  chartHeight: number;
  debugMode: boolean;
}

/**
 * Default plugin settings.
 */
export const DEFAULT_SETTINGS: WorkoutChartsSettings = {
  logFolderPath: "Log/Data",
  exerciseFolderPath: "Esercizi",
  defaultExercise: "",
  chartType: "volume",
  dateRange: 30,
  showTrendLine: true,
  chartHeight: 400,
  debugMode: false,
};

/**
 * Parses a workout log file and returns a WorkoutLogData object, or null if invalid.
 */
export function parseLogFile(
  content: string,
  file: TFile,
  debugMode = false
): WorkoutLogData | null {
  try {
    if (debugMode) {
      console.log(`=== PARSING FILE: ${file.path} ===`);
      console.log(`Content length: ${content.length}`);
      console.log(`Content preview:`, content.substring(0, 200) + "...");
    }

    // Parse frontmatter - handle both CRLF and LF line endings
    const frontmatterMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (debugMode) {
      console.log(`🔍 Frontmatter regex test:`);
      console.log(`  Content starts with "---":`, content.startsWith("---"));
      console.log(
        `  Content contains "---" at end:`,
        content.includes("---", 10)
      );
      console.log(
        `  Frontmatter match:`,
        frontmatterMatch ? `✅ Found` : `❌ Not found`
      );
      if (frontmatterMatch) {
        console.log(`  Frontmatter content:`, frontmatterMatch[1]);
      }
    }

    if (!frontmatterMatch) {
      if (debugMode) {
        console.log(`❌ No frontmatter found in ${file.path}`);
        console.log(`Content:`, content);
        console.log(
          `Content hex:`,
          Buffer.from(content, "utf8").toString("hex").substring(0, 100)
        );
      }
      return null;
    }

    const frontmatter = frontmatterMatch[1];
    if (debugMode) {
      console.log(`✅ Frontmatter found:`, frontmatter);
    }

    // Extract fields from frontmatter with multiple possible formats
    const repsMatch =
      frontmatter.match(/Rep:\s*(\d+)/) ||
      frontmatter.match(/reps:\s*(\d+)/) ||
      frontmatter.match(/Repetitions:\s*(\d+)/);
    const weightMatch =
      frontmatter.match(/Weight:\s*"?(\d+(?:\.\d+)?)"?/) ||
      frontmatter.match(/weight:\s*"?(\d+(?:\.\d+)?)"?/) ||
      frontmatter.match(/kg:\s*"?(\d+(?:\.\d+)?)"?/);
    const volumeMatch =
      frontmatter.match(/Volume:\s*"?(\d+(?:\.\d+)?)"?/) ||
      frontmatter.match(/volume:\s*"?(\d+(?:\.\d+)?)"?/);

    if (debugMode) {
      console.log(`🔍 Field matching results:`);
      console.log(
        `  Reps match:`,
        repsMatch ? `✅ "${repsMatch[1]}"` : `❌ Not found`
      );
      console.log(
        `  Weight match:`,
        weightMatch ? `✅ "${weightMatch[1]}"` : `❌ Not found`
      );
      console.log(
        `  Volume match:`,
        volumeMatch ? `✅ "${volumeMatch[1]}"` : `❌ Not found`
      );

      // Debug: show all possible weight patterns
      console.log(`🔍 Testing weight patterns:`);
      const weightPatterns = [
        /Weight:\s*"?(\d+(?:\.\d+)?)"?/,
        /weight:\s*"?(\d+(?:\.\d+)?)"?/,
        /kg:\s*"?(\d+(?:\.\d+)?)"?/,
      ];
      weightPatterns.forEach((pattern, index) => {
        const match = frontmatter.match(pattern);
        console.log(
          `  Pattern ${index + 1}:`,
          match ? `✅ "${match[1]}"` : `❌ No match`
        );
      });
    }

    // Extract fields from body (after frontmatter) - handle both CRLF and LF line endings
    const bodyContent = content.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, "");
    if (debugMode) {
      console.log(`📄 Body content:`, bodyContent);
    }

    const exerciseMatch =
      bodyContent.match(/Esercizio::\s*\[\[(.+?)\]\]/) ||
      bodyContent.match(/Exercise::\s*\[\[(.+?)\]\]/) ||
      bodyContent.match(/exercise::\s*\[\[(.+?)\]\]/);
    const dateMatch =
      bodyContent.match(/DataOra::\s*(.+)/) ||
      bodyContent.match(/Date::\s*(.+)/) ||
      bodyContent.match(/date::\s*(.+)/);
    const origineMatch =
      bodyContent.match(/Origine::\s*\[\[(.+?)\]\]/) ||
      bodyContent.match(/Origin::\s*\[\[(.+?)\]\]/) ||
      bodyContent.match(/origine::\s*\[\[(.+?)\]\]/);
    const workoutMatch =
      bodyContent.match(/Workout::\s*\[\[(.+?)\]\]/) ||
      bodyContent.match(/workout::\s*\[\[(.+?)\]\]/);

    if (debugMode) {
      console.log(`🔍 Body field matching results:`);
      console.log(
        `  Exercise match:`,
        exerciseMatch ? `✅ "${exerciseMatch[1]}"` : `❌ Not found`
      );
      console.log(
        `  Date match:`,
        dateMatch ? `✅ "${dateMatch[1]}"` : `❌ Not found`
      );
      console.log(
        `  Origine match:`,
        origineMatch ? `✅ "${origineMatch[1]}"` : `❌ Not found`
      );
      console.log(
        `  Workout match:`,
        workoutMatch ? `✅ "${workoutMatch[1]}"` : `❌ Not found`
      );
    }

    if (!exerciseMatch || !repsMatch || !weightMatch) {
      if (debugMode) {
        console.log(`❌ Missing required fields in ${file.path}:`);
        console.log(
          `  Exercise:`,
          exerciseMatch ? `✅ "${exerciseMatch[1]}"` : `❌ missing`
        );
        console.log(
          `  Reps:`,
          repsMatch ? `✅ "${repsMatch[1]}"` : `❌ missing`
        );
        console.log(
          `  Weight:`,
          weightMatch ? `✅ "${weightMatch[1]}"` : `❌ missing`
        );
        console.log(`  Frontmatter:`, frontmatter);
        console.log(`  Body content:`, bodyContent);
      }
      return null;
    }

    const exercise = exerciseMatch[1].trim();
    const reps = parseInt(repsMatch[1]);
    const weight = parseFloat(weightMatch[1]);
    const volume = volumeMatch ? parseFloat(volumeMatch[1]) : reps * weight;
    const date = dateMatch ? dateMatch[1].trim() : file.stat.ctime.toString();
    const origine = origineMatch ? origineMatch[1].trim() : undefined;
    const workout = workoutMatch ? workoutMatch[1].trim() : undefined;

    if (debugMode) {
      console.log(`Successfully parsed ${file.path}:`, {
        exercise,
        reps,
        weight,
        volume,
        date,
        origine,
        workout,
      });
    }

    return {
      date,
      exercise,
      reps,
      weight,
      volume,
      file,
      origine,
      workout,
    };
  } catch (error) {
    if (debugMode) {
      console.warn(`Error parsing file ${file.path}:`, error);
    }
    return null;
  }
}
