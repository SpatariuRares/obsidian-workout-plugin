import { WorkoutLogData } from "../../types/WorkoutLogData";
import { EmbeddedDashboardParams } from "../types/types";
import type WorkoutChartsPlugin from "../../../main";

export interface MuscleGroupData {
  name: string;
  volume: number;
  exercises: string[];
  intensity: number; // 0-1 scale for heat map coloring
}

export interface MuscleHeatMapOptions {
  timeFrame: "week" | "month" | "year";
  view: "front" | "back";
}

export interface BodyPart {
  id: string;
  name: string;
  path: string; // SVG path for the body part
  exercises: string[];
  position: { x: number; y: number; width: number; height: number };
}

export class MuscleHeatMap {
  private static exerciseTagsCache = new Map<string, string[]>();

  // Tag to muscle group mapping
  private static readonly TAG_MUSCLE_MAP: Record<string, string> = {
    // Main muscle groups
    chest: "chest",
    petto: "chest",
    back: "back",
    schiena: "back",
    shoulders: "shoulders",
    spalle: "shoulders",
    biceps: "biceps",
    bicipiti: "biceps",
    triceps: "triceps",
    tricipiti: "triceps",
    legs: "quads",
    gambe: "quads",
    quads: "quads",
    quadricipiti: "quads",
    hamstrings: "hamstrings",
    ischiocrurali: "hamstrings",
    glutes: "glutes",
    glutei: "glutes",
    calves: "calves",
    polpacci: "calves",
    abs: "abs",
    addominali: "abs",
    core: "core",
    cardio: "core",

    // Secondary muscle groups
    forearms: "forearms",
    avambracci: "forearms",
    traps: "traps",
    trapezi: "traps",
    rear_delts: "rear_delts",
    deltoidi_posteriori: "rear_delts",

    // Exercise types that help determine muscle groups
    push: "chest",
    pull: "back",
    squat: "quads",
    deadlift: "back",
    press: "shoulders",
    curl: "biceps",
    extension: "triceps",
    fly: "chest",
    row: "back",
  };

  private static readonly BODY_PARTS: BodyPart[] = [
    // Front view
    {
      id: "chest",
      name: "Chest",
      path: "M180,120 L220,120 L220,160 L180,160 Z",
      exercises: [],
      position: { x: 180, y: 120, width: 40, height: 40 },
    },
    {
      id: "abs",
      name: "Abs",
      path: "M185,165 L215,165 L215,200 L185,200 Z",
      exercises: [],
      position: { x: 185, y: 165, width: 30, height: 35 },
    },
    {
      id: "biceps",
      name: "Biceps",
      path: "M150,140 L175,140 L175,180 L150,180 Z",
      exercises: [],
      position: { x: 150, y: 140, width: 25, height: 40 },
    },
    {
      id: "shoulders",
      name: "Shoulders",
      path: "M160,100 L240,100 L240,130 L160,130 Z",
      exercises: [],
      position: { x: 160, y: 100, width: 80, height: 30 },
    },
    {
      id: "forearms",
      name: "Forearms",
      path: "M140,180 L165,180 L165,220 L140,220 Z",
      exercises: [],
      position: { x: 140, y: 180, width: 25, height: 40 },
    },
    {
      id: "quads",
      name: "Quadriceps",
      path: "M170,210 L230,210 L230,280 L170,280 Z",
      exercises: [],
      position: { x: 170, y: 210, width: 60, height: 70 },
    },
    {
      id: "calves",
      name: "Calves",
      path: "M175,320 L225,320 L225,370 L175,370 Z",
      exercises: [],
      position: { x: 175, y: 320, width: 50, height: 50 },
    },

    // Back view (will be positioned differently when back view is active)
    {
      id: "back",
      name: "Back",
      path: "M180,120 L220,120 L220,200 L180,200 Z",
      exercises: [],
      position: { x: 180, y: 120, width: 40, height: 80 },
    },
    {
      id: "triceps",
      name: "Triceps",
      path: "M225,140 L250,140 L250,180 L225,180 Z",
      exercises: [],
      position: { x: 225, y: 140, width: 25, height: 40 },
    },
    {
      id: "rear_delts",
      name: "Rear Delts",
      path: "M160,110 L240,110 L240,125 L160,125 Z",
      exercises: [],
      position: { x: 160, y: 110, width: 80, height: 15 },
    },
    {
      id: "traps",
      name: "Traps",
      path: "M175,95 L225,95 L225,115 L175,115 Z",
      exercises: [],
      position: { x: 175, y: 95, width: 50, height: 20 },
    },
    {
      id: "glutes",
      name: "Glutes",
      path: "M175,205 L225,205 L225,235 L175,235 Z",
      exercises: [],
      position: { x: 175, y: 205, width: 50, height: 30 },
    },
    {
      id: "hamstrings",
      name: "Hamstrings",
      path: "M175,240 L225,240 L225,310 L175,310 Z",
      exercises: [],
      position: { x: 175, y: 240, width: 50, height: 70 },
    },
    {
      id: "core",
      name: "Core",
      path: "M185,165 L215,165 L215,200 L185,200 Z",
      exercises: [],
      position: { x: 185, y: 165, width: 30, height: 35 },
    },
  ];

