import { App, Notice, TFile } from "obsidian";
import { ModalBase } from "@app/features/modals/base/ModalBase";
import { ExerciseMatchUtils } from "@app/utils/exercise/ExerciseMatchUtils";
import type WorkoutChartsPlugin from "main";
import { Button } from "@app/components/atoms";
import { StringUtils, ErrorUtils } from "@app/utils";
import { t } from "@app/i18n";

interface MismatchEntry {
  file: TFile;
  fileName: string;
  closestMatch: string;
  score: number;
}

/**
 * Modal for auditing exercise file names against CSV entries
 * Identifies mismatches and provides fuzzy matching with similarity scores
 */
export class AuditExerciseNamesModal extends ModalBase {
  private plugin: WorkoutChartsPlugin;
  private mismatches: MismatchEntry[] = [];
  private contentContainer: HTMLElement | null = null;

  constructor(app: App, plugin: WorkoutChartsPlugin) {
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
      // Get all CSV exercise names
      const logData = await this.plugin.getWorkoutLogData();
      const csvExercises = new Set(
        logData.map((log) => StringUtils.normalize(log.exercise)),
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
        const fileNameLower = StringUtils.normalize(fileName);

        // Check for exact match
        if (csvExercises.has(fileNameLower)) {
          continue; // Perfect match, skip
        }

        // Find closest match using fuzzy matching
        let bestMatch = "";
        let bestScore = 0;

        for (const csvExercise of csvExercises) {
          const score = ExerciseMatchUtils.getMatchScore(
            fileNameLower,
            csvExercise,
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
          closestMatch: bestMatch || "No match found",
          score: bestScore,
        });
      }

      // Sort by score (lowest first - worst matches first)
      this.mismatches.sort((a, b) => a.score - b.score);
    } catch (error) {
      const errorMessage = ErrorUtils.getErrorMessage(error);
      new Notice(`Error scanning exercise files: ${errorMessage}`);
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
      text: `Found ${this.mismatches.length} potential mismatch${this.mismatches.length !== 1 ? "es" : ""}:`,
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
    headerRow.createEl("th", { text: "Actions" });

    // Table body
    const tbody = table.createEl("tbody");
    for (const mismatch of this.mismatches) {
      const row = tbody.createEl("tr");

      // File name (with link)
      const fileCell = row.createEl("td");
      const fileLink = fileCell.createEl("a", {
        text: mismatch.fileName,
        href: "#",
      });
      fileLink.addEventListener("click", (e) => {
        e.preventDefault();
        void this.app.workspace.openLinkText(mismatch.file.path, "", false);
      });

      // Closest match
      row.createEl("td", { text: mismatch.closestMatch });

      // Similarity score
      row.createEl("td", { text: `${mismatch.score}%` });

      // Status with color coding
      const statusCell = row.createEl("td");
      let statusClass = "workout-audit-status-red";
      let statusText = "No match";

      if (mismatch.score === 100) {
        statusClass = "workout-audit-status-green";
        statusText = "Exact match";
      } else if (mismatch.score >= 70) {
        statusClass = "workout-audit-status-yellow";
        statusText = "Close match";
      } else if (mismatch.score > 0) {
        statusClass = "workout-audit-status-yellow";
        statusText = "Partial match";
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
      if (mismatch.closestMatch !== "No match found" && mismatch.score > 0) {
        const renameInCSVButton = Button.create(actionsCell, {
          text: t("modal.buttons.renameInCsv"),
          className: "mod-cta",
          ariaLabel: t("modal.buttons.renameInCsv"),
          variant: "secondary",
        });
        Button.onClick(renameInCSVButton, async () => {
          await this.handleRenameInCSV(mismatch);
        });

        const renameFileButton = Button.create(actionsCell, {
          text: t("modal.buttons.renameFile"),
          variant: "secondary",
          ariaLabel: t("modal.buttons.renameFile"),
        });
        Button.onClick(renameFileButton, async () => {
          await this.handleRenameFile(mismatch);
        });
      }
    }
  }

  /**
   * Handles renaming an exercise in the CSV
   */
  private async handleRenameInCSV(mismatch: MismatchEntry): Promise<void> {
    const oldName = mismatch.closestMatch;
    const newName = mismatch.fileName;

    // Show confirmation dialog with preview
    const confirmMessage = t("modal.notices.auditConfirmRenameFile", {
      oldName: oldName,
      newName: newName,
    });

    // Use Obsidian's built-in confirm dialog
    const confirmed = confirm(confirmMessage);

    if (!confirmed) {
      return;
    }

    try {
      // Rename exercise in CSV using plugin's public method
      const count = await this.plugin.renameExercise(oldName, newName);

      // Show success message with count
      new Notice(
        t("modal.notices.auditRenameSuccess", {
          count,
        }),
      );

      // Refresh modal to show updated state
      await this.scanExerciseFiles();
      this.renderResults();
    } catch (error) {
      const errorMessage = ErrorUtils.getErrorMessage(error);
      new Notice(
        t("modal.notices.auditRenameError", {
          error: errorMessage,
        }),
      );
    }
  }

  /**
   * Handles renaming an exercise file to match the CSV
   */
  private async handleRenameFile(mismatch: MismatchEntry): Promise<void> {
    const oldFileName = mismatch.fileName;
    const newFileName = mismatch.closestMatch;

    // Show confirmation dialog with preview
    const confirmMessage = t("modal.notices.auditConfirmRenameFile", {
      oldName: oldFileName,
      newName: newFileName,
    });

    // Use Obsidian's built-in confirm dialog
    const confirmed = confirm(confirmMessage);

    if (!confirmed) {
      return;
    }

    try {
      // Calculate new file path
      const oldPath = mismatch.file.path;
      const newPath = oldPath.replace(`${oldFileName}.md`, `${newFileName}.md`);

      // Rename file using Obsidian vault API
      await this.app.vault.rename(mismatch.file, newPath);

      // Show success message
      new Notice(t("modal.notices.auditRenameFileSuccess"));

      // Refresh modal to show updated state
      await this.scanExerciseFiles();
      this.renderResults();
    } catch (error) {
      const errorMessage = ErrorUtils.getErrorMessage(error);
      new Notice(
        t("modal.notices.auditRenameFileError", {
          error: errorMessage,
        }),
      );
    }
  }
}
