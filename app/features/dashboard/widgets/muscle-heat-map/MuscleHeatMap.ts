import { WorkoutLogData } from "@app/types/WorkoutLogData";
import type { EmbeddedDashboardParams } from "@app/features/dashboard/types";
import type WorkoutChartsPlugin from "main";
import {
  Body,
  type BodyData,
  VIEW_TYPE,
} from "@app/features/dashboard/widgets/muscle-heat-map/body";
import {
  MuscleDataCalculator,
  MuscleBalanceAnalyzer,
  MuscleTagMapper,
} from "@app/features/dashboard/widgets/muscle-heat-map/business";
import { HeatMapControls } from "@app/features/dashboard/widgets/muscle-heat-map/HeatMapControls";
import type { MuscleHeatMapOptions } from "@app/features/dashboard/widgets/muscle-heat-map/types";
import { WidgetContainer } from "@app/features/dashboard/ui/WidgetContainer";
import { t } from "@app/i18n";

/**
 * Main orchestrator for muscle heat map visualization
 * Coordinates between data processing, UI controls, and rendering
 */
export class MuscleHeatMap {
  static async render(
    container: HTMLElement,
    data: WorkoutLogData[],
    params: EmbeddedDashboardParams,
    plugin: WorkoutChartsPlugin,
  ): Promise<void> {
    const heatMapEl = WidgetContainer.create(container, {
      title: t("general.muscleHeatMap"),
      className: "workout-muscle-heatmap",
      isWide: true,
    });

    // Controls container (created in correct DOM order: title -> controls -> canvas -> info)
    const controlsContainer = heatMapEl.createEl("div");

    // Heat map canvas container
    const canvasContainer = heatMapEl.createEl("div", {
      cls: "workout-heatmap-canvas-container",
    });

    // Info panel for imbalance alerts
    const infoPanel = heatMapEl.createEl("div", {
      cls: "workout-heatmap-info-panel",
    });

    // Create calculator with DI
    const muscleTagService = plugin.getMuscleTagService();
    const tagMapper = new MuscleTagMapper(muscleTagService);
    const calculator = new MuscleDataCalculator(tagMapper);

    const renderHeatMap = async (
      cntr: HTMLElement,
      d: WorkoutLogData[],
      opts: MuscleHeatMapOptions,
      info: HTMLElement,
      plg: WorkoutChartsPlugin,
    ): Promise<void> => {
      await MuscleHeatMap.renderHeatMap(cntr, d, opts, info, plg, calculator);
    };

    // Create controls inside the pre-positioned container
    const currentOptions = HeatMapControls.create(
      controlsContainer,
      data,
      canvasContainer,
      infoPanel,
      plugin,
      renderHeatMap,
    );

    // Render initial heat map
    await MuscleHeatMap.renderHeatMap(
      canvasContainer,
      data,
      currentOptions,
      infoPanel,
      plugin,
      calculator,
    );
  }

  private static async renderHeatMap(
    container: HTMLElement,
    data: WorkoutLogData[],
    options: MuscleHeatMapOptions,
    infoPanel: HTMLElement,
    plugin: WorkoutChartsPlugin,
    calculator: MuscleDataCalculator,
  ): Promise<void> {
    container.empty();

    // Filter data based on time frame
    const filteredData = MuscleDataCalculator.filterDataByTimeFrame(
      data,
      options.timeFrame,
    );

    // Calculate muscle group volumes
    const muscleData = await calculator.calculateMuscleGroupVolumes(
      filteredData,
      plugin,
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
    options: MuscleHeatMapOptions,
  ): void {
    const maxValue = MuscleDataCalculator.calculateMaxValue(bodyData);

    const body = new Body(bodyData, {
      view: options.view === "back" ? VIEW_TYPE.BACK : VIEW_TYPE.FRONT,
      showLabels: true,
      maxValue: maxValue,
    });

    // Render the body visualization
    body.render(container);
  }
}
