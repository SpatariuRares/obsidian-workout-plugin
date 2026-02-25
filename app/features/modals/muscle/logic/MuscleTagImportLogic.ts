import { t } from "@app/i18n";
import {
  CANONICAL_MUSCLE_GROUPS,
  type CanonicalMuscleGroup,
} from "@app/constants/muscles.constants";
import type { ParsedMuscleTagImportResult } from "@app/features/modals/muscle/types";
import { StringUtils } from "@app/utils";

export class MuscleTagImportLogic {
  static parseImportFileContent(content: string): ParsedMuscleTagImportResult {
    const lines = content.split(/\r?\n/).filter((line) => line.trim());
    if (lines.length === 0) {
      return {
        validTags: new Map(),
        errors: [],
        isValidFormat: false,
      };
    }

    const headerLine = lines[0].toLowerCase();
    const hasTagColumn = headerLine.includes("tag");
    const hasMuscleGroupColumn =
      headerLine.includes("musclegroup") ||
      headerLine.includes("muscle_group") ||
      headerLine.includes("group");

    if (!hasTagColumn || !hasMuscleGroupColumn) {
      return {
        validTags: new Map(),
        errors: [],
        isValidFormat: false,
      };
    }

    const headers = this.parseCsvLine(lines[0]);
    const tagIndex = headers.findIndex((h) => h.toLowerCase() === "tag");
    const groupIndex = headers.findIndex((h) =>
      ["musclegroup", "muscle_group", "group"].includes(h.toLowerCase()),
    );

    if (tagIndex === -1 || groupIndex === -1) {
      return {
        validTags: new Map(),
        errors: [],
        isValidFormat: false,
      };
    }

    const validTags = new Map<string, string>();
    const errors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const columns = this.parseCsvLine(lines[i]);
      if (columns.length <= Math.max(tagIndex, groupIndex)) {
        continue;
      }

      const tag = StringUtils.normalize(columns[tagIndex]);
      const muscleGroup = StringUtils.normalize(columns[groupIndex]);

      if (!tag || !muscleGroup) {
        continue;
      }

      if (!this.isCanonicalMuscleGroup(muscleGroup)) {
        errors.push(
          t("modal.notices.muscleTagImportInvalidGroup", { tag, group: muscleGroup }),
        );
        continue;
      }

      validTags.set(tag, muscleGroup);
    }

    return {
      validTags,
      errors,
      isValidFormat: true,
    };
  }

  static parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        result.push(current);
        current = "";
      } else {
        current += char;
      }
    }

    result.push(current);
    return result;
  }

  private static isCanonicalMuscleGroup(value: string): boolean {
    return CANONICAL_MUSCLE_GROUPS.includes(value as CanonicalMuscleGroup);
  }
}
