import {
  EXERCISE_TYPE_IDS,
  getExerciseTypeById,
} from "@app/constants/exerciseTypes.constants";
import type { ExerciseTypeDefinition } from "@app/types/ExerciseTypes";
import type { CSVWorkoutLogEntry } from "@app/types/WorkoutLogData";
import type WorkoutChartsPlugin from "main";

export interface FieldMapping {
  fromField: string;
  toField: string;
  fromLabel: string;
  toLabel: string;
}

export class ExerciseConversionService {
  constructor(private plugin: WorkoutChartsPlugin) {}

  /**
   * Suggests initial field mappings based on source and target types
   */
  public suggestInitialMappings(
    sourceType: ExerciseTypeDefinition,
    targetType: ExerciseTypeDefinition
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
   * Converts all exercise data entries
   */
  public async convertExerciseData(
    exerciseName: string,
    targetTypeId: string,
    fieldMappings: FieldMapping[]
  ): Promise<number> {
    // Get all entries for this exercise
    const logData = await this.plugin.getWorkoutLogData({
      exercise: exerciseName,
      exactMatch: true,
    });

    let convertedCount = 0;

    for (const log of logData) {
      // Build updated entry
      const updatedEntry: Omit<CSVWorkoutLogEntry, "timestamp"> = {
        date: log.date,
        exercise: log.exercise,
        reps: log.reps,
        weight: log.weight,
        volume: log.volume,
        origine: log.origine,
        workout: log.workout,
        notes: log.notes,
        protocol: log.protocol,
        customFields: { ...log.customFields },
      };

      // Apply field mappings
      for (const mapping of fieldMappings) {
        const sourceValue = this.getFieldValue(log, mapping.fromField);

        if (sourceValue !== undefined && sourceValue !== null) {
          this.setFieldValue(updatedEntry, mapping.toField, sourceValue);
        }
      }

      // Clear fields that don't belong to the target type
      const targetType = getExerciseTypeById(targetTypeId);
      const targetFieldKeys = new Set(
        targetType?.parameters.map((p) => p.key) ?? []
      );

      if (!targetFieldKeys.has("reps")) {
        updatedEntry.reps = 0;
      }
      if (!targetFieldKeys.has("weight")) {
        updatedEntry.weight = 0;
      }

      // Remove custom fields not defined in the target type
      if (updatedEntry.customFields) {
        for (const key of Object.keys(updatedEntry.customFields)) {
          if (!targetFieldKeys.has(key)) {
            delete updatedEntry.customFields[key];
          }
        }
      }

      // Recalculate volume for strength type
      if (targetTypeId === EXERCISE_TYPE_IDS.STRENGTH) {
        updatedEntry.volume = updatedEntry.reps * updatedEntry.weight;
      } else {
        updatedEntry.volume = 0;
      }

      // Update entry
      await this.plugin.updateWorkoutLogEntry(log, updatedEntry);
      convertedCount++;
    }

    return convertedCount;
  }

  /**
   * Updates the exercise file frontmatter with new type
   */
  public async updateExerciseFrontmatter(
    exerciseName: string,
    targetTypeId: string
  ): Promise<void> {
    const definition = await this.plugin
      .getExerciseDefinitionService()
      .getExerciseDefinition(exerciseName);

    if (definition) {
      // Update exercise type
      definition.typeId = targetTypeId;

      // Save updated definition
      await this.plugin
        .getExerciseDefinitionService()
        .saveExerciseDefinition(definition);
    }
  }

  /**
   * Gets a field value from a log entry
   */
  private getFieldValue(
    log: {
      reps: number;
      weight: number;
      customFields?: Record<string, string | number | boolean>;
    },
    fieldKey: string
  ): number | string | boolean | undefined {
    // Standard fields
    if (fieldKey === "reps") return log.reps;
    if (fieldKey === "weight") return log.weight;

    // Custom fields
    return log.customFields?.[fieldKey];
  }

  /**
   * Sets a field value on an entry
   */
  private setFieldValue(
    entry: {
      reps: number;
      weight: number;
      customFields?: Record<string, string | number | boolean>;
    },
    fieldKey: string,
    value: number | string | boolean
  ): void {
    // Standard fields
    if (fieldKey === "reps") {
      entry.reps = typeof value === "number" ? value : parseInt(String(value)) || 0;
      return;
    }
    if (fieldKey === "weight") {
      entry.weight =
        typeof value === "number" ? value : parseFloat(String(value)) || 0;
      return;
    }

    // Custom fields
    if (!entry.customFields) {
      entry.customFields = {};
    }
    entry.customFields[fieldKey] = value;
  }
}
