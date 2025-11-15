import { WorkoutLogData } from "@app/types/WorkoutLogData";
import type WorkoutChartsPlugin from "main";
import type { MuscleHeatMapOptions } from "@app/types/MuscleHeatMapOptions";
import { HeatMapExporter } from "@app/features/dashboard/business/muscleHeatMap";

type RenderCallback = (
  _canvasContainer: HTMLElement,
  _data: WorkoutLogData[],
  _options: MuscleHeatMapOptions,
  _infoPanel: HTMLElement,
  _plugin: WorkoutChartsPlugin
) => Promise<void>;

/**
 * Manages UI controls for the muscle heat map
 */
export class HeatMapControls {
  /**
   * Create and setup all heat map controls
   */
  static create(
    container: HTMLElement,
    data: WorkoutLogData[],
    canvasContainer: HTMLElement,
    infoPanel: HTMLElement,
    plugin: WorkoutChartsPlugin,
    renderCallback: RenderCallback
  ): MuscleHeatMapOptions {
    const controlsEl = container.createEl("div", {
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
      text: "📸 export",
      cls: "export-btn",
    });

    // Current options state
    const currentOptions: MuscleHeatMapOptions = {
      timeFrame: "week",
      view: "front",
    };

    // Setup time frame event listeners
    [weekBtn, monthBtn, yearBtn].forEach((btn, index) => {
      btn.addEventListener("click", () => {
        [weekBtn, monthBtn, yearBtn].forEach((b) => b.removeClass("active"));
        btn.addClass("active");
        currentOptions.timeFrame = ["week", "month", "year"][index] as
          | "week"
          | "month"
          | "year";
        void renderCallback(
          canvasContainer,
          data,
          currentOptions,
          infoPanel,
          plugin
        );
      });
    });

    // Setup view toggle event listeners
    [frontBtn, backBtn].forEach((btn, index) => {
      btn.addEventListener("click", () => {
        [frontBtn, backBtn].forEach((b) => b.removeClass("active"));
        btn.addClass("active");
        currentOptions.view = ["front", "back"][index] as "front" | "back";
        void renderCallback(
          canvasContainer,
          data,
          currentOptions,
          infoPanel,
          plugin
        );
      });
    });

    // Setup export button
    exportBtn.addEventListener("click", () => {
      HeatMapExporter.export(canvasContainer);
    });

    return currentOptions;
  }
}

