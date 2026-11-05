/** @jest-environment jsdom */

import { SummaryWidget } from "@app/features/dashboard/widgets/summary/SummaryWidget";
import { createObsidianContainer } from "@app/components/__tests__/obsidianDomMocks";
import { t } from "@app/i18n";

const titles = (container: HTMLElement) =>
  [...container.querySelectorAll(".workout-summary-card .stat-card-label")].map(
    (el) => el.textContent,
  );

describe("SummaryWidget", () => {
  it("shows the four cards by default", () => {
    const container = createObsidianContainer();

    SummaryWidget.render(container, [], {});

    expect(titles(container)).toHaveLength(4);
  });

  it("shows only the cards the block lists", () => {
    const container = createObsidianContainer();

    SummaryWidget.render(container, [], {
      summaryMetrics: ["streak", "records"],
    });

    expect(titles(container)).toEqual([
      t("dashboard.summary.currentStreak"),
      t("dashboard.summary.personalRecords"),
    ]);
  });
});
