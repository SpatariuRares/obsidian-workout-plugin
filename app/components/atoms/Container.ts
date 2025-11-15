/**
 * Container Atom
 * Basic div container - indivisible UI primitive
 */

export interface ContainerProps {
	className?: string;
	id?: string;
}

/**
 * Creates a basic container (div) element
 * This is an atom - it has no dependencies on other UI components
 */
export class Container {
	/**
	 * Create a div container
	 * @param parent - Parent HTML element
	 * @param props - Container properties
	 * @returns The created div element
	 */
	static create(
		parent: HTMLElement,
		props?: ContainerProps
	): HTMLElement {
		return parent.createEl("div", {
			cls: props?.className || "container",
			attr: props?.id ? { id: props.id } : undefined,
		});
	}
}
