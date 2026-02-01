/**
 * ProtocolBadge Atom
 * Badge for displaying workout protocols with dynamic color support - indivisible UI primitive
 * Centralizes contrast color calculation for accessibility
 */

export interface ProtocolBadgeProps {
	text: string;
	color?: string;
	tooltip?: string;
	className?: string;
}

/**
 * Creates protocol badge elements with dynamic coloring
 * This is an atom - it has no dependencies on other UI components
 */
export class ProtocolBadge {
	/**
	 * Create a protocol badge element
	 * @param parent - Parent HTML element
	 * @param props - Badge properties
	 * @returns The created span element
	 */
	static create(parent: HTMLElement, props: ProtocolBadgeProps): HTMLSpanElement {
		const badge = parent.createEl("span", {
			text: props.text,
			cls: props.className || "workout-protocol-badge",
		});

		if (props.tooltip) {
			badge.setAttribute("title", props.tooltip);
		}

		if (props.color) {
			badge.style.backgroundColor = props.color;
			badge.style.color = this.getContrastColor(props.color);
		}

		return badge;
	}

	/**
	 * Calculates whether black or white text should be used based on background color.
	 * Uses relative luminance formula for accessibility.
	 * Supports both hex colors (#ff0000) and rgba colors (rgba(255, 0, 0, 1))
	 * @param color - Color string (hex or rgba format)
	 * @returns "black" or "white"
	 */
	static getContrastColor(color: string): string {
		let r: number, g: number, b: number;

		if (color.startsWith("rgba") || color.startsWith("rgb")) {
			// Parse rgba/rgb format: rgba(255, 0, 0, 1) or rgb(255, 0, 0)
			const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
			if (!match) {
				return "white"; // Default fallback
			}
			r = parseInt(match[1], 10);
			g = parseInt(match[2], 10);
			b = parseInt(match[3], 10);
		} else {
			// Parse hex format: #ff0000 or ff0000
			const hex = color.replace("#", "");
			r = parseInt(hex.substring(0, 2), 16);
			g = parseInt(hex.substring(2, 4), 16);
			b = parseInt(hex.substring(4, 6), 16);
		}

		// Calculate relative luminance
		const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

		// Return black for light backgrounds, white for dark backgrounds
		return luminance > 0.5 ? "black" : "white";
	}
}
