/** @jest-environment jsdom */

import { BlockCard } from "@app/components/molecules/BlockCard";
import { createObsidianContainer } from "@app/components/__tests__/obsidianDomMocks";

describe("BlockCard molecule", () => {
  it("is a card with the block's class and a top row: title, then meta", () => {
    const parent = createObsidianContainer();
    const { el, header } = BlockCard.create(parent, {
      title: "Bench Press",
      meta: "2/4 sets",
      className: "workout-sets",
    });

    expect(el.classList.contains("workout-block-card")).toBe(true);
    expect(el.classList.contains("workout-sets")).toBe(true);
    expect(el.firstElementChild).toBe(header);
    expect(Array.from(header.children).map((child) => child.className)).toEqual([
      "workout-block-title",
      "workout-block-meta",
    ]);
    expect(header.textContent).toBe("Bench Press2/4 sets");
  });

  it("keeps what the caller adds to the top row after the title and meta", () => {
    const { header } = BlockCard.create(createObsidianContainer(), { title: "Squat" });
    const menu = header.createDiv({ cls: "menu" });

    expect(header.lastElementChild).toBe(menu);
  });

  it("marks a title that says what is missing", () => {
    const { header } = BlockCard.create(createObsidianContainer(), {
      title: "Choose an exercise",
      titleIsMessage: true,
    });

    expect(header.querySelector(".workout-block-title")!.classList.contains("is-message")).toBe(true);
  });

  it("leaves the top row empty without a title or meta", () => {
    const { header } = BlockCard.create(createObsidianContainer());

    expect(header.childElementCount).toBe(0);
  });

  it("adds the actions row at the end of the card", () => {
    const { el } = BlockCard.create(createObsidianContainer(), { title: "Squat" });
    el.createDiv({ cls: "content" });
    const footer = BlockCard.footer(el);

    expect(footer.className).toBe("workout-block-footer");
    expect(el.lastElementChild).toBe(footer);
  });
});
