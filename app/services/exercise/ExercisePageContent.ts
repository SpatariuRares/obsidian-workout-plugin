import { parseYaml, stringifyYaml } from "obsidian";
import type {
  ExerciseDefinition,
  ParameterDefinition,
} from "@app/types/ExerciseTypes";
import { getExerciseTypeById } from "@app/constants/exerciseTypes.constants";
import {
  readWorkoutNote,
  replaceBlockLines,
} from "@app/services/notes/WorkoutNote";
import type { CodeBlockSchema } from "@app/services/codeblocks/CodeBlockSchema";
import { tableBlock } from "@app/features/tables/tableBlock";
import { setsBlock } from "@app/features/tables/setsBlock";
import { chartBlock } from "@app/features/charts/chartBlock";

/**
 * Writes exercise pages (see "Exercise Pages" in CONTEXT.md), the notes
 * `ExerciseLibrary` finds by `exercise_name`. The frontmatter is real YAML
 * (`stringifyYaml`), so a name holding `:` or `#` still reads back, and the
 * plugin's blocks come from their schemas.
 */

/** The exercise name the blank template's blocks hold until it is filled in */
const TEMPLATE_EXERCISE = "name";

/** Blocks of a page that name an exercise */
const EXERCISE_BLOCKS: CodeBlockSchema<{ exercise?: string }, unknown>[] = [
  tableBlock,
  setsBlock,
  chartBlock,
];

/** The frontmatter fields of an exercise page, in the order they are written */
export function exercisePageFrontmatter(
  definition: ExerciseDefinition,
): Record<string, unknown> {
  const frontmatter: Record<string, unknown> = {
    exercise_name: definition.name,
    exercise_type: definition.typeId,
  };
  if (definition.muscleGroups && definition.muscleGroups.length > 0) {
    frontmatter.tags = [...definition.muscleGroups];
  }
  if (definition.customParameters && definition.customParameters.length > 0) {
    frontmatter.parameters = definition.customParameters.map(parameterYaml);
  }
  return frontmatter;
}

/**
 * A new exercise page: its frontmatter, then `body` (by default a title, a
 * description to fill in, the exercise's log and its chart)
 */
export function exercisePageContent(
  definition: ExerciseDefinition,
  body: string = defaultBody(definition.name),
): string {
  return withFrontmatter(exercisePageFrontmatter(definition), body);
}

/**
 * The blank exercise page template (`exercise-page.md` in the template
 * folder): empty fields, and blocks naming the placeholder exercise that
 * `fillExercisePageTemplate` replaces
 */
export function exercisePageTemplate(): string {
  return withFrontmatter(
    { exercise_name: "", exercise_type: "", tags: [] },
    `# Description

Type:

# Execution Technique



# Safety Notes

-

# Performance Log

${tableBlock.serialize({ exercise: TEMPLATE_EXERCISE })}

### Chart

${chartBlock.serialize({ exercise: TEMPLATE_EXERCISE })}
`,
  );
}

/**
 * An exercise page made from a template (the user's, or the blank one): the
 * definition's fields over the template's own frontmatter (fields it leaves
 * empty are dropped), an empty `Type:` line gets the type's name, and every
 * block naming the placeholder exercise names this one
 */
export function fillExercisePageTemplate(
  template: string,
  definition: ExerciseDefinition,
  /** The type's name, for a type the user made (built-in ones are known here) */
  typeNameOf?: string,
): string {
  const { frontmatter, body } = splitFrontmatter(template);
  const fields: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(frontmatter)) {
    if (!isEmpty(value)) fields[key] = value;
  }
  Object.assign(fields, exercisePageFrontmatter(definition));

  const typeName =
    getExerciseTypeById(definition.typeId)?.name ?? typeNameOf ?? definition.typeId;
  const filled = nameBlocks(body, definition.name).replace(
    /^Type:[ \t]*$/m,
    `Type: ${typeName}`,
  );
  return withFrontmatter(fields, filled);
}

function defaultBody(name: string): string {
  return `# ${name}

## Description



## Log

${tableBlock.serialize({ exercise: name })}

## Chart

${chartBlock.serialize({ exercise: name })}
`;
}

function withFrontmatter(
  frontmatter: Record<string, unknown>,
  body: string,
): string {
  const yaml = stringifyYaml(frontmatter);
  return `---\n${yaml}${yaml.endsWith("\n") ? "" : "\n"}---\n\n${body}`;
}

/** Only the fields a parameter sets, so none is written as `null` */
function parameterYaml(param: ParameterDefinition): Record<string, unknown> {
  const yaml: Record<string, unknown> = {
    key: param.key,
    label: param.label,
    type: param.type,
  };
  if (param.unit) yaml.unit = param.unit;
  yaml.required = param.required;
  if (param.default !== undefined) yaml.default = param.default;
  if (param.min !== undefined) yaml.min = param.min;
  if (param.max !== undefined) yaml.max = param.max;
  return yaml;
}

function splitFrontmatter(content: string): {
  frontmatter: Record<string, unknown>;
  body: string;
} {
  const match = /^---\r?\n([\s\S]*?)\r?\n?---[ \t]*(?:\r?\n|$)/.exec(content);
  if (!match) return { frontmatter: {}, body: content };
  let frontmatter: Record<string, unknown> = {};
  try {
    const parsed: unknown = parseYaml(match[1]);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      frontmatter = parsed as Record<string, unknown>;
    }
  } catch {
    // An unreadable template frontmatter is replaced by the page's own
  }
  return {
    frontmatter,
    body: content.slice(match[0].length).replace(/^\r?\n/, ""),
  };
}

function isEmpty(value: unknown): boolean {
  return (
    value === null ||
    value === undefined ||
    value === "" ||
    (Array.isArray(value) && value.length === 0)
  );
}

/** Rewrites, through its schema, each block that names the placeholder */
function nameBlocks(body: string, exercise: string): string {
  let content = body;
  const blocks = readWorkoutNote(body).blocks.reverse();
  for (const block of blocks) {
    const schema = EXERCISE_BLOCKS.find((s) => s.type === block.type);
    if (!schema || schema.parse(block.body).params.exercise !== TEMPLATE_EXERCISE) {
      continue;
    }
    const patched = schema.patch(block.body, { exercise });
    content = replaceBlockLines(content, block, patched.split("\n"));
  }
  return content;
}
