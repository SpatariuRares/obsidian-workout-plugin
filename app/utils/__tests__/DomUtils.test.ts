/**
 * @jest-environment jsdom
 */
import { DomUtils } from "@app/utils/DomUtils";

describe("DomUtils", () => {
  describe("setCssProps", () => {
    let element: HTMLDivElement;

    beforeEach(() => {
      element = document.createElement("div");
    });

    describe("single property", () => {
      it("should set a single CSS property", () => {
        DomUtils.setCssProps(element, { color: "red" });
        expect(element.style.color).toBe("red");
      });

      it("should set width property", () => {
        DomUtils.setCssProps(element, { width: "100px" });
        expect(element.style.width).toBe("100px");
      });

      it("should set height property", () => {
        DomUtils.setCssProps(element, { height: "50px" });
        expect(element.style.height).toBe("50px");
      });

      it("should set background color", () => {
        DomUtils.setCssProps(element, { backgroundColor: "blue" });
        expect(element.style.backgroundColor).toBe("blue");
      });

      it("should set display property", () => {
        DomUtils.setCssProps(element, { display: "flex" });
        expect(element.style.display).toBe("flex");
      });
    });

    describe("multiple properties", () => {
      it("should set multiple CSS properties at once", () => {
        DomUtils.setCssProps(element, {
          color: "red",
          backgroundColor: "blue",
          fontSize: "14px",
        });

        expect(element.style.color).toBe("red");
        expect(element.style.backgroundColor).toBe("blue");
        expect(element.style.fontSize).toBe("14px");
      });

      it("should set layout properties together", () => {
        DomUtils.setCssProps(element, {
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
        });

        expect(element.style.display).toBe("flex");
        expect(element.style.flexDirection).toBe("column");
        expect(element.style.justifyContent).toBe("center");
        expect(element.style.alignItems).toBe("center");
      });

      it("should set positioning properties together", () => {
        DomUtils.setCssProps(element, {
          position: "absolute",
          top: "10px",
          left: "20px",
          right: "30px",
          bottom: "40px",
        });

        expect(element.style.position).toBe("absolute");
        expect(element.style.top).toBe("10px");
        expect(element.style.left).toBe("20px");
        expect(element.style.right).toBe("30px");
        expect(element.style.bottom).toBe("40px");
      });

      it("should set box model properties together", () => {
        DomUtils.setCssProps(element, {
          margin: "10px",
          padding: "5px",
          border: "1px solid black",
        });

        expect(element.style.margin).toBe("10px");
        expect(element.style.padding).toBe("5px");
        expect(element.style.border).toBe("1px solid black");
      });
    });

    describe("edge cases", () => {
      it("should handle empty props object", () => {
        const originalStyle = element.style.cssText;
        DomUtils.setCssProps(element, {});
        expect(element.style.cssText).toBe(originalStyle);
      });

      it("should overwrite existing styles", () => {
        element.style.color = "red";
        DomUtils.setCssProps(element, { color: "blue" });
        expect(element.style.color).toBe("blue");
      });

      it("should preserve existing styles not being overwritten", () => {
        element.style.color = "red";
        element.style.fontSize = "12px";
        DomUtils.setCssProps(element, { backgroundColor: "blue" });

        expect(element.style.color).toBe("red");
        expect(element.style.fontSize).toBe("12px");
        expect(element.style.backgroundColor).toBe("blue");
      });

      it("should handle empty string values", () => {
        element.style.color = "red";
        DomUtils.setCssProps(element, { color: "" });
        expect(element.style.color).toBe("");
      });

      it("should handle numeric-like string values", () => {
        DomUtils.setCssProps(element, { zIndex: "999" });
        expect(element.style.zIndex).toBe("999");
      });

      it("should handle opacity values", () => {
        DomUtils.setCssProps(element, { opacity: "0.5" });
        expect(element.style.opacity).toBe("0.5");
      });
    });

    describe("Record<string, string> input type", () => {
      it("should work with plain object notation", () => {
        const props: Record<string, string> = {
          color: "green",
          padding: "10px",
        };
        DomUtils.setCssProps(element, props);

        expect(element.style.color).toBe("green");
        expect(element.style.padding).toBe("10px");
      });
    });

    describe("different element types", () => {
      it("should work with span elements", () => {
        const span = document.createElement("span");
        DomUtils.setCssProps(span, { fontWeight: "bold" });
        expect(span.style.fontWeight).toBe("bold");
      });

      it("should work with button elements", () => {
        const button = document.createElement("button");
        DomUtils.setCssProps(button, { cursor: "pointer" });
        expect(button.style.cursor).toBe("pointer");
      });

      it("should work with input elements", () => {
        const input = document.createElement("input");
        DomUtils.setCssProps(input, { width: "200px", borderStyle: "none" });
        expect(input.style.width).toBe("200px");
        expect(input.style.borderStyle).toBe("none");
      });

      it("should work with canvas elements", () => {
        const canvas = document.createElement("canvas");
        DomUtils.setCssProps(canvas, { maxWidth: "100%" });
        expect(canvas.style.maxWidth).toBe("100%");
      });
    });

    describe("CSS transform and transition", () => {
      it("should set transform property", () => {
        DomUtils.setCssProps(element, { transform: "translateX(50px)" });
        expect(element.style.transform).toBe("translateX(50px)");
      });

      it("should set transition property", () => {
        DomUtils.setCssProps(element, { transition: "all 0.3s ease" });
        expect(element.style.transition).toBe("all 0.3s ease");
      });
    });

    describe("CSS custom properties (variables)", () => {
      it("should handle CSS variable-like values without throwing", () => {
        // Note: jsdom doesn't fully support CSS variables, so the value may not persist
        // This test verifies the function executes without error
        expect(() => {
          DomUtils.setCssProps(element, { color: "var(--text-normal)" });
        }).not.toThrow();
      });
    });

    describe("chained calls", () => {
      it("should accumulate styles from multiple calls", () => {
        DomUtils.setCssProps(element, { color: "red" });
        DomUtils.setCssProps(element, { backgroundColor: "blue" });
        DomUtils.setCssProps(element, { fontSize: "14px" });

        expect(element.style.color).toBe("red");
        expect(element.style.backgroundColor).toBe("blue");
        expect(element.style.fontSize).toBe("14px");
      });

      it("should allow later calls to override earlier values", () => {
        DomUtils.setCssProps(element, { color: "red" });
        DomUtils.setCssProps(element, { color: "blue" });
        expect(element.style.color).toBe("blue");
      });
    });
  });
});
