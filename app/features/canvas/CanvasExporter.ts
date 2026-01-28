/**
 * CanvasExporter - Exports workout files to Obsidian Canvas format
 *
 * Creates a visual representation of a workout file as a .canvas file,
 * with each exercise represented as a node colored by muscle group.
 */
import { App, TFile, Notice } from "obsidian";
import { MuscleTagMapper } from "@app/features/dashboard/business/muscleHeatMap/MuscleTagMapper";
import type WorkoutChartsPlugin from "main";

/**
 * Canvas node types as defined by JSON Canvas spec
 */
interface CanvasNode {
  id: string;
  type: "text" | "file" | "link" | "group";
  x: number;
  y: number;
  width: number;
  height: number;
  color?: string;
  text?: string;
  file?: string;
  label?: string;
}

/**
 * Canvas edge for connecting nodes
 */
interface CanvasEdge {
  id: string;
  fromNode: string;
  toNode: string;
  fromSide?: "top" | "right" | "bottom" | "left";
  toSide?: "top" | "right" | "bottom" | "left";
  fromEnd?: "none" | "arrow";
  toEnd?: "none" | "arrow";
  color?: string;
  label?: string;
}

/**
 * Canvas file structure following JSON Canvas spec
 */
interface CanvasData {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
}

/**
 * Exercise info extracted from workout file
 */
interface ExerciseInfo {
  name: string;
  muscleGroups: string[];
}

/**
 * Muscle group color mapping using JSON Canvas color presets
 * Colors 1-6 map to: red, orange, yellow, green, cyan, purple
 */
const MUSCLE_GROUP_COLORS: Record<string, string> = {
  // Primary groups - distinct colors
  chest: "1", // red
  back: "2", // orange
  shoulders: "6", // purple
  biceps: "4", // green
  triceps: "5", // cyan
  quads: "3", // yellow
  hamstrings: "2", // orange
  glutes: "1", // red
  calves: "3", // yellow
  abs: "4", // green
  core: "4", // green
  // Secondary groups
  forearms: "5", // cyan
  traps: "2", // orange
  rear_delts: "6", // purple
};

/**
 * Default color for exercises without recognized muscle groups
 */
const DEFAULT_NODE_COLOR = "5"; // cyan

/**
 * Node dimensions and spacing
 */
const NODE_WIDTH = 250;
const NODE_HEIGHT = 100;
const HORIZONTAL_SPACING = 50;
const VERTICAL_SPACING = 30;
const NODES_PER_ROW = 4;

/**
 * CanvasExporter creates Obsidian Canvas files from workout files
 */
export class CanvasExporter {
  constructor(
    private app: App,
    private plugin: WorkoutChartsPlugin
  ) {}

  /**
   * Export a workout file to canvas format
   * @param workoutFile - The workout markdown file to export
   * @returns Path to the created canvas file
   */
  async exportToCanvas(workoutFile: TFile): Promise<string> {
    // Extract exercises from the workout file
    const exercises = await this.extractExercises(workoutFile);

    if (exercises.length === 0) {
      throw new Error("No exercises found in workout file");
    }

    // Create canvas data
    const canvasData = await this.createCanvasData(exercises);

    // Generate canvas file path (same folder as workout file)
    const canvasFileName = workoutFile.basename + ".canvas";
    const canvasPath = workoutFile.parent
      ? workoutFile.parent.path + "/" + canvasFileName
      : canvasFileName;

    // Check if canvas file already exists
    const existingFile = this.app.vault.getAbstractFileByPath(canvasPath);
    if (existingFile instanceof TFile) {
      // Overwrite existing canvas file
      await this.app.vault.modify(existingFile, JSON.stringify(canvasData, null, 2));
    } else {
      // Create new canvas file
      await this.app.vault.create(canvasPath, JSON.stringify(canvasData, null, 2));
    }

    return canvasPath;
  }

