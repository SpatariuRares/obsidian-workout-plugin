/**
 * Mock for the obsidian module
 * Provides mock implementations of obsidian functions used in tests
 */
import { jest } from "@jest/globals";
/**
 * Simple YAML parser mock that handles basic YAML structures
 * Mimics Obsidian's parseYaml function
 */
/**
 * Simple normalizePath mock
 */
export function normalizePath(path: string): string {
  // Simple implementation: replace backslashes with slashes and remove multiple slashes
  return path.replace(/\\/g, "/").replace(/\/+/g, "/");
}

export class AbstractInputSuggest<T> {
  app: App;
  protected inputEl: HTMLInputElement;

  constructor(app: App, textInputEl: HTMLInputElement) {
    this.app = app;
    this.inputEl = textInputEl;
  }

  getSuggestions(_query: string): T[] {
    return [];
  }

  renderSuggestion(_item: T, _el: HTMLElement): void {}

  selectSuggestion(_item: T): void {}

  close(): void {}
}

export const parseYaml = jest.fn(
  (yaml: string): Record<string, string | string[]> | null => {
    if (!yaml || !yaml.trim()) {
      return null;
    }

    const result: Record<string, string | string[]> = {};
    const lines = yaml.split("\n");
    let currentKey: string | null = null;
    let currentArray: string[] | null = null;

    for (const line of lines) {
      const trimmed = line.trim();

      // Skip empty lines
      if (!trimmed) continue;

      // Check if it's an array item
      if (trimmed.startsWith("-")) {
        if (currentKey && currentArray !== null) {
          const value = trimmed.slice(1).trim();
          if (value) {
            currentArray.push(value);
          }
        }
        continue;
      }

      // Check if it's a key-value pair
      const colonIndex = trimmed.indexOf(":");
      if (colonIndex > 0) {
        // Save previous array if exists
        if (currentKey && currentArray !== null) {
          result[currentKey] = currentArray;
        }

        const key = trimmed.slice(0, colonIndex).trim();
        const value = trimmed.slice(colonIndex + 1).trim();

        if (value) {
          // Simple key: value
          result[key] = value;
          currentKey = null;
          currentArray = null;
        } else {
          // Key with array value (next lines will have - items)
          currentKey = key;
          currentArray = [];
        }
      }
    }

    // Don't forget the last array
    if (currentKey && currentArray !== null) {
      result[currentKey] = currentArray;
    }

    return Object.keys(result).length > 0 ? result : null;
  },
);

/** Obsidian's app language (since 1.8.7). Tests set it with mockReturnValue. */
export const getLanguage = jest.fn((): string => "en");

/** Obsidian's bundled moment; only the locale is mocked. */
export const moment = {
  locale: jest.fn((): string => "en"),
};

// Mock other commonly used obsidian exports
export const Notice = jest.fn();

export class TFile {
  path: string = "";
  basename: string = "";
  extension: string = "";
  name: string = "";
}

export class TAbstractFile {
  path: string = "";
  name: string = "";
  parent: TFolder | null = null;
}

export class EventRef {}

export class App {
  vault = {
    getAbstractFileByPath: jest.fn(),
    getFolderByPath: jest.fn().mockReturnValue(null),
    getAllLoadedFiles: jest.fn(),
    read: jest.fn(),
    create: jest.fn(),
    process: jest.fn(),
    createFolder: jest.fn(),
    modify: jest.fn(),
    getMarkdownFiles: jest.fn().mockReturnValue([]),
  };
  fileManager = {
    processFrontMatter: jest.fn(),
  };
  workspace = {
    getActiveViewOfType: jest.fn(),
  };
}

export class Plugin {}

type Handler<V> = (value: V) => unknown;

/** Obsidian's DomElementInfo, the part the helpers below honour */
type ElInfo = {
  cls?: string | string[];
  text?: string;
  attr?: Record<string, string | number | boolean | null>;
};

/** Value-holding base of Obsidian's setting components (text, toggle, ...). */
export class MockComponent<V = unknown> {
  value: V | undefined;
  handler: Handler<V> | null = null;
  disabled = false;
  constructor(
    readonly kind: string,
    /** The one element this component creates */
    readonly el: HTMLElement,
  ) {}
  setValue(value: V) {
    this.value = value;
    return this;
  }
  setDisabled(disabled: boolean) {
    this.disabled = disabled;
    return this;
  }
  onChange(handler: Handler<V>) {
    this.handler = handler;
    return this;
  }
  /** Test helper: act as the user changing the value. */
  async change(value: V) {
    this.value = value;
    await this.handler?.(value);
  }
}

