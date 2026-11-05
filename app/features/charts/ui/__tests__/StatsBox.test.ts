/** @jest-environment jsdom */

import { StatsBox } from "@app/features/charts/ui/StatsBox";
import { CHART_DATA_TYPE } from "@app/features/charts/types";
import { LocalizationService, t } from "@app/i18n";
import { createObsidianContainer } from "@app/components/__tests__/obsidianDomMocks";

describe("StatsBox", () => {
  beforeAll(() => LocalizationService.initialize({} as never));

  const render = (
    data: number[],
    dataType: string = CHART_DATA_TYPE.VOLUME,
  ) => {
    const container = createObsidianContainer();
    const labels = data.map((_, i) => `0${i + 1}/10/2026`);
    StatsBox.render(container, labels, data, dataType as CHART_DATA_TYPE);
    return container;
  };

  const cards = (container: HTMLElement) =>
    [...container.querySelectorAll(".workout-charts-stats .stat-card")].map(
      (card) => ({
        label: card.querySelector(".stat-card-label")?.textContent,
        value: card.querySelector(".stat-card-value")?.textContent,
        detail: card.querySelector(".stat-card-detail")?.textContent,
        className: card.className,
      }),
    );

  it("shows average, max and min with their days, and the sessions", () => {
    const [average, max, min, sessions] = cards(render([60, 80, 70]));

    expect(average).toMatchObject({ label: t("charts.stats.average"), value: "70.0 kg" });
    expect(max).toMatchObject({ label: t("charts.stats.max"), value: "80.0 kg", detail: "02/10/2026" });
    expect(min).toMatchObject({ label: t("charts.stats.min"), value: "60.0 kg", detail: "01/10/2026" });
    expect(sessions).toMatchObject({ label: t("charts.stats.sessions"), value: "3" });
  });

  it("shows the change over the last 3 as an improvement", () => {
    const recent = cards(render([60, 70, 80]))[4];

    expect(recent).toMatchObject({
      label: t("charts.stats.recentTrend"),
      value: "+20.0 kg",
      detail: t("charts.stats.last3"),
    });
    expect(recent.className).toContain("is-up");
  });

  it("counts a falling pace as an improvement", () => {
    const recent = cards(render([6, 5.5, 5], CHART_DATA_TYPE.PACE))[4];

    expect(recent.value).toBe(`-1.00 ${t("common.minPerKm")}`);
    expect(recent.className).toContain("is-up");
  });

  it("calls a change within 5% stable", () => {
    const recent = cards(render([100, 101, 102]))[4];

    expect(recent.value).toBe(t("trends.stable"));
    expect(recent.className).toContain("is-neutral");
  });

  it("compares two days with the previous one", () => {
    const recent = cards(render([80, 70]))[4];

    expect(recent).toMatchObject({ value: "-10.0 kg", detail: t("charts.stats.vsPrevious") });
    expect(recent.className).toContain("is-down");
  });

  it("calls two equal days stable", () => {
    const recent = cards(render([80, 80]))[4];

    expect(recent).toMatchObject({ value: t("trends.stable"), detail: t("charts.stats.vsPrevious") });
    expect(recent.className).toContain("is-neutral");
  });

  it("calls two days within 5% of their mean stable", () => {
    const recent = cards(render([100, 103]))[4];

    expect(recent.value).toBe(t("trends.stable"));
    expect(recent.className).toContain("is-neutral");
  });

  it("measures stable against the mean of the last 3, not the first", () => {
    // +1.5 is over 5% of 20 but within 5% of the mean (30.5)
    const recent = cards(render([20, 50, 21.5]))[4];

    expect(recent.value).toBe(t("trends.stable"));
    expect(recent.className).toContain("is-neutral");
  });

  it("only looks at the last 3 days", () => {
    const recent = cards(render([500, 60, 70, 80]))[4];

    expect(recent.value).toBe("+20.0 kg");
    expect(recent.className).toContain("is-up");
  });

  it("counts a rising pace as a decline", () => {
    const recent = cards(render([5, 6], CHART_DATA_TYPE.PACE))[4];

    expect(recent.value).toBe(`+1.00 ${t("common.minPerKm")}`);
    expect(recent.className).toContain("is-down");
  });

  it("has no recent trend with one day", () => {
    expect(cards(render([80]))).toHaveLength(4);
  });
});
