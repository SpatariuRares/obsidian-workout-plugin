import type WorkoutChartsPlugin from "../../../main";

export class TableCSVIndicator {
  /**
   * Render CSV mode indicator
   */
  static render(container: HTMLElement, plugin: WorkoutChartsPlugin): void {
    const indicatorDiv = container.createEl("div", {
      cls: "csv-mode-indicator",
    });

    const iconSpan = indicatorDiv.createEl("span", {
      cls: "csv-mode-indicator-icon",
    });
    iconSpan.textContent = "📊";

    const textSpan = indicatorDiv.createEl("span");
    textSpan.textContent = `CSV Mode: Data loaded from ${plugin.settings.csvLogFilePath}`;
  }
}