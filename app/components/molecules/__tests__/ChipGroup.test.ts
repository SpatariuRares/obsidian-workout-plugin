/** @jest-environment jsdom */

import { ChipGroup } from "@app/components/molecules/ChipGroup";
import { createObsidianContainer } from "@app/components/__tests__/obsidianDomMocks";

const options = [
  { id: "week", label: "Week" },
  { id: "month", label: "Month" },
  { id: "year", label: "Year" },
];

const pressed = (group: HTMLElement) =>
  Array.from(group.querySelectorAll("button")).map((b) => b.getAttribute("aria-pressed"));

describe("ChipGroup molecule", () => {
  it("is a group of chips labelled by its visible label", () => {
    const { container: group } = ChipGroup.create(createObsidianContainer(), {
      label: "Period",
      options,
      selected: "week",
      onPick: () => {},
      className: "workout-heatmap-period",
    });
    const label = group.querySelector(".workout-chip-group-label")!;
    const chips = group.querySelector(".workout-chip-group-chips")!;

    expect(group.classList).toContain("workout-heatmap-period");
    expect(label.textContent).toBe("Period");
    expect(chips.getAttribute("role")).toBe("group");
    expect(chips.getAttribute("aria-labelledby")).toBe(label.id);
    expect(pressed(group)).toEqual(["true", "false", "false"]);
  });

  it("presses the picked chip at once, without a redraw", () => {
    const onPick = jest.fn();
    const { container: group } = ChipGroup.create(createObsidianContainer(), {
      label: "Period",
      options,
      selected: "week",
      onPick,
    });
    const chips = group.querySelectorAll<HTMLButtonElement>("button");

    chips[2].click();
    chips[2].click();

    expect(onPick).toHaveBeenCalledTimes(1);
    expect(onPick).toHaveBeenCalledWith("year");
    expect(pressed(group)).toEqual(["false", "false", "true"]);
    expect(chips[2].classList).toContain("workout-chip-selected");
  });
});

describe("ChipGroup handle", () => {
  it("reads the picked chip", () => {
    const { container, value } = ChipGroup.create(createObsidianContainer(), {
      label: "Period",
      options,
      selected: "month",
    });

    expect(value()).toBe("month");
    container.querySelectorAll<HTMLButtonElement>("button")[2].click();
    expect(value()).toBe("year");
  });

  it("picks from code as a click would, ignoring ids it doesn't offer", () => {
    const onPick = jest.fn();
    const { container, value, select } = ChipGroup.create(createObsidianContainer(), {
      label: "Period",
      options,
      selected: "week",
      onPick,
    });

    expect(select("year")).toBe(true);
    expect(select("year")).toBe(true);
    expect(select("decade")).toBe(false);

    expect(value()).toBe("year");
    expect(onPick).toHaveBeenCalledTimes(1);
    expect(onPick).toHaveBeenCalledWith("year");
    expect(pressed(container)).toEqual(["false", "false", "true"]);
  });

  it("swaps its options, keeping the pick when still offered", () => {
    const onPick = jest.fn();
    const group = ChipGroup.create(createObsidianContainer(), {
      label: "Data",
      options,
      selected: "month",
      onPick,
    });

    group.setOptions([
      { id: "day", label: "Day" },
      { id: "month", label: "Month" },
    ]);
    expect(group.value()).toBe("month");
    expect(pressed(group.container)).toEqual(["false", "true"]);

    group.setOptions([{ id: "day", label: "Day" }, { id: "hour", label: "Hour" }]);
    expect(group.value()).toBe("day");

    group.setOptions(options, "year");
    expect(group.value()).toBe("year");
    expect(pressed(group.container)).toEqual(["false", "false", "true"]);
    expect(onPick).not.toHaveBeenCalled();

    group.container.querySelectorAll<HTMLButtonElement>("button")[0].click();
    expect(group.value()).toBe("week");
    expect(onPick).toHaveBeenCalledWith("week");
  });
});

describe("ChipGroup labelHidden", () => {
  it("keeps the label for screen readers only", () => {
    const { container: group } = ChipGroup.create(createObsidianContainer(), {
      label: "Period",
      options,
      selected: "week",
      onPick: () => {},
      labelHidden: true,
    });
    const label = group.querySelector(".workout-chip-group-label")!;

    expect(label.classList).toContain("workout-visually-hidden");
    expect(group.querySelector('[role="group"]')!.getAttribute("aria-labelledby")).toBe(label.id);
  });
});

describe("ChipGroup.createMulti", () => {
  it("presses and releases chips independently, reading them in order", () => {
    const { container, picked } = ChipGroup.createMulti(createObsidianContainer(), {
      label: "Periods shown",
      options,
      selected: ["year", "week"],
    });
    const chips = container.querySelectorAll<HTMLButtonElement>("button");

    expect(picked()).toEqual(["week", "year"]);
    chips[0].click();
    chips[1].click();

    expect(picked()).toEqual(["month", "year"]);
    expect(pressed(container)).toEqual(["false", "true", "true"]);
  });

  it("shows an error under the chips until the next pick", () => {
    const { container, setError } = ChipGroup.createMulti(createObsidianContainer(), {
      label: "Periods shown",
      options,
      selected: [],
    });
    const error = container.querySelector<HTMLElement>(".workout-chip-group-error")!;
    const group = container.querySelector('[role="group"]')!;

    setError("Pick at least one");
    expect(error.hidden).toBe(false);
    expect(group.getAttribute("aria-describedby")).toBe(error.id);

    container.querySelector<HTMLButtonElement>("button")!.click();
    expect(error.hidden).toBe(true);
    expect(group.hasAttribute("aria-describedby")).toBe(false);
  });
});
