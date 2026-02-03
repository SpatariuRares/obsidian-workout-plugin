/**
 * CanvasExporter - Exports workout files to Obsidian Canvas format
 *
 * Creates a visual representation of a workout file as a .canvas file,
 * with each exercise represented as a node colored by muscle group.
 */
import { App, TFile } from "obsidian";
import { MuscleTagMapper } from "@app/features/dashboard/business/muscleHeatMap/MuscleTagMapper";
import { WorkoutPlannerAPI, ExerciseStats } from "@app/api/WorkoutPlannerAPI";
import { DataService } from "@app/services/DataService";
import type WorkoutChartsPlugin from "main";
import type {
  CanvasExportOptions,
  CanvasLayoutType,
} from "@app/features/canvas/CanvasExportModal";

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

  constructor(
    private app: App,
    private plugin: WorkoutChartsPlugin,
  ) {
    const dataService = new DataService(app, plugin.settings);
    this.api = new WorkoutPlannerAPI(dataService, app, plugin.settings);
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
          const stats = await this.api.getExerciseStats(exercise.name);
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
    const existingFile = this.app.vault.getAbstractFileByPath(canvasPath);
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
      const durationLine = blockContent.match(/duration:\s*(\d+)/i);
      const supersetLine = blockContent.match(/superset:\s*true/i);

      if (exerciseLine) {
        const exerciseName = exerciseLine[1].trim();
        if (exerciseName && !exerciseSet.has(exerciseName.toLowerCase())) {
          exerciseSet.add(exerciseName.toLowerCase());
          const muscleGroups = await MuscleTagMapper.findMuscleGroupsFromTags(
            exerciseName,
            this.plugin,
          );
          exercises.push({
            name: exerciseName,
            muscleGroups,
            duration: durationLine ? parseInt(durationLine[1], 10) : undefined,
            isSuperset: !!supersetLine,
          });
        }
      }
    }

    // Pattern 2: Extract exercises from H2 headers (## Exercise Name)
    const h2Regex = /^##\s+(.+)$/gm;
    while ((match = h2Regex.exec(content)) !== null) {
      const headerText = match[1].trim();
      // Skip common non-exercise headers
      if (
        this.isLikelyExerciseName(headerText) &&
        !exerciseSet.has(headerText.toLowerCase())
      ) {
        exerciseSet.add(headerText.toLowerCase());
        const muscleGroups = await MuscleTagMapper.findMuscleGroupsFromTags(
          headerText,
          this.plugin,
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
            linkPath.endsWith(".md") ? linkPath : linkPath + ".md",
          );
          if (file || !linkPath.includes("/")) {
            exerciseSet.add(exerciseName.toLowerCase());
            const muscleGroups = await MuscleTagMapper.findMuscleGroupsFromTags(
              exerciseName,
              this.plugin,
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
      (header) => lowerText === header || lowerText.startsWith(header + " "),
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
      const color = this.getColorForMuscleGroups(exercise.muscleGroups);
      const stats = exerciseStats.get(exercise.name);

      const node: CanvasNode = {
        id: this.generateNodeId(index),
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
      case "horizontal":
        return this.calculateHorizontalLayout(exercises.length, nodeHeight);
      case "vertical":
        return this.calculateVerticalLayout(exercises.length, nodeHeight);
      case "grouped":
        return this.calculateGroupedLayout(exercises, nodeHeight);
      default:
        return this.calculateHorizontalLayout(exercises.length, nodeHeight);
    }
  }

  /**
   * Calculate horizontal flow layout (left to right, wrapping)
   */
  private calculateHorizontalLayout(
    count: number,
    nodeHeight: number,
  ): Array<{ x: number; y: number }> {
    const positions: Array<{ x: number; y: number }> = [];

    for (let i = 0; i < count; i++) {
      const row = Math.floor(i / NODES_PER_ROW);
      const col = i % NODES_PER_ROW;
      positions.push({
        x: col * (NODE_WIDTH + HORIZONTAL_SPACING),
        y: row * (nodeHeight + VERTICAL_SPACING),
      });
    }

    return positions;
  }

  /**
   * Calculate vertical flow layout (top to bottom, single column)
   */
  private calculateVerticalLayout(
    count: number,
    nodeHeight: number,
  ): Array<{ x: number; y: number }> {
    const positions: Array<{ x: number; y: number }> = [];

    for (let i = 0; i < count; i++) {
      positions.push({
        x: 0,
        y: i * (nodeHeight + VERTICAL_SPACING),
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
    const groupedPositions: Array<{ index: number; x: number; y: number }> = [];

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
          id: this.generateEdgeId(i),
          fromNode: nodes[i].id,
          toNode: nodes[i + 1].id,
          fromSide: fromSide as "top" | "right" | "bottom" | "left",
          toSide: toSide as "top" | "right" | "bottom" | "left",
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
    let text = `## ${exercise.name}`;

    // Add muscle groups
    if (exercise.muscleGroups.length > 0) {
      const muscleText = exercise.muscleGroups
        .map((g) => g.charAt(0).toUpperCase() + g.slice(1))
        .join(", ");
      text += `\n\n*${muscleText}*`;
    }

    // Add duration if available and enabled
    if (options.includeDurations && exercise.duration) {
      const minutes = Math.floor(exercise.duration / 60);
      const seconds = exercise.duration % 60;
      const durationText =
        minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
      text += `\n\n**Duration:** ${durationText}`;
    }

    // Add stats if available and enabled
    if (options.includeStats && stats && stats.totalSets > 0) {
      text += `\n\n**Last:** ${stats.prWeight}kg × ${stats.prReps} reps`;
      if (stats.trend !== "stable") {
        const trendEmoji = stats.trend === "up" ? "📈" : "📉";
        text += ` ${trendEmoji}`;
      }
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

  /**
   * Generate a unique edge ID
   */
  private generateEdgeId(index: number): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `edge-${index}-${timestamp}${random}`;
  }
}
