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
		className = "workout-charts-container"
	): HTMLElement {
		return parent.createEl("div", { cls: className });
	}

	/**
	 * Creates a canvas element for the chart rendering.
	 * @param container - The container element to append the canvas to
	 * @param className - Optional CSS class name
	 * @returns The created canvas element
	 */
	static createCanvas(
		container: HTMLElement,
		className = "workout-charts-canvas"
	): HTMLCanvasElement {
		return Canvas.create(container, { className });
	}

	/**
	 * Creates both container and canvas in one call
	 * @param parent - The parent HTML element
	 * @returns Object with container and canvas elements
	 */
	static createWithCanvas(parent: HTMLElement): {
		container: HTMLElement;
		canvas: HTMLCanvasElement;
	} {
		const container = this.create(parent);
		const canvas = this.createCanvas(container);
		return { container, canvas };
	}
}