  static async render(
    container: HTMLElement,
    data: WorkoutLogData[],
    params: EmbeddedDashboardParams,
    plugin: WorkoutChartsPlugin
  ): Promise<void> {
    const heatMapEl = container.createEl("div", {
      cls: "dashboard-widget muscle-heatmap",
    });

    heatMapEl.createEl("h3", {
      text: "Muscle Heat Map",
      cls: "widget-title",
    });

    // Create controls
    const controlsEl = heatMapEl.createEl("div", {
      cls: "heatmap-controls",
    });

    // Time frame toggle
    const timeFrameEl = controlsEl.createEl("div", {
      cls: "time-frame-toggle",
    });

    const weekBtn = timeFrameEl.createEl("button", {
      text: "Week",
      cls: "toggle-btn active",
    });

    const monthBtn = timeFrameEl.createEl("button", {
      text: "Month",
      cls: "toggle-btn",
    });

    const yearBtn = timeFrameEl.createEl("button", {
      text: "Year",
      cls: "toggle-btn",
    });

    // View toggle
    const viewToggleEl = controlsEl.createEl("div", {
      cls: "view-toggle",
    });

    const frontBtn = viewToggleEl.createEl("button", {
      text: "Front",
      cls: "toggle-btn active",
    });

    const backBtn = viewToggleEl.createEl("button", {
      text: "Back",
      cls: "toggle-btn",
    });

    // Export button
    const exportBtn = controlsEl.createEl("button", {
      text: "📸 Export",
      cls: "export-btn",
    });

    // Heat map container
    const canvasContainer = heatMapEl.createEl("div", {
      cls: "heatmap-canvas-container",
    });

    // Info panel for imbalance alerts
    const infoPanel = heatMapEl.createEl("div", {
      cls: "heatmap-info-panel",
    });

    let currentOptions: MuscleHeatMapOptions = {
      timeFrame: "week",
      view: "front",
    };

    // Render initial heat map
    await this.renderHeatMap(
      canvasContainer,
      data,
      currentOptions,
      infoPanel,
      plugin
    );

    // Event listeners
    [weekBtn, monthBtn, yearBtn].forEach((btn, index) => {
      btn.addEventListener("click", async () => {
        [weekBtn, monthBtn, yearBtn].forEach((b) => b.removeClass("active"));
        btn.addClass("active");
        currentOptions.timeFrame = ["week", "month", "year"][index] as
          | "week"
          | "month"
          | "year";
        await this.renderHeatMap(
          canvasContainer,
          data,
          currentOptions,
          infoPanel,
          plugin
        );
      });
    });

    [frontBtn, backBtn].forEach((btn, index) => {
      btn.addEventListener("click", async () => {
        [frontBtn, backBtn].forEach((b) => b.removeClass("active"));
        btn.addClass("active");
        currentOptions.view = ["front", "back"][index] as "front" | "back";
        await this.renderHeatMap(
          canvasContainer,
          data,
          currentOptions,
          infoPanel,
          plugin
        );
      });
    });

    exportBtn.addEventListener("click", () => {
      this.exportHeatMap(canvasContainer);
    });
  }

