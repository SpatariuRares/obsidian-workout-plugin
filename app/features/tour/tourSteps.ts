import { t } from "@app/i18n";
import {
  completeOnInsertCommand,
  completeOnLogAdded,
  completeOnTargetClick,
} from "@app/features/tour/completions";
import { TOUR_TARGETS } from "@app/features/tour/tourTargets";
import type { Tour } from "@app/features/tour/TourStep";
import type { WorkoutEventBus } from "@app/services/events/WorkoutEventBus";

/**
 * Which data the tour runs on: the example notes (`examples`) or the user's
 * own log (`mine`), whose chart and dashboard start nearly empty.
 */
export type TourMode = "examples" | "mine";

export const GUIDED_TOUR_ID = "guided-tour";

/** The nine steps of the guided tour, in the order of the tour note's blocks. */
export function buildTour(options: {
  bus: WorkoutEventBus;
  mode: TourMode;
}): Tour {
  const { bus, mode } = options;
  const own = mode === "mine";

  return {
    id: GUIDED_TOUR_ID,
    steps: [
      {
        id: "log-set",
        target: TOUR_TARGETS.tableAddButton,
        title: t("tour.steps.logSet.title"),
        text: t("tour.steps.logSet.text"),
        completion: completeOnLogAdded(bus),
      },
      {
        id: "row-actions",
        target: TOUR_TARGETS.tableRowActions,
        title: t("tour.steps.rowActions.title"),
        text: t("tour.steps.rowActions.text"),
      },
      {
        id: "chart",
        target: TOUR_TARGETS.chart,
        title: t("tour.steps.chart.title"),
        text: own ? t("tour.steps.chart.textMine") : t("tour.steps.chart.text"),
        mobileText: own
          ? t("tour.steps.chart.mobileTextMine")
          : t("tour.steps.chart.mobileText"),
      },
      {
        id: "dashboard",
        target: TOUR_TARGETS.dashboard,
        title: t("tour.steps.dashboard.title"),
        text: own
          ? t("tour.steps.dashboard.textMine")
          : t("tour.steps.dashboard.text"),
      },
      {
        id: "muscles",
        target: TOUR_TARGETS.dashboardMuscleHeatMap,
        title: t("tour.steps.muscles.title"),
        text: t("tour.steps.muscles.text"),
      },
      {
        id: "timer",
        target: TOUR_TARGETS.timerStart,
        title: t("tour.steps.timer.title"),
        text: t("tour.steps.timer.text"),
        completion: completeOnTargetClick(TOUR_TARGETS.timerStart),
      },
      {
        id: "ribbon",
        target: TOUR_TARGETS.ribbonIcon,
        title: t("tour.steps.ribbon.title"),
        text: t("tour.steps.ribbon.text"),
        mobileText: t("tour.steps.ribbon.mobileText"),
      },
      {
        id: "commands",
        title: t("tour.steps.commands.title"),
        text: t("tour.steps.commands.text"),
        completion: completeOnInsertCommand(bus),
      },
      {
        id: "end",
        title: t("tour.steps.end.title"),
        text: t("tour.steps.end.text"),
      },
    ],
  };
}
