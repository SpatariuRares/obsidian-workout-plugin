import { App } from "obsidian";
import { generateCodeBlockId } from "@app/utils/IdUtils";

const TARGET_BLOCKS = ["workout-log", "workout-timer"];

function addMissingBlockIds(content: string): {
  content: string;
  modified: boolean;
  added: number;
} {
  const lines = content.split("\n");
  let added = 0;
  let i = 0;

  while (i < lines.length) {
    const trimmed = lines[i].trim();
    const matchedType = TARGET_BLOCKS.find(
      (type) => trimmed === `\`\`\`${type}`,
    );

    if (matchedType) {
      let hasId = false;
      let blockEnd = -1;

      for (let j = i + 1; j < lines.length; j++) {
        const inner = lines[j].trim();
        if (inner === "```") {
          blockEnd = j;
          break;
        }
        if (inner.startsWith("id:")) {
          hasId = true;
        }
      }

      if (!hasId && blockEnd !== -1) {
        lines.splice(i + 1, 0, `id: ${generateCodeBlockId()}`);
        added++;
        i = blockEnd + 2; // account for the inserted line
        continue;
      }
    }

    i++;
  }

  return { content: lines.join("\n"), modified: added > 0, added };
}

export interface BlockIdMigrationResult {
  totalAdded: number;
  modifiedFiles: number;
}

export async function runAddMissingBlockIds(
  app: App,
): Promise<BlockIdMigrationResult> {
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
