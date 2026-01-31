/**
 * Mock for the obsidian module
 * Provides mock implementations of obsidian functions used in tests
 */
import { jest } from "@jest/globals";
/**
 * Simple YAML parser mock that handles basic YAML structures
 * Mimics Obsidian's parseYaml function
 */
export function parseYaml(yaml: string): Record<string, any> | null {
  if (!yaml || !yaml.trim()) {
    return null;
  }

  const result: Record<string, any> = {};
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
}

// Mock other commonly used obsidian exports
export class Notice {
  constructor(message: string, timeout?: number) {
    // Mock implementation - do nothing in tests
  }
}

export class TFile {
  path: string = "";
  basename: string = "";
  extension: string = "";
  name: string = "";
}

export class App {
  vault = {
    getAbstractFileByPath: jest.fn(),
    read: jest.fn(),
    create: jest.fn(),
    process: jest.fn(),
  };
  workspace = {
    getActiveViewOfType: jest.fn(),
  };
}

export class Plugin {}
export class PluginSettingTab {}
export class Modal {}
export class FuzzySuggestModal<T> {
  app: App;
  constructor(app: App) {
    this.app = app;
  }
  setPlaceholder(_placeholder: string) {}
  getItems(): T[] { return []; }
  getItemText(_item: T): string { return ""; }
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
