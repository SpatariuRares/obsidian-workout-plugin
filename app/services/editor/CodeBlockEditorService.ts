import { App, TFile } from "obsidian";
import {
  NoteBlock,
  readWorkoutNote,
} from "@app/services/notes/WorkoutNote";
import type { CodeBlockSchema } from "@app/services/codeblocks/CodeBlockSchema";

/**
 * Which block to edit: by the `id` the insert modals write, or, for blocks
 * written before ids existed, by exercise (first match wins) or by its body
 * (the processor's `source`), within the lines Obsidian rendered it in when
 * it gives them (`MarkdownSectionInformation`: the block itself, or the
 * callout around it; none in a callout in Live Preview). A block found by
 * its body must be the only one that matches.
 */
export type CodeBlockMatch =
  | { id: string }
  | { exercise: string }
  | { body: string; lines?: { start: number; end: number } };

/** Where a rendered block is written, for its edit menu */
export interface BlockLocation {
  /** The note the block is written in */
  sourcePath: string;
  /** How to find the block when it has no id, read when the menu is used */
  matchWithoutId: () => CodeBlockMatch;
}

/** Edits code block parameters in a note */
export class CodeBlockEditorService {
  /**
   * Patch one block of the schema's type: only the changed parameters'
   * lines are rewritten (see CodeBlockSchema.patch).
   * @param path - The note the block is written in (`ctx.sourcePath`; not
   * the active note, which differs for a block embedded from another note)
   * @returns false when there is no such note or no matching block
   */
  static async patchCodeBlock<P>(
    app: App,
    schema: CodeBlockSchema<P>,
    path: string,
    match: CodeBlockMatch,
    changes: P,
  ): Promise<boolean> {
    const file = app.vault.getAbstractFileByPath(path);
    if (!(file instanceof TFile)) return false;

    let found = false;
    try {
      // Vault API, not the editor, so it works in Reading view too
      await app.vault.process(file, (content) => {
        const patched = patchBlockInNote(
          content,
          schema,
          match,
          changes,
        );
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
  const blocks = readWorkoutNote(content).blocks.filter(
    (block) => block.type === schema.type,
  );
  const block = findBlock(blocks, schema, match);
  if (!block) return null;

  const crlf = content.includes("\r\n");
  const patched = schema.patch(block.body, changes);
  const lines = content.split("\n");
  lines.splice(
    block.start + 1,
    block.end - block.start - 1,
    ...(patched === ""
      ? []
      : patched
          .split("\n")
          .map((line) => `${block.quote}${line}${crlf ? "\r" : ""}`)),
  );
  return lines.join("\n");
}

function findBlock<P>(
  blocks: NoteBlock[],
  schema: CodeBlockSchema<P>,
  match: CodeBlockMatch,
): NoteBlock | undefined {
  if ("body" in match) {
    const { body, lines } = match;
    const same = blocks.filter(
      (block) =>
        sameBody(block.body, body) &&
        (!lines || (block.start >= lines.start && block.end <= lines.end)),
    );
    return same.length === 1 ? same[0] : undefined;
  }
  return blocks.find((block) => {
    const params = schema.parse(block.body).params as Record<
      string,
      unknown
    >;
    return "id" in match
      ? params.id === match.id
      : params.exercise === match.exercise;
  });
}

/** Bodies compared without line endings and trailing spaces */
function sameBody(a: string, b: string): boolean {
  const lines = (text: string) =>
    text
      .split("\n")
      .map((line) => line.trimEnd())
      .join("\n")
      .trim();
  return lines(a) === lines(b);
}
