/**
 * Utility class for DOM manipulation operations
 * Centralizes DOM-related helper functions
 */
export class DomUtils {
  /**
   * Helper to set multiple CSS properties on an element.
   * Custom properties (`--name`) are set with `style.setProperty`, since
   * assigning them to `style` has no effect.
   */
  static setCssProps(
    element: HTMLElement,
    props: Partial<CSSStyleDeclaration> | Record<string, string>,
  ): void {
    const standard: Record<string, unknown> = {};
    for (const [name, value] of Object.entries(props)) {
      if (name.startsWith("--") && typeof value === "string") {
        element.style.setProperty(name, value);
      } else {
        standard[name] = value;
      }
    }
    Object.assign(element.style, standard);
  }

  /**
   * Names an element so it can be focused again after its parent is drawn
   * anew (a block redrawn on every log change loses the focused element)
   */
  static setFocusKey(element: HTMLElement, key: string): void {
    element.dataset.focusKey = key;
  }

  /**
   * Focuses the element named `key` inside `root`, without scrolling it.
   * @returns Whether one was found
   */
  static focusByKey(root: HTMLElement, key: string): boolean {
    const target = Array.from(root.querySelectorAll<HTMLElement>("[data-focus-key]")).find(
      (el) => el.dataset.focusKey === key,
    );
    target?.focus({ preventScroll: true });
    return !!target;
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
