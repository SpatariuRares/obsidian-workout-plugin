import { App, MarkdownView } from "obsidian";
import type { CodeBlockSchema } from "@app/services/codeblocks/CodeBlockSchema";

/**
 * Which block to edit: by the `id` the insert modals write, or by exercise
 * for blocks written before ids existed (first match wins).
 */
export type CodeBlockMatch = { id: string } | { exercise: string };

/** Edits code block parameters in the note open in the active view */
export class CodeBlockEditorService {
  /**
   * Patch one block of the schema's type: only the changed parameters'
   * lines are rewritten (see CodeBlockSchema.patch).
   * @returns false when there is no active note or no matching block
   */
  static async patchCodeBlock<P>(
    app: App,
    schema: CodeBlockSchema<P>,
    match: CodeBlockMatch,
    changes: P,
  ): Promise<boolean> {
    const file = app.workspace.getActiveViewOfType(MarkdownView)?.file;
    if (!file) return false;

    let found = false;
    try {
      // Vault API, not the editor, so it works in Reading view too
      await app.vault.process(file, (content) => {
        const patched = patchBlockInNote(content, schema, match, changes);
        found = patched !== null;
        return patched ?? content;
      });
    } catch {
      return false;
    }
    return found;
  }
}

function patchBlockInNote<P>(
  content: string,
  schema: CodeBlockSchema<P>,
  match: CodeBlockMatch,
  changes: P,
): string | null {
  const lines = content.split("\n");
  const fence = `\`\`\`${schema.type}`;

  for (let start = 0; start < lines.length; start++) {
    if (lines[start].trim() !== fence) continue;
    const end = lines.findIndex(
      (line, index) => index > start && line.trim().startsWith("```"),
    );
    if (end === -1) return null;

    const body = lines.slice(start + 1, end).join("\n");
    const params = schema.parse(body).params as Record<string, unknown>;
    const isMatch =
      "id" in match
        ? params.id === match.id
        : params.exercise === match.exercise;

    if (isMatch) {
      const patched = schema.patch(body, changes);
      lines.splice(
        start + 1,
        end - start - 1,
        ...(patched === "" ? [] : patched.split("\n")),
      );
      return lines.join("\n");
    }
    start = end;
  }
  return null;
}
