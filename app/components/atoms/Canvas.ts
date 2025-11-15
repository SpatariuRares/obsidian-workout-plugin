/**
 * Canvas Atom
 * Basic canvas element for charts - indivisible UI primitive
 */

export interface CanvasProps {
	className?: string;
	width?: number;
	height?: number;
}

/**
 * Creates canvas elements for chart rendering
 * This is an atom - it has no dependencies on other UI components
 */
export class Canvas {
	/**
	 * Create a canvas element
	 * @param parent - Parent HTML element
	 * @param props - Canvas properties
	 * @returns The created canvas element
	 */
	static create(
		parent: HTMLElement,
		props?: CanvasProps
	): HTMLCanvasElement {
		const canvas = parent.createEl("canvas", {
			cls: props?.className || "canvas",
		});

		if (props?.width) canvas.width = props.width;
		if (props?.height) canvas.height = props.height;

		return canvas;
	}
}
