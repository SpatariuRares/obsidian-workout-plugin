import { App, MarkdownView, Notice } from "obsidian";
import type WorkoutChartsPlugin from "../../main";
import { CodeGenerator } from "./components/CodeGenerator";

export class CreateDashboardSection {
  private app: App;
  private plugin: WorkoutChartsPlugin;

  constructor(app: App, plugin: WorkoutChartsPlugin) {
    this.app = app;
    this.plugin = plugin;
  }

  async insert() {
    const sectionCode = CodeGenerator.generateDashboardCode();
    this.insertIntoEditor(sectionCode);
  }

  private insertIntoEditor(code: string) {
    const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);

    if (!activeView) {
      new Notice("❌ No active markdown editor");
      return;
    }

    const editor = activeView.editor;
    const cursor = editor.getCursor();
    editor.replaceRange(code, cursor);

    new Notice("✅ Dashboard section created successfully!");
  }
}
