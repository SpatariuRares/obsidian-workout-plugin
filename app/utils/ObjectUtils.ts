/**
 * The object without its keys whose value is undefined (null, 0, "" and
 * false stay), so spreading it never overwrites a value with undefined and
 * objects compare cleanly.
 */
export function withoutUndefined<T extends object>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter(([, v]) => v !== undefined),
  ) as T;
}
