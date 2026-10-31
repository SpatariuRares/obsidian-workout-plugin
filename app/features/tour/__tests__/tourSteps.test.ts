/** @jest-environment jsdom */
import { t } from "@app/i18n";
import { WorkoutEventBus } from "@app/services/events/WorkoutEventBus";
import { TOUR_TARGETS } from "@app/features/tour/tourTargets";
import { buildTour } from "@app/features/tour/tourSteps";
import type { TourStep } from "@app/features/tour/TourStep";

function armed(step: TourStep) {
  const complete = jest.fn();
  step.completion?.arm({ complete });
  return complete;
}

describe("buildTour", () => {
  const bus = new WorkoutEventBus();

  it("has the nine steps in order, pointing at the right targets", () => {
    const tour = buildTour({ bus, mode: "examples" });
    expect(tour.steps.map((s) => [s.id, s.target])).toEqual([
      ["log-set", TOUR_TARGETS.tableAddButton],
      ["row-actions", TOUR_TARGETS.tableRowActions],
      ["chart", TOUR_TARGETS.chart],
      ["dashboard", TOUR_TARGETS.dashboard],
      ["muscles", TOUR_TARGETS.dashboardMuscleHeatMap],
      ["timer", TOUR_TARGETS.timerStart],
      ["ribbon", TOUR_TARGETS.ribbonIcon],
      ["commands", undefined],
      ["end", undefined],
    ]);
  });

  it("has translated, short text on every step", () => {
    for (const mode of ["examples", "mine"] as const) {
      for (const s of buildTour({ bus, mode }).steps) {
        expect(s.title).toBeTruthy();
        expect(s.text).toBeTruthy();
      }
    }
  });

  it("completes the first step when a set is logged", () => {
    const [first] = buildTour({ bus, mode: "mine" }).steps;
    const complete = armed(first);
    bus.emit({ type: "log:added", payload: { exercise: "Squat" } } as never);
    expect(complete).toHaveBeenCalledTimes(1);
  });

  it("completes the commands step when an insert command runs", () => {
    const step = buildTour({ bus, mode: "mine" }).steps.find(
      (s) => s.id === "commands",
    )!;
    const complete = armed(step);
    bus.emit({ type: "command:insert", payload: { kind: "chart" } });
    expect(complete).toHaveBeenCalledTimes(1);
  });

  it("gives mobile text where the UI differs: chart is a table, no ribbon", () => {
    const steps = buildTour({ bus, mode: "examples" }).steps;
    const byId = (id: string) => steps.find((s) => s.id === id)!;
    expect(byId("chart").mobileText).toBe(t("tour.steps.chart.mobileText"));
    expect(byId("ribbon").mobileText).toBe(t("tour.steps.ribbon.mobileText"));
    expect(byId("log-set").mobileText).toBeUndefined();
  });

  it("says the chart starts nearly empty with your own data", () => {
    const chart = (mode: "examples" | "mine") =>
      buildTour({ bus, mode }).steps.find((s) => s.id === "chart")!;
    expect(chart("mine").text).toBe(t("tour.steps.chart.textMine"));
    expect(chart("examples").text).toBe(t("tour.steps.chart.text"));
    expect(chart("mine").mobileText).toBe(t("tour.steps.chart.mobileTextMine"));
  });
});
