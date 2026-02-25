/** @jest-environment jsdom */

import { ChartFallbackTable } from "../ChartTableViews";
import { CONSTANTS } from "@app/constants";
import { createObsidianContainer } from "@app/components/__tests__/obsidianDomMocks";
import { t } from "@app/i18n";

describe("ChartFallbackTable", () => {
  it("renders table headers, body rows, and footer message", () => {
    const container = createObsidianContainer();
    const labels = ["2024-01-01", "2024-01-02"];
    const volumeData = [100, 110.567];

    ChartFallbackTable.render(container, labels, volumeData);

    const tableWrapper = container.querySelector(
      ".workout-charts-table-fallback",
    ) as HTMLElement;
    expect(tableWrapper).toBeTruthy();

    const table = tableWrapper.querySelector(
      "table.workout-charts-table",
    ) as HTMLTableElement;
    expect(table).toBeTruthy();

    const headers = table.querySelectorAll("thead th");
    expect(headers.length).toBe(2);
    expect(headers[0].textContent).toBe("Date");
    expect(headers[1].textContent).toBe("Volume (kg)");

    const rows = table.querySelectorAll("tbody tr");
    expect(rows.length).toBe(2);
    expect(rows[0].querySelectorAll("td")[0].textContent).toBe("2024-01-01");
    expect(rows[0].querySelectorAll("td")[1].textContent).toBe("100.0");
    expect(rows[1].querySelectorAll("td")[0].textContent).toBe("2024-01-02");
    expect(rows[1].querySelectorAll("td")[1].textContent).toBe("110.6");

    const footer = tableWrapper.querySelector(
      ".workout-charts-footer",
    ) as HTMLElement;
    expect(footer).toBeTruthy();
    expect(footer.textContent).toBe(
      `icons.status.info ${t("charts.fallbackTableMessage")}`,
    );
  });
});