  /**
   * Extract exercise information from a workout file
   * Looks for workout-timer code blocks and H2/H3 headers
   */
  private async extractExercises(workoutFile: TFile): Promise<ExerciseInfo[]> {
    const content = await this.app.vault.read(workoutFile);
    const exercises: ExerciseInfo[] = [];
    const exerciseSet = new Set<string>(); // Avoid duplicates

    // Pattern 1: Extract exercises from workout-timer code blocks
    const timerBlockRegex = /```workout-timer\n([\s\S]*?)```/g;
    let match;

    while ((match = timerBlockRegex.exec(content)) !== null) {
      const blockContent = match[1];
      const exerciseLine = blockContent.match(/exercise:\s*(.+)/i);
      if (exerciseLine) {
        const exerciseName = exerciseLine[1].trim();
        if (exerciseName && !exerciseSet.has(exerciseName.toLowerCase())) {
          exerciseSet.add(exerciseName.toLowerCase());
          const muscleGroups = await MuscleTagMapper.findMuscleGroupsFromTags(
            exerciseName,
            this.plugin
          );
          exercises.push({ name: exerciseName, muscleGroups });
        }
      }
    }

    // Pattern 2: Extract exercises from H2 headers (## Exercise Name)
    const h2Regex = /^##\s+(.+)$/gm;
    while ((match = h2Regex.exec(content)) !== null) {
      const headerText = match[1].trim();
      // Skip common non-exercise headers
      if (this.isLikelyExerciseName(headerText) && !exerciseSet.has(headerText.toLowerCase())) {
        exerciseSet.add(headerText.toLowerCase());
        const muscleGroups = await MuscleTagMapper.findMuscleGroupsFromTags(
          headerText,
          this.plugin
        );
        exercises.push({ name: headerText, muscleGroups });
      }
    }

    // Pattern 3: Extract from markdown links to exercise files [[Exercise Name]]
    const linkRegex = /\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g;
    const exerciseFolderPath = this.plugin.settings.exerciseFolderPath;
    while ((match = linkRegex.exec(content)) !== null) {
      const linkPath = match[1].trim();
      // Check if the link points to an exercise file
      if (linkPath.startsWith(exerciseFolderPath) || !linkPath.includes("/")) {
        const exerciseName = linkPath.split("/").pop() || linkPath;
        if (exerciseName && !exerciseSet.has(exerciseName.toLowerCase())) {
          // Verify it's actually an exercise file
          const file = this.app.vault.getFileByPath(
            linkPath.endsWith(".md") ? linkPath : linkPath + ".md"
          );
          if (file || !linkPath.includes("/")) {
            exerciseSet.add(exerciseName.toLowerCase());
            const muscleGroups = await MuscleTagMapper.findMuscleGroupsFromTags(
              exerciseName,
              this.plugin
            );
            exercises.push({ name: exerciseName, muscleGroups });
          }
        }
      }
    }

    return exercises;
  }

  /**
   * Check if a header text is likely an exercise name
   */
  private isLikelyExerciseName(text: string): boolean {
    // Exclude common non-exercise headers
    const nonExerciseHeaders = [
      "notes",
      "summary",
      "warmup",
      "warm-up",
      "warm up",
      "cooldown",
      "cool-down",
      "cool down",
      "stretch",
      "stretching",
      "workout",
      "routine",
      "introduction",
      "overview",
      "instructions",
    ];
    const lowerText = text.toLowerCase();
    return !nonExerciseHeaders.some(
      (header) => lowerText === header || lowerText.startsWith(header + " ")
    );
  }

  /**
   * Create canvas data structure from exercises
   */
  private async createCanvasData(exercises: ExerciseInfo[]): Promise<CanvasData> {
    const nodes: CanvasNode[] = [];
    const edges: CanvasEdge[] = [];

    // Calculate node positions in a grid layout
    exercises.forEach((exercise, index) => {
      const row = Math.floor(index / NODES_PER_ROW);
      const col = index % NODES_PER_ROW;

      const x = col * (NODE_WIDTH + HORIZONTAL_SPACING);
      const y = row * (NODE_HEIGHT + VERTICAL_SPACING);

      // Determine node color based on primary muscle group
      const color = this.getColorForMuscleGroups(exercise.muscleGroups);

      // Create text node for the exercise
      const node: CanvasNode = {
        id: this.generateNodeId(index),
        type: "text",
        x,
        y,
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
        color,
        text: this.formatExerciseText(exercise),
      };

      nodes.push(node);
    });

    return { nodes, edges };
  }

  /**
   * Get canvas color for muscle groups
   * Returns the color for the first recognized muscle group
   */
  private getColorForMuscleGroups(muscleGroups: string[]): string {
    for (const group of muscleGroups) {
      const color = MUSCLE_GROUP_COLORS[group.toLowerCase()];
      if (color) {
        return color;
      }
    }
    return DEFAULT_NODE_COLOR;
  }

  /**
   * Format exercise information as markdown text for the node
   */
  private formatExerciseText(exercise: ExerciseInfo): string {
    let text = `## ${exercise.name}`;

    if (exercise.muscleGroups.length > 0) {
      const muscleText = exercise.muscleGroups
        .map((g) => g.charAt(0).toUpperCase() + g.slice(1))
        .join(", ");
      text += `\n\n*${muscleText}*`;
    }

    return text;
  }

  /**
   * Generate a unique node ID
   */
  private generateNodeId(index: number): string {
    // Generate UUID-like ID as per canvas spec
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `node-${index}-${timestamp}${random}`;
  }
}
