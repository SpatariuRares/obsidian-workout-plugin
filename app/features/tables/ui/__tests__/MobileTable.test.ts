/** @jest-environment jsdom */

import { MobileTable } from "@app/features/charts/components/ChartTableViews";
import { createObsidianContainer } from "@app/components/__tests__/obsidianDomMocks";
import { CONSTANTS } from "@app/constants";
import { CHART_DATA_TYPE } from "@app/features/charts/types";

describe("MobileTable", () => {
  it("renders a mobile table with data", () => {
    const container = createObsidianContainer();
    const labels = ["Jan 1", "Jan 2", "Jan 3"];
    const datasets = [
      {
        label: "Volume",
        data: [100.5, 200.3, 150.7],
        backgroundColor: "rgba(0,0,0,0.1)",
        borderColor: "rgba(0,0,0,1)",
      },
    ];

    MobileTable.render(container, labels, datasets, CHART_DATA_TYPE.VOLUME, {});

    const table = container.querySelector("table");
    expect(table).not.toBeNull();

    const rows = table!.querySelectorAll("tbody tr");
    expect(rows.length).toBe(3);

    // Check first row content
    const cells = rows[0].querySelectorAll("td");
    expect(cells[0].textContent).toBe("Jan 1");
    expect(cells[1].textContent).toBe("100.5");
  });

  it("uses custom title from params", () => {
    const container = createObsidianContainer();

    MobileTable.render(
      container,
      ["Jan 1"],
      [{ label: "Volume", data: [100], backgroundColor: "", borderColor: "" }],
      CHART_DATA_TYPE.VOLUME,
      { title: "My Custom Chart" },
    );

    const title = container.querySelector(".workout-mobile-table-title");
    expect(title?.textContent).toBe("My Custom Chart");
  });

  it("generates default title from chart type", () => {
    const container = createObsidianContainer();

    MobileTable.render(
      container,
      ["Jan 1"],
      [{ label: "Weight", data: [80], backgroundColor: "", borderColor: "" }],
      CHART_DATA_TYPE.WEIGHT,
      {},
    );

    const title = container.querySelector(".workout-mobile-table-title");
    expect(title?.textContent).toContain("Weight");
  });

  it("skips null/undefined data values", () => {
    const container = createObsidianContainer();

    MobileTable.render(
      container,
      ["Jan 1", "Jan 2", "Jan 3"],
      [
        {
          label: "Volume",
          data: [100, null as unknown as number, 200],
          backgroundColor: "",
          borderColor: "",
        },
      ],
      CHART_DATA_TYPE.VOLUME,
      {},
    );

    const rows = container.querySelectorAll("tbody tr");
    expect(rows.length).toBe(2); // Only non-null values
  });

  it("excludes trend line dataset", () => {
    const container = createObsidianContainer();

    MobileTable.render(
      container,
      ["Jan 1"],
      [
        {
          label: CONSTANTS.WORKOUT.TABLE.LABELS.TREND_LINE,
          data: [50],
          backgroundColor: "",
          borderColor: "",
        },
        {
          label: "Volume",
          data: [100],
          backgroundColor: "",
          borderColor: "",
        },
      ],
      CHART_DATA_TYPE.VOLUME,
      {},
    );

    const rows = container.querySelectorAll("tbody tr");
    expect(rows.length).toBe(1);
    expect(rows[0].querySelectorAll("td")[1].textContent).toBe("100.0");
  });

  it("shows no data message when no datasets", () => {
    const container = createObsidianContainer();

    MobileTable.render(container, ["Jan 1"], [], CHART_DATA_TYPE.VOLUME, {});

    const rows = container.querySelectorAll("tbody tr");
    expect(rows.length).toBe(1);
    expect(rows[0].querySelector("td")?.textContent).toBe(
      CONSTANTS.WORKOUT.TABLE.LABELS.NO_DATA,
    );
  });

  it("shows no data when dataset has no data array", () => {
    const container = createObsidianContainer();

    MobileTable.render(
      container,
      ["Jan 1"],
      [
        {
          label: "Volume",
          data: undefined as unknown as number[],
          backgroundColor: "",
          borderColor: "",
        },
      ],
      CHART_DATA_TYPE.VOLUME,
      {},
    );

    const rows = container.querySelectorAll("tbody tr");
    expect(rows.length).toBe(1);
    expect(rows[0].querySelector("td")?.textContent).toBe(
      CONSTANTS.WORKOUT.TABLE.LABELS.NO_DATA,
    );
  });

  it("falls back to first dataset when no non-trend dataset", () => {
    const container = createObsidianContainer();

    MobileTable.render(
      container,
      ["Jan 1"],
      [
        {
          label: CONSTANTS.WORKOUT.TABLE.LABELS.TREND_LINE,
          data: [50],
          backgroundColor: "",
          borderColor: "",
        },
      ],
      CHART_DATA_TYPE.VOLUME,
      {},
    );

    // When all datasets are trend lines, it falls back to first
    const rows = container.querySelectorAll("tbody tr");
    expect(rows.length).toBe(1);
  });
});
