/**
 * Utility for detecting the user's language from Obsidian settings.
 */
export class LanguageUtils {
  private static readonly DEFAULT_LOCALE = "en";

  /**
   * Gets the user's language from Obsidian's localStorage.
   * Defaults to 'en' if not available.
   * @param normalize - If true, normalizes regional codes (e.g., "pt-br" → "pt-BR")
   * @returns Language code string
   */
  static getUserLanguage(normalize = false): string {
    try {
      const lang =
        window.localStorage.getItem("language") || this.DEFAULT_LOCALE;

      if (normalize && lang.includes("-")) {
        const parts = lang.split("-");
        return `${parts[0].toLowerCase()}-${parts[1].toUpperCase()}`;
      }

      return normalize ? lang.toLowerCase() : lang;
    } catch {
      return this.DEFAULT_LOCALE;
    }
  }
}
