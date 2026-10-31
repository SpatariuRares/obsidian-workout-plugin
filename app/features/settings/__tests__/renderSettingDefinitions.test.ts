/** @jest-environment jsdom */
import { mockSettingNamed, withHelpers } from "obsidian";
import type { MockButton } from "obsidian";
import type { DefinitionItem } from "@app/features/settings/settingDefinitionTypes";
import { renderSettingDefinitions } from "@app/features/settings/renderSettingDefinitions";

function draw(items: DefinitionItem[]) {
  const container = withHelpers(document.createElement("div"));
  renderSettingDefinitions(container, items);
  return container;
}

const names = (c: HTMLElement) =>
  Array.from(c.querySelectorAll(".setting-item-name")).map(
    (el) => el.textContent,
  );

describe("renderSettingDefinitions", () => {
  it("draws a group heading, then its rows with name and description", () => {
    const c = draw([
      {
        type: "group",
        heading: "Section",
        items: [{ name: "Row", desc: "About", render: () => undefined }],
      },
    ]);

    expect(names(c)).toEqual(["Section", "Row"]);
    expect(c.querySelector(".setting-item-heading")).toBeTruthy();
    expect(c.querySelectorAll(".setting-item-description")[1]?.textContent).toBe(
      "About",
    );
  });

  it("lets a row add its own controls", async () => {
    const onChange = jest.fn();
    const c = draw([
      {
        name: "Toggle",
        render: (setting) => setting.addToggle((tg) => tg.onChange(onChange)),
      },
    ]);

    await mockSettingNamed(c, "Toggle")
      .component("toggle")
      .change(true as never);
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("skips what is not visible", () => {
    const c = draw([
      { name: "Hidden", visible: false },
      { name: "Shown" },
    ]);

    expect(names(c)).toEqual(["Shown"]);
  });

  it("draws a list with an edit button, a delete button and an add button", () => {
    const edit = jest.fn();
    const del = jest.fn();
    const add = jest.fn();
    const c = draw([
      {
        type: "list",
        addItem: { name: "Add one", action: add },
        onDelete: del,
        deleteTooltip: "Delete entry",
        items: [
          { name: "A", action: edit, tooltip: "Edit entry" },
          { name: "B", action: edit, tooltip: "Edit entry" },
        ],
      },
    ]);

    const buttons = mockSettingNamed(c, "B").components.filter(
      (x) => x.kind === "button",
    ) as MockButton[];
    buttons[0].buttonEl.click(); // edit
    buttons[1].buttonEl.click(); // delete
    expect(edit).toHaveBeenCalledWith(expect.anything());
    expect(del).toHaveBeenCalledWith(1);
    expect(buttons[0].buttonEl.getAttribute("aria-label")).toBe("Edit entry");
    expect(buttons[1].buttonEl.getAttribute("aria-label")).toBe("Delete entry");

    Array.from(c.querySelectorAll("button"))
      .find((b) => b.textContent === "Add one")!
      .click();
    expect(add).toHaveBeenCalled();
  });

  it("deletes the entry at its place in the list, whatever the row's own flags", () => {
    const del = jest.fn();
    const c = draw([
      {
        type: "list",
        onDelete: del,
        items: [
          { name: "A", action: jest.fn() },
          { name: "B", action: jest.fn() },
          { name: "C", action: jest.fn() },
        ],
      },
    ]);

    const buttons = mockSettingNamed(c, "C").components as MockButton[];
    buttons[1].buttonEl.click();
    expect(del).toHaveBeenCalledWith(2);
  });

  it("shows the empty state of an empty list", () => {
    const c = draw([{ type: "list", emptyState: "Nothing yet", items: [] }]);

    expect(c.querySelector("p")?.textContent).toBe("Nothing yet");
  });

  it("draws a page as a collapsible section with its items inside", () => {
    const c = draw([
      { type: "page", name: "Advanced", items: [{ name: "Inside" }] },
    ]);

    expect(c.querySelector("details summary")?.textContent).toBe("Advanced");
    expect(names(c.querySelector("details") as HTMLElement)).toEqual([
      "Inside",
    ]);
  });
});
