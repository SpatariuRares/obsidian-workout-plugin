/**
 * UI component for rendering table headers.
 * Pure UI logic with no business dependencies.
 */
export class TableHeader {
  /**
   * Creates and populates a table header row
   * @param table - The table element to add the header to
   * @param headers - Array of header labels
   * @returns The thead element
   */
  static render(table: HTMLElement, headers: string[]): HTMLElement {
    const thead = table.createEl("thead");
    const headerRow = thead.createEl("tr");

    headers.forEach((header) => {
      headerRow.createEl("th", { text: header });
    });

    return thead;
  }
}
