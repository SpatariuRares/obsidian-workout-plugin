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
});
