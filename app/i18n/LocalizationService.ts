/**
 * @fileoverview LocalizationService - Internationalization Service
 *
 * Part of the DOE Framework - Execution Layer (E)
 * Provides deterministic translation logic using JSON locale files.
 *
 * Features:
 * - Automatic language detection via app.getUserLanguage()
 * - Fallback to English for missing translations
 * - Nested key support (e.g., "modal.titles.createLog")
 * - Parameter interpolation (e.g., "Hello {name}")
 * - Caching for performance
 * - Hot-reloading on language change
 *
 * Usage:
 * ```typescript
 * const t = LocalizationService.getInstance();
 * t('modal.titles.createLog'); // "Create workout log"
 * t('modal.notices.logCreated', { exercise: 'Squat' }); // "Squat log created!"
 * ```
 */

import { App } from "obsidian";

type TranslationParams = Record<string, string | number>;
type Translations = Record<string, unknown>;

/**
 * LocalizationService - Singleton service for i18n
 *
 * Execution Layer (E) - Deterministic translation logic
 */
export class LocalizationService {
  private static instance: LocalizationService;
  private app: App;
  private currentLocale: string;
  private translations: Translations = {};
  private fallbackTranslations: Translations = {};
  private readonly DEFAULT_LOCALE = "en";

  private constructor(app: App) {
    this.app = app;
    this.currentLocale = this.detectLanguage();
    this.loadTranslations();
  }

  /**
   * Initialize the service (must be called on plugin load)
   */
  public static initialize(app: App): void {
    if (!LocalizationService.instance) {
      LocalizationService.instance = new LocalizationService(app);
    }
  }

  /**
   * Get the singleton instance
   * Returns a safe fallback if not yet initialized (for early constant evaluation)
   */
  public static getInstance(): LocalizationService {
    if (!LocalizationService.instance) {
      // Return a dummy instance for early evaluation (before plugin.onload)
      // This allows constants to be defined without errors
      return {
        t: (key: string) => key, // Return key as fallback
        getCurrentLocale: () => "en",
        hasKey: () => false,
        reload: () => {},
        destroy: () => {},
      } as unknown as LocalizationService;
    }
    return LocalizationService.instance;
  }

  /**
   * Detect user's language from Obsidian settings
   */
  private detectLanguage(): string {
    try {
      const lang =
        window.localStorage.getItem("language") || this.DEFAULT_LOCALE;
      // Normalize language code (handle variants like "en-US" -> "en")
      return lang.split("-")[0].toLowerCase();
    } catch {
      return this.DEFAULT_LOCALE;
    }
  }

  /**
   * Load translation files for current locale and fallback
   */
  private loadTranslations(): void {
    try {
      // Load current locale
      this.translations = this.loadLocaleFile(this.currentLocale);

      // Load fallback (English)
      if (this.currentLocale !== this.DEFAULT_LOCALE) {
        this.fallbackTranslations = this.loadLocaleFile(this.DEFAULT_LOCALE);
      }
    } catch (error) {
      console.error(
        `[i18n] Error loading translations for locale "${this.currentLocale}":`,
        error,
      );
      // If loading fails, use fallback
      this.translations = this.loadLocaleFile(this.DEFAULT_LOCALE);
    }
  }

  /**
   * Load a specific locale file
   */
  private loadLocaleFile(locale: string): Translations {
    try {
      // Dynamic import of locale JSON
      // NOTE: This will be bundled by esbuild
      const localeFile = require(`./locales/${locale}.json`);
      return localeFile as Translations;
    } catch (error) {
      console.warn(`[i18n] Locale file not found: ${locale}.json`);
      // Return empty object if file doesn't exist
      return {};
    }
  }

  /**
   * Get translation for a key with optional parameters
   *
   * @param key - Translation key (supports nested keys with dot notation)
   * @param params - Optional parameters for interpolation
   * @returns Translated string or key if not found
   *
   * @example
   * t('modal.titles.createLog') // "Create workout log"
   * t('modal.notices.logCreated', { exercise: 'Squat' }) // "Squat log created!"
   */
  public t(key: string, params?: TranslationParams): string {
    // Try to get translation from current locale
    let translation = this.getNestedValue(this.translations, key);

    // Fallback to English if not found
    if (
      translation === undefined &&
      this.currentLocale !== this.DEFAULT_LOCALE
    ) {
      translation = this.getNestedValue(this.fallbackTranslations, key);
    }

    // If still not found, return the key itself (for debugging)
    if (translation === undefined) {
      console.warn(`[i18n] Translation not found for key: "${key}"`);
      return key;
    }

    // Ensure translation is a string
    const translatedString =
      typeof translation === "string" ? translation : String(translation);

    // Interpolate parameters if provided
    if (params) {
      return this.interpolate(translatedString, params);
    }

    return translatedString;
  }

  /**
   * Get nested value from object using dot notation
   *
   * @example
   * getNestedValue({ modal: { titles: { create: "Create" } } }, "modal.titles.create") // "Create"
   */
  private getNestedValue(obj: Translations, path: string): unknown {
    const keys = path.split(".");
    let current: unknown = obj;

    for (const key of keys) {
      if (current && typeof current === "object" && key in current) {
        current = (current as Record<string, unknown>)[key];
      } else {
        return undefined;
      }
    }

    return current;
  }

  /**
   * Interpolate parameters in translation string
   *
   * @example
   * interpolate("Hello {name}!", { name: "Claude" }) // "Hello Claude!"
   */
  private interpolate(template: string, params: TranslationParams): string {
    return template.replace(/\{(\w+)\}/g, (match, key) => {
      return key in params ? String(params[key]) : match;
    });
  }

  /**
   * Get current locale
   */
  public getCurrentLocale(): string {
    return this.currentLocale;
  }

  /**
   * Check if a translation key exists
   */
  public hasKey(key: string): boolean {
    return this.getNestedValue(this.translations, key) !== undefined;
  }

  /**
   * Reload translations (useful for hot-reloading during development)
   */
  public reload(): void {
    this.currentLocale = this.detectLanguage();
    this.loadTranslations();
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    this.translations = {};
    this.fallbackTranslations = {};
  }
}

/**
 * Global translation function (convenience export)
 * Safe to use before initialization (returns key as fallback)
 */
export function t(key: string, params?: TranslationParams): string {
  const instance = LocalizationService.getInstance();

  // If service not initialized yet, return key as fallback
  if (!instance || typeof instance.t !== "function") {
    return key;
  }

  return instance.t(key, params);
}
