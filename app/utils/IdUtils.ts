/**
 * Generates a unique ID for code block identification.
 * Format: base36 timestamp + random suffix (e.g., "m1abc2xyz"), after
 * `<prefix>-` when given one (e.g., "timer-m1abc2xyz")
 */
export function generateCodeBlockId(prefix?: string): string {
  const id =
    Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  return prefix ? `${prefix}-${id}` : id;
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
