/**
 * Utility class for string operations including fuzzy matching
 * Used for finding similar tags, preventing duplicates, and exercise matching
 */
export class StringUtils {
  /**
   * Normalize a string for case-insensitive comparison
   * Trims whitespace and converts to lowercase
   *
   * @param str - String to normalize
   * @returns Normalized string (trimmed and lowercase)
   *
   * @example
   * StringUtils.normalize("  Hello World  ") // "hello world"
   * StringUtils.normalize("CHEST") // "chest"
   */
  static normalize(str: string): string {
    return str.trim().toLowerCase();
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
    const commonWords = words1.filter((word) => words2.includes(word));
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
          matrix[i - 1][j - 1] + cost // substitution
        );
      }
    }

    return matrix[aLower.length][bLower.length];
  }

  /**
   * Find strings in a haystack that are similar to a needle string
   * Uses Levenshtein distance for fuzzy matching with case-insensitive comparison
   *
   * @param needle The string to search for
   * @param haystack Array of strings to search in
   * @param maxDistance Maximum edit distance to consider a match (inclusive)
   * @returns Array of strings from haystack within maxDistance, sorted by distance (closest first)
   */
  static findSimilarStrings(
    needle: string,
    haystack: string[],
    maxDistance: number
  ): string[] {
    const matches: Array<{ str: string; distance: number }> = [];

    for (const str of haystack) {
      const distance = this.levenshteinDistance(needle, str);
      if (distance <= maxDistance) {
        matches.push({ str, distance });
      }
    }

    // Sort by distance (closest first), then alphabetically for ties
    matches.sort((a, b) => {
      if (a.distance !== b.distance) {
        return a.distance - b.distance;
      }
      return a.str.localeCompare(b.str);
    });

    return matches.map((m) => m.str);
  }
}
