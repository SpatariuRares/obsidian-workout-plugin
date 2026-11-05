/** One column of a card table */
export interface CardTableColumn<Row> {
  /** The header, and the label over the value on a phone card */
  label: string;
  /** Class of each cell of the column */
  className?: string;
  /** Fills a cell with the row's value */
  render(cell: HTMLTableCellElement, row: Row): void;
}

export interface CardTableProps<Row> {
  /** The table's own class, beside `workout-card-table` */
  className?: string;
  /** The first column is each card's title, the others its values */
  columns: CardTableColumn<Row>[];
  rows: Row[];
}

/**
 * CardTable Molecule
 * A table whose rows are "a title + a few values" (dashboard widgets). On a
 * desk it is a plain table; on phones each row becomes a card, the first
 * cell as its title and every other value under its column name. The name
 * comes from the same label as the header (`data-label`), so the two never
 * drift apart.
 */
export class CardTable {
  static create<Row>(
    parent: HTMLElement,
    props: CardTableProps<Row>,
  ): HTMLTableElement {
    const container = parent.createDiv({ cls: "workout-card-table-container" });
    const table = container.createEl("table", {
      cls: ["workout-card-table", props.className ?? ""].join(" ").trim(),
    });

    const headerRow = table.createEl("thead").createEl("tr");
    for (const column of props.columns) {
      headerRow.createEl("th", { text: column.label });
    }

    const tbody = table.createEl("tbody");
    for (const row of props.rows) {
      const tr = tbody.createEl("tr");
      props.columns.forEach((column, index) => {
        const cell = tr.createEl("td", {
          cls: column.className,
          // The title cell needs no label: it heads the card
          attr: index === 0 ? undefined : { "data-label": column.label },
        });
        column.render(cell, row);
      });
    }
    return table;
  }
}
