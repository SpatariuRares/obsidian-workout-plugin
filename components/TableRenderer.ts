import { EmbeddedTableParams, TableData } from "./types";

export class TableRenderer {
  static createTableContainer(parent: HTMLElement): HTMLElement {
    const container = parent.createEl("div", {
      cls: "workout-table-container",
    });
    return container;
  }

  static renderTable(
    container: HTMLElement,
    headers: string[],
    rows: any[][],
    params: EmbeddedTableParams,
    logs?: any[], // pass the original log objects
    plugin?: any // pass the plugin for file opening
  ): boolean {
    try {
      const table = container.createEl("table", { cls: "workout-log-table" });

      // Create header
      const thead = table.createEl("thead");
      const headerRow = thead.createEl("tr");

      headers.forEach((header) => {
        const th = headerRow.createEl("th", { text: header });
      });

      // Create body
      const tbody = table.createEl("tbody");

      rows.forEach((row, rowIndex) => {
        const tr = tbody.createEl("tr");

        row.forEach((cell, cellIndex) => {
          const td = tr.createEl("td");

          // Add special classes for specific columns
          if (
            cellIndex === 0 &&
            typeof cell === "string" &&
            cell.includes(":")
          ) {
            td.classList.add("workout-table-date-cell");
          }

          if (cellIndex === 4 && !isNaN(Number(cell))) {
            td.classList.add("workout-table-volume-cell");
          }

          // Render Link column as clickable link
          if (
            cellIndex === headers.length - 1 &&
            logs &&
            logs[rowIndex] &&
            logs[rowIndex].file?.path &&
            logs[rowIndex].file?.basename &&
            plugin
          ) {
            const link = td.createEl("a", {
              text: logs[rowIndex].file.basename,
              href: "#",
            });
            link.addEventListener("click", (e) => {
              e.preventDefault();
              plugin.app.workspace.openLinkText(
                logs[rowIndex].file.path,
                "",
                true
              );
            });
          } else {
            td.textContent = cell;
          }
        });
      });

      // Apply row grouping styling
      this.applyRowGrouping(tbody, rows);

      return true;
    } catch (error) {
      console.error("Error rendering table:", error);
      return false;
    }
  }

  private static applyRowGrouping(tbody: HTMLElement, rows: any[][]): void {
    setTimeout(() => {
      try {
        const tableRows = tbody.querySelectorAll("tr");
        let previousDate: string | null = null;

        tableRows.forEach((row, index) => {
          if (index >= rows.length) return;

          const dateCell = row.querySelector("td");
          if (!dateCell) return;

          const currentDate = this.extractDateFromCell(
            dateCell.textContent || ""
          );
          row.classList.remove("same-day-log", "new-day-log");

          if (previousDate && currentDate && currentDate === previousDate) {
            row.classList.add("same-day-log");
          } else {
            row.classList.add("new-day-log");
          }

          previousDate = currentDate || null;
        });
      } catch (error) {
        console.error("Error applying row grouping:", error);
      }
    }, 100);
  }

  private static extractDateFromCell(cellText: string): string | null {
    if (!cellText) return null;

    // Extract date from format like "10:30 - 05/17"
    const dateMatch = cellText.match(/(\d{2}\/\d{2})/);
    return dateMatch ? dateMatch[1] : null;
  }

  static renderFallbackMessage(
    container: HTMLElement,
    message: string,
    title: string = "Table Error"
  ): void {
    const errorDiv = container.createEl("div", { cls: "workout-table-error" });

    errorDiv.innerHTML = `
      <strong>❌ ${title}:</strong><br>
      ${message}
    `;
  }
}
