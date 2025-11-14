import { App, MarkdownView, Notice } from "obsidian";
import { CodeGenerator } from "@app/modals/components/CodeGenerator";

export class CreateDashboardSection {
  private app: App;

  constructor(app: App) {
    this.app = app;
  }

  insert() {
    const sectionCode = CodeGenerator.generateDashboardCode();
    this.insertIntoEditor(sectionCode);
  }

  private insertIntoEditor(code: string) {
    const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);

    if (!activeView) {
      new Notice("no active markdown editor");
      return;
    }

    const editor = activeView.editor;
    const cursor = editor.getCursor();
    editor.replaceRange(code, cursor);

    new Notice("Dashboard section created successfully");
  }
}