  private static async renderHeatMap(
    container: HTMLElement,
    data: WorkoutLogData[],
    options: MuscleHeatMapOptions,
    infoPanel: HTMLElement,
    plugin: WorkoutChartsPlugin
  ): Promise<void> {
    container.empty();

    // Filter data based on time frame
    const filteredData = this.filterDataByTimeFrame(data, options.timeFrame);

    // Calculate muscle group volumes
    const muscleData = await this.calculateMuscleGroupVolumes(
      filteredData,
      plugin
    );

    // Create canvas
    const canvas = container.createEl("canvas", {
      attr: {
        width: "400",
        height: "500",
      },
    });

    const ctx = canvas.getContext("2d")!;

    // Clear canvas and set background
    ctx.fillStyle = "#f8f9fa";
    ctx.fillRect(0, 0, 400, 500);

    // Draw body outline
    this.drawBodyOutlineCanvas(ctx, options.view);

    // Render muscle groups with heat map coloring
    this.renderMuscleGroupsCanvas(ctx, muscleData, options, container);

    // Update info panel with imbalance detection
    this.updateInfoPanel(infoPanel, muscleData);
  }

  private static drawBodyOutlineCanvas(
    ctx: CanvasRenderingContext2D,
    view: "front" | "back"
  ): void {
    ctx.strokeStyle = "#666";
    ctx.lineWidth = 2;

    if (view === "front") {
      // Head
      ctx.beginPath();
      ctx.arc(200, 50, 25, 0, 2 * Math.PI);
      ctx.stroke();

      // Torso
      ctx.strokeRect(175, 75, 50, 120);

      // Arms
      ctx.strokeRect(135, 90, 40, 100);
      ctx.strokeRect(225, 90, 40, 100);

      // Legs
      ctx.strokeRect(170, 195, 25, 120);
      ctx.strokeRect(205, 195, 25, 120);
    } else {
      // Back view - similar structure
      // Head
      ctx.beginPath();
      ctx.arc(200, 50, 25, 0, 2 * Math.PI);
      ctx.stroke();

      // Back torso
      ctx.strokeRect(175, 75, 50, 120);

      // Arms (back view)
      ctx.strokeRect(135, 90, 40, 100);
      ctx.strokeRect(225, 90, 40, 100);

      // Legs (back view)
      ctx.strokeRect(170, 195, 25, 120);
      ctx.strokeRect(205, 195, 25, 120);
    }
  }

  private static renderMuscleGroupsCanvas(
    ctx: CanvasRenderingContext2D,
    muscleData: Map<string, MuscleGroupData>,
    options: MuscleHeatMapOptions,
    container: HTMLElement
  ): void {
    const relevantBodyParts = this.BODY_PARTS.filter((part) => {
      if (options.view === "front") {
        return ![
          "back",
          "triceps",
          "rear_delts",
          "traps",
          "glutes",
          "hamstrings",
        ].includes(part.id);
      } else {
        return !["chest", "abs", "biceps", "forearms", "quads"].includes(
          part.id
        );
      }
    });

    relevantBodyParts.forEach((bodyPart) => {
      const muscleInfo = muscleData.get(bodyPart.id);
      const intensity = muscleInfo ? muscleInfo.intensity : 0;

      // Color based on intensity (0 = light, 1 = dark red)
      const color = this.getHeatMapColor(intensity);

      // Draw muscle group rectangle
      ctx.fillStyle = color;
      ctx.globalAlpha = intensity > 0 ? 0.8 : 0.3;
      ctx.fillRect(
        bodyPart.position.x,
        bodyPart.position.y,
        bodyPart.position.width,
        bodyPart.position.height
      );

      // Draw border
      ctx.globalAlpha = 1;
      ctx.strokeStyle = "#333";
      ctx.lineWidth = 1;
      ctx.strokeRect(
        bodyPart.position.x,
        bodyPart.position.y,
        bodyPart.position.width,
        bodyPart.position.height
      );

      // Add label
      ctx.fillStyle = intensity > 0.5 ? "#fff" : "#333";
      ctx.font = "bold 10px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(
        bodyPart.name,
        bodyPart.position.x + bodyPart.position.width / 2,
        bodyPart.position.y + bodyPart.position.height / 2
      );
    });

