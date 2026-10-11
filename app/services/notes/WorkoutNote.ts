/** Code block types this plugin renders */
const BLOCK_TYPES = new Set([
  "workout-log",
  "workout-timer",
  "workout-chart",
  "workout-dashboard",
  "workout-duration",
]);

/** One of the plugin's code blocks in a note */
export interface NoteBlock {
  /** "workout-log", "workout-timer", … */
  type: string;
  /** The lines between the fences (parse it with the block's schema) */
  body: string;
  /** Line index of the opening and of the closing fence */
  start: number;
  end: number;
}

/** A part of the note under one level-2 heading (null: before the first) */
export interface NoteSection {
  heading: string | null;
  /** The section's lines outside code blocks, heading excluded */
  text: string;
  blocks: NoteBlock[];
}

/**
 * Reads a workout note: its plugin code blocks (with line ranges, so they
 * can be rewritten in place) and its level-2 sections. Line numbers count
 * `\n`-separated lines; a trailing `\r` is ignored. Blocks shown inside a
 * longer fence (e.g. a ````markdown example) are not blocks.
 */
export function readWorkoutNote(content: string): {
  blocks: NoteBlock[];
  sections: NoteSection[];
} {
  const lines = content.split("\n").map((line) => line.replace(/\r$/, ""));
  const blocks: NoteBlock[] = [];
  const sections: NoteSection[] = [];
  let section: NoteSection & { lines: string[] } = {
    heading: null,
    text: "",
    blocks: [],
    lines: [],
  };

  const closeSection = () => {
    const { lines: prose, ...rest } = section;
    sections.push({ ...rest, text: prose.join("\n").trim() });
  };

  for (let i = 0; i < lines.length; i++) {
    const fence = /^\s*(`{3,}|~{3,})\s*(\S*)\s*$/.exec(lines[i]);
    if (fence) {
      const [, marks, info] = fence;
      const end = closingFence(lines, i + 1, marks);
      if (end === -1) break; // an unclosed fence runs to the end of the note
      if (BLOCK_TYPES.has(info)) {
        const block: NoteBlock = {
          type: info,
          body: lines.slice(i + 1, end).join("\n"),
          start: i,
          end,
        };
        blocks.push(block);
        section.blocks.push(block);
      }
      i = end;
      continue;
    }

    const heading = /^##\s+(.+?)\s*#*\s*$/.exec(lines[i]);
    if (heading) {
      closeSection();
      section = { heading: heading[1], text: "", blocks: [], lines: [] };
    } else {
      section.lines.push(lines[i]);
    }
  }
  closeSection();

  return {
    blocks,
    sections: sections.filter(
      (s) => s.heading !== null || s.text || s.blocks.length > 0,
    ),
  };
}

/** Index of the line closing a fence opened with `marks`, or -1 */
function closingFence(lines: string[], from: number, marks: string): number {
  const char = marks[0] === "`" ? "`" : "~";
  const closing = new RegExp(`^\\s*\\${char}{${marks.length},}\\s*$`);
  for (let j = from; j < lines.length; j++) {
    if (closing.test(lines[j])) return j;
  }
  return -1;
}
