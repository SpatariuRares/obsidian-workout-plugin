/**
 * Service for managing exercise definitions from exercise folder .md frontmatter files.
 *
 * Exercise definitions link exercise names to their types (Strength, Timed, Distance, etc.)
 * and define what parameters should be tracked when logging.
 */

import { App, TFile, TFolder, parseYaml } from "obsidian";
import type { WorkoutChartsSettings } from "@app/types/WorkoutLogData";
import type {
  ExerciseDefinition,
  ExerciseTypeDefinition,
  ParameterDefinition,
} from "@app/types/ExerciseTypes";
import {
  getExerciseTypeById,
  DEFAULT_EXERCISE_TYPE_ID,
} from "@app/constants/exerciseTypes.constants";
import { FrontmatterParser } from "@app/utils/FrontmatterParser";
import { ParameterUtils } from "@app/utils/ParameterUtils";

/**
 * Cache entry for exercise definitions with timestamp for TTL management.
 */
interface CacheEntry {
  definitions: Map<string, ExerciseDefinition>;
  timestamp: number;
}

export class ExerciseDefinitionService {
  /** Cache for exercise definitions */
  private cache: CacheEntry | null = null;

  /** Cache TTL in milliseconds (10 seconds) */
  private readonly CACHE_DURATION = 10000;

  /** Lock to prevent parallel loading (race condition prevention) */
  private loadingPromise: Promise<Map<string, ExerciseDefinition>> | null =
    null;

  constructor(
    private app: App,
    private settings: WorkoutChartsSettings
  ) {}

  /**
   * Get an exercise definition by name.
   *
   * @param name - The exercise name (case-insensitive match against filename)
   * @returns The exercise definition or undefined if not found
   *
   * @example
   * const benchPress = await service.getExerciseDefinition("Bench Press");
   * // Returns { name: "Bench Press", typeId: "strength", ... }
   */
  async getExerciseDefinition(
    name: string
  ): Promise<ExerciseDefinition | undefined> {
    const definitions = await this.loadDefinitions();
    // Normalize name for lookup (case-insensitive)
    const normalizedName = name.toLowerCase().trim();

    for (const [key, definition] of definitions) {
      if (key.toLowerCase() === normalizedName) {
        return definition;
      }
    }

    return undefined;
  }

  /**
   * Get all exercise definitions from the exercise folder.
   *
   * @returns Array of all exercise definitions
   */
  async getAllExerciseDefinitions(): Promise<ExerciseDefinition[]> {
    const definitions = await this.loadDefinitions();
    return Array.from(definitions.values());
  }

