import { CONSTANTS } from "@app/constants";
import type { MuscleGroupData } from "@app/features/dashboard/business/muscleHeatMap/MuscleDataCalculator";

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

  private static readonly FRONT_MUSCLES = ["chest", "abs", "biceps", "quads"];
  private static readonly BACK_MUSCLES = [
    "back",
    "triceps",
    "hamstrings",
    "glutes",
  ];

  /**
   * Analyze muscle balance and detect imbalances
   */
  static analyze(muscleData: Map<string, MuscleGroupData>): ImbalanceAnalysis {
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
      (sum, muscle) => sum + (muscleData.get(muscle)?.volume || 0),
      0
    );
    const backVolume = this.BACK_MUSCLES.reduce(
      (sum, muscle) => sum + (muscleData.get(muscle)?.volume || 0),
      0
    );

    if (
      Math.abs(frontVolume - backVolume) / Math.max(frontVolume, backVolume) >
      this.IMBALANCE_THRESHOLD
    ) {
      imbalances.push(
        `Front-Back imbalance detected (${frontVolume > backVolume ? "Front" : "Back"
        } dominant)`
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
    muscleData: Map<string, MuscleGroupData>
  ): void {
    infoPanel.empty();

    const analysis = this.analyze(muscleData);

    if (!analysis.hasData) {
      infoPanel.createEl("p", {
        text: CONSTANTS.WORKOUT.MESSAGES.NO_DATA_PERIOD,
        cls: "workout-info-message",
      });
      return;
    }

    // Display analysis header
    infoPanel.createEl("h4", { text: CONSTANTS.WORKOUT.UI.LABELS.TRAINING_ANALYSIS });

    infoPanel.createEl("p", {
      text: `Average volume: ${analysis.avgVolume.toFixed(0)} kg`,
    });

    // Display imbalance alerts or success message
    if (analysis.imbalances.length > 0) {
      const alertEl = infoPanel.createEl("div", {
        cls: "workout-imbalance-alert",
      });

      alertEl.createEl("h5", {
        text: CONSTANTS.WORKOUT.MESSAGES.WARNINGS.IMBALANCE_ALERTS,
        cls: "workout-alert-title",
      });

      analysis.imbalances.forEach((imbalance) => {
        alertEl.createEl("p", {
          text: imbalance,
          cls: "workout-alert-message",
        });
      });
    } else {
      infoPanel.createEl("p", {
        text: CONSTANTS.WORKOUT.MESSAGES.SUCCESS.NO_IMBALANCES,
        cls: "workout-success-message",
      });
    }
  }
}
