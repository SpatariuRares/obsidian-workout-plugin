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
  /** The lines between the fences, without `quote` (parse it with the block's schema) */
  body: string;
  /** Line index of the opening and of the closing fence */
  start: number;
  end: number;
  /**
   * The blockquote markers before the opening fence ("> " in a callout),
   * to put back on every line written into the block; "" outside one
   */
  quote: string;
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
 * `\n`-separated lines; a trailing `\r` is ignored. Blocks inside a callout
 * or blockquote count; blocks shown inside a longer fence (e.g. a ````markdown
 * example) are not blocks.
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
    const opening = unquote(lines[i]);
    const fence = /^\s*(`{3,}|~{3,})\s*(\S*)\s*$/.exec(opening.rest);
    if (fence) {
      const [, marks, info] = fence;
      const end = closingFence(lines, i + 1, marks, opening.depth);
      if (end === -1) {
        // An unclosed fence runs to the end of the note, or of its callout
        if (opening.depth === 0) break;
        continue;
      }
      if (BLOCK_TYPES.has(info)) {
        const block: NoteBlock = {
          type: info,
          body: lines
            .slice(i + 1, end)
            .map((line) => unquote(line, opening.depth).rest)
            .join("\n"),
          start: i,
          end,
          quote: opening.quote,
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

/**
 * Index of the line closing a fence opened with `marks` inside `depth`
 * blockquote levels, or -1 when the note or the callout ends first
 */
function closingFence(
  lines: string[],
  from: number,
  marks: string,
  depth: number,
): number {
  const char = marks[0] === "`" ? "`" : "~";
  const closing = new RegExp(`^\\s*\\${char}{${marks.length},}\\s*$`);
  for (let j = from; j < lines.length; j++) {
    const line = unquote(lines[j], depth);
    if (line.depth < depth) return -1;
    if (closing.test(line.rest)) return j;
  }
  return -1;
}

/** Splits up to `maxDepth` blockquote markers (`> `) off the start of a line */
function unquote(
  line: string,
  maxDepth = Infinity,
): { quote: string; depth: number; rest: string } {
  let quote = "";
  let depth = 0;
  let marker: RegExpExecArray | null;
  while (
    depth < maxDepth &&
    (marker = /^[ \t]*>[ \t]?/.exec(line.slice(quote.length)))
  ) {
    quote += marker[0];
    depth++;
  }
  return { quote, depth, rest: line.slice(quote.length) };
}
