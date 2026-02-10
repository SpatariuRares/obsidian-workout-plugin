import { App, MarkdownView } from "obsidian";

/**
 * CodeBlockEditorService - Service for editing code block parameters in markdown files
 *
 * Provides methods to programmatically update parameters within code blocks
 * (e.g., workout-log, workout-chart) in the active editor.
 */
export class CodeBlockEditorService {
  /**
   * Update the targetWeight parameter in a workout-log code block
   *
   * Finds the code block matching the exercise name and updates its targetWeight.
   *
   * @param app - Obsidian App instance
   * @param exercise - Exercise name to match
   * @param newWeight - New target weight value
   * @returns True if update was successful, false otherwise
   */
  static async updateTargetWeight(
    app: App,
    exercise: string,
    newWeight: number,
  ): Promise<boolean> {
    try {
      const activeView = app.workspace.getActiveViewOfType(MarkdownView);
      if (!activeView) {
        return false;
      }

      const editor = activeView.editor;
      const content = editor.getValue();

      const result = this.updateCodeBlockParameter(
        content,
        "workout-log",
        exercise,
        "targetWeight",
        newWeight,
      );

      if (result.updated) {
        editor.setValue(result.content);
        return true;
      }

      return false;
    } catch {
      return false;
    }
  }

  /**
   * Generic method to update a parameter in a code block
   *
   * @param content - Full markdown content
   * @param blockType - Code block type (e.g., "workout-log")
   * @param exerciseMatch - Exercise name to match
   * @param paramName - Parameter name to update
   * @param newValue - New parameter value
   * @returns Object with updated content and success flag
   */
  private static updateCodeBlockParameter(
    content: string,
    blockType: string,
    exerciseMatch: string,
    paramName: string,
    newValue: number | string,
  ): { content: string; updated: boolean } {
    const lines = content.split("\n");
    let inCodeBlock = false;
    let _codeBlockStart = -1;
    let foundExercise = false;
    let paramLineIndex = -1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Start of target code block
      if (line.startsWith(`\`\`\`${blockType}`)) {
        inCodeBlock = true;
        _codeBlockStart = i;
        foundExercise = false;
        paramLineIndex = -1;
        continue;
      }

      // End of code block
      if (inCodeBlock && line.startsWith("```")) {
        if (foundExercise && paramLineIndex !== -1) {
          // Found the matching block with the parameter - update it
          lines[paramLineIndex] = lines[paramLineIndex].replace(
            new RegExp(`${paramName}:\\s*[\\d.]+`),
            `${paramName}: ${newValue}`,
          );
          return { content: lines.join("\n"), updated: true };
        }
        // Reset for next code block
        inCodeBlock = false;
        foundExercise = false;
        paramLineIndex = -1;
        continue;
      }

      if (!inCodeBlock) continue;

      // Check for exercise match
      if (line.startsWith("exercise:")) {
        const exerciseValue = line.replace("exercise:", "").trim();
        if (exerciseValue === exerciseMatch) {
          foundExercise = true;
        }
      }

      // Track parameter line
      if (line.startsWith(`${paramName}:`)) {
        paramLineIndex = i;
      }
    }

    return { content, updated: false };
  }

  /**
   * Add or update a parameter in a code block
   *
   * If the parameter exists, updates it. If not, adds it before the closing ```.
   *
   * @param app - Obsidian App instance
   * @param blockType - Code block type
   * @param exercise - Exercise name to match
   * @param paramName - Parameter name
   * @param value - Parameter value
   * @returns True if successful
   */
  static async setParameter(
    app: App,
    blockType: string,
    exercise: string,
    paramName: string,
    value: number | string | boolean,
  ): Promise<boolean> {
    try {
      const activeView = app.workspace.getActiveViewOfType(MarkdownView);
      if (!activeView) {
        return false;
      }

      const editor = activeView.editor;
      const content = editor.getValue();
      const lines = content.split("\n");

      let inCodeBlock = false;
      let foundExercise = false;
      let paramLineIndex = -1;
      let codeBlockEndIndex = -1;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        if (line.startsWith(`\`\`\`${blockType}`)) {
          inCodeBlock = true;
          foundExercise = false;
          paramLineIndex = -1;
          continue;
        }

        if (inCodeBlock && line.startsWith("```")) {
          if (foundExercise) {
            codeBlockEndIndex = i;
            break;
          }
          inCodeBlock = false;
          continue;
        }

        if (!inCodeBlock) continue;

        if (line.startsWith("exercise:")) {
          const exerciseValue = line.replace("exercise:", "").trim();
          if (exerciseValue === exercise) {
            foundExercise = true;
          }
        }

        if (foundExercise && line.startsWith(`${paramName}:`)) {
          paramLineIndex = i;
        }
      }

      if (!foundExercise) {
        return false;
      }

      if (paramLineIndex !== -1) {
        // Update existing parameter
        lines[paramLineIndex] = `${paramName}: ${value}`;
      } else if (codeBlockEndIndex !== -1) {
        // Add new parameter before closing ```
        lines.splice(codeBlockEndIndex, 0, `${paramName}: ${value}`);
      } else {
        return false;
      }

      editor.setValue(lines.join("\n"));
      return true;
    } catch {
      return false;
    }
  }
}