/** TextComponent and TextAreaComponent */
export class MockText extends MockComponent<string> {
  inputEl: HTMLInputElement | HTMLTextAreaElement;
  constructor(kind: "text" | "textarea", doc: Document) {
    const inputEl = doc.createElement(kind === "text" ? "input" : "textarea");
    super(kind, inputEl);
    this.inputEl = inputEl;
  }
  setPlaceholder(placeholder: string) {
    this.inputEl.placeholder = placeholder;
    return this;
  }
}

export class MockToggle extends MockComponent<boolean> {
  toggleEl: HTMLElement;
  constructor(doc: Document) {
    const toggleEl = doc.createElement("div");
    super("toggle", toggleEl);
    this.toggleEl = toggleEl;
  }
}

export class MockDropdown extends MockComponent<string> {
  selectEl: HTMLSelectElement;
  options: Record<string, string> = {};
  constructor(doc: Document) {
    const selectEl = doc.createElement("select");
    super("dropdown", selectEl);
    this.selectEl = selectEl;
  }
  addOption(value: string, label: string) {
    this.options[value] = label;
    return this;
  }
}

export class MockColor extends MockComponent<string> {
  constructor(doc: Document) {
    const input = doc.createElement("input");
    input.type = "color";
    super("color", input);
  }
}

/** ButtonComponent: the only component with a click handler and text */
export class MockButton {
  readonly kind = "button";
  buttonEl: HTMLButtonElement;
  text = "";
  disabled = false;
  constructor(doc: Document) {
    this.buttonEl = withHelpers(doc.createElement("button"));
  }
  get el(): HTMLElement {
    return this.buttonEl;
  }
  /** Like Obsidian's setTooltip: the tooltip text is the aria-label */
  setTooltip(tooltip: string) {
    this.buttonEl.setAttribute("aria-label", tooltip);
    return this;
  }
  setIcon(icon: string) {
    this.buttonEl.dataset.icon = icon;
    return this;
  }
  setCta() {
    return this;
  }
  setWarning() {
    return this;
  }
  setDisabled(disabled: boolean) {
    this.disabled = disabled;
    return this;
  }
  setButtonText(text: string) {
    this.text = text;
    this.buttonEl.textContent = text;
    return this;
  }
  onClick(handler: () => unknown) {
    this.buttonEl.addEventListener("click", () => handler());
    return this;
  }
}

type AnyMockComponent =
  | MockText
  | MockToggle
  | MockDropdown
  | MockColor
  | MockButton;

export function withHelpers<T extends HTMLElement | DocumentFragment>(el: T): T {
  const e = el as unknown as Record<string, unknown>;
  const make = (tag: string, o?: ElInfo | string) => {
    const info: ElInfo = typeof o === "string" ? { cls: o } : (o ?? {});
    const child = el.ownerDocument.createElement(tag);
    if (info.cls) {
      child.className = Array.isArray(info.cls) ? info.cls.join(" ") : info.cls;
    }
    if (info.text) child.textContent = info.text;
    for (const [name, value] of Object.entries(info.attr ?? {})) {
      if (value !== null) child.setAttribute(name, String(value));
    }
    el.appendChild(child);
    return withHelpers(child);
  };
  e.createEl = make;
  e.createDiv = (o?: ElInfo | string) => make("div", o);
  e.createSpan = (o?: ElInfo | string) => make("span", o);
  e.empty = () => el.replaceChildren();
  e.setText = (text: string) => {
    el.textContent = text;
  };
  e.addClass = (c: string) => (el as HTMLElement).classList.add(c);
  e.removeClass = (c: string) => (el as HTMLElement).classList.remove(c);
  e.toggleClass = (c: string, on: boolean) => (el as HTMLElement).classList.toggle(c, on);
  e.setCssProps = () => undefined;
  return el;
}

const settingsByEl = new WeakMap<HTMLElement, Setting>();

/** Test helper: the mock Setting that drew the row `containerEl` has by name. */
export function mockSettingNamed(
  containerEl: HTMLElement,
  name: string,
): Setting {
  const rows = Array.from(containerEl.querySelectorAll<HTMLElement>(".setting-item"));
  const row = rows.find(
    (el) => el.querySelector(".setting-item-name")?.textContent === name,
  );
  const setting = row && settingsByEl.get(row);
  if (!setting) throw new Error(`No setting named "${name}"`);
  return setting;
}

