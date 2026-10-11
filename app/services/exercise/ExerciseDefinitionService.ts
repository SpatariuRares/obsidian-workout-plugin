/**
 * Service for managing exercise definitions from exercise folder .md frontmatter files.
 *
 * Exercise definitions link exercise names to their types (Strength, Timed, Distance, etc.)
 * and define what parameters should be tracked when logging.
 */

import { normalizePath } from "obsidian";
import type { App } from "obsidian";
import type { WorkoutChartsSettings } from "@app/types/WorkoutLogData";
import type {
  ExerciseDefinition,
  ExerciseTypeDefinition,
  ParameterDefinition,
} from "@app/types/ExerciseTypes";
import {
  getExerciseTypeById,
  DEFAULT_EXERCISE_TYPE_ID,
  resolveExerciseTypeId,
} from "@app/constants/exerciseTypes.constants";
import type {
  ExerciseLibrary,
  ExercisePage,
} from "@app/services/exercise/ExerciseLibrary";
import { StringUtils } from "@app/utils/StringUtils";

export class ExerciseDefinitionService {
  constructor(
    private app: Pick<App, "vault" | "fileManager">,
    private settings: Pick<WorkoutChartsSettings, "exerciseFolderPath">,
    private exercises: ExerciseLibrary,
  ) {}

  /**
   * Get an exercise definition by name.
   *
   * @param name - The exercise name, found like ExerciseLibrary.find
   * @returns The exercise definition or undefined if it has no page
   *
   * @example
   * const benchPress = await service.getExerciseDefinition("Bench Press");
   * // Returns { name: "Bench Press", typeId: "strength", ... }
   */
  async getExerciseDefinition(
    name: string,
  ): Promise<ExerciseDefinition | undefined> {
    const page = this.exercises.find(name);
    return page ? toDefinition(page) : undefined;
  }

  /**
   * Get a definition for every exercise page.
   */
  async getAllExerciseDefinitions(): Promise<ExerciseDefinition[]> {
    return this.exercises.pages().map(toDefinition);
  }

  /**
   * Save an exercise definition into its exercise page's frontmatter, or
   * create a page in the exercise folder when the exercise has none.
   *
   * @param definition - The exercise definition to save
   */
  async saveExerciseDefinition(
    definition: ExerciseDefinition,
  ): Promise<void> {
    const page = this.exercises.find(definition.name);

    if (page) {
      await this.app.fileManager.processFrontMatter(
        page.file,
        (frontmatter) => {
          frontmatter.exercise_type = definition.typeId;

          if (
            definition.customParameters &&
            definition.customParameters.length > 0
          ) {
            frontmatter.parameters = definition.customParameters;
          } else {
            // Remove parameters field if no custom parameters
            delete frontmatter.parameters;
          }

          if (
            definition.muscleGroups &&
            definition.muscleGroups.length > 0
          ) {
            frontmatter.tags = definition.muscleGroups;
          }
        },
      );
      return;
    }

    const safeExerciseName = definition.name.replace(
      /[\\/:"*?<>|]/g,
      "_",
    );
    const folder = this.settings.exerciseFolderPath.trim();
    const filePath = normalizePath(
      folder ? `${folder}/${safeExerciseName}.md` : `${safeExerciseName}.md`,
    );
    await this.app.vault.create(
      filePath,
      this.generateExerciseFileContent(definition),
    );
  }

  /**
   * Get the combined parameters for an exercise (type parameters + custom parameters).
   *
   * For exercises with a known type, returns the type's parameters plus any custom ones.
   * For unknown exercises, returns strength parameters as default.
   *
   * @param name - The exercise name
   * @returns Array of parameter definitions for the exercise
   */
  async getParametersForExercise(
    name: string,
  ): Promise<ParameterDefinition[]> {
    const definition = await this.getExerciseDefinition(name);
    const exerciseType = getExerciseTypeById(
      definition?.typeId ?? DEFAULT_EXERCISE_TYPE_ID,
    );

    if (!definition || !exerciseType) {
      // No page or unknown type ID: default to strength
      return getExerciseTypeById(DEFAULT_EXERCISE_TYPE_ID)?.parameters || [];
    }

    return [...exerciseType.parameters, ...(definition.customParameters || [])];
  }

  /**
   * Get the exercise type definition for an exercise.
   *
   * @param name - The exercise name
   * @returns The exercise type definition or the default strength type
   */
  async getExerciseType(
    name: string,
  ): Promise<ExerciseTypeDefinition> {
    const definition = await this.getExerciseDefinition(name);
    const typeId = definition?.typeId || DEFAULT_EXERCISE_TYPE_ID;
    const exerciseType = getExerciseTypeById(typeId);

    // Fallback to strength type if not found
    return (
      exerciseType || getExerciseTypeById(DEFAULT_EXERCISE_TYPE_ID)!
    );
  }

  /**
   * Generate markdown file content for a new exercise definition.
   */
  private generateExerciseFileContent(
    definition: ExerciseDefinition,
  ): string {
    const frontmatterLines: string[] = ["---"];

    // Exercise name
    frontmatterLines.push(`exercise_name: ${definition.name}`);

    // Exercise type
    frontmatterLines.push(`exercise_type: ${definition.typeId}`);

    // Tags (muscle groups)
    if (
      definition.muscleGroups &&
      definition.muscleGroups.length > 0
    ) {
      frontmatterLines.push("tags:");
      for (const tag of definition.muscleGroups) {
        frontmatterLines.push(`  - ${tag}`);
      }
    }

    // Custom parameters
    if (
      definition.customParameters &&
      definition.customParameters.length > 0
    ) {
      frontmatterLines.push("parameters:");
      for (const param of definition.customParameters) {
        frontmatterLines.push(`  - key: ${param.key}`);
        frontmatterLines.push(`    label: ${param.label}`);
        frontmatterLines.push(`    type: ${param.type}`);
        if (param.unit) {
          frontmatterLines.push(`    unit: "${param.unit}"`);
        }
        frontmatterLines.push(`    required: ${param.required}`);
        if (param.default !== undefined) {
          frontmatterLines.push(`    default: ${param.default}`);
        }
        if (param.min !== undefined) {
          frontmatterLines.push(`    min: ${param.min}`);
        }
        if (param.max !== undefined) {
          frontmatterLines.push(`    max: ${param.max}`);
        }
      }
    }

    frontmatterLines.push("---");

    // Add basic content structure
    const content = `${frontmatterLines.join("\n")}

# ${definition.name}

## Description



## Log

\`\`\`workout-log
exercise: ${definition.name}
\`\`\`

## Chart

\`\`\`workout-chart
exercise: ${definition.name}
\`\`\`
`;

    return content;
  }
}

/** The definition an exercise page gives; type defaults to strength */
function toDefinition(page: ExercisePage): ExerciseDefinition {
  return {
    // exercise_name / nome_esercizio when set, else the file name
    name: page.names[1] ?? page.names[0],
    typeId: page.type
      ? resolveExerciseTypeId(StringUtils.normalize(page.type))
      : DEFAULT_EXERCISE_TYPE_ID,
    muscleGroups: page.tags.length > 0 ? page.tags : undefined,
    customParameters:
      page.parameters.length > 0 ? page.parameters : undefined,
  };
}
