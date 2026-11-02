import {
  autoPack,
  columnsFor,
  fitColumns,
  gridProblems,
  moveTo,
  placeFirstFree,
  Placement,
  readingOrder,
  resizeTo,
} from "@app/features/dashboard/layout/gridLayout";

const at = (
  id: string,
  column: number,
  row: number,
  width = 1,
  height = 1,
): Placement => ({ id, column, row, width, height });

const minOne = () => 1;

describe("columnsFor", () => {
  it("fits as many cells of the minimum width as the width allows, gaps included", () => {
    // 3 × 280 + 2 × 16 = 872
    expect(columnsFor(872, 280, 16)).toBe(3);
    expect(columnsFor(871, 280, 16)).toBe(2);
  });

  it("never gives fewer than one column", () => {
    expect(columnsFor(100, 280, 16)).toBe(1);
    expect(columnsFor(0, 280, 16)).toBe(1);
  });
});

describe("gridProblems", () => {
  it("accepts widgets that fit, side by side and below each other", () => {
    expect(
      gridProblems(
        [at("a", 1, 1, 2), at("b", 3, 1), at("c", 1, 2, 3)],
        3,
        minOne,
      ),
    ).toEqual([]);
  });

  it("reports a widget that goes past the last column", () => {
    expect(gridProblems([at("a", 3, 1, 2)], 3, minOne)).toEqual([
      { kind: "outside", id: "a" },
    ]);
  });

  it("reports a widget narrower than its minimum", () => {
    expect(gridProblems([at("a", 1, 1, 1)], 3, () => 2)).toEqual([
      { kind: "narrow", id: "a", min: 2 },
    ]);
  });

  it("reports two widgets sharing a cell once", () => {
    expect(
      gridProblems([at("a", 1, 1, 2, 2), at("b", 2, 2)], 3, minOne),
    ).toEqual([{ kind: "overlap", id: "b", other: "a" }]);
  });
});

describe("readingOrder", () => {
  it("goes top to bottom, then left to right", () => {
    expect(
      readingOrder([at("c", 2, 2), at("b", 1, 2), at("a", 3, 1)]).map(
        (p) => p.id,
      ),
    ).toEqual(["a", "b", "c"]);
  });
});

describe("autoPack", () => {
  it("puts each widget in the first free spot, in order", () => {
    expect(
      autoPack(
        [
          { id: "a", width: 2, height: 1 },
          { id: "b", width: 1, height: 2 },
          { id: "c", width: 2, height: 1 },
        ],
        3,
      ),
    ).toEqual([
      at("a", 1, 1, 2),
      at("b", 3, 1, 1, 2),
      at("c", 1, 2, 2),
    ]);
  });

  it("narrows a widget wider than the grid to the grid", () => {
    expect(autoPack([{ id: "a", width: 3, height: 1 }], 2)).toEqual([
      at("a", 1, 1, 2),
    ]);
  });
});

describe("fitColumns", () => {
  const saved = [at("a", 1, 1, 2), at("b", 3, 1), at("c", 1, 2)];

  it("keeps the layout when the columns are enough", () => {
    expect(fitColumns(saved, 3)).toEqual(saved);
    expect(fitColumns(saved, 4)).toEqual(saved);
  });

  it("packs the widgets again, in reading order, into fewer columns", () => {
    expect(fitColumns(saved, 2)).toEqual([
      at("a", 1, 1, 2),
      at("b", 1, 2),
      at("c", 2, 2),
    ]);
  });

  it("stacks them in one column", () => {
    expect(
      fitColumns(saved, 1).map((p) => [
        p.id,
        p.column,
        p.row,
        p.width,
      ]),
    ).toEqual([
      ["a", 1, 1, 1],
      ["b", 1, 2, 1],
      ["c", 1, 3, 1],
    ]);
  });
});

describe("moveTo", () => {
  const grid = [at("a", 1, 1, 2), at("b", 3, 1)];

  it("moves a widget to free cells", () => {
    expect(moveTo(grid, "b", 1, 2, 3)).toEqual([
      at("a", 1, 1, 2),
      at("b", 1, 2),
    ]);
  });

  it("refuses a spot taken by another widget", () => {
    expect(moveTo(grid, "b", 2, 1, 3)).toBeNull();
  });

  it("refuses a spot past the last column or above the first row", () => {
    expect(moveTo(grid, "a", 3, 1, 3)).toBeNull();
    expect(moveTo(grid, "b", 3, 0, 3)).toBeNull();
  });

  it("places a widget that wasn't on the grid", () => {
    expect(
      moveTo(grid, "c", 1, 2, 3, { width: 2, height: 1 }),
    ).toEqual([...grid, at("c", 1, 2, 2)]);
  });
});

describe("resizeTo", () => {
  const grid = [at("a", 1, 1), at("b", 3, 1)];

  it("makes a widget wider and taller into free cells", () => {
    expect(resizeTo(grid, "a", 2, 2, 3, minOne)).toEqual([
      at("a", 1, 1, 2, 2),
      at("b", 3, 1),
    ]);
  });

  it("refuses to cover another widget, leave the grid or go below the minimum", () => {
    expect(resizeTo(grid, "a", 3, 1, 3, minOne)).toBeNull();
    expect(resizeTo(grid, "b", 2, 1, 3, minOne)).toBeNull();
    expect(resizeTo(grid, "a", 1, 1, 3, () => 2)).toBeNull();
    expect(resizeTo(grid, "a", 1, 0, 3, minOne)).toBeNull();
  });
});

describe("placeFirstFree", () => {
  it("adds a widget in the first free spot that fits, keeping the others", () => {
    const grid = [at("a", 1, 1), at("b", 3, 1)];
    expect(
      placeFirstFree(grid, { id: "c", width: 2, height: 1 }, 3),
    ).toEqual([...grid, at("c", 1, 2, 2)]);
  });
});
