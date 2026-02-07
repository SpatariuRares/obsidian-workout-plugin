/**
 * Tests for the components barrel export
 */

import * as Components from "@app/components";

describe("components barrel export", () => {
  it("exports atoms", () => {
    expect(Components.Button).toBeDefined();
    expect(Components.Container).toBeDefined();
    expect(Components.Text).toBeDefined();
    expect(Components.Icon).toBeDefined();
    expect(Components.Input).toBeDefined();
    expect(Components.Canvas).toBeDefined();
    expect(Components.ErrorMessage).toBeDefined();
    expect(Components.Chip).toBeDefined();
    expect(Components.SpacerStat).toBeDefined();
    expect(Components.ProtocolBadge).toBeDefined();
    // Note: Feedback is not exported from barrel, used internally
  });

  it("exports molecules", () => {
    expect(Components.Badge).toBeDefined();
    expect(Components.StatCard).toBeDefined();
    expect(Components.FormField).toBeDefined();
    expect(Components.SearchBox).toBeDefined();
    expect(Components.TrendIndicator).toBeDefined();
    expect(Components.EmptyState).toBeDefined();
    expect(Components.InfoBanner).toBeDefined();
    expect(Components.LoadingSpinner).toBeDefined();
    expect(Components.ProgressBar).toBeDefined();
    expect(Components.ActionButtonGroup).toBeDefined();
    expect(Components.ChartLegendItem).toBeDefined();
    expect(Components.FilterIndicator).toBeDefined();
    expect(Components.CopyableBadge).toBeDefined();
    expect(Components.ListItem).toBeDefined();
  });

  it("exports data utilities", () => {
    expect(Components.DataFilter).toBeDefined();
    expect(Components.TrendCalculator).toBeDefined();
  });
});
