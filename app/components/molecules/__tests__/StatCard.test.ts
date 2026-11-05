/** @jest-environment jsdom */

import { StatCard } from "@app/components/molecules/StatCard";
import { createObsidianContainer } from "@app/components/__tests__/obsidianDomMocks";

describe("StatCard molecule", () => {
  it("renders the label, the figure and the detail", () => {
    const parent = createObsidianContainer();

    const card = StatCard.create(parent, {
      label: "Max",
      value: "820 kg",
      detail: "05/11/2026",
      className: "is-up",
    });

    expect(card.className).toBe("stat-card is-up");
    expect(card.querySelector(".stat-card-label")?.textContent).toBe("Max");
    expect(card.querySelector(".stat-card-value")?.textContent).toBe("820 kg");
    expect(card.querySelector(".stat-card-detail")?.textContent).toBe(
      "05/11/2026",
    );
  });

  it("renders a number, without detail or icon", () => {
    const parent = createObsidianContainer();

    const card = StatCard.create(parent, { label: "Sessions", value: 25 });

    expect(card.querySelector(".stat-card-value")?.textContent).toBe("25");
    expect(card.querySelector(".stat-card-detail")).toBeNull();
    expect(card.querySelector(".stat-card-icon")).toBeNull();
  });

  it("puts the icon inside the label", () => {
    const parent = createObsidianContainer();

    const card = StatCard.create(parent, {
      label: "Workouts",
      value: 42,
      icon: "dumbbell",
    });

    expect(
      card
        .querySelector(".stat-card-label .stat-card-icon")
        ?.getAttribute("data-icon"),
    ).toBe("dumbbell");
  });

  it("draws the row StatCards sit in, with the block's own class", () => {
    const parent = createObsidianContainer();

    const row = StatCard.row(parent, "workout-charts-stats");

    expect(row.className).toBe("stat-card-row workout-charts-stats");
    expect(row.parentElement).toBe(parent);
  });
});
