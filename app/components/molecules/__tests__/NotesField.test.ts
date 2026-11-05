/** @jest-environment jsdom */

import { NotesField } from "@app/components/molecules/NotesField";
import { createObsidianContainer } from "@app/components/__tests__/obsidianDomMocks";

describe("NotesField molecule", () => {
  it("is a text area with a real label and its value", () => {
    const parent = createObsidianContainer();
    const textarea = NotesField.create(parent, { label: "Notes", value: "easy", onChange: () => {} });
    const label = parent.querySelector("label")!;

    expect(textarea.value).toBe("easy");
    expect(label.textContent).toBe("Notes");
    expect(label.getAttribute("for")).toBe(textarea.id);
    expect(textarea.getAttribute("rows")).toBe("2");
  });

  it("hands every key over by default", () => {
    const onChange = jest.fn();
    const textarea = NotesField.create(createObsidianContainer(), { label: "Notes", value: "", onChange });

    textarea.value = "slow";
    textarea.dispatchEvent(new Event("input"));

    expect(onChange).toHaveBeenCalledWith("slow");
  });

  it("hands the value over once left with saveOn change", () => {
    const onChange = jest.fn();
    const textarea = NotesField.create(createObsidianContainer(), {
      label: "Notes",
      value: "",
      saveOn: "change",
      onChange,
    });

    textarea.value = "felt heavy";
    textarea.dispatchEvent(new Event("input"));
    expect(onChange).not.toHaveBeenCalled();
    textarea.dispatchEvent(new Event("change"));

    expect(onChange).toHaveBeenCalledWith("felt heavy");
  });

  it("keeps keys from the editor around it", () => {
    const parent = createObsidianContainer();
    const outside = jest.fn();
    parent.addEventListener("keydown", outside);
    const textarea = NotesField.create(parent, { label: "Notes", value: "", onChange: () => {}, focusKey: "notes" });

    textarea.dispatchEvent(new KeyboardEvent("keydown", { key: "a", bubbles: true }));

    expect(outside).not.toHaveBeenCalled();
    expect(textarea.dataset.focusKey).toBe("notes");
  });
});
