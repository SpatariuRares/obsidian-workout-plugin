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
import { ExerciseTypeCatalog } from "@app/services/exercise/ExerciseTypeCatalog";
import type {
  ExerciseLibrary,
  ExercisePage,
} from "@app/services/exercise/ExerciseLibrary";
import { StringUtils } from "@app/utils/StringUtils";
import { exercisePageContent } from "@app/services/exercise/ExercisePageContent";

/**
 * The fields a set of the exercise records, or none when its page can't be
 * read: views that only show or log sets draw without them instead of failing.
 */
export async function parametersOrNone(
  plugin: { getExerciseDefinitionService(): Pick<ExerciseDefinitionService, "getParametersForExercise"> },
  exercise: string,
): Promise<ParameterDefinition[]> {
  return plugin
    .getExerciseDefinitionService()
    .getParametersForExercise(exercise)
    .catch((): ParameterDefinition[] => []);
}

export class ExerciseDefinitionService {
  constructor(
    private app: Pick<App, "vault" | "fileManager">,
    private settings: Pick<WorkoutChartsSettings, "exerciseFolderPath" | "exerciseTypes">,
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
        (frontmatter: Record<string, unknown>) => {
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
      exercisePageContent(definition),
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
    const exerciseType = this.catalog().resolve(
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
    const exerciseType = this.catalog().resolve(typeId);

    // Fallback to strength type if not found
    return (
      exerciseType || getExerciseTypeById(DEFAULT_EXERCISE_TYPE_ID)!
    );
  }

  /** The types as the settings have them now (the list changes while the plugin runs) */
  private catalog(): ExerciseTypeCatalog {
    return new ExerciseTypeCatalog(this.settings.exerciseTypes ?? []);
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
