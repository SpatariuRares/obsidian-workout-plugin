/**
 * @jest-environment jsdom
 */
import { FolderSuggest } from "../FolderSuggest";
import { App, TFolder, TFile } from "obsidian";

// Polyfill Obsidian's String.contains method
declare global {
  interface String {
    contains(substring: string): boolean;
  }
  interface HTMLElement {
    setText(text: string): void;
  }
  interface HTMLInputElement {
    trigger(event: string): void;
  }
}

String.prototype.contains = function (substring: string): boolean {
  return this.includes(substring);
};

HTMLElement.prototype.setText = function (text: string): void {
  this.textContent = text;
};

HTMLInputElement.prototype.trigger = function (event: string): void {
  this.dispatchEvent(new Event(event));
};

describe("FolderSuggest", () => {
  let app: App;
  let inputEl: HTMLInputElement;
  let folderSuggest: FolderSuggest;

  beforeEach(() => {
    app = new App();
    inputEl = document.createElement("input");
    folderSuggest = new FolderSuggest(app, inputEl);
  });

  describe("constructor", () => {
    it("should initialize with app and input element", () => {
      expect(folderSuggest).toBeDefined();
      expect(folderSuggest["inputEl"]).toBe(inputEl);
    });
  });

  describe("getSuggestions", () => {
    it("should return empty array when no files exist", () => {
      (app.vault.getAllLoadedFiles as jest.Mock).mockReturnValue([]);

      const result = folderSuggest.getSuggestions("test");

      expect(result).toEqual([]);
    });

    it("should return only TFolder items", () => {
      const folder = new TFolder();
      folder.path = "my-folder";

      const file = new TFile();
      file.path = "my-file.md";

      (app.vault.getAllLoadedFiles as jest.Mock).mockReturnValue([
        folder,
        file,
      ]);

      const result = folderSuggest.getSuggestions("");

      expect(result).toHaveLength(1);
      expect(result[0]).toBe(folder);
    });

    it("should filter folders by query (case insensitive)", () => {
      const folder1 = new TFolder();
      folder1.path = "Documents/Notes";

      const folder2 = new TFolder();
      folder2.path = "Projects/Code";

      const folder3 = new TFolder();
      folder3.path = "documents/archive";

      (app.vault.getAllLoadedFiles as jest.Mock).mockReturnValue([
        folder1,
        folder2,
        folder3,
      ]);

      const result = folderSuggest.getSuggestions("documents");

      expect(result).toHaveLength(2);
      expect(result).toContain(folder1);
      expect(result).toContain(folder3);
    });

    it("should return all folders when query is empty", () => {
      const folder1 = new TFolder();
      folder1.path = "folder1";

      const folder2 = new TFolder();
      folder2.path = "folder2";

      (app.vault.getAllLoadedFiles as jest.Mock).mockReturnValue([
        folder1,
        folder2,
      ]);

      const result = folderSuggest.getSuggestions("");

      expect(result).toHaveLength(2);
    });

    it("should match partial paths", () => {
      const folder = new TFolder();
      folder.path = "theGYM/Esercizi/Data";

      (app.vault.getAllLoadedFiles as jest.Mock).mockReturnValue([folder]);

      const result = folderSuggest.getSuggestions("eser");

      expect(result).toHaveLength(1);
      expect(result[0]).toBe(folder);
    });

    it("should return empty array when no folders match", () => {
      const folder = new TFolder();
      folder.path = "Documents";

      (app.vault.getAllLoadedFiles as jest.Mock).mockReturnValue([folder]);

      const result = folderSuggest.getSuggestions("xyz");

      expect(result).toEqual([]);
    });
  });

  describe("renderSuggestion", () => {
    it("should set folder path as text content", () => {
      const folder = new TFolder();
      folder.path = "my/folder/path";

      const el = document.createElement("div");

      folderSuggest.renderSuggestion(folder, el);

      expect(el.textContent).toBe("my/folder/path");
    });
  });

  describe("selectSuggestion", () => {
    it("should set input value to folder path", () => {
      const folder = new TFolder();
      folder.path = "selected/folder";

      folderSuggest.selectSuggestion(folder);

      expect(inputEl.value).toBe("selected/folder");
    });

    it("should trigger input event on input element", () => {
      const folder = new TFolder();
      folder.path = "selected/folder";

      const dispatchEventSpy = jest.spyOn(inputEl, "dispatchEvent");

      folderSuggest.selectSuggestion(folder);

      expect(dispatchEventSpy).toHaveBeenCalled();
      expect(dispatchEventSpy.mock.calls[0][0].type).toBe("input");
    });

    it("should call close after selection", () => {
      const folder = new TFolder();
      folder.path = "selected/folder";

      inputEl.trigger = jest.fn();
      const closeSpy = jest.spyOn(folderSuggest, "close");

      folderSuggest.selectSuggestion(folder);

      expect(closeSpy).toHaveBeenCalled();
    });
  });
});
