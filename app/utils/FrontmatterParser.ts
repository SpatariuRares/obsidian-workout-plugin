import { CONSTANTS } from "@app/constants/Constants";
import { parseYaml } from "obsidian";
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

    const parsed = parseYaml(frontmatter);
    if (!parsed || !parsed.tags) {
      return [];
    }

    return Array.isArray(parsed.tags) ? parsed.tags : [];
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
   * Case-insensitive field name lookup
   */
  static parseField(content: string, fieldName: string): string | null {
    const frontmatter = this.extractFrontmatter(content);
    if (!frontmatter) {
      return null;
    }

    const parsed = parseYaml(frontmatter);
    if (!parsed) {
      return null;
    }

    // Case-insensitive field lookup
    const lowerFieldName = fieldName.toLowerCase();
    for (const key of Object.keys(parsed)) {
      if (key.toLowerCase() === lowerFieldName) {
        const value = parsed[key];
        return typeof value === "string" ? value : null;
      }
    }

    return null;
  }

  /**
   * Parse all frontmatter fields into a key-value object
   * Only returns simple string fields (excludes arrays and objects)
   */
  static parseAllFields(content: string): Record<string, string> {
    const frontmatter = this.extractFrontmatter(content);
    if (!frontmatter) {
      return {};
    }

    const parsed = parseYaml(frontmatter);
    if (!parsed) {
      return {};
    }

    const fields: Record<string, string> = {};
    for (const [key, value] of Object.entries(parsed)) {
      // Only include simple string values
      if (typeof value === "string") {
        fields[key] = value;
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
      errors.push(CONSTANTS.WORKOUT.MESSAGES.ERRORS.FILE_EMPTY);
      return errors;
    }

    // Check for frontmatter
    if (!this.hasFrontmatter(content)) {
      errors.push(CONSTANTS.WORKOUT.MESSAGES.ERRORS.NO_FRONTMATTER);
      return errors;
    }

    // Check for tags
    if (!this.hasTags(content)) {
      errors.push(CONSTANTS.WORKOUT.MESSAGES.ERRORS.NO_TAGS);
    }

    return errors;
  }
}
