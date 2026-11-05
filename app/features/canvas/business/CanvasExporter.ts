/**
 * CanvasExporter - Exports workout files to Obsidian Canvas format
 *
 * Creates a visual representation of a workout file as a .canvas file,
 * with each exercise represented as a node colored by muscle group.
 */
import { App, TFile } from "obsidian";
import { readWorkoutNote } from "@app/services/notes/WorkoutNote";
import { timerBlock } from "@app/features/timer/timerBlock";
import { timerRunSeconds } from "@app/features/timer/business/timerRunSeconds";
import type { WorkoutChartsSettings } from "@app/types/WorkoutLogData";
import { generateCodeBlockId } from "@app/utils/IdUtils";
import {
  WorkoutPlannerAPI,
  ExerciseStats,
} from "@app/api/WorkoutPlannerAPI";
import type { MuscleTagService } from "@app/services/exercise/MuscleTagService";
import type { ExerciseLibrary } from "@app/services/exercise/ExerciseLibrary";
import type {
  CanvasExportOptions,
  CanvasLayoutType,
} from "@app/features/canvas/types";
import { ParameterUtils } from "@app/utils/parameter/ParameterUtils";
import { FormatUtils } from "@app/utils/FormatUtils";
import { t } from "@app/i18n";

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
  duration?: number;
  isSuperset?: boolean;
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
const NODE_HEIGHT_WITH_STATS = 150;
const HORIZONTAL_SPACING = 50;
const VERTICAL_SPACING = 30;
const NODES_PER_ROW = 4;
const GROUP_SPACING = 80;

/**
 * Default export options
 */
const DEFAULT_OPTIONS: CanvasExportOptions = {
  layout: "horizontal",
  includeDurations: false,
  includeStats: false,
  connectSupersets: true,
};

/**
 * CanvasExporter creates Obsidian Canvas files from workout files
 */
export class CanvasExporter {
  private api: WorkoutPlannerAPI;
  private muscleTags: Pick<MuscleTagService, "musclesForExercise">;

  constructor(
    private app: App,
    api: WorkoutPlannerAPI,
    muscleTags: Pick<MuscleTagService, "musclesForExercise">,
    private exercises: Pick<ExerciseLibrary, "find">,
    private settings: Pick<WorkoutChartsSettings, "timerPresets" | "defaultTimerPreset">,
  ) {
    this.api = api;
    this.muscleTags = muscleTags;
  }

  /**
   * Export a workout file to canvas format
   * @param workoutFile - The workout markdown file to export
   * @param options - Export options for layout and content
   * @returns Path to the created canvas file
   */
  async exportToCanvas(
    workoutFile: TFile,
    options: CanvasExportOptions = DEFAULT_OPTIONS,
  ): Promise<string> {
    // Extract exercises from the workout file
    const exercises = await this.extractExercises(workoutFile);

    if (exercises.length === 0) {
      throw new Error("No exercises found in workout file");
    }

    // Get stats for exercises if needed
    const exerciseStats: Map<string, ExerciseStats> = new Map();
    if (options.includeStats) {
      for (const exercise of exercises) {
        try {
          const stats = await this.api.getExerciseStats(
            exercise.name,
          );
          exerciseStats.set(exercise.name, stats);
        } catch {
          // Skip if stats unavailable
        }
      }
    }

    // Create canvas data
    const canvasData = await this.createCanvasData(
      exercises,
      options,
      exerciseStats,
    );

    // Generate canvas file path (same folder as workout file)
    const canvasFileName = workoutFile.basename + ".canvas";
    const canvasPath = workoutFile.parent
      ? workoutFile.parent.path + "/" + canvasFileName
      : canvasFileName;

    // Check if canvas file already exists
    const existingFile =
      this.app.vault.getAbstractFileByPath(canvasPath);
    if (existingFile instanceof TFile) {
      // Overwrite existing canvas file
      await this.app.vault.modify(
        existingFile,
        JSON.stringify(canvasData, null, 2),
      );
    } else {
      // Create new canvas file
      await this.app.vault.create(
        canvasPath,
        JSON.stringify(canvasData, null, 2),
      );
    }

    return canvasPath;
  }

