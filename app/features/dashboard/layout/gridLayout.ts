/*
 * The rules of a dashboard grid ("inventory" layout): widgets are rectangles
 * of cells that never overlap, never leave the columns and are never
 * narrower than their minimum. Rows grow with their content, so a height is
 * only the number of rows a widget spans. Pure: no DOM, no settings.
 */

import type { CellValue } from "@app/services/codeblocks/CodeBlockSchema";

/** Where a widget sits, in 1-based cells (a block's `grid.<widget>` value) */
export type GridCell = CellValue;

export interface Placement extends GridCell {
  id: string;
}

export type GridProblem =
  | { kind: "outside"; id: string }
  | { kind: "narrow"; id: string; min: number }
  | { kind: "overlap"; id: string; other: string };

/** How many cells of `cellMinWidth` fit in `width`, with `gap` between them */
export function columnsFor(
  width: number,
  cellMinWidth: number,
  gap: number,
): number {
  return Math.max(
    1,
    Math.floor((width + gap) / (cellMinWidth + gap)),
  );
}

function overlaps(a: GridCell, b: GridCell): boolean {
  return (
    a.column < b.column + b.width &&
    b.column < a.column + a.width &&
    a.row < b.row + b.height &&
    b.row < a.row + a.height
  );
}

function inside(cell: GridCell, columns: number): boolean {
  return (
    cell.column >= 1 &&
    cell.row >= 1 &&
    cell.width >= 1 &&
    cell.height >= 1 &&
    cell.column + cell.width - 1 <= columns
  );
}

/** What is wrong with a grid, one problem per widget at most */
export function gridProblems(
  placements: Placement[],
  columns: number,
  minColumns: (id: string) => number,
): GridProblem[] {
  const problems: GridProblem[] = [];
  placements.forEach((placement, index) => {
    if (!inside(placement, columns)) {
      problems.push({ kind: "outside", id: placement.id });
      return;
    }
    const min = Math.min(minColumns(placement.id), columns);
    if (placement.width < min) {
      problems.push({ kind: "narrow", id: placement.id, min });
      return;
    }
    const other = placements
      .slice(0, index)
      .find((earlier) => overlaps(earlier, placement));
    if (other) {
      problems.push({
        kind: "overlap",
        id: placement.id,
        other: other.id,
      });
    }
  });
  return problems;
}

/** Top to bottom, then left to right */
export function readingOrder(placements: Placement[]): Placement[] {
  return [...placements].sort(
    (a, b) => a.row - b.row || a.column - b.column,
  );
}

function firstFreeSpot(
  taken: GridCell[],
  width: number,
  height: number,
  columns: number,
): { column: number; row: number } {
  for (let row = 1; ; row++) {
    for (let column = 1; column + width - 1 <= columns; column++) {
      const cell = { column, row, width, height };
      if (!taken.some((other) => overlaps(other, cell)))
        return { column, row };
    }
  }
}

/**
 * Each widget, in order, in the first free spot that fits (scanning rows,
 * then columns); a widget wider than the grid is narrowed to it
 */
export function autoPack(
  items: { id: string; width: number; height: number }[],
  columns: number,
): Placement[] {
  return items.reduce<Placement[]>(
    (placed, item) => placeFirstFree(placed, item, columns),
    [],
  );
}

/** Adds a widget in the first free spot that fits, after the others */
export function placeFirstFree(
  placements: Placement[],
  item: { id: string; width: number; height: number },
  columns: number,
): Placement[] {
  const width = Math.min(item.width, columns);
  const spot = firstFreeSpot(placements, width, item.height, columns);
  return [
    ...placements,
    { id: item.id, ...spot, width, height: item.height },
  ];
}

/**
 * The layout to draw in `columns`: as saved when every widget fits,
 * otherwise packed again in reading order (a narrower pane, a phone)
 */
export function fitColumns(
  placements: Placement[],
  columns: number,
): Placement[] {
  if (placements.every((placement) => inside(placement, columns))) {
    return placements;
  }
  return autoPack(readingOrder(placements), columns);
}

/** The grid with one widget changed, or null when it doesn't fit there */
function replaced(
  placements: Placement[],
  next: Placement,
  columns: number,
): Placement[] | null {
  const others = placements.filter(
    (placement) => placement.id !== next.id,
  );
  if (
    !inside(next, columns) ||
    others.some((other) => overlaps(other, next))
  ) {
    return null;
  }
  const index = placements.findIndex(
    (placement) => placement.id === next.id,
  );
  return index === -1
    ? [...placements, next]
    : placements.map((placement, i) =>
        i === index ? next : placement,
      );
}

/**
 * Moves a widget so its top-left cell is (`column`, `row`). A widget not on
 * the grid yet is added with `size`. Null when the spot isn't free.
 */
export function moveTo(
  placements: Placement[],
  id: string,
  column: number,
  row: number,
  columns: number,
  size: { width: number; height: number } = { width: 1, height: 1 },
): Placement[] | null {
  const current = placements.find((placement) => placement.id === id);
  return replaced(
    placements,
    {
      id,
      column,
      row,
      width: current?.width ?? size.width,
      height: current?.height ?? size.height,
    },
    columns,
  );
}

/** Resizes a widget from its top-left cell; null when it doesn't fit */
export function resizeTo(
  placements: Placement[],
  id: string,
  width: number,
  height: number,
  columns: number,
  minColumns: (id: string) => number,
): Placement[] | null {
  const current = placements.find((placement) => placement.id === id);
  if (!current || width < Math.min(minColumns(id), columns))
    return null;
  return replaced(placements, { ...current, width, height }, columns);
}
