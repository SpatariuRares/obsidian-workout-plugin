/** @jest-environment jsdom */

import { INPUT_TYPE } from "@app/types/InputTypes";
import { Input } from "../atoms";
import { createObsidianContainer } from "./obsidianDomMocks";

describe("obsidianDomMocks", () => {
  describe("createObsidianContainer", () => {
    it("creates a container with Obsidian helper methods", () => {
      const container = createObsidianContainer();

      expect(container.createEl).toBeDefined();
      expect(container.createDiv).toBeDefined();
      expect(container.createSpan).toBeDefined();
      expect(container.addClass).toBeDefined();
      expect(container.removeClass).toBeDefined();
      expect(container.appendText).toBeDefined();
    });
  });

  describe("createEl", () => {
    it("creates element with no options", () => {
      const container = createObsidianContainer();
      const child = container.createEl("p");

      expect(child.tagName).toBe("P");
      expect(container.contains(child)).toBe(true);
    });

    it("creates element with text", () => {
      const container = createObsidianContainer();
      const child = container.createEl("span", { text: "Hello" });

      expect(child.textContent).toBe("Hello");
    });

    it("creates element with single class", () => {
      const container = createObsidianContainer();
      const child = container.createEl("div", { cls: "my-class" });

      expect(child.classList.contains("my-class")).toBe(true);
    });

    it("creates element with multiple space-separated classes", () => {
      const container = createObsidianContainer();
      const child = container.createEl("div", {
        cls: "class-a class-b class-c",
      });

      expect(child.classList.contains("class-a")).toBe(true);
      expect(child.classList.contains("class-b")).toBe(true);
      expect(child.classList.contains("class-c")).toBe(true);
    });

    it("creates element with array of classes", () => {
      const container = createObsidianContainer();
      const child = container.createEl("div", { cls: ["first", "second"] });

      expect(child.classList.contains("first")).toBe(true);
      expect(child.classList.contains("second")).toBe(true);
    });

    it("creates element with attributes", () => {
      const container = createObsidianContainer();
      const child = Input.create(container, {
        type: INPUT_TYPE.TEXT,
        placeholder: "Enter value",
      });

      expect(child.getAttribute("type")).toBe("text");
      expect(child.getAttribute("placeholder")).toBe("Enter value");
    });

    it("created elements also have Obsidian helpers", () => {
      const container = createObsidianContainer();
      const child = container.createEl("div");

      expect(child.createEl).toBeDefined();
      const nested = child.createEl("span", { text: "nested" });
      expect(child.contains(nested)).toBe(true);
    });
  });

  describe("createDiv", () => {
    it("creates a div element", () => {
      const container = createObsidianContainer();
      const div = container.createDiv({ cls: "wrapper" });

      expect(div.tagName).toBe("DIV");
      expect(div.classList.contains("wrapper")).toBe(true);
    });
  });

  describe("createSpan", () => {
    it("creates a span element", () => {
      const container = createObsidianContainer();
      const span = container.createSpan({ text: "label" });

      expect(span.tagName).toBe("SPAN");
      expect(span.textContent).toBe("label");
    });
  });

  describe("addClass", () => {
    it("adds a single class", () => {
      const container = createObsidianContainer();
      container.addClass("new-class");

      expect(container.classList.contains("new-class")).toBe(true);
    });

    it("adds multiple space-separated classes", () => {
      const container = createObsidianContainer();
      container.addClass("one two three");

      expect(container.classList.contains("one")).toBe(true);
      expect(container.classList.contains("two")).toBe(true);
      expect(container.classList.contains("three")).toBe(true);
    });
  });

  describe("removeClass", () => {
    it("removes a single class", () => {
      const container = createObsidianContainer();
      container.addClass("to-remove");
      container.removeClass("to-remove");

      expect(container.classList.contains("to-remove")).toBe(false);
    });

    it("removes multiple space-separated classes", () => {
      const container = createObsidianContainer();
      container.addClass("a b c");
      container.removeClass("a c");

      expect(container.classList.contains("a")).toBe(false);
      expect(container.classList.contains("b")).toBe(true);
      expect(container.classList.contains("c")).toBe(false);
    });

    it("handles empty string gracefully", () => {
      const container = createObsidianContainer();
      container.addClass("keep-me");

      // Should not throw and should not remove anything
      container.removeClass("");

      expect(container.classList.contains("keep-me")).toBe(true);
    });
  });

  describe("appendText", () => {
    it("appends a text node to the element", () => {
      const container = createObsidianContainer();
      const textNode = container.appendText("Hello World");

      expect(textNode).toBeInstanceOf(Text);
      expect(container.textContent).toBe("Hello World");
    });

    it("appends text alongside other content", () => {
      const container = createObsidianContainer();
      container.createEl("span", { text: "Before " });
      container.appendText("After");

      expect(container.textContent).toBe("Before After");
    });
  });

  describe("empty", () => {
    it("removes all children from the element", () => {
      const container = createObsidianContainer();
      container.createEl("div", { text: "First" });
      container.createEl("span", { text: "Second" });
      container.appendText("Third");

      expect(container.childNodes.length).toBe(3);

      container.empty();

      expect(container.childNodes.length).toBe(0);
      expect(container.textContent).toBe("");
    });

    it("handles already empty elements", () => {
      const container = createObsidianContainer();

      expect(container.childNodes.length).toBe(0);

      container.empty();

      expect(container.childNodes.length).toBe(0);
    });
  });
});
