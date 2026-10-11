import type { TFile } from "obsidian";
import type { ExercisePage } from "@app/services/exercise/ExerciseLibrary";
import { ExerciseMatchUtils } from "@app/utils/exercise/ExerciseMatchUtils";
import { StringUtils } from "@app/utils/StringUtils";

export interface MismatchEntry {
  file: TFile;
  fileName: string;
  /** The name the page is known by: its frontmatter name, else its file name */
  canonicalName: string;
  /** Closest exercise name in the log, "" when there is none */
  closestMatch: string;
  score: number;
}

/**
 * Exercise pages none of whose names appear in the log, each with the
 * closest log name. Worst matches first.
 */
export function findNameMismatches(
  pages: ExercisePage[],
  logNames: string[],
): MismatchEntry[] {
  const originals = [
    ...new Map(
      logNames
        .filter((name) => name)
        .map((name) => [StringUtils.normalize(name), name]),
    ).values(),
  ];
  const known = new Set(originals.map((name) => StringUtils.normalize(name)));

  const mismatches: MismatchEntry[] = [];
  for (const page of pages) {
    if (page.names.some((name) => known.has(StringUtils.normalize(name)))) {
      continue;
    }
    const canonicalName = page.names[1] ?? page.names[0];
    const normalized = StringUtils.normalize(canonicalName);

    let closestMatch = "";
    let score = 0;
    for (const original of originals) {
      const s = ExerciseMatchUtils.getMatchScore(
        normalized,
        StringUtils.normalize(original),
      );
      if (s > score) {
        score = s;
        closestMatch = original;
      }
    }

    mismatches.push({
      file: page.file,
      fileName: page.file.basename,
      canonicalName,
      closestMatch,
      score,
    });
  }

  return mismatches.sort((a, b) => a.score - b.score);
}