    // Add click detection by creating an overlay div with clickable areas
    const overlay = container.createEl("div", {
      cls: "heatmap-overlay",
    });

    relevantBodyParts.forEach((bodyPart) => {
      const muscleInfo = muscleData.get(bodyPart.id);

      const clickArea = overlay.createEl("div", {
        cls: "muscle-click-area",
        attr: {
          style: `
            position: absolute;
            left: ${bodyPart.position.x}px;
            top: ${bodyPart.position.y}px;
            width: ${bodyPart.position.width}px;
            height: ${bodyPart.position.height}px;
            cursor: pointer;
            background: transparent;
          `,
        },
      });

      clickArea.addEventListener("click", () => {
        this.showMuscleDetails(bodyPart.id, muscleInfo, container);
      });

      clickArea.addEventListener("mouseenter", () => {
        clickArea.style.backgroundColor = "rgba(0, 122, 204, 0.2)";
      });

      clickArea.addEventListener("mouseleave", () => {
        clickArea.style.backgroundColor = "transparent";
      });
    });
  }

  private static getHeatMapColor(intensity: number): string {
    if (intensity === 0) return "#e9ecef";

    // Gradient from light red to dark red
    const red = Math.floor(255 - intensity * 100);
    const green = Math.floor(50 * (1 - intensity));
    const blue = Math.floor(50 * (1 - intensity));

    return `rgb(${Math.max(red, 100)}, ${green}, ${blue})`;
  }

  private static filterDataByTimeFrame(
    data: WorkoutLogData[],
    timeFrame: "week" | "month" | "year"
  ): WorkoutLogData[] {
    const now = new Date();
    let cutoffDate: Date;

    switch (timeFrame) {
      case "week":
        cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "month":
        cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "year":
        cutoffDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
    }

    return data.filter((entry) => new Date(entry.date) >= cutoffDate);
  }

  private static async calculateMuscleGroupVolumes(
    data: WorkoutLogData[],
    plugin: WorkoutChartsPlugin
  ): Promise<Map<string, MuscleGroupData>> {
    const muscleData = new Map<string, MuscleGroupData>();

    // Initialize all muscle groups
    const allMuscleGroups = new Set(Object.values(this.TAG_MUSCLE_MAP));
    allMuscleGroups.forEach((muscle) => {
      muscleData.set(muscle, {
        name: muscle,
        volume: 0,
        exercises: [],
        intensity: 0,
      });
    });

    // Calculate volumes
    for (const entry of data) {
      const mappedMuscles = await this.findMuscleGroupsFromTags(
        entry.exercise,
        plugin
      );

      mappedMuscles.forEach((muscle) => {
        const current = muscleData.get(muscle);
        if (current) {
          current.volume += entry.volume;
          if (!current.exercises.includes(entry.exercise)) {
            current.exercises.push(entry.exercise);
          }
        }
      });
    }

    // Calculate intensities (normalize to 0-1 scale)
    const maxVolume = Math.max(
      ...Array.from(muscleData.values()).map((m) => m.volume)
    );
    if (maxVolume > 0) {
      muscleData.forEach((muscle) => {
        muscle.intensity = muscle.volume / maxVolume;
      });
    }

    return muscleData;
  }

  /**
   * Loads exercise tags from the exercise file
   */
  private static async loadExerciseTags(
    exerciseName: string,
    plugin: WorkoutChartsPlugin
  ): Promise<string[]> {
    // Check cache first
    if (this.exerciseTagsCache.has(exerciseName)) {
      return this.exerciseTagsCache.get(exerciseName)!;
    }

    try {
      const exerciseFolderPath = plugin.settings.exerciseFolderPath;
      if (!exerciseFolderPath) {
        return [];
      }

      // Find the exercise file
      const allFiles = plugin.app.vault.getMarkdownFiles();
      const exerciseFile = allFiles.find((file) => {
        const normalizedFilePath = file.path.replace(/\\/g, "/");
        const fileName = file.basename.toLowerCase();
        const searchName = exerciseName.toLowerCase();

        // Check if this file is in the exercise folder and matches the exercise name
        const isInExerciseFolder = [
          exerciseFolderPath,
          exerciseFolderPath + "/",
          exerciseFolderPath + "/Data",
          exerciseFolderPath + "/Data/",
          "theGYM/" + exerciseFolderPath,
          "theGYM/" + exerciseFolderPath + "/",
          "theGYM/" + exerciseFolderPath + "/Data",
          "theGYM/" + exerciseFolderPath + "/Data/",
        ].some(
          (path) =>
            normalizedFilePath.startsWith(path) ||
            normalizedFilePath.includes(path + "/")
        );

        return (
          isInExerciseFolder &&
          (fileName === searchName ||
            fileName.includes(searchName) ||
            searchName.includes(fileName))
        );
      });

      if (!exerciseFile) {
        this.exerciseTagsCache.set(exerciseName, []);
        return [];
      }

      // Read the file content
      const content = await plugin.app.vault.read(exerciseFile);

      // Parse frontmatter for tags
      const frontmatterMatch = content.match(/^---\s*\n(.*?)\n---/);
      if (!frontmatterMatch) {
        this.exerciseTagsCache.set(exerciseName, []);
        return [];
      }

      const frontmatter = frontmatterMatch[1];
      const tagsMatch = frontmatter.match(/tags:\s*\n((?:\s*-\s*.+\n?)*)/);

      if (!tagsMatch) {
        this.exerciseTagsCache.set(exerciseName, []);
        return [];
      }

      // Extract tags
      const tags = tagsMatch[1]
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.startsWith("- "))
        .map((line) => line.substring(2).trim())
        .filter((tag) => tag.length > 0);

      this.exerciseTagsCache.set(exerciseName, tags);
      return tags;
    } catch (error) {
      if (plugin.settings.debugMode) {
        console.error(
          `Error loading exercise tags for "${exerciseName}":`,
          error
        );
      }
      this.exerciseTagsCache.set(exerciseName, []);
      return [];
    }
  }

  /**
   * Maps exercise tags to muscle groups
   */
  private static async findMuscleGroupsFromTags(
    exerciseName: string,
    plugin: WorkoutChartsPlugin
  ): Promise<string[]> {
    const tags = await this.loadExerciseTags(exerciseName, plugin);
    const muscleGroups = new Set<string>();

    // Map tags to muscle groups
    tags.forEach((tag) => {
      const normalizedTag = tag.toLowerCase().trim();
      const mappedMuscle = this.TAG_MUSCLE_MAP[normalizedTag];
      if (mappedMuscle) {
        muscleGroups.add(mappedMuscle);
      }
    });

    // If no muscle groups found from tags, try exercise name patterns
    if (muscleGroups.size === 0) {
      const exerciseNameLower = exerciseName.toLowerCase();

      // Check exercise name against tag mappings
      Object.entries(this.TAG_MUSCLE_MAP).forEach(([tag, muscle]) => {
        if (
          exerciseNameLower.includes(tag) ||
          tag.includes(exerciseNameLower)
        ) {
          muscleGroups.add(muscle);
        }
      });

      // Default fallback
      if (muscleGroups.size === 0) {
        muscleGroups.add("core");
      }
    }

    return Array.from(muscleGroups);
  }

  private static showMuscleDetails(
    muscleId: string,
    muscleInfo: MuscleGroupData | undefined,
    container: HTMLElement
  ): void {
    // Remove existing details
    container.querySelector(".muscle-details")?.remove();

    if (!muscleInfo || muscleInfo.volume === 0) {
      return;
    }

    const detailsEl = container.createEl("div", {
      cls: "muscle-details",
    });

    detailsEl.createEl("h4", {
      text: `${muscleInfo.name} Details`,
    });

    detailsEl.createEl("p", {
      text: `Total Volume: ${muscleInfo.volume.toLocaleString()} kg`,
    });

    detailsEl.createEl("p", {
      text: `Exercises: ${muscleInfo.exercises.length}`,
    });

    const exerciseList = detailsEl.createEl("ul");
    muscleInfo.exercises.forEach((exercise) => {
      exerciseList.createEl("li", { text: exercise });
    });

    // Auto-hide after 5 seconds
    setTimeout(() => {
      detailsEl.remove();
    }, 5000);
  }

  private static updateInfoPanel(
    infoPanel: HTMLElement,
    muscleData: Map<string, MuscleGroupData>
  ): void {
    infoPanel.empty();

    const volumes = Array.from(muscleData.values())
      .map((m) => m.volume)
      .filter((v) => v > 0);

    if (volumes.length === 0) {
      infoPanel.createEl("p", {
        text: "No workout data found for the selected time period.",
        cls: "info-message",
      });
      return;
    }

    const avgVolume =
      volumes.reduce((sum, vol) => sum + vol, 0) / volumes.length;
    const maxVolume = Math.max(...volumes);
    const minVolume = Math.min(...volumes);

    // Imbalance detection
    const imbalanceThreshold = 0.3; // 30% difference
    const imbalances: string[] = [];

    // Check for major imbalances
    const frontMuscles = ["chest", "abs", "biceps", "quads"];
    const backMuscles = ["back", "triceps", "hamstrings", "glutes"];

    const frontVolume = frontMuscles.reduce(
      (sum, muscle) => sum + (muscleData.get(muscle)?.volume || 0),
      0
    );
    const backVolume = backMuscles.reduce(
      (sum, muscle) => sum + (muscleData.get(muscle)?.volume || 0),
      0
    );

    if (
      Math.abs(frontVolume - backVolume) / Math.max(frontVolume, backVolume) >
      imbalanceThreshold
    ) {
      imbalances.push(
        `Front-Back imbalance detected (${
          frontVolume > backVolume ? "Front" : "Back"
        } dominant)`
      );
    }

    // Display info
    infoPanel.createEl("h4", { text: "Training Analysis" });

    infoPanel.createEl("p", {
      text: `Average Volume: ${avgVolume.toFixed(0)} kg`,
    });

    if (imbalances.length > 0) {
      const alertEl = infoPanel.createEl("div", {
        cls: "imbalance-alert",
      });

      alertEl.createEl("h5", {
        text: "⚠️ Imbalance Alerts",
        cls: "alert-title",
      });

      imbalances.forEach((imbalance) => {
        alertEl.createEl("p", {
          text: imbalance,
          cls: "alert-message",
        });
      });
    } else {
      infoPanel.createEl("p", {
        text: "✅ No major muscle imbalances detected",
        cls: "success-message",
      });
    }
  }

  private static exportHeatMap(container: HTMLElement): void {
    const canvas = container.querySelector("canvas");
    if (!canvas) return;

    // Create a higher resolution canvas for export
    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = 800;
    exportCanvas.height = 1000;
    const exportCtx = exportCanvas.getContext("2d")!;

    // Scale up the existing canvas
    exportCtx.fillStyle = "#ffffff";
    exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
    exportCtx.drawImage(canvas, 0, 0, exportCanvas.width, exportCanvas.height);

    // Download the image
    exportCanvas.toBlob((blob) => {
      if (blob) {
        const link = document.createElement("a");
        link.download = `muscle-heatmap-${
          new Date().toISOString().split("T")[0]
        }.png`;
        link.href = URL.createObjectURL(blob);
        link.click();
        URL.revokeObjectURL(link.href);
      }
    });
  }
}
