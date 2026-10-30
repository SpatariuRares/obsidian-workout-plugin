/** @jest-environment jsdom */

import { StatsBox } from "@app/features/dashboard/ui/StatsBox";
import { CHART_DATA_TYPE, CHART_TYPE } from "@app/features/charts/types";
import { CONSTANTS } from "@app/constants";
import { LocalizationService, t } from "@app/i18n";
import { createObsidianContainer } from "@app/components/__tests__/obsidianDomMocks";

describe("StatsBox", () => {
  beforeAll(() => LocalizationService.initialize({} as never));

  const render = (dataType: string) => {
    const container = createObsidianContainer();
    StatsBox.render(
      container,
      ["2026-10-01", "2026-10-02"],
      [60, 70],
      CHART_TYPE.EXERCISE,
      dataType as CHART_DATA_TYPE,
    );
    return container;
  };

  const titleOf = (container: HTMLElement) =>
    container.querySelector(".workout-charts-stats-title")?.textContent;

  const expectedTitle = (dataTypeLabel: string) =>
    t("stats.title", {
      dataTypeLabel,
      contextLabel: CONSTANTS.WORKOUT.LABELS.TABLE.EXERCISE,
    });

  it.each([
    [CHART_DATA_TYPE.VOLUME, "charts.types.volume"],
    [CHART_DATA_TYPE.WEIGHT, "charts.types.weight"],
    [CHART_DATA_TYPE.REPS, "charts.types.reps"],
    [CHART_DATA_TYPE.DURATION, "charts.types.duration"],
    [CHART_DATA_TYPE.DISTANCE, "charts.types.distance"],
    [CHART_DATA_TYPE.PACE, "charts.types.pace"],
    [CHART_DATA_TYPE.HEART_RATE, "charts.types.heartRate"],
  ])("titles a %s chart's stats with the full type name", (dataType, key) => {
    expect(titleOf(render(dataType))).toBe(expectedTitle(t(key)));
  });

  it("titles a custom numeric field's stats with its key", () => {
    expect(titleOf(render("cadence"))).toBe(expectedTitle("cadence"));
  });

  it.each(Object.values(CHART_DATA_TYPE))(
    "labels the average of a %s chart as the average, followed by the value",
    (dataType) => {
      const firstStat = render(dataType).querySelector(
        ".workout-charts-stats-list li",
      );

      expect(firstStat?.childNodes[0].textContent).toBe(t("stats.average"));
      expect(firstStat?.querySelector("strong")?.textContent).not.toBe("");
    },
  );
});
