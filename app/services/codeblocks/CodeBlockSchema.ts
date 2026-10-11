import { t } from "@app/i18n";

/*
 * One schema per code block type (workout-log, workout-chart, ...). The
 * schema lists every parameter with its type, default and allowed values;
 * parsing, validation, writing a new block and patching an existing one all
 * come from it, so the parameter set lives in one place.
 */

interface StringField {
  kind: "string";
  default?: string;
}
interface NumberField {
  kind: "number";
  default?: number;
  min?: number;
  max?: number;
}
interface BooleanField {
  kind: "boolean";
  default?: boolean;
}
interface EnumField<V extends string = string> {
  kind: "enum";
  values: readonly V[];
  default?: V;
}
/** `[a, b]` or `a, b` */
interface ListField {
  kind: "list";
  default?: string[];
}
/** A number (pixels) or a CSS length such as `50vh` */
interface SizeField {
  kind: "size";
  default?: number | string;
}

export type FieldSpec =
  | StringField
  | NumberField
  | BooleanField
  | EnumField
  | ListField
  | SizeField;

type FieldValue<F> = F extends EnumField<infer V>
  ? V
  : F extends StringField
    ? string
    : F extends NumberField
      ? number
      : F extends BooleanField
        ? boolean
        : F extends ListField
          ? string[]
          : F extends SizeField
            ? number | string
            : never;

export type ParamsOf<Fields extends Record<string, FieldSpec>> = {
  -readonly [K in keyof Fields]?: FieldValue<Fields[K]>;
};

/** The parameter type of a schema, e.g. `BlockParams<typeof tableBlock>` */
export type BlockParams<S> = S extends CodeBlockSchema<infer P> ? P : never;

export interface ParseResult<P> {
  /** Only the parameters written in the block, typed */
  params: P;
  /** One message per parameter whose value doesn't fit its type */
  errors: string[];
}

export interface CodeBlockSchema<P> {
  /** The code block language, e.g. `workout-log` */
  readonly type: string;
  /** Parameters that have a default, with that default */
  readonly defaults: P;
  /**
   * Read a block body (the text between the fences). Comments (`#`),
   * blank lines and unknown keys are skipped; a repeated key keeps its
   * last value. Invalid values are reported in `errors` and left out.
   */
  parse(source: string): ParseResult<P>;
  /** Write a whole block (fences included), parameters in schema order */
  serialize(params: P): string;
  /**
   * Apply changes to a block body, touching only the changed lines: a
   * changed key is rewritten where it is, a new key is appended, a key set
   * to undefined is removed. Everything else is kept as typed.
   */
  patch(source: string, changes: P): string;
}

/** The parameters whose value differs between two snapshots of a form */
export function changedParams<P extends object>(before: P, after: P): P {
  const changes: Record<string, unknown> = {};
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  for (const key of keys) {
    const a = (before as Record<string, unknown>)[key];
    const b = (after as Record<string, unknown>)[key];
    if (JSON.stringify(a) !== JSON.stringify(b)) changes[key] = b;
  }
  return changes as P;
}

export function defineCodeBlock<
  const Fields extends Record<string, FieldSpec>,
