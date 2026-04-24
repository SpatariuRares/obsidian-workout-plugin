import { App, Notice, TFile } from "obsidian";
import { ModalBase } from "@app/features/modals/base/ModalBase";
import { ExerciseMatchUtils } from "@app/utils/exercise/ExerciseMatchUtils";
import type { WorkoutPluginContext } from "@app/types/PluginPorts";
import { Button, BUTTONVARIANT } from "@app/components/atoms";
import { StringUtils, ErrorUtils } from "@app/utils";
import { FrontmatterParser } from "@app/utils/frontmatter/FrontmatterParser";
import { ConfirmModal } from "@app/features/modals/common/ConfirmModal";
import { t } from "@app/i18n";

interface MismatchEntry {
  file: TFile;
  fileName: string;
  canonicalName: string;
  closestMatch: string;
  score: number;
}

/**
 * Modal for auditing exercise file names against CSV entries
 * Identifies mismatches and provides fuzzy matching with similarity scores
 */
export class AuditExerciseNamesModal extends ModalBase {
  private plugin: WorkoutPluginContext;
  private mismatches: MismatchEntry[] = [];
  private contentContainer: HTMLElement | null = null;

  constructor(app: App, plugin: WorkoutPluginContext) {
    super(app);
    this.plugin = plugin;
  }

  async onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("workout-modal");

    // Title
    contentEl.createEl("h2", {
      text: t("modal.titles.auditExerciseNames"),
    });

    // Main container
    this.contentContainer = contentEl.createEl("div", {
      cls: "workout-charts-form",
    });

    // Show loading message
    this.contentContainer.createEl("p", {
      text: t("modal.notices.auditScanning"),
    });

    // Scan for mismatches
    await this.scanExerciseFiles();

