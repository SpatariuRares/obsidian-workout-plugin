import { normalizePath } from "obsidian";
import { t } from "@app/i18n";

/** File name of the example log inside the example log folder */
const EXAMPLE_LOG_FILE_NAME = "workout_logs.csv";

/** The one place the example vault paths (all localized) are built */
export const examplePaths = {
  base: (): string => normalizePath(t("examples.folderNames.base")),
  exercises: (): string =>
    normalizePath(
      `${t("examples.folderNames.base")}/${t("examples.folderNames.exercises")}`,
    ),
  workouts: (): string =>
    normalizePath(
      `${t("examples.folderNames.base")}/${t("examples.folderNames.workouts")}`,
    ),
  logFolder: (): string =>
    normalizePath(
      `${t("examples.folderNames.base")}/${t("examples.folderNames.log")}`,
    ),
  logFileName: (): string => EXAMPLE_LOG_FILE_NAME,
  log: (): string =>
    normalizePath(
      `${t("examples.folderNames.base")}/${t("examples.folderNames.log")}/${EXAMPLE_LOG_FILE_NAME}`,
    ),
  gettingStartedFolder: (): string =>
    normalizePath(
      `${t("examples.folderNames.base")}/${t("examples.fileNames.gettingStarted")}`,
    ),
  gettingStartedGuide: (): string =>
    normalizePath(
      `${t("examples.folderNames.base")}/${t("examples.fileNames.gettingStarted")}/${t("examples.fileNames.gettingStarted")}.md`,
    ),
};
