/** @jest-environment jsdom */

import { ProtocolBadge } from "@app/components/atoms/ProtocolBadge";
import { createObsidianContainer } from "@app/components/__tests__/obsidianDomMocks";

describe("ProtocolBadge atom", () => {
  describe("create", () => {
    it("renders a badge with text", () => {
      const parent = createObsidianContainer();

      const badge = ProtocolBadge.create(parent, {
        text: "Drop",
      });

      expect(parent.contains(badge)).toBe(true);
      expect(badge.tagName).toBe("SPAN");
      expect(badge.textContent).toBe("Drop");
    });

    it("uses default workout-protocol-badge class", () => {
      const parent = createObsidianContainer();

      const badge = ProtocolBadge.create(parent, {
        text: "Myo",
      });

      expect(badge.classList.contains("workout-protocol-badge")).toBe(
        true,
      );
    });

    it("uses custom className when provided", () => {
      const parent = createObsidianContainer();

      const badge = ProtocolBadge.create(parent, {
        text: "RP",
        className: "workout-protocol-badge workout-protocol-badge-rp",
      });

      expect(badge.classList.contains("workout-protocol-badge")).toBe(
        true,
      );
      expect(
        badge.classList.contains("workout-protocol-badge-rp"),
      ).toBe(true);
    });

    it("sets tooltip when provided", () => {
      const parent = createObsidianContainer();

      const badge = ProtocolBadge.create(parent, {
        text: "SS",
        tooltip: "Superset",
      });

      expect(badge.getAttribute("title")).toBe("Superset");
    });

    it("applies dynamic color with auto contrast text", () => {
      const parent = createObsidianContainer();

      const badge = ProtocolBadge.create(parent, {
        text: "Custom",
        color: "#ff0000",
      });

      expect(badge.style.backgroundColor).toBe("rgb(255, 0, 0)");
      // White on pure red is 4.0:1 (fails AA), black is 5.25:1
      expect(badge.style.color).toBe("black");
    });

    it("renders translucent colors opaque so the text contrast is predictable", () => {
      const parent = createObsidianContainer();

      const badge = ProtocolBadge.create(parent, {
        text: "Superset",
        color: "rgba(59, 130, 246, 0.7)",
      });

      expect(badge.style.backgroundColor).toBe("rgb(59, 130, 246)");
      expect(badge.style.color).toBe("black");
    });

    it("applies black text for light background", () => {
      const parent = createObsidianContainer();

      const badge = ProtocolBadge.create(parent, {
        text: "Light",
        color: "#ffffff",
      });

      expect(badge.style.color).toBe("black");
    });
  });

  describe("getContrastColor", () => {
    describe("hex colors", () => {
      it("returns white for dark colors", () => {
        expect(ProtocolBadge.getContrastColor("#000000")).toBe(
          "white",
        );
        expect(ProtocolBadge.getContrastColor("#1a1a1a")).toBe(
          "white",
        );
        expect(ProtocolBadge.getContrastColor("#0000ff")).toBe(
          "white",
        );
      });

      it("picks the text color with the higher WCAG contrast for mid-tones", () => {
        // Saturated mid-tones read better with black: red 5.25 vs 4.0,
        // the protocol purple 5.3 vs 3.96
        expect(ProtocolBadge.getContrastColor("#ff0000")).toBe(
          "black",
        );
        expect(ProtocolBadge.getContrastColor("#a855f7")).toBe(
          "black",
        );
        expect(ProtocolBadge.getContrastColor("#7c3aed")).toBe(
          "white",
        );
      });

      it("returns black for light colors", () => {
        expect(ProtocolBadge.getContrastColor("#ffffff")).toBe(
          "black",
        );
        expect(ProtocolBadge.getContrastColor("#ffff00")).toBe(
          "black",
        );
        expect(ProtocolBadge.getContrastColor("#00ff00")).toBe(
          "black",
        );
        expect(ProtocolBadge.getContrastColor("#e0e0e0")).toBe(
          "black",
        );
      });

      it("handles hex without # prefix", () => {
        expect(ProtocolBadge.getContrastColor("000000")).toBe(
          "white",
        );
        expect(ProtocolBadge.getContrastColor("ffffff")).toBe(
          "black",
        );
      });
    });

    describe("rgba colors", () => {
      it("returns white for dark rgba colors", () => {
        expect(
          ProtocolBadge.getContrastColor("rgba(0, 0, 0, 1)"),
        ).toBe("white");
        expect(ProtocolBadge.getContrastColor("rgb(0, 0, 255)")).toBe(
          "white",
        );
      });

      it("returns black for light rgba colors", () => {
        expect(
          ProtocolBadge.getContrastColor("rgba(255, 255, 255, 1)"),
        ).toBe("black");
        expect(
          ProtocolBadge.getContrastColor("rgba(255, 255, 0, 0.9)"),
        ).toBe("black");
        expect(ProtocolBadge.getContrastColor("rgb(0, 255, 0)")).toBe(
          "black",
        );
      });

      it("returns white as fallback for invalid format", () => {
        expect(ProtocolBadge.getContrastColor("invalid")).toBe(
          "white",
        );
      });

      it("returns white as fallback for malformed rgba", () => {
        // Starts with rgba but doesn't match the expected pattern
        expect(ProtocolBadge.getContrastColor("rgba(invalid)")).toBe(
          "white",
        );
        expect(ProtocolBadge.getContrastColor("rgb()")).toBe("white");
        expect(
          ProtocolBadge.getContrastColor("rgba(abc, def, ghi, 1)"),
        ).toBe("white");
      });
    });
  });
});
