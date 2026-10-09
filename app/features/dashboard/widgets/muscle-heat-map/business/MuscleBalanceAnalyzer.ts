import { Feedback } from "@app/components/atoms/Feedback";
import type { MuscleGroupData } from "@app/features/dashboard/widgets/muscle-heat-map/business/MuscleDataCalculator";
import type { HeatMapMetric } from "@app/features/dashboard/widgets/muscle-heat-map/types";
import { ParameterUtils } from "@app/utils/parameter/ParameterUtils";
import { t } from "@app/i18n";
import { CONSTANTS } from "@app/constants";
import { MUSCLE_PARENT_GROUPS } from "@app/constants/muscles.constants";

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

  private static readonly FRONT_MUSCLES = [
    "chest",
    "abs",
    "biceps",
    "quads",
  ];
  private static readonly BACK_MUSCLES = [
    "back",
    "triceps",
    "hamstrings",
    "glutes",
  ];

  /**
   * Volume of a group plus the specific muscles under it
   * (e.g. back + lats + rhomboids + lower_back)
   */
  private static getGroupTotal(
    muscleData: Map<string, MuscleGroupData>,
    group: string,
  ): number {
    let total = muscleData.get(group)?.volume || 0;
    for (const [muscle, parent] of Object.entries(MUSCLE_PARENT_GROUPS)) {
      if (parent === group) {
        total += muscleData.get(muscle)?.volume || 0;
      }
    }
    return total;
  }

  /**
   * Analyze muscle balance and detect imbalances
   */
  static analyze(
    muscleData: Map<string, MuscleGroupData>,
  ): ImbalanceAnalysis {
    const volumes = Array.from(muscleData.values())
      .map((m) => m.volume)
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
    const frontVolume = this.FRONT_MUSCLES.reduce(
      (sum, muscle) => sum + this.getGroupTotal(muscleData, muscle),
      0,
    );
    const backVolume = this.BACK_MUSCLES.reduce(
      (sum, muscle) => sum + this.getGroupTotal(muscleData, muscle),
      0,
    );

    const maxVolume = Math.max(frontVolume, backVolume);
    if (
      maxVolume > 0 &&
      Math.abs(frontVolume - backVolume) / maxVolume >
        this.IMBALANCE_THRESHOLD
    ) {
      imbalances.push(
        `Front-Back imbalance detected (${
          frontVolume > backVolume ? "Front" : "Back"
        } dominant)`,
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
