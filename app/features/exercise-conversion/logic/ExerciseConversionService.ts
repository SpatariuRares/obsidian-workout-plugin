import { EXERCISE_TYPE_IDS } from "@app/constants/exerciseTypes.constants";
import type {
  ExerciseTypeDefinition,
  ParameterDefinition,
} from "@app/types/ExerciseTypes";
import type { WorkoutPluginContext } from "@app/types/PluginPorts";
import type { WorkoutLogData } from "@app/types/WorkoutLogData";
import { StringUtils } from "@app/utils/StringUtils";
import { DataFilter } from "@app/services/data/DataFilter";
import { toLogEntryInput } from "@app/services/data/WorkoutLogCodec";
import {
  fieldKey,
  fieldValue,
  hasFieldValue,
  setFieldValue,
} from "@app/services/exercise/ExerciseFields";
import {
  ExerciseTypeCatalog,
  type ExerciseTypeInfo,
} from "@app/services/exercise/ExerciseTypeCatalog";

export interface FieldMapping {
  fromField: string;
  toField: string;
  fromLabel: string;
  toLabel: string;
}

export class ExerciseConversionService {
  constructor(private plugin: WorkoutPluginContext) {}

  /**
   * The types an exercise can be converted to: the built-in ones, then the
   * user's own (Settings → Exercise types)
   */
  public targetTypes(): ExerciseTypeInfo[] {
    return this.catalog().pickable();
  }

  /** A type by its id, built-in or the user's own */
  public resolveType(typeId: string): ExerciseTypeInfo | undefined {
    return this.catalog().resolve(typeId);
  }

  /**
   * The fields a conversion can read from this exercise's sets: the fields
   * its page logs (its type's, then the page's `parameters:`), then any
   * other column its sets have a value in
   */
  public async sourceFields(
    exerciseName: string,
  ): Promise<ParameterDefinition[]> {
    const fields = [
      ...(await this.plugin
        .getExerciseDefinitionService()
        .getParametersForExercise(exerciseName)),
    ];
    const known = (key: string) =>
      fields.some((field) => fieldKey(field.key) === fieldKey(key));
    for (const set of await this.setsOf(exerciseName)) {
      for (const [key, value] of Object.entries(
        set.customFields ?? {},
      )) {
        if (!known(key) && hasFieldValue(value)) {
          fields.push({
            key,
            label: StringUtils.humanize(key),
            type: "number",
            required: false,
          });
        }
      }
    }
    return fields;
  }

  /** The types as the settings have them now */
  private catalog(): ExerciseTypeCatalog {
    return new ExerciseTypeCatalog(
      this.plugin.settings.exerciseTypes ?? [],
    );
  }

  /**
   * Suggests initial field mappings based on source and target types
   */
  public suggestInitialMappings(
    sourceType: ExerciseTypeDefinition,
    targetType: ExerciseTypeDefinition,
  ): Array<{ from: string; to: string }> {
    const suggestions: Array<{ from: string; to: string }> = [];

    // Strength → Timed: reps → duration
    if (
      sourceType.id === EXERCISE_TYPE_IDS.STRENGTH &&
      targetType.id === EXERCISE_TYPE_IDS.TIMED
    ) {
      suggestions.push({ from: "reps", to: "duration" });
    }
    // Timed → Strength: duration → reps
    else if (
      sourceType.id === EXERCISE_TYPE_IDS.TIMED &&
      targetType.id === EXERCISE_TYPE_IDS.STRENGTH
    ) {
      suggestions.push({ from: "duration", to: "reps" });
    }
    // Add other smart defaults here if needed

    return suggestions;
  }

  /**
   * The sets a conversion of this exercise rewrites: exact name only, so a
   * similar exercise is never converted
   */
  public async setsOf(
    exerciseName: string,
  ): Promise<WorkoutLogData[]> {
    return DataFilter.filterRows(
      await this.plugin.getWorkoutLogData(),
      {
        exercise: exerciseName,
        exactMatch: true,
      },
    );
  }

  /**
   * Converts all exercise data entries
   */
  public async convertExerciseData(
    exerciseName: string,
    targetTypeId: string,
    fieldMappings: FieldMapping[],
  ): Promise<number> {
    const logData = await this.setsOf(exerciseName);

    let convertedCount = 0;

    await this.plugin.batchOperation("other", async () => {
      for (const log of logData) {
        // Read and write the set as entered (its own weight unit), not the
        // weight converted to the settings unit, so weight and weightUnit
        // stay consistent
        const source = toLogEntryInput(log);
        const updatedEntry = toLogEntryInput(log);
        updatedEntry.customFields = { ...log.customFields };

        // Apply field mappings
        for (const mapping of fieldMappings) {
          const sourceValue = fieldValue(source, mapping.fromField);

          if (sourceValue !== undefined && sourceValue !== null) {
            setFieldValue(updatedEntry, mapping.toField, sourceValue);
          }
        }

        // Clear fields that don't belong to the target type. A type with no
        // parameters of its own (custom: defined per exercise) clears
        // nothing, and fields the user mapped are always kept.
        const targetType = this.resolveType(targetTypeId);
        const targetParams = targetType?.parameters ?? [];
        if (targetParams.length > 0) {
          const keptKeys = new Set([
            ...targetParams.map((p) => p.key),
            ...fieldMappings.map((m) => m.toField),
          ]);

          if (!keptKeys.has("reps")) {
            updatedEntry.reps = 0;
          }
          if (!keptKeys.has("weight")) {
            updatedEntry.weight = 0;
          }

          if (updatedEntry.customFields) {
            for (const key of Object.keys(
              updatedEntry.customFields,
            )) {
              if (!keptKeys.has(key)) {
                delete updatedEntry.customFields[key];
              }
            }
          }
        }

        // Update entry
        await this.plugin.updateWorkoutLogEntry(log, updatedEntry);
        convertedCount++;
      }
    });

    return convertedCount;
  }

  /**
   * Updates the exercise file frontmatter with new type
   */
  public async updateExerciseFrontmatter(
    exerciseName: string,
    targetTypeId: string,
  ): Promise<void> {
    const definition = await this.plugin
      .getExerciseDefinitionService()
      .getExerciseDefinition(exerciseName);

    if (definition) {
      // Update exercise type. The page's own fields go with the old type:
      // the sets no longer hold them (only the target type's and the mapped
      // fields are kept)
      definition.typeId = targetTypeId;
      delete definition.customParameters;

      // Save updated definition
      await this.plugin
        .getExerciseDefinitionService()
        .saveExerciseDefinition(definition);
    }
  }
}
