export type InfoBannerType = "info" | "warning" | "success";

/**
 * Small molecule that renders contextual info/warning/success banners.
 * Keeps styling consistent while allowing callers to pass any message.
 */
export class InfoBanner {
	static render(
		container: HTMLElement,
		message: string,
		type: InfoBannerType = "info"
	): HTMLElement {
		const banner = container.createEl("div", {
			cls: `workout-charts-info workout-charts-info-${type}`,
		});
		banner.appendText(message);
		return banner;
	}
}

