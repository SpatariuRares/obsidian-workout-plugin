/** @jest-environment jsdom */

import { CardTable } from "@app/components/molecules/CardTable";
import { createObsidianContainer } from "@app/components/__tests__/obsidianDomMocks";

interface Lift {
  name: string;
  sets: number;
  kg: number;
}

const LIFTS: Lift[] = [
  { name: "Squat", sets: 5, kg: 100 },
  { name: "Bench", sets: 3, kg: 80 },
];

const draw = () =>
  CardTable.create<Lift>(createObsidianContainer(), {
    className: "workout-lifts-table",
    rows: LIFTS,
    columns: [
      {
        label: "Exercise",
        className: "workout-lifts-name",
        render: (cell, lift) => cell.createSpan({ text: lift.name }),
      },
      { label: "Sets", render: (cell, lift) => cell.setText(String(lift.sets)) },
      { label: "Weight", render: (cell, lift) => cell.setText(`${lift.kg} kg`) },
    ],
  });

describe("CardTable molecule", () => {
  it("is a card table with the caller's class, in a container that scrolls sideways", () => {
    const table = draw();

    expect(table.classList.contains("workout-card-table")).toBe(true);
    expect(table.classList.contains("workout-lifts-table")).toBe(true);
    expect(table.parentElement?.classList.contains("workout-card-table-container")).toBe(true);
  });

  it("heads each column with its label, one row per item in order", () => {
    const table = draw();

    expect([...table.querySelectorAll("th")].map((th) => th.textContent)).toEqual([
      "Exercise",
      "Sets",
      "Weight",
    ]);
    expect(
      [...table.querySelectorAll("tbody tr")].map((tr) =>
        [...tr.querySelectorAll("td")].map((td) => td.textContent),
      ),
    ).toEqual([
      ["Squat", "5", "100 kg"],
      ["Bench", "3", "80 kg"],
    ]);
  });

  it("labels every value cell with its column for the phone card, the title cell not", () => {
    const [first, ...values] = draw().querySelectorAll("tbody tr:first-child td");

    expect(first.hasAttribute("data-label")).toBe(false);
    expect(values.map((td) => td.getAttribute("data-label"))).toEqual(["Sets", "Weight"]);
  });

  it("gives a cell its column's class", () => {
    const cells = draw().querySelectorAll(".workout-lifts-name");

    expect([...cells].map((td) => td.tagName)).toEqual(["TD", "TD"]);
  });
});
