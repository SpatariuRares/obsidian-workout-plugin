/**
 * `n` rounded to 2 decimals, as a number (weights, volumes, averages): the
 * one rounding of stored and computed figures. Has no imports, so the log
 * codec and the unit conversions can use it (`FormatUtils` pulls in the UI
 * constants).
 */
export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
