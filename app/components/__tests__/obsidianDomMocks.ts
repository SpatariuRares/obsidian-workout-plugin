interface CreateElOptions {
  cls?: string | string[];
  text?: string;
  attr?: Record<string, string>;
}

export type ObsidianHTMLElement = HTMLElement & {
  createEl: <K extends keyof HTMLElementTagNameMap>(
    tag: K,
    options?: CreateElOptions
  ) => (HTMLElementTagNameMap[K] & ObsidianHTMLElement) | HTMLElementTagNameMap[K];
  createDiv: (
    options?: CreateElOptions
  ) => (HTMLDivElement & ObsidianHTMLElement) | HTMLDivElement;
  createSpan: (
    options?: CreateElOptions
  ) => (HTMLSpanElement & ObsidianHTMLElement) | HTMLSpanElement;
  addClass: (cls: string) => void;
  removeClass: (cls: string) => void;
  appendText: (text: string) => Text;
};

/**
 * Create a DOM container that mimics Obsidian's HTMLElement helpers.
 */
export const createObsidianContainer = (): ObsidianHTMLElement => {
  return attachObsidianHelpers(document.createElement("div"));
};

const attachObsidianHelpers = <T extends HTMLElement>(
  element: T
): T & ObsidianHTMLElement => {
  const obsidianElement = element as T & ObsidianHTMLElement;

  obsidianElement.createEl = function createEl<K extends keyof HTMLElementTagNameMap>(
    tag: K,
    options?: CreateElOptions
  ): HTMLElementTagNameMap[K] & ObsidianHTMLElement {
    const child = attachObsidianHelpers(
      document.createElement(tag)
    ) as HTMLElementTagNameMap[K] & ObsidianHTMLElement;

    applyOptions(child, options);
    this.appendChild(child);

    return child;
  };

  obsidianElement.createDiv = function createDiv(
    options?: CreateElOptions
  ): HTMLDivElement & ObsidianHTMLElement {
    return this.createEl("div", options) as HTMLDivElement & ObsidianHTMLElement;
  };

  obsidianElement.createSpan = function createSpan(
    options?: CreateElOptions
  ): HTMLSpanElement & ObsidianHTMLElement {
    return this.createEl(
      "span",
      options
    ) as HTMLSpanElement & ObsidianHTMLElement;
  };

  obsidianElement.addClass = function addClass(cls: string): void {
    applyClasses(this, cls);
  };

  obsidianElement.removeClass = function removeClass(cls: string): void {
    if (!cls) {
      return;
    }

    cls
      .split(/\s+/)
      .map((name) => name.trim())
      .filter(Boolean)
      .forEach((name) => this.classList.remove(name));
  };

  obsidianElement.appendText = function appendText(text: string): Text {
    const textNode = document.createTextNode(text);
    this.appendChild(textNode);
    return textNode;
  };

  return obsidianElement;
};

const applyOptions = (
  element: HTMLElement,
  options?: CreateElOptions
): void => {
  if (!options) {
    return;
  }

  applyClasses(element, options.cls);

  if (options.text !== undefined) {
    element.textContent = options.text;
  }

  if (options.attr) {
    Object.entries(options.attr).forEach(([key, value]) => {
      element.setAttribute(key, value);
    });
  }
};

const applyClasses = (
  element: Element,
  classes?: string | string[]
): void => {
  if (!classes) {
    return;
  }

  const tokens = Array.isArray(classes) ? classes : classes.split(/\s+/);

  tokens
    .map((cls) => cls.trim())
    .filter(Boolean)
    .forEach((cls) => element.classList.add(cls));
};