>(type: string, fields: Fields): CodeBlockSchema<ParamsOf<Fields>> {
  type P = ParamsOf<Fields>;
  const keys = Object.keys(fields);

  const defaults: Record<string, unknown> = {};
  for (const key of keys) {
    if (fields[key].default !== undefined) defaults[key] = fields[key].default;
  }

  return {
    type,
    defaults: defaults as P,

    parse(source) {
      const params: Record<string, unknown> = {};
      const errors: string[] = [];
      for (const { key, value } of readLines(source)) {
        const field = fields[key];
        if (!field) continue;
        const result = readValue(key, value, field);
        if ("error" in result) {
          delete params[key];
          errors.push(result.error);
        } else {
          params[key] = result.value;
        }
      }
      return { params: params as P, errors };
    },

    serialize(params) {
      const lines = [`\`\`\`${type}`];
      for (const key of keys) {
        const value = (params as Record<string, unknown>)[key];
        if (value !== undefined) lines.push(`${key}: ${writeValue(value)}`);
      }
      lines.push("```");
      return lines.join("\n");
    },

    patch(source, changes) {
      const lines = source === "" ? [] : source.split("\n");
      for (const [key, value] of Object.entries(changes)) {
        if (!fields[key]) continue;
        const indices = lines
          .map((line, index) => (lineKey(line) === key ? index : -1))
          .filter((index) => index !== -1);

        if (value === undefined) {
          for (const index of indices.reverse()) lines.splice(index, 1);
          continue;
        }

        const text = `${key}: ${writeValue(value)}`;
        if (indices.length === 0) {
          // Keep a trailing newline at the end of the body
          const end =
            lines.length > 0 && lines[lines.length - 1].trim() === ""
              ? lines.length - 1
              : lines.length;
          lines.splice(end, 0, text);
          continue;
        }
        // A repeated key reads as its last value: rewrite that one, drop the rest
        const last = indices[indices.length - 1];
        const indent = lines[last].match(/^\s*/)?.[0] ?? "";
        lines[last] = indent + text;
        for (const index of indices.slice(0, -1).reverse()) {
          lines.splice(index, 1);
        }
      }
      return lines.join("\n");
    },
  };
}

function lineKey(line: string): string | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) return null;
  const colon = trimmed.indexOf(":");
  return colon > 0 ? trimmed.substring(0, colon).trim() : null;
}

function readLines(source: string): Array<{ key: string; value: string }> {
  const entries: Array<{ key: string; value: string }> = [];
  for (const line of source.split("\n")) {
    const key = lineKey(line);
    if (!key) continue;
    const trimmed = line.trim();
    entries.push({
      key,
      value: trimmed.substring(trimmed.indexOf(":") + 1).trim(),
    });
  }
  return entries;
}

/** Strip one pair of matching wrapping quotes ("x" or 'x') */
function unquote(value: string): string {
  const first = value.charAt(0);
  if (
    value.length >= 2 &&
    (first === '"' || first === "'") &&
    value.charAt(value.length - 1) === first
  ) {
    return value.slice(1, -1);
  }
  return value;
}

function readValue(
  key: string,
  raw: string,
  field: FieldSpec,
): { value: unknown } | { error: string } {
  const value = unquote(raw);
  switch (field.kind) {
    case "string":
      return { value };
    case "number": {
      const num = Number(value);
      if (value === "" || !Number.isFinite(num)) {
        return { error: t("codeBlocks.validation.notANumber", { key, value }) };
      }
      const { min, max } = field;
      if ((min !== undefined && num < min) || (max !== undefined && num > max)) {
        return {
          error:
            max === undefined
              ? t("codeBlocks.validation.tooSmall", { key, min: String(min), value })
              : t("codeBlocks.validation.outOfRange", {
                  key,
                  min: String(min ?? ""),
                  max: String(max),
                  value,
                }),
        };
      }
      return { value: num };
    }
    case "boolean":
      if (value === "true") return { value: true };
      if (value === "false") return { value: false };
      return { error: t("codeBlocks.validation.notABoolean", { key, value }) };
    case "enum":
      if (field.values.includes(value)) return { value };
      return {
        error: t("codeBlocks.validation.notOneOf", {
          key,
          value,
          allowed: field.values.join(", "),
        }),
      };
    case "list": {
      const inner =
        raw.startsWith("[") && raw.endsWith("]") ? raw.slice(1, -1) : raw;
      return {
        value: inner
          .split(",")
          .map((item) => unquote(item.trim()))
          .filter((item) => item.length > 0),
      };
    }
    case "size": {
      const num = Number(value);
      return { value: value !== "" && Number.isFinite(num) ? num : value };
    }
  }
}

function writeValue(value: unknown): string {
  return Array.isArray(value) ? `[${value.join(", ")}]` : String(value);
}
