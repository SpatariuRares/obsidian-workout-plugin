/** @jest-environment jsdom */

import { TableHeader } from "@app/features/tables/ui/TableHeader";
import { createObsidianContainer } from "@app/components/__tests__/obsidianDomMocks";

describe("TableHeader", () => {
  describe("render", () => {
    it("creates thead with header row", () => {
      const table = createObsidianContainer();
      const headers = ["Date", "Exercise", "Reps"];

      const thead = TableHeader.render(table, headers);

      expect(thead.tagName).toBe("THEAD");
      expect(table.contains(thead)).toBe(true);

      const ths = thead.querySelectorAll("th");
      expect(ths.length).toBe(3);
      expect(ths[0].textContent).toBe("Date");
      expect(ths[1].textContent).toBe("Exercise");
      expect(ths[2].textContent).toBe("Reps");
    });

    it("handles empty headers array", () => {
      const table = createObsidianContainer();

      const thead = TableHeader.render(table, []);

      expect(thead.tagName).toBe("THEAD");
      expect(thead.querySelectorAll("th").length).toBe(0);
    });
  });

  describe("createHeaderCell", () => {
    it("creates a th element with text", () => {
      const parent = createObsidianContainer();

      const th = TableHeader.createHeaderCell(parent, "Weight");

      expect(th.tagName).toBe("TH");
      expect(th.textContent).toBe("Weight");
      expect(parent.contains(th)).toBe(true);
    });

    it("creates a th element with attributes", () => {
      const parent = createObsidianContainer();

      const th = TableHeader.createHeaderCell(parent, "Volume", {
        colspan: "2",
        "data-sort": "asc",
      });

      expect(th.getAttribute("colspan")).toBe("2");
      expect(th.getAttribute("data-sort")).toBe("asc");
    });

    it("creates a th element without attributes", () => {
      const parent = createObsidianContainer();

      const th = TableHeader.createHeaderCell(parent, "Reps");

      expect(th.textContent).toBe("Reps");
    });
  });
});
