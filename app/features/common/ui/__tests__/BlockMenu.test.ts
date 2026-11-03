/** @jest-environment jsdom */

import {
  BlockMenu,
  BLOCK_MENU_CLASS,
} from "@app/features/common/ui/BlockMenu";
import { createObsidianContainer } from "@app/components/__tests__/obsidianDomMocks";

const items = (menu: HTMLElement) => [
  ...menu.querySelectorAll<HTMLButtonElement>(
    ".workout-icon-dropdown-item",
  ),
];

describe("BlockMenu", () => {
  it("lists every action and runs the one that is picked", () => {
    const goto = jest.fn();
    const edit = jest.fn();
    const menu = BlockMenu.render(createObsidianContainer(), [
      { label: "Go to exercise", icon: "arrow", run: goto },
      { label: "Edit table", icon: "pencil", run: edit, edits: true },
    ]);

    expect(items(menu).map((i) => i.textContent)).toEqual([
      "Go to exercise",
      "Edit table",
    ]);
    items(menu)[1].click();
    expect(edit).toHaveBeenCalledTimes(1);
    expect(goto).not.toHaveBeenCalled();
  });

  it("is marked as the block's menu only when it can edit the block", () => {
    const container = createObsidianContainer();
    const withEdit = BlockMenu.render(container, [
      { label: "Edit", icon: "pencil", run: jest.fn(), edits: true },
    ]);
    const without = BlockMenu.render(container, [
      { label: "Go", icon: "arrow", run: jest.fn() },
    ]);

    expect(withEdit.classList.contains(BLOCK_MENU_CLASS)).toBe(true);
    expect(without.classList.contains(BLOCK_MENU_CLASS)).toBe(false);
  });

  it("stops listening when the view is torn down", () => {
    const run = jest.fn();
    const controller = new AbortController();
    const menu = BlockMenu.render(
      createObsidianContainer(),
      [{ label: "Edit", icon: "pencil", run, edits: true }],
      controller.signal,
    );
    controller.abort();
    items(menu)[0].click();
    expect(run).not.toHaveBeenCalled();
  });
});
