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
   * @param classes - Each column's cell class, the same as its cells in the rows
   * @returns The thead element
   */
  static render(table: HTMLElement, headers: string[], classes: string[] = []): HTMLElement {
    const thead = table.createEl("thead");
    const headerRow = thead.createEl("tr");

    // Map technical identifiers to translated labels for display
    const translatedHeaders = mapColumnIdentifiersToLabels(headers);

    translatedHeaders.forEach((header, index) => {
      headerRow.createEl("th", { cls: classes[index], text: header });
    });

    return thead;
  }
}
