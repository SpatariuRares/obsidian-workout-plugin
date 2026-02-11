import { mapColumnIdentifiersToLabels } from "@app/constants";

/**
 * UI component for rendering table headers.
 * Pure UI logic with no business dependencies.
 */
export class TableHeader {
  /**
   * Creates and populates a table header row
   * @param table - The table element to add the header to
   * @param headers - Array of technical header identifiers (e.g., "Wgt", "Rep")
   * @returns The thead element
   */
  static render(table: HTMLElement, headers: string[]): HTMLElement {
    const thead = table.createEl("thead");
    const headerRow = thead.createEl("tr");

    // Map technical identifiers to translated labels for display
    const translatedHeaders = mapColumnIdentifiersToLabels(headers);

    translatedHeaders.forEach((header) => {
      headerRow.createEl("th", { text: header });
    });

    return thead;
  }
}
