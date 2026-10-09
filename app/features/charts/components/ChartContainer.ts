import { Canvas } from "@app/components/atoms";

/**
 * UI component for creating chart containers and canvas elements.
 * Pure UI logic with no business dependencies.
 */
export class ChartContainer {
  /**
   * Creates a container element for the chart with proper styling.
   * @param parent - The parent HTML element to append the chart container to
   * @param className - Optional CSS class name
   * @returns The created chart container element
   */
  static create(
    parent: HTMLElement,
    className = "workout-charts-container",
  ): HTMLElement {
    return parent.createEl("div", { cls: className });
  }

  /**
   * Applies the `height` code block param: a number or digits are pixels,
   * a value with a CSS unit is used as is. Invalid values keep the default
   * aspect ratio.
   * @returns true if a fixed height was applied
   */
  static applyHeight(
    container: HTMLElement,
    height?: string | number,
  ): boolean {
    const raw = String(height ?? "").trim();
    const value = /^\d+(\.\d+)?$/.test(raw)
      ? // eslint-disable-next-line i18next/no-literal-string -- CSS unit
        `${raw}px`
      : /^\d+(\.\d+)?(px|em|rem|vh|%)$/.test(raw)
        ? raw
        : "";
    if (!value || parseFloat(value) <= 0) {
      return false;
    }
    container.addClass("has-fixed-height");
    container.style.setProperty("--workout-chart-height", value);
    return true;
  }

  /**
   * Creates a canvas element for the chart rendering.
   * @param container - The container element to append the canvas to
   * @param className - Optional CSS class name
   * @returns The created canvas element
   */
  static createCanvas(
    container: HTMLElement,
    className = "workout-charts-canvas",
  ): HTMLCanvasElement {
    return Canvas.create(container, { className });
  }
}