/**
 * DOM-backed Setting. Needs a jsdom test (`@jest-environment jsdom`).
 * Components it creates are kept in `components` so tests can drive them.
 */
export class Setting {
  settingEl: HTMLElement;
  nameEl: HTMLElement;
  descEl: HTMLElement;
  controlEl: HTMLElement;
  heading = false;
  components: AnyMockComponent[] = [];
  constructor(containerEl: HTMLElement) {
    const doc = containerEl.ownerDocument;
    this.settingEl = doc.createElement("div");
    this.settingEl.className = "setting-item";
    const info = doc.createElement("div");
    this.nameEl = doc.createElement("div");
    this.nameEl.className = "setting-item-name";
    this.descEl = doc.createElement("div");
    this.descEl.className = "setting-item-description";
    this.controlEl = withHelpers(doc.createElement("div"));
    this.controlEl.className = "setting-item-control";
    info.append(this.nameEl, this.descEl);
    this.settingEl.append(info, this.controlEl);
    containerEl.appendChild(this.settingEl);
    settingsByEl.set(this.settingEl, this);
  }
  setName(name: string | DocumentFragment) {
    this.nameEl.replaceChildren(name);
    return this;
  }
  setDesc(desc: string | DocumentFragment) {
    this.descEl.replaceChildren(desc);
    return this;
  }
  setHeading() {
    this.heading = true;
    this.settingEl.classList.add("setting-item-heading");
    return this;
  }
  private add<C extends AnyMockComponent>(
    component: C,
    cb: (c: C) => unknown,
  ) {
    this.components.push(component);
    this.controlEl.append(component.el);
    cb(component);
    return this;
  }
  private get doc() {
    return this.settingEl.ownerDocument;
  }
  addText(cb: (c: MockText) => unknown) {
    return this.add(new MockText("text", this.doc), cb);
  }
  addTextArea(cb: (c: MockText) => unknown) {
    return this.add(new MockText("textarea", this.doc), cb);
  }
  addToggle(cb: (c: MockToggle) => unknown) {
    return this.add(new MockToggle(this.doc), cb);
  }
  addDropdown(cb: (c: MockDropdown) => unknown) {
    return this.add(new MockDropdown(this.doc), cb);
  }
  addColorPicker(cb: (c: MockColor) => unknown) {
    return this.add(new MockColor(this.doc), cb);
  }
  addButton(cb: (c: MockButton) => unknown) {
    return this.add(new MockButton(this.doc), cb);
  }
  /** Test helper */
  component(kind: "text" | "textarea", index?: number): MockText;
  component(kind: "toggle", index?: number): MockToggle;
  component(kind: "dropdown", index?: number): MockDropdown;
  component(kind: "color", index?: number): MockColor;
  component(kind: "button", index?: number): MockButton;
  component(kind: string, index = 0): AnyMockComponent {
    return this.components.filter((c) => c.kind === kind)[index];
  }
}

export abstract class SettingTab {
  app: App;
  containerEl: HTMLElement;
  constructor(app: App) {
    this.app = app;
    this.containerEl =
      typeof document === "undefined"
        ? (undefined as unknown as HTMLElement)
        : withHelpers(document.createElement("div"));
  }
}
export abstract class PluginSettingTab extends SettingTab {
  plugin: Plugin;
  constructor(app: App, plugin: Plugin) {
    super(app);
    this.plugin = plugin;
  }
}
export class Modal {
  app: App;
  contentEl: HTMLElement;
  titleEl: HTMLElement;
  constructor(app: App) {
    this.app = app;
    const hasDom = typeof document !== "undefined";
    this.contentEl = hasDom ? withHelpers(document.createElement("div")) : (undefined as unknown as HTMLElement);
    this.titleEl = hasDom ? withHelpers(document.createElement("div")) : (undefined as unknown as HTMLElement);
  }
  open() {}
  close() {}
}
export class FuzzySuggestModal<T> {
  app: App;
  constructor(app: App) {
    this.app = app;
  }
  setPlaceholder(_placeholder: string) {}
  getItems(): T[] {
    return [];
  }
  getItemText(_item: T): string {
    return "";
  }
  onChooseItem(_item: T): void {}
  open() {}
  close() {}
}
export class MarkdownView {}
export class MarkdownRenderChild {}
export class TFolder {
  path: string = "";
  name: string = "";
  children: (TFile | TFolder)[] = [];
}
