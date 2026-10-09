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
    props: Partial<CSSStyleDeclaration> | Record<string, string>,
  ): void {
    Object.assign(element.style, props);
  }

  /**
   * Keeps the focused form field inside `root` visible above the on-screen
   * keyboard (iOS overlays the keyboard instead of resizing the page).
   * Pads `root` by the keyboard height so fields near the bottom can scroll
   * up, and scrolls the focused field to the center.
   * Returns a cleanup function that removes listeners and padding.
   */
  static keepFocusedFieldVisible(
    root: HTMLElement,
    viewport: VisualViewport | null = window.visualViewport,
  ): () => void {
    const KEYBOARD_ANIMATION_MS = 300;
    let timer: number | undefined;

    const isFormField = (el: Element | null): el is HTMLElement =>
      el instanceof HTMLInputElement ||
      el instanceof HTMLTextAreaElement ||
      el instanceof HTMLSelectElement;

    const scrollActiveField = () => {
      const active = document.activeElement;
      if (isFormField(active) && root.contains(active)) {
        active.scrollIntoView({ block: "center" });
      }
    };

    const onFocusIn = (event: FocusEvent) => {
      if (!isFormField(event.target as Element | null)) return;
      window.clearTimeout(timer);
      timer = window.setTimeout(scrollActiveField, KEYBOARD_ANIMATION_MS);
    };

    const onViewportResize = () => {
      if (!viewport) return;
      const keyboardHeight = Math.max(
        0,
        window.innerHeight - viewport.height - viewport.offsetTop,
      );
      if (keyboardHeight > 0) {
        root.style.paddingBottom = `${keyboardHeight}px`;
      } else {
        root.style.removeProperty("padding-bottom");
      }
      scrollActiveField();
    };

    root.addEventListener("focusin", onFocusIn);
    viewport?.addEventListener("resize", onViewportResize);

    return () => {
      window.clearTimeout(timer);
      root.removeEventListener("focusin", onFocusIn);
      viewport?.removeEventListener("resize", onViewportResize);
      root.style.removeProperty("padding-bottom");
    };
  }
}
