/**
 * Generates a unique ID for code block identification.
 * Format: base36 timestamp + random suffix (e.g., "m1abc2xyz")
 */
export function generateCodeBlockId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
