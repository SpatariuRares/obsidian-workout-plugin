/**
 * Utility class for string operations including fuzzy matching
 * Used for finding similar tags, preventing duplicates, and exercise matching
 */
export class StringUtils {
  /**
   * Normalize a string for case-insensitive comparison.
   * Strips wiki-link syntax, collapses multiple spaces, trims, and lowercases.
   *
   * @param str - String to normalize
   * @param options.stripWikiLinks - Remove Obsidian wiki-link brackets `[[` / `]]` (default: false)
   * @returns Normalized string
   *
   * @example
   * StringUtils.normalize("  Hello   World  ") // "hello world"
   * StringUtils.normalize("[[Push Day]]", { stripWikiLinks: true }) // "push day"
   */
  static normalize(
    str: string | undefined | null,
    options?: { stripWikiLinks?: boolean },
  ): string {
    if (!str) return "";
    let result = str;
    if (options?.stripWikiLinks) {
      result = result.replace(/\[\[|\]\]/g, "");
    }
    return result.replace(/\s+/g, " ").trim().toLowerCase();
  }

  /**
   * Fill a user template's `{{name}}` placeholders (the exercise block
   * template). Values are written as typed; a placeholder without a value
   * stays in the text.
   */
  static fillTemplate(
    template: string,
    vars: Record<string, string>,
  ): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match: string, name: string) =>
      Object.prototype.hasOwnProperty.call(vars, name) ? vars[name] : match,
    );
  }

  /**
   * Capitalize the first letter of each word (Title Case).
   *
   * @param str - String to capitalize
   * @returns Title-cased string, e.g. "bench press" → "Bench Press"
   */
  static capitalize(str: string | undefined | null): string {
    if (!str) return "";
    return str
      .trim()
      .replace(/\s+/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  /**
   * An identifier in snake_case as Title Case words ("rear_delts" →
   * "Rear Delts"). `capitalize` alone would keep "Rear_delts": `_` is a
   * word character for `\b\w`.
   */
  static humanize(str: string | undefined | null): string {
    return this.capitalize(str?.replace(/_/g, " "));
  }

  /**
   * Calculate semantic match score between two strings
   * Uses heuristics like prefix/suffix matching and word containment
   * Best for exercise name matching where semantic similarity matters
   *
   * @param str1 First string
   * @param str2 Second string
   * @returns Score from 0-100 indicating similarity
   */
  static getMatchScore(str1: string, str2: string): number {
    const s1 = this.normalize(str1);
    const s2 = this.normalize(str2);

    if (s1 === s2) return 100;
    if (s1.startsWith(s2) || s2.startsWith(s1)) return 90;
    if (s1.endsWith(s2) || s2.endsWith(s1)) return 80;

    const words1 = s1.split(/\s+/);
    const words2 = s2.split(/\s+/);

    // Check if all words from one string are contained in the other
    const allWords1In2 = words1.every((word) => s2.includes(word));
    const allWords2In1 = words2.every((word) => s1.includes(word));

    if (allWords1In2 || allWords2In1) return 70;

    // Check for partial word matches
    const commonWords = words1.filter((word) =>
      words2.includes(word),
    );
    if (commonWords.length > 0) return 60;

    // Check for substring match
    if (s1.includes(s2) || s2.includes(s1)) return 50;

    return 0;
  }

  /**
   * Calculate the Levenshtein (edit) distance between two strings
   * Uses case-insensitive comparison
   *
   * @param a First string
   * @param b Second string
   * @returns Number of single-character edits (insertions, deletions, substitutions) needed
   */
  static levenshteinDistance(a: string, b: string): number {
    const aLower = a.toLowerCase();
    const bLower = b.toLowerCase();

    // Create matrix of size (a.length + 1) x (b.length + 1)
    const matrix: number[][] = [];

    // Initialize first column (cost of deleting all characters from a)
    for (let i = 0; i <= aLower.length; i++) {
      matrix[i] = [i];
    }

    // Initialize first row (cost of inserting all characters of b)
    for (let j = 0; j <= bLower.length; j++) {
      matrix[0][j] = j;
    }

    // Fill in the rest of the matrix
    for (let i = 1; i <= aLower.length; i++) {
      for (let j = 1; j <= bLower.length; j++) {
        const cost = aLower[i - 1] === bLower[j - 1] ? 0 : 1;

        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1, // deletion
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j - 1] + cost, // substitution
        );
      }
    }

    return matrix[aLower.length][bLower.length];
  }

  /**
   * The values of a haystack within `max` edits of the needle (Levenshtein,
   * case-insensitive), with their distance, closest first, then
   * alphabetically. `min` leaves out closer values (min: 1 skips the needle
   * itself).
   */
  static findSimilar(
    needle: string,
    haystack: string[],
    { max, min = 0 }: { max: number; min?: number },
  ): Array<{ value: string; distance: number }> {
    return haystack
      .map((value) => ({
        value,
        distance: this.levenshteinDistance(needle, value),
      }))
      .filter(({ distance }) => distance >= min && distance <= max)
      .sort(
        (a, b) => a.distance - b.distance || a.value.localeCompare(b.value),
      );
  }
}
