import { App } from "obsidian";
import { generateCodeBlockId } from "@app/utils/IdUtils";
import { readWorkoutNote } from "@app/services/notes/WorkoutNote";
import { tableBlock } from "@app/features/tables/tableBlock";
import { timerBlock } from "@app/features/timer/timerBlock";

/** Blocks the edit modals find by id */
const SCHEMAS = [tableBlock, timerBlock];

/** Adds an `id:` line to every log and timer block that has none */
export function addMissingBlockIds(content: string): {
  content: string;
  modified: boolean;
  added: number;
} {
  const missing = readWorkoutNote(content).blocks.filter((block) => {
    const schema = SCHEMAS.find((s) => s.type === block.type);
    return schema !== undefined && !schema.parse(block.body).params.id;
  });
  if (missing.length === 0) return { content, modified: false, added: 0 };

  const crlf = content.includes("\r\n");
  const lines = content.split("\n");
  const ids = missing.map((block) => ({ block, id: `id: ${generateCodeBlockId()}` }));
  // Insert bottom-up, so earlier line numbers stay valid
  for (const { block, id } of ids.reverse()) {
    lines.splice(block.start + 1, 0, crlf ? `${id}\r` : id);
  }
  return { content: lines.join("\n"), modified: true, added: missing.length };
}

export interface BlockIdMigrationResult {
  totalAdded: number;
  modifiedFiles: number;
}

export async function runAddMissingBlockIds(
  app: App,
): Promise<BlockIdMigrationResult> {
  // Vault-wide on purpose: the migration covers every note with a plugin block
  const files = app.vault.getMarkdownFiles();
  let totalAdded = 0;
  let modifiedFiles = 0;

  for (const file of files) {
    const content = await app.vault.read(file);
    const result = addMissingBlockIds(content);
    if (result.modified) {
      await app.vault.modify(file, result.content);
      modifiedFiles++;
      totalAdded += result.added;
    }
  }

  return { totalAdded, modifiedFiles };
}
