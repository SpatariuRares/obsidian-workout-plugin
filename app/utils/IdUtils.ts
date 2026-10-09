/**
 * Generates a unique ID for code block identification.
 * Format: base36 timestamp + random suffix (e.g., "m1abc2xyz")
 */
export function generateCodeBlockId(): string {
  return (
    Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
  );
}

/**
 * Returns an ID stored on the element under `data-<key>`, creating it on
 * first use. Code block containers keep the same element across re-renders,
 * so this gives each embedded view a stable per-block ID.
 */
export function getElementScopedId(
  el: HTMLElement,
  key = "scopedId",
): string {
  el.dataset[key] ??= generateCodeBlockId();
  return el.dataset[key];
}
