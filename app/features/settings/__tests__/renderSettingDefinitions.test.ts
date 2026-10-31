/** @jest-environment jsdom */
import { mockSettingNamed, withHelpers } from "obsidian";
import type { SettingDefinitionItem } from "obsidian";
import { renderSettingDefinitions } from "@app/features/settings/renderSettingDefinitions";
import { t } from "@app/i18n";

function draw(items: SettingDefinitionItem[]) {
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
      { name: "Hidden too", visible: () => false },
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
        items: [
          { name: "A", action: edit },
          { name: "B", action: edit },
        ],
      },
    ]);

    const buttons = mockSettingNamed(c, "B").components.filter(
      (x) => x.kind === "button",
    );
    buttons[0].buttonEl.click(); // edit
    buttons[1].buttonEl.click(); // delete
    expect(edit).toHaveBeenCalledWith(expect.anything(), 1);
    expect(del).toHaveBeenCalledWith(1);
    expect(buttons[1].buttonEl.title).toBe(t("settings.tooltips.deleteItem"));

    Array.from(c.querySelectorAll("button"))
      .find((b) => b.textContent === "Add one")!
      .click();
    expect(add).toHaveBeenCalled();
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
