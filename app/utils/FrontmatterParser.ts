/**
 * Utility for parsing YAML frontmatter from markdown files
 * Centralizes frontmatter parsing logic used across the application
 */
export class FrontmatterParser {
  /**
   * Extract frontmatter section from markdown content
   */
  static extractFrontmatter(content: string): string | null {
    const frontmatterMatch = content.match(/^---\s*\n(.*?)\n---/s);
    return frontmatterMatch ? frontmatterMatch[1] : null;
  }

  /**
   * Parse tags from frontmatter YAML
   * Returns an array of tag strings
   */
  static parseTags(content: string): string[] {
    const frontmatter = this.extractFrontmatter(content);
    if (!frontmatter) {
      return [];
    }

    const tagsMatch = frontmatter.match(/tags:\s*\n((?:\s*-\s*.+\n?)*)/);
    if (!tagsMatch) {
      return [];
    }

    return tagsMatch[1]
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.startsWith("- "))
      .map((line) => line.substring(2).trim())
      .filter((tag) => tag.length > 0);
  }

  /**
   * Check if content has valid frontmatter
   */
  static hasFrontmatter(content: string): boolean {
    return this.extractFrontmatter(content) !== null;
  }

  /**
   * Check if frontmatter contains tags section
   */
  static hasTags(content: string): boolean {
    const frontmatter = this.extractFrontmatter(content);
    if (!frontmatter) {
      return false;
    }
    return /tags:\s*\n/.test(frontmatter);
  }

  /**
   * Parse a specific field from frontmatter
   */
  static parseField(content: string, fieldName: string): string | null {
    const frontmatter = this.extractFrontmatter(content);
    if (!frontmatter) {
      return null;
    }

    const fieldRegex = new RegExp(`${fieldName}:\\s*(.+)`, "i");
    const match = frontmatter.match(fieldRegex);
    return match ? match[1].trim() : null;
  }

  /**
   * Parse all frontmatter fields into a key-value object
   */
  static parseAllFields(content: string): Record<string, string> {
    const frontmatter = this.extractFrontmatter(content);
    if (!frontmatter) {
      return {};
    }

    const fields: Record<string, string> = {};
    const lines = frontmatter.split("\n");

    for (const line of lines) {
      const match = line.match(/^(\w+):\s*(.+)$/);
      if (match) {
        fields[match[1]] = match[2].trim();
      }
    }

    return fields;
  }

  /**
   * Validate frontmatter structure
   * Returns an array of validation errors (empty if valid)
   */
  static validateFrontmatter(content: string): string[] {
    const errors: string[] = [];

    // Check if content is empty
    if (!content.trim()) {
      errors.push("File is empty");
      return errors;
    }

    // Check for frontmatter
    if (!this.hasFrontmatter(content)) {
      errors.push("No frontmatter found");
      return errors;
    }

    // Check for tags
    if (!this.hasTags(content)) {
      errors.push("No tags found");
    }

    return errors;
  }
}