  /**
   * Save an exercise definition to the corresponding exercise file's frontmatter.
   *
   * Creates the file if it doesn't exist, or updates the frontmatter if it does.
   *
   * @param definition - The exercise definition to save
   */
  async saveExerciseDefinition(definition: ExerciseDefinition): Promise<void> {
    const folderPath = this.settings.exerciseFolderPath;
    const safeExerciseName = definition.name.replace(/[\\/:"*?<>|]/g, "_");
    const filePath = `${folderPath}/${safeExerciseName}.md`;

    const abstractFile = this.app.vault.getAbstractFileByPath(filePath);

    if (abstractFile instanceof TFile) {
      // Update existing file's frontmatter
      await this.app.fileManager.processFrontMatter(
        abstractFile,
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

          if (definition.muscleGroups && definition.muscleGroups.length > 0) {
            frontmatter.tags = definition.muscleGroups;
          }
        }
      );
    } else {
      // Create new file with frontmatter
      const content = this.generateExerciseFileContent(definition);
      await this.app.vault.create(filePath, content);
    }

    // Clear cache to reflect changes
    this.clearCache();
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
  async getParametersForExercise(name: string): Promise<ParameterDefinition[]> {
    const definition = await this.getExerciseDefinition(name);

    if (!definition) {
      // Default to strength type for unknown exercises
      const strengthType = getExerciseTypeById(DEFAULT_EXERCISE_TYPE_ID);
      return strengthType?.parameters || [];
    }

    const exerciseType = getExerciseTypeById(definition.typeId);

    if (!exerciseType) {
      // Unknown type ID, default to strength
      const strengthType = getExerciseTypeById(DEFAULT_EXERCISE_TYPE_ID);
      return strengthType?.parameters || [];
    }

    // Combine type parameters with custom parameters
    const typeParams = exerciseType.parameters;
    const customParams = definition.customParameters || [];

    return [...typeParams, ...customParams];
  }

  /**
   * Get the exercise type definition for an exercise.
   *
   * @param name - The exercise name
   * @returns The exercise type definition or the default strength type
   */
  async getExerciseType(name: string): Promise<ExerciseTypeDefinition> {
    const definition = await this.getExerciseDefinition(name);
    const typeId = definition?.typeId || DEFAULT_EXERCISE_TYPE_ID;
    const exerciseType = getExerciseTypeById(typeId);

    // Fallback to strength type if not found
    return exerciseType || getExerciseTypeById(DEFAULT_EXERCISE_TYPE_ID)!;
  }

  /**
   * Clear the definition cache.
   * Call this after modifying exercise files or when settings change.
   */
  clearCache(): void {
    this.cache = null;
    this.loadingPromise = null;
  }

  /**
   * Load all exercise definitions from the exercise folder.
   * Uses caching with TTL to avoid repeated file system reads.
   */
  private async loadDefinitions(): Promise<Map<string, ExerciseDefinition>> {
    const now = Date.now();

    // Check if cache is valid
    if (this.cache && now - this.cache.timestamp < this.CACHE_DURATION) {
      return this.cache.definitions;
    }

    // If already loading, wait for that promise (race condition prevention)
    if (this.loadingPromise) {
      return this.loadingPromise;
    }

    // Start loading with lock
    this.loadingPromise = this.scanExerciseFolder();

    try {
      const definitions = await this.loadingPromise;

      // Update cache
      this.cache = {
        definitions,
        timestamp: Date.now(),
      };

      return definitions;
    } finally {
      this.loadingPromise = null;
    }
  }

  /**
   * Scan the exercise folder and parse exercise definitions from frontmatter.
   */
  private async scanExerciseFolder(): Promise<Map<string, ExerciseDefinition>> {
    const definitions = new Map<string, ExerciseDefinition>();
    const folderPath = this.settings.exerciseFolderPath;

    const abstractFolder = this.app.vault.getAbstractFileByPath(folderPath);
    if (!(abstractFolder instanceof TFolder)) {
      // Exercise folder doesn't exist
      return definitions;
    }

    // Get all markdown files in the folder
    const files = abstractFolder.children.filter(
      (file): file is TFile => file instanceof TFile && file.extension === "md"
    );

    // Parse each file
    for (const file of files) {
      try {
        const definition = await this.parseExerciseFile(file);
        if (definition) {
          definitions.set(definition.name, definition);
        }
      } catch {
        // Skip files that can't be parsed
        continue;
      }
    }

    return definitions;
  }

  /**
   * Parse an exercise definition from a markdown file's frontmatter.
   */
  private async parseExerciseFile(
    file: TFile
  ): Promise<ExerciseDefinition | null> {
    const content = await this.app.vault.read(file);

    // Extract frontmatter
    const frontmatterText = FrontmatterParser.extractFrontmatter(content);
    if (!frontmatterText) {
      // No frontmatter, create default definition from filename
      return {
        name: file.basename,
        typeId: DEFAULT_EXERCISE_TYPE_ID,
      };
    }

    // Parse frontmatter YAML
    const frontmatter = parseYaml(frontmatterText);
    if (!frontmatter) {
      return {
        name: file.basename,
        typeId: DEFAULT_EXERCISE_TYPE_ID,
      };
    }

    // Extract exercise type (default to strength for backward compatibility)
    const typeId = this.parseTypeId(frontmatter);

    // Extract custom parameters
    const customParameters = this.parseCustomParameters(frontmatter);

    // Extract muscle groups from tags
    const muscleGroups = this.parseMuscleGroups(frontmatter);

    // Use filename as exercise name (or nome_esercizio if present)
    const name =
      typeof frontmatter.nome_esercizio === "string"
        ? frontmatter.nome_esercizio
        : file.basename;

    return {
      name,
      typeId,
      muscleGroups: muscleGroups.length > 0 ? muscleGroups : undefined,
      customParameters:
        customParameters.length > 0 ? customParameters : undefined,
    };
  }

  /**
   * Parse the exercise type ID from frontmatter.
   * Supports both `exercise_type` and `type` fields for flexibility.
   */
  private parseTypeId(
    frontmatter: Record<string, unknown>
  ): string {
    // Check for exercise_type field (primary)
    if (
      typeof frontmatter.exercise_type === "string" &&
      frontmatter.exercise_type.trim()
    ) {
      return frontmatter.exercise_type.trim().toLowerCase();
    }

    // Check for type field (alternative)
    if (
      typeof frontmatter.type === "string" &&
      frontmatter.type.trim()
    ) {
      return frontmatter.type.trim().toLowerCase();
    }

    // Default to strength for backward compatibility
    return DEFAULT_EXERCISE_TYPE_ID;
  }

  /**
   * Parse custom parameters from frontmatter.
   * Expects a YAML array of parameter definitions.
   * Validates parameters and skips reserved/invalid keys.
   *
   * @example
   * ```yaml
   * parameters:
   *   - key: incline
   *     label: Incline
   *     type: number
   *     unit: "%"
   *     required: false
   * ```
   */
  private parseCustomParameters(
    frontmatter: Record<string, unknown>
  ): ParameterDefinition[] {
    const parametersField = frontmatter.parameters;

    if (!Array.isArray(parametersField)) {
      return [];
    }

    const parameters: ParameterDefinition[] = [];

    for (const param of parametersField) {
      if (!param || typeof param !== "object") {
        continue;
      }

      const paramObj = param as Record<string, unknown>;

      // Validate required fields
      if (typeof paramObj.key !== "string" || !paramObj.key.trim()) {
        continue;
      }

      const paramDef: ParameterDefinition = {
        key: paramObj.key.trim(),
        label:
          typeof paramObj.label === "string"
            ? paramObj.label.trim()
            : paramObj.key.trim(),
        type: this.parseParameterType(paramObj.type),
        required: paramObj.required === true,
      };

      // Validate the parameter using ParameterUtils
      // Skip reserved keys and invalid parameters
      const validation = ParameterUtils.validateParam(paramDef);
      if (!validation.isValid) {
        // Log warning but don't fail - just skip the invalid parameter
        console.warn(
          `[ExerciseDefinitionService] Skipping invalid custom parameter "${paramDef.key}": ${validation.error}`
        );
        continue;
      }

      // Optional fields
      if (typeof paramObj.unit === "string" && paramObj.unit.trim()) {
        paramDef.unit = paramObj.unit.trim();
      }

      if (paramObj.default !== undefined) {
        paramDef.default = paramObj.default as number | string | boolean;
      }

      if (typeof paramObj.min === "number") {
        paramDef.min = paramObj.min;
      }

      if (typeof paramObj.max === "number") {
        paramDef.max = paramObj.max;
      }

      parameters.push(paramDef);
    }

    return parameters;
  }

  /**
   * Parse parameter type, defaulting to 'number' for invalid values.
   */
  private parseParameterType(
    value: unknown
  ): "number" | "string" | "boolean" {
    if (value === "string") return "string";
    if (value === "boolean") return "boolean";
    return "number"; // Default
  }

  /**
   * Parse muscle groups from frontmatter tags.
   */
  private parseMuscleGroups(
    frontmatter: Record<string, unknown>
  ): string[] {
    const tags = frontmatter.tags;

    if (!Array.isArray(tags)) {
      return [];
    }

    return tags
      .filter((tag): tag is string => typeof tag === "string")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);
  }

  /**
   * Generate markdown file content for a new exercise definition.
   */
  private generateExerciseFileContent(definition: ExerciseDefinition): string {
    const frontmatterLines: string[] = ["---"];

    // Exercise name
    frontmatterLines.push(`nome_esercizio: ${definition.name}`);

    // Exercise type
    frontmatterLines.push(`exercise_type: ${definition.typeId}`);

    // Tags (muscle groups)
    if (definition.muscleGroups && definition.muscleGroups.length > 0) {
      frontmatterLines.push("tags:");
      for (const tag of definition.muscleGroups) {
        frontmatterLines.push(`  - ${tag}`);
      }
    }

    // Custom parameters
    if (definition.customParameters && definition.customParameters.length > 0) {
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
