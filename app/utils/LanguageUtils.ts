import * as obsidian from "obsidian";

/**
 * Utility for detecting the user's language from Obsidian settings.
 */
export class LanguageUtils {
  private static readonly DEFAULT_LOCALE = "en";

  /**
   * Gets the app language Obsidian is set to.
   * Uses `getLanguage()` (Obsidian 1.8.7+); on older versions, where it does
   * not exist, reads the locale Obsidian set on its bundled moment.
   * Defaults to 'en' if not available.
   * @param normalize - If true, normalizes regional codes (e.g., "pt-br" → "pt-BR")
   * @returns Language code string
   */
  static getUserLanguage(normalize = false): string {
    try {
      const lang = this.readAppLanguage() || this.DEFAULT_LOCALE;

      if (normalize && lang.includes("-")) {
        const parts = lang.split("-");
        return `${parts[0].toLowerCase()}-${parts[1].toUpperCase()}`;
      }

      return normalize ? lang.toLowerCase() : lang;
    } catch {
      return this.DEFAULT_LOCALE;
    }
  }

  private static readAppLanguage(): string {
    // getLanguage is missing before Obsidian 1.8.7 (minAppVersion is lower)
    const { getLanguage } = obsidian as Partial<typeof obsidian>;
    if (typeof getLanguage === "function") {
      return getLanguage();
    }
    return obsidian.moment.locale();
  }
}