  /**
   * Extract exercise information from a workout file
   * Looks for workout-timer code blocks and H2/H3 headers
   */
  private async extractExercises(
    workoutFile: TFile,
  ): Promise<ExerciseInfo[]> {
    const content = await this.app.vault.read(workoutFile);
    const note = readWorkoutNote(content);
    const exercises: ExerciseInfo[] = [];
    const exerciseSet = new Set<string>(); // Avoid duplicates

    // Pattern 1: exercises named in workout-timer blocks
    let match: RegExpExecArray | null;
    const timers = note.blocks.filter(
      (block) => block.type === timerBlock.type,
    );
    for (const block of timers) {
      const parsed = timerBlock.parse(block.body);
      const { exercise, superset } = parsed.params;
      const exerciseName = exercise?.trim();
      if (exerciseName && !exerciseSet.has(exerciseName.toLowerCase())) {
        exerciseSet.add(exerciseName.toLowerCase());
        const muscleGroups =
          await this.muscleTags.musclesForExercise(exerciseName);
        // A block with invalid values shows an error instead of a timer
        const duration =
          parsed.errors.length > 0
            ? 0
            : timerRunSeconds(parsed.params, this.settings);
        exercises.push({
          name: exerciseName,
          muscleGroups,
          duration,
          isSuperset: superset === true,
        });
      }
    }

    // Pattern 2: level-2 headings (## Exercise Name), outside fenced examples
    for (const section of note.sections) {
      const headerText = section.heading?.trim();
      // Skip common non-exercise headers
      if (
        headerText &&
        this.isLikelyExerciseName(headerText) &&
        !exerciseSet.has(headerText.toLowerCase())
      ) {
        exerciseSet.add(headerText.toLowerCase());
        const muscleGroups =
          await this.muscleTags.musclesForExercise(headerText);
        exercises.push({ name: headerText, muscleGroups });
      }
    }

    // Pattern 3: links to exercise pages [[Exercise Name]] / [[Folder/Exercise Name]]
    const linkRegex = /\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g;
    while ((match = linkRegex.exec(content)) !== null) {
      const linkPath = match[1].trim();
      const exerciseName = (linkPath.split("/").pop() || linkPath).replace(
        /\.md$/i,
        "",
      );
      if (
        exerciseName &&
        !exerciseSet.has(exerciseName.toLowerCase()) &&
        this.exercises.find(exerciseName)
      ) {
        exerciseSet.add(exerciseName.toLowerCase());
        const muscleGroups =
          await this.muscleTags.musclesForExercise(exerciseName);
        exercises.push({ name: exerciseName, muscleGroups });
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
      (header) =>
        lowerText === header || lowerText.startsWith(header + " "),
    );
  }

  /**
   * Create canvas data structure from exercises
   */
  private async createCanvasData(
    exercises: ExerciseInfo[],
    options: CanvasExportOptions,
    exerciseStats: Map<string, ExerciseStats>,
  ): Promise<CanvasData> {
    const nodes: CanvasNode[] = [];
    const edges: CanvasEdge[] = [];

    // Determine node height based on whether stats are included
    const nodeHeight = options.includeStats
      ? NODE_HEIGHT_WITH_STATS
      : NODE_HEIGHT;

    // Calculate node positions based on layout type
    const positions = this.calculatePositions(
      exercises,
      options.layout,
      nodeHeight,
    );

    // Create nodes for each exercise
    exercises.forEach((exercise, index) => {
      const { x, y } = positions[index];
      const color = this.getColorForMuscleGroups(
        exercise.muscleGroups,
      );
      const stats = exerciseStats.get(exercise.name);

      const node: CanvasNode = {
        id: this.generateId("node", index),
        type: "text",
        x,
        y,
        width: NODE_WIDTH,
        height: nodeHeight,
        color,
        text: this.formatExerciseText(exercise, options, stats),
      };

      nodes.push(node);
    });

    // Create edges for supersets if enabled
    if (options.connectSupersets) {
      const supersetEdges = this.createSupersetEdges(
        exercises,
        nodes,
        options.layout,
      );
      edges.push(...supersetEdges);
    }

    return { nodes, edges };
  }

  /**
   * Calculate node positions based on layout type
   */
  private calculatePositions(
    exercises: ExerciseInfo[],
    layout: CanvasLayoutType,
    nodeHeight: number,
  ): Array<{ x: number; y: number }> {
    switch (layout) {
      case "vertical":
        return this.calculateFlowLayout(exercises.length, nodeHeight, 1);
      case "grouped":
        return this.calculateGroupedLayout(exercises, nodeHeight);
      default:
        return this.calculateFlowLayout(
          exercises.length,
          nodeHeight,
          NODES_PER_ROW,
        );
    }
  }

  /**
   * Flow layout: left to right, wrapping after `perRow` nodes (1 = a single
   * column, top to bottom)
   */
  private calculateFlowLayout(
    count: number,
    nodeHeight: number,
    perRow: number,
  ): Array<{ x: number; y: number }> {
    const positions: Array<{ x: number; y: number }> = [];

    for (let i = 0; i < count; i++) {
      const row = Math.floor(i / perRow);
      const col = i % perRow;
      positions.push({
        x: col * (NODE_WIDTH + HORIZONTAL_SPACING),
        y: row * (nodeHeight + VERTICAL_SPACING),
      });
    }

    return positions;
  }

  /**
   * Calculate grouped layout (exercises grouped by primary muscle group)
   */
  private calculateGroupedLayout(
    exercises: ExerciseInfo[],
    nodeHeight: number,
  ): Array<{ x: number; y: number }> {
    const positions: Array<{ x: number; y: number }> = [];

    // Group exercises by primary muscle group
    const groups = new Map<string, number[]>();

    exercises.forEach((exercise, index) => {
      const primaryMuscle = exercise.muscleGroups[0] || "other";
      if (!groups.has(primaryMuscle)) {
        groups.set(primaryMuscle, []);
      }
      groups.get(primaryMuscle)!.push(index);
    });

    // Assign positions by group
    let groupIndex = 0;
    const groupedPositions: Array<{
      index: number;
      x: number;
      y: number;
    }> = [];

    groups.forEach((indices) => {
      const groupX = groupIndex * (NODE_WIDTH + GROUP_SPACING);

      indices.forEach((exerciseIndex, posInGroup) => {
        groupedPositions.push({
          index: exerciseIndex,
          x: groupX,
          y: posInGroup * (nodeHeight + VERTICAL_SPACING),
        });
      });

      groupIndex++;
    });

    // Sort by original index and extract positions
    groupedPositions.sort((a, b) => a.index - b.index);
    groupedPositions.forEach((pos) => {
      positions.push({ x: pos.x, y: pos.y });
    });

    return positions;
  }

  /**
   * Create edges connecting superset exercises
   * Supersets are detected by:
   * 1. Consecutive exercises marked with isSuperset flag
   * 2. Exercises in the same workout-timer block
   */
  private createSupersetEdges(
    exercises: ExerciseInfo[],
    nodes: CanvasNode[],
    layout: CanvasLayoutType,
  ): CanvasEdge[] {
    const edges: CanvasEdge[] = [];

    // Connect consecutive exercises that are marked as supersets
    for (let i = 0; i < exercises.length - 1; i++) {
      if (exercises[i].isSuperset && exercises[i + 1].isSuperset) {
        const fromSide = layout === "vertical" ? "bottom" : "right";
        const toSide = layout === "vertical" ? "top" : "left";

        edges.push({
          id: this.generateId("edge", i),
          fromNode: nodes[i].id,
          toNode: nodes[i + 1].id,
          fromSide: fromSide,
          toSide: toSide,
          toEnd: "arrow",
          color: "6", // purple for superset connection
          label: "superset",
        });
      }
    }

    return edges;
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
  private formatExerciseText(
    exercise: ExerciseInfo,
    options: CanvasExportOptions,
    stats?: ExerciseStats,
  ): string {
    const sections = [`## ${exercise.name}`];

    // Add muscle groups
    if (exercise.muscleGroups.length > 0) {
      const muscleText = exercise.muscleGroups
        .map((g) => g.charAt(0).toUpperCase() + g.slice(1))
        .join(", ");
      sections.push(`*${muscleText}*`);
    }

    // Add duration if available and enabled
    if (options.includeDurations && exercise.duration) {
      sections.push(
        t("canvas.duration", {
          duration: FormatUtils.formatDuration(exercise.duration),
        }),
      );
    }

    // Add stats if available and enabled
    if (options.includeStats && stats && stats.totalSets > 0) {
      // Shows the personal record, so it is labelled "Best"
      let statsText = t("canvas.best", {
        weight: stats.prWeight,
        unit: ParameterUtils.getWeightUnit(),
        reps: stats.prReps,
      });
      if (stats.trend !== "stable") {
        statsText += stats.trend === "up" ? " 📈" : " 📉";
      }
      sections.push(statsText);
    }

    return sections.join("\n\n");
  }

  /** A unique canvas node or edge id, e.g. `node-0-m1abc2xyz` */
  private generateId(prefix: "node" | "edge", index: number): string {
    return generateCodeBlockId(`${prefix}-${index}`);
  }
}
