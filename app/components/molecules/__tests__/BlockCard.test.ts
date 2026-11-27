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

  it("renders a plain title with no anchor when titleLink is omitted", () => {
    const { header } = BlockCard.create(createObsidianContainer(), { title: "Squat" });
    const titleEl = header.querySelector(".workout-block-title")!;

    expect(titleEl.textContent).toBe("Squat");
    expect(titleEl.querySelector("a")).toBeNull();
  });

  it("renders title as an internal link when titleLink is provided", () => {
    const onOpen = jest.fn();
    const { header } = BlockCard.create(createObsidianContainer(), {
      title: "Squat",
      titleLink: {
        href: "Exercises/Squat.md",
        onOpen,
      },
    } as never);

    const link = header.querySelector<HTMLAnchorElement>(
      ".workout-block-title a.internal-link.workout-block-title-link",
    );
    expect(link).not.toBeNull();
    expect(link?.textContent).toBe("Squat");
    expect(link?.getAttribute("href")).toBe("Exercises/Squat.md");
    expect(link?.getAttribute("data-href")).toBe("Exercises/Squat.md");
    expect(link?.getAttribute("rel")).toBe("noopener");
    expect(link?.classList.contains("is-unresolved")).toBe(false);
  });

  it("marks an unresolved title link with is-unresolved", () => {
    const { header } = BlockCard.create(createObsidianContainer(), {
      title: "Squat",
      titleLink: {
        href: "Squat",
        unresolved: true,
        onOpen: jest.fn(),
      },
    } as never);

    const link = header.querySelector("a.workout-block-title-link")!;
    expect(link.classList.contains("is-unresolved")).toBe(true);
  });

  it("handles click, middle auxclick, hover, and AbortSignal cleanup on titleLink", () => {
    const onOpen = jest.fn();
    const onHover = jest.fn();
    const controller = new AbortController();
    const { header } = BlockCard.create(createObsidianContainer(), {
      title: "Squat",
      titleLink: {
        href: "Exercises/Squat.md",
        onOpen,
        onHover,
        signal: controller.signal,
      },
    } as never);

    const link = header.querySelector<HTMLAnchorElement>("a.workout-block-title-link")!;

    const clickEvent = new MouseEvent("click", { bubbles: true, cancelable: true });
    link.dispatchEvent(clickEvent);
    expect(clickEvent.defaultPrevented).toBe(true);
    expect(onOpen).toHaveBeenCalledTimes(1);

    const middleEvent = new MouseEvent("auxclick", { bubbles: true, cancelable: true, button: 1 });
    link.dispatchEvent(middleEvent);
    expect(middleEvent.defaultPrevented).toBe(true);
    expect(onOpen).toHaveBeenCalledTimes(2);

    const rightAuxEvent = new MouseEvent("auxclick", { bubbles: true, cancelable: true, button: 2 });
    link.dispatchEvent(rightAuxEvent);
    expect(rightAuxEvent.defaultPrevented).toBe(false);
    expect(onOpen).toHaveBeenCalledTimes(2);

    const hoverEvent = new MouseEvent("mouseover", { bubbles: true });
    link.dispatchEvent(hoverEvent);
    expect(onHover).toHaveBeenCalledWith(hoverEvent, link);

    controller.abort();
    link.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    link.dispatchEvent(new MouseEvent("auxclick", { bubbles: true, cancelable: true, button: 1 }));
    link.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    expect(onOpen).toHaveBeenCalledTimes(2);
    expect(onHover).toHaveBeenCalledTimes(1);
  });

  it("keeps titleIsMessage as plain muted text even if titleLink is provided", () => {
    const { header } = BlockCard.create(createObsidianContainer(), {
      title: "Choose an exercise",
      titleIsMessage: true,
      titleLink: {
        href: "Exercises/Squat.md",
        onOpen: jest.fn(),
      },
    } as never);

    const titleEl = header.querySelector(".workout-block-title")!;
    expect(titleEl.classList.contains("is-message")).toBe(true);
    expect(titleEl.querySelector("a")).toBeNull();
  });
});
