import { Feedback } from "@app/components/atoms/Feedback";
import type { MuscleGroupData } from "@app/features/dashboard/widgets/muscle-heat-map/business/MuscleDataCalculator";
import type { HeatMapMetric } from "@app/features/dashboard/widgets/muscle-heat-map/types";
import { ParameterUtils } from "@app/utils/parameter/ParameterUtils";
import { t } from "@app/i18n";
import { CONSTANTS } from "@app/constants";
import {
  MUSCLE_GROUPS,
  type BodySide,
} from "@app/constants/muscles.constants";

export interface ImbalanceAnalysis {
  avgVolume: number;
  imbalances: string[];
  hasData: boolean;
}

/**
 * Analyzes muscle balance and detects training imbalances
 */
export class MuscleBalanceAnalyzer {
  private static readonly IMBALANCE_THRESHOLD = 0.3; // 30% difference

  /** Total of every muscle group on one side of the body (see MUSCLE_GROUPS) */
  private static sideTotal(
    muscleData: Map<string, MuscleGroupData>,
    side: BodySide,
  ): number {
    return MUSCLE_GROUPS.filter((group) => group.side === side).reduce(
      (sum, group) => sum + (muscleData.get(group.id)?.total || 0),
      0,
    );
  }

  /**
   * Analyze muscle balance and detect imbalances
   */
  static analyze(
    muscleData: Map<string, MuscleGroupData>,
  ): ImbalanceAnalysis {
    const volumes = Array.from(muscleData.values())
      .map((m) => m.total)
      .filter((v) => v > 0);

    if (volumes.length === 0) {
      return {
        avgVolume: 0,
        imbalances: [],
        hasData: false,
      };
    }

    const avgVolume =
      volumes.reduce((sum, vol) => sum + vol, 0) / volumes.length;
    const imbalances: string[] = [];

    // Check front-back imbalance
    const frontVolume = this.sideTotal(muscleData, "front");
    const backVolume = this.sideTotal(muscleData, "back");

    const maxVolume = Math.max(frontVolume, backVolume);
    if (
      maxVolume > 0 &&
      Math.abs(frontVolume - backVolume) / maxVolume >
        this.IMBALANCE_THRESHOLD
    ) {
      imbalances.push(
        frontVolume > backVolume
          ? t("dashboard.muscleHeatMap.imbalance.frontDominant")
          : t("dashboard.muscleHeatMap.imbalance.backDominant"),
      );
    }

    return {
      avgVolume,
      imbalances,
      hasData: true,
    };
  }

  /**
   * Render imbalance analysis to info panel
   */
  static renderToInfoPanel(
    infoPanel: HTMLElement,
    muscleData: Map<string, MuscleGroupData>,
    metric: HeatMapMetric = "volume",
  ): void {
    infoPanel.empty();

    const analysis = this.analyze(muscleData);

    if (!analysis.hasData) {
      Feedback.renderInfo(infoPanel, t("messages.noDataPeriod"));
      return;
    }

    // Display analysis header
    infoPanel.createEl("h4", {
      text: CONSTANTS.WORKOUT.UI.LABELS.TRAINING_ANALYSIS,
    });

    infoPanel.createEl("p", {
      text: t(`dashboard.muscleHeatMap.average.${metric}`, {
        value: analysis.avgVolume.toFixed(0),
        unit: ParameterUtils.getWeightUnit(),
      }),
    });

    // Display imbalance alerts or success message
    if (analysis.imbalances.length > 0) {
      Feedback.renderWarning(infoPanel, analysis.imbalances, {
        title: t("messages.imbalanceAlerts"),
        append: true,
      });
    } else {
      Feedback.renderSuccess(infoPanel, t("messages.noImbalances"), {
        append: true,
      });
    }
  }
}
