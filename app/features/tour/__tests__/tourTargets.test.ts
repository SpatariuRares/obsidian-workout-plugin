/** @jest-environment jsdom */
import { withHelpers } from "obsidian";
import { TOUR_TARGETS } from "@app/features/tour/tourTargets";
import { WidgetContainer } from "@app/features/dashboard/ui/WidgetContainer";
import { ActionButtons } from "@app/features/tables/ui/ActionButtons";

describe("data-tour markers on real components", () => {
  let root: HTMLElement;
  beforeEach(() => {
    document.body.innerHTML = "";
    root = withHelpers(document.body).createDiv();
  });

  it("every target id is unique", () => {
    const ids = Object.values(TOUR_TARGETS);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("a dashboard widget carries its tour target", () => {
    const widget = WidgetContainer.create(root, {
      title: "Summary",
      tourTarget: TOUR_TARGETS.dashboardSummary,
    });
    expect(widget.getAttribute("data-tour")).toBe("dashboard-summary");
  });

  it("a widget without a tour target has no data-tour", () => {
    const widget = WidgetContainer.create(root, { title: "Other" });
    expect(widget.hasAttribute("data-tour")).toBe(false);
  });

  it("table row actions carry their tour target", () => {
    const { container } = ActionButtons.createActionButtonsContainer(root);
    expect(container.getAttribute("data-tour")).toBe("table-row-actions");
  });
});
