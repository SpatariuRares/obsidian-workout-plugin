/**
 * Icon Atom
 * Basic icon/emoji display - indivisible UI primitive
 */

export interface IconProps {
	name: string;
	className?: string;
	title?: string;
}

/**
 * Creates icon elements (emoji or text icons)
 * This is an atom - it has no dependencies on other UI components
 */
export class Icon {
	/**
	 * Create an icon element
	 * @param parent - Parent HTML element
	 * @param props - Icon properties
	 * @returns The created icon element
	 */
	static create(
		parent: HTMLElement,
		props: IconProps
	): HTMLSpanElement {
		return parent.createSpan({
			text: props.name,
			cls: props.className || "icon",
			attr: props.title ? { title: props.title } : undefined,
		});
	}
}
