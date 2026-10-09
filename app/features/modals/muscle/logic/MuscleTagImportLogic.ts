import { t } from "@app/i18n";
import {
  CANONICAL_MUSCLE_GROUPS,
  type CanonicalMuscleGroup,
} from "@app/constants/muscles.constants";
import type { ParsedMuscleTagImportResult } from "@app/features/modals/muscle/types";
import { StringUtils } from "@app/utils";
import { parseCsv } from "@app/utils/data/CsvCodec";

export class MuscleTagImportLogic {
  static parseImportFileContent(
    content: string,
  ): ParsedMuscleTagImportResult {
    const rows = parseCsv(content);
    if (rows.length === 0) {
      return {
        validTags: new Map(),
        errors: [],
        isValidFormat: false,
      };
    }

    const headerLine = rows[0].join(",").toLowerCase();
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

    const headers = rows[0].map((h) => h.trim());
    const tagIndex = headers.findIndex(
      (h) => h.toLowerCase() === "tag",
    );
    const groupIndex = headers.findIndex((h) =>
      ["musclegroup", "muscle_group", "group"].includes(
        h.toLowerCase(),
      ),
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

    for (let i = 1; i < rows.length; i++) {
      const columns = rows[i];
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
          t("modal.notices.muscleTagImportInvalidGroup", {
            tag: tag,
            group: muscleGroup,
          }),
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

  private static isCanonicalMuscleGroup(value: string): boolean {
    return CANONICAL_MUSCLE_GROUPS.includes(
      value as CanonicalMuscleGroup,
    );
  }
}
