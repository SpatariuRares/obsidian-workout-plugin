/**
 * The single CSV reader/writer for the plugin (RFC 4180).
 *
 * Quoted fields may contain commas, doubled quotes and line breaks, so rows
 * are split while parsing, never with `content.split("\n")` beforehand.
 */

/**
 * Parses CSV content into rows of raw string fields.
 * Accepts LF and CRLF line endings. Blank lines are skipped.
 */
export function parseCsv(content: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let rowHasContent = false;

  const endField = () => {
    row.push(field);
    field = "";
  };
  const endRow = () => {
    endField();
    if (rowHasContent || row.length > 1) {
      rows.push(row);
    }
    row = [];
    rowHasContent = false;
  };

  for (let i = 0; i < content.length; i++) {
    const char = content[i];

    if (inQuotes) {
      if (char === '"') {
        if (content[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      rowHasContent = true;
    } else if (char === ",") {
      endField();
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && content[i + 1] === "\n") i++;
      endRow();
    } else {
      field += char;
      if (char.trim()) rowHasContent = true;
    }
  }

  if (field !== "" || row.length > 0 || rowHasContent) {
    endRow();
  }

  return rows;
}

/**
 * Quotes a value when it contains a comma, quote or line break.
 */
export function stringifyCsvValue(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Serializes one row of values (no trailing newline).
 */
export function stringifyCsvRow(values: string[]): string {
  return values.map(stringifyCsvValue).join(",");
}

const FORMULA_START = /^[=+\-@]/;

/**
 * Prefixes values a spreadsheet would run as a formula with `'`,
 * so opening the log in Excel/Sheets cannot execute them.
 */
export function protectFormula(value: string): string {
  return FORMULA_START.test(value) ? `'${value}` : value;
}

/**
 * Reverses protectFormula, so users see the value they typed.
 */
export function unprotectFormula(value: string): string {
  return value.startsWith("'") && FORMULA_START.test(value.slice(1))
    ? value.slice(1)
    : value;
}
