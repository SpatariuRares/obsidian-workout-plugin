/** @jest-environment jsdom */

import { ProtocolPicker } from "@app/components/molecules/ProtocolPicker";
import { createObsidianContainer } from "@app/components/__tests__/obsidianDomMocks";

const options = [
  { id: "standard", name: "Standard" },
  { id: "warmup", name: "Warm-up" },
  { id: "dropset", name: "Drop set" },
];

describe("ProtocolPicker molecule", () => {
  it("is a group of chips labelled by its visible label", () => {
    const picker = ProtocolPicker.create(createObsidianContainer(), {
      label: "Protocol",
      options,
      selected: "warmup",
      onPick: () => {},
    });
    const label = picker.querySelector(".workout-chip-group-label")!;
    const group = picker.querySelector(".workout-chip-group-chips")!;

    expect(label.textContent).toBe("Protocol");
    expect(group.getAttribute("role")).toBe("group");
    expect(group.getAttribute("aria-labelledby")).toBe(label.id);
    expect(Array.from(group.querySelectorAll("button")).map((b) => b.textContent)).toEqual([
      "Standard",
      "Warm-up",
      "Drop set",
    ]);
  });

  it("presses the picked chip only", () => {
    const picker = ProtocolPicker.create(createObsidianContainer(), {
      label: "Protocol",
      options,
      selected: "warmup",
      onPick: () => {},
    });

    expect(
      Array.from(picker.querySelectorAll("button")).map((b) => b.getAttribute("aria-pressed")),
    ).toEqual(["false", "true", "false"]);
  });

  it("hands over a different pick, not the picked one again", () => {
    const onPick = jest.fn();
    const picker = ProtocolPicker.create(createObsidianContainer(), {
      label: "Protocol",
      options,
      selected: "standard",
      onPick,
    });
    const chips = picker.querySelectorAll<HTMLButtonElement>("button");

    chips[0].click();
    chips[2].click();

    expect(onPick).toHaveBeenCalledTimes(1);
    expect(onPick).toHaveBeenCalledWith("dropset");
  });

  it("names each chip for focusing it again, and gives every picker its own label id", () => {
    const parent = createObsidianContainer();
    const a = ProtocolPicker.create(parent, {
      label: "Protocol",
      options,
      selected: "standard",
      onPick: () => {},
      focusKeyPrefix: "row-2-protocol",
    });
    const b = ProtocolPicker.create(parent, { label: "Protocol", options, selected: "standard", onPick: () => {} });

    expect(a.querySelector("button")!.dataset.focusKey).toBe("row-2-protocol-standard");
    expect(b.querySelector("button")!.dataset.focusKey).toBeUndefined();
    expect(a.querySelector(".workout-chip-group-label")!.id).not.toBe(
      b.querySelector(".workout-chip-group-label")!.id,
    );
  });
});
