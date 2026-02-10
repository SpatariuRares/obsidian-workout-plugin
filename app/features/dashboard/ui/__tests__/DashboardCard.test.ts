/** @jest-environment jsdom */

import { DashboardCard } from "../DashboardCard";
import { Container, Icon, Text } from "@app/components/atoms";
import { attachObsidianHelpers } from "@app/components/__tests__/obsidianDomMocks";

// Mock atoms
jest.mock("@app/components/atoms", () => ({
  Container: {
    create: jest.fn((parent, props) => {
      const el = attachObsidianHelpers(document.createElement("div"));
      if (props?.className) el.className = props.className;
      if (props?.text) el.textContent = props.text;
      parent.appendChild(el);
      return el;
    }),
  },
  Icon: {
    create: jest.fn((parent, props) => {
      const el = attachObsidianHelpers(document.createElement("div"));
      if (props?.className) el.className = props.className;
      if (props?.name) el.textContent = props.name;
      parent.appendChild(el);
      return el;
    }),
  },
  Text: {
    create: jest.fn((parent, props) => {
      const el = attachObsidianHelpers(document.createElement(props?.tag || "div"));
      if (props?.className) el.className = props.className;
      if (props?.text) el.textContent = props.text;
      parent.appendChild(el);
      return el;
    }),
  },
}));

describe("DashboardCard", () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = attachObsidianHelpers(document.createElement("div"));
    jest.clearAllMocks();
  });

  describe("Summary Variant (Default)", () => {
    it("should create a summary card with correct structure", () => {
      DashboardCard.create(container, {
        icon: "🔥",
        title: "Streak",
        value: "5 days",
        variant: "summary",
      });

      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain("workout-summary-card");

      // Check for internal elements using class names from the implementation
      const iconEl = card.querySelector(".workout-card-icon");
      const valueEl = card.querySelector(".workout-card-value");
      const titleEl = card.querySelector(".workout-card-title");

      expect(iconEl?.textContent).toBe("🔥");
      expect(valueEl?.textContent).toBe("5 days");
      expect(titleEl?.textContent).toBe("Streak");
    });

    it("should handle missing value", () => {
      DashboardCard.create(container, {
        icon: "🔥",
        title: "No Value",
        variant: "summary",
      });

      const card = container.firstChild as HTMLElement;
      const valueEl = card.querySelector(".workout-card-value");
      expect(valueEl).toBeNull();
    });
  });

  describe("Stats Variant", () => {
    it("should create a stats card with correct structure", () => {
      DashboardCard.create(container, {
        icon: "📅",
        title: "Weekly Stats",
        variant: "stats",
      });

      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain("workout-stats-card");

      const header = card.querySelector(".workout-card-header");
      expect(header).toBeDefined();

      const iconEl = header?.querySelector(".workout-card-icon");
      const titleEl = header?.querySelector(".workout-card-title"); // Corrected selector

      expect(iconEl?.textContent).toBe("📅");
      expect(titleEl?.textContent).toBe("Weekly Stats");
      expect(titleEl?.tagName).toBe("H4");
    });
  });
});
