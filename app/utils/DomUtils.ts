/**
 * Utility class for DOM manipulation operations
 * Centralizes DOM-related helper functions
 */
export class DomUtils {
  /**
   * Helper to set multiple CSS properties on an element
   */
  static setCssProps(
    element: HTMLElement,
    props: Partial<CSSStyleDeclaration> | Record<string, string>
  ): void {
    Object.assign(element.style, props);
  }
}

 