    // Re-render with results
    this.renderResults();
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }

  /**
   * Scans exercise files and compares against CSV entries
   */
  private async scanExerciseFiles(): Promise<void> {
    this.mismatches = [];

    try {
      const logData = await this.plugin.getWorkoutLogData();
      const csvExerciseOriginals = [
        ...new Map(
          logData
            .filter((log) => log.exercise)
            .map((log) => [
              StringUtils.normalize(log.exercise),
              log.exercise,
            ]),
        ).values(),
      ];
      const csvExercisesNormalized = new Set(
        csvExerciseOriginals.map((e) => StringUtils.normalize(e)),
      );

      // Get all exercise files from the exercise folder
      const exerciseFolder = this.plugin.settings.exerciseFolderPath;
      const files = this.app.vault.getMarkdownFiles();
      const exerciseFiles = files.filter((file) =>
        file.path.startsWith(exerciseFolder),
      );

      // Check each file for mismatches
      for (const file of exerciseFiles) {
        const fileName = file.basename;

        // Resolve canonical name: exercise_name → nome_esercizio → basename
        let canonicalName = fileName;
        try {
          const content = await this.app.vault.read(file);
          const frontmatterName =
            FrontmatterParser.parseField(content, "exercise_name") ??
            FrontmatterParser.parseField(content, "nome_esercizio");
          if (frontmatterName) {
            canonicalName = frontmatterName;
          }
        } catch {
          // fallback to basename
        }

        const canonicalNameLower =
          StringUtils.normalize(canonicalName);

        if (csvExercisesNormalized.has(canonicalNameLower)) {
          continue; // Perfect match, skip
        }

        // Find closest match using fuzzy matching, keeping original casing
        let bestMatch = "";
        let bestScore = 0;

        for (const csvExercise of csvExerciseOriginals) {
          const score = ExerciseMatchUtils.getMatchScore(
            canonicalNameLower,
            StringUtils.normalize(csvExercise),
          );
          if (score > bestScore) {
            bestScore = score;
            bestMatch = csvExercise;
          }
        }

        // Add to mismatches (even if no close match found)
        this.mismatches.push({
          file,
          fileName,
          canonicalName,
          closestMatch: bestMatch,
          score: bestScore,
        });
      }

      // Sort by score (lowest first - worst matches first)
      this.mismatches.sort((a, b) => a.score - b.score);
    } catch (error) {
      const errorMessage = ErrorUtils.getErrorMessage(error);
      new Notice(
        t("modal.notices.auditScanError", { error: errorMessage }),
      );
    }
  }

  /**
   * Renders the audit results
   */
  private renderResults(): void {
    if (!this.contentContainer) return;

    this.contentContainer.empty();

    // If no mismatches, show success message
    if (this.mismatches.length === 0) {
      this.contentContainer.createEl("p", {
        text: t("modal.notices.auditNoMismatches"),
        cls: "workout-audit-success",
      });
      return;
    }

    // Show mismatch count
    this.contentContainer.createEl("p", {
      text: t("modal.notices.auditMismatchCount", {
        count: this.mismatches.length,
      }),
    });

    // Create table
    const tableContainer = this.contentContainer.createEl("div", {
      cls: "workout-audit-table-container",
    });

    const table = tableContainer.createEl("table", {
      cls: "workout-audit-table",
    });

    // Table header
    const thead = table.createEl("thead");
    const headerRow = thead.createEl("tr");
    headerRow.createEl("th", {
      text: t("modal.fileName"),
    });
    headerRow.createEl("th", {
      text: t("modal.csvExercise"),
    });
    headerRow.createEl("th", {
      text: t("modal.similarity"),
    });
    headerRow.createEl("th", { text: t("modal.status") });
    headerRow.createEl("th", { text: t("modal.labels.actions") });

    // Table body
    const tbody = table.createEl("tbody");
    for (const mismatch of this.mismatches) {
      const row = tbody.createEl("tr");

      const fileCell = row.createEl("td");
      const fileLink = fileCell.createEl("a", {
        text: mismatch.fileName,
        href: "#",
      });
      fileLink.addEventListener("click", (e) => {
        e.preventDefault();
        void this.app.workspace.openLinkText(
          mismatch.file.path,
          "",
          false,
        );
      });
      if (mismatch.canonicalName !== mismatch.fileName) {
        fileCell.createEl("span", {
          text: ` (${mismatch.canonicalName})`,
          cls: "workout-text-muted",
        });
      }

      // Closest match
      row.createEl("td", {
        text:
          mismatch.closestMatch ||
          t("modal.notices.auditNoMatchFound"),
      });

      // Similarity score
      row.createEl("td", { text: `${mismatch.score}%` });

      // Status with color coding
      const statusCell = row.createEl("td");
      let statusClass = "workout-audit-status-red";
      let statusText = t("modal.auditStatusNoMatch");

      if (mismatch.score === 100) {
        statusClass = "workout-audit-status-green";
        statusText = t("modal.auditStatusExactMatch");
      } else if (mismatch.score >= 70) {
        statusClass = "workout-audit-status-yellow";
        statusText = t("modal.auditStatusCloseMatch");
      } else if (mismatch.score > 0) {
        statusClass = "workout-audit-status-yellow";
        statusText = t("modal.auditStatusPartialMatch");
      }

      statusCell.createEl("span", {
        text: statusText,
        cls: statusClass,
      });

      // Actions cell with Rename in CSV and Rename File buttons
      const actionsCell = row.createEl("td");
      actionsCell.addClasses([
        "workout-flex",
        "workout-items-center",
        "workout-gap-2",
      ]);

      // Only show rename buttons if there's a valid match to rename to
      if (mismatch.closestMatch && mismatch.score > 0) {
        const renameInCSVButton = Button.create(actionsCell, {
          text: t("modal.buttons.renameInCsv"),
          className: "mod-cta",
          ariaLabel: t("modal.buttons.renameInCsv"),
          variant: BUTTONVARIANT.SECONDARY,
        });
        Button.onClick(renameInCSVButton, () => {
          this.handleRenameInCSV(mismatch);
        });

        const renameFileButton = Button.create(actionsCell, {
          text: t("modal.buttons.renameFile"),
          variant: BUTTONVARIANT.SECONDARY,
          ariaLabel: t("modal.buttons.renameFile"),
        });
        Button.onClick(renameFileButton, () => {
          this.handleRenameFile(mismatch);
        });
      }
    }
  }

  /**
   * Handles renaming an exercise in the CSV
   */
  private handleRenameInCSV(mismatch: MismatchEntry): void {
    const oldName = mismatch.closestMatch;
    const newName = StringUtils.capitalize(mismatch.canonicalName);

    new ConfirmModal(
      this.app,
      t("modal.notices.auditConfirmRenameFile", { oldName, newName }),
      async () => {
        try {
          const count = await this.plugin.renameExercise(
            oldName,
            newName,
          );
          new Notice(
            t("modal.notices.auditRenameSuccess", { count }),
          );
          await this.scanExerciseFiles();
          this.renderResults();
        } catch (error) {
          new Notice(
            t("modal.notices.auditRenameError", {
              error: ErrorUtils.getErrorMessage(error),
            }),
          );
        }
      },
    ).open();
  }

  /**
   * Handles renaming an exercise file to match the CSV
   */
  private handleRenameFile(mismatch: MismatchEntry): void {
    const oldFileName = mismatch.fileName;
    const newFileName = StringUtils.capitalize(mismatch.closestMatch);

    new ConfirmModal(
      this.app,
      t("modal.notices.auditConfirmRenameFile", {
        oldName: oldFileName,
        newName: newFileName,
      }),
      async () => {
        try {
          await this.app.fileManager.processFrontMatter(
            mismatch.file,
            (frontmatter) => {
              if (typeof frontmatter.exercise_name === "string") {
                frontmatter.exercise_name = newFileName;
              } else if (
                typeof frontmatter.nome_esercizio === "string"
              ) {
                frontmatter.nome_esercizio = newFileName;
              }
            },
          );

          const oldPath = mismatch.file.path;
          const newPath = oldPath.replace(
            `${oldFileName}.md`,
            `${newFileName}.md`,
          );
          await this.app.vault.rename(mismatch.file, newPath);

          new Notice(t("modal.notices.auditRenameFileSuccess"));
          await this.scanExerciseFiles();
          this.renderResults();
        } catch (error) {
          new Notice(
            t("modal.notices.auditRenameFileError", {
              error: ErrorUtils.getErrorMessage(error),
            }),
          );
        }
      },
    ).open();
  }
}
