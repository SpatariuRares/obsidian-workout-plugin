import { WorkoutLogData } from "@app/types/WorkoutLogData";
import { EmbeddedDashboardParams } from "@app/types";
import type WorkoutChartsPlugin from "main";
import { BodyHeatMap, type BodyData } from "@app/components/dashboard/body";
import { MuscleDataCalculator } from "@app/components/dashboard/muscleHeatMap/MuscleDataCalculator";
import { MuscleBalanceAnalyzer } from "@app/components/dashboard/muscleHeatMap/MuscleBalanceAnalyzer";
import { HeatMapControls } from "@app/components/dashboard/muscleHeatMap/HeatMapControls";
import { MuscleHeatMapOptions } from "@app/types/MuscleHeatMapOptions";

/**
 * Main orchestrator for muscle heat map visualization
 * Coordinates between data processing, UI controls, and rendering
 */
export class MuscleHeatMap {
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
      text: "Muscle heat map",
      cls: "widget-title",
    });

    // Heat map canvas container
    const canvasContainer = heatMapEl.createEl("div", {
      cls: "heatmap-canvas-container",
    });

    // Info panel for imbalance alerts
    const infoPanel = heatMapEl.createEl("div", {
      cls: "heatmap-info-panel",
    });

    // Create controls and get initial options (placed before canvas)
    const currentOptions = HeatMapControls.create(
      heatMapEl,
      data,
      canvasContainer,
      infoPanel,
      plugin,
      this.renderHeatMap.bind(this)
    );

    // Move controls to be first child after title
    const controlsEl = heatMapEl.querySelector(".heatmap-controls");
    if (controlsEl) {
      heatMapEl.insertAfter(
        controlsEl,
        heatMapEl.querySelector(".widget-title")
      );
    }

    // Render initial heat map
    await this.renderHeatMap(
      canvasContainer,
      data,
      currentOptions,
      infoPanel,
      plugin
    );
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
    const filteredData = MuscleDataCalculator.filterDataByTimeFrame(
      data,
      options.timeFrame
    );

    // Calculate muscle group volumes
    const muscleData = await MuscleDataCalculator.calculateMuscleGroupVolumes(
      filteredData,
      plugin
    );

    // Create body data from muscle volumes
    const bodyData =
      MuscleDataCalculator.createBodyDataFromMuscleData(muscleData);

    // Render body visualization
    this.renderBodyVisualization(container, bodyData, options);

    // Update info panel with imbalance analysis
    MuscleBalanceAnalyzer.renderToInfoPanel(infoPanel, muscleData);
  }

  private static renderBodyVisualization(
    container: HTMLElement,
    bodyData: BodyData,
    options: MuscleHeatMapOptions
  ): void {
    // Calculate max value dynamically from actual body data
    const allValues = [
      bodyData.shoulders.frontLeft,
      bodyData.shoulders.frontRight,
      bodyData.shoulders.rearLeft,
      bodyData.shoulders.rearRight,
      bodyData.chest.upper,
      bodyData.chest.middle,
      bodyData.chest.lower,
      bodyData.back.traps,
      bodyData.back.lats,
      bodyData.back.lowerBack,
      bodyData.back.trapsMiddle,
      bodyData.arms.bicepsLeft,
      bodyData.arms.bicepsRight,
      bodyData.arms.tricepsLeft,
      bodyData.arms.tricepsRight,
      bodyData.arms.forearmsLeft,
      bodyData.arms.forearmsRight,
      bodyData.legs.quadsLeft,
      bodyData.legs.quadsRight,
      bodyData.legs.hamstringsLeft,
      bodyData.legs.hamstringsRight,
      bodyData.legs.glutesLeft,
      bodyData.legs.glutesRight,
      bodyData.legs.calvesLeft,
      bodyData.legs.calvesRight,
      bodyData.core.abs,
      bodyData.core.obliques,
    ];

    const maxValue = Math.max(...allValues, 1); // Ensure at least 1 to avoid division by zero

    // Create BodyHeatMap component with visualization options
    const bodyHeatMap = new BodyHeatMap(bodyData, {
      view: options.view,
      showLabels: true,
      maxValue: maxValue,
    });

    // Render the body heat map
    bodyHeatMap.render(container);
  }
}
