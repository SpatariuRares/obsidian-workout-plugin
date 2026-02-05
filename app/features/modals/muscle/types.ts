export interface MuscleTagSimilarityMatch {
  tag: string;
  distance: number;
}

export interface MuscleTagSuggestionItem extends MuscleTagSimilarityMatch {
  muscleGroup: string;
  isVeryClose: boolean;
}

export interface ParsedMuscleTagImportResult {
  validTags: Map<string, string>;
  errors: string[];
  isValidFormat: boolean;
}

export type MuscleTagImportMode = "merge" | "replace";
