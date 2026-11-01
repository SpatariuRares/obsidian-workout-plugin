import { App, Notice } from "obsidian";
import { ModalBase } from "@app/features/modals/base/ModalBase";
import { Button, BUTTONVARIANT } from "@app/components/atoms";
import type { WorkoutPluginContext } from "@app/types/PluginPorts";
import {
  readWorkoutExport,
  SOURCE_NAME,
  type WorkoutExport,
} from "@app/features/import/logic/readWorkoutExport";
import {
  planImport,
  type ImportPlan,
} from "@app/features/import/logic/planImport";
import { ErrorUtils } from "@app/utils/ErrorUtils";
import { t } from "@app/i18n";

/**
 * Imports a Strong or Hevy CSV export: pick the file, see what would be
 * added (duplicates skipped, exercises without a page, days covered),
 * then add the sets in one write.
 */
export class ImportWorkoutsModal extends ModalBase {
  private resultEl: HTMLElement | null = null;

  constructor(
    app: App,
    private plugin: WorkoutPluginContext,
  ) {
    super(app);
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("workout-modal");
    contentEl.createEl("h2", { text: t("import.title") });
    contentEl.createEl("p", { text: t("import.intro") });

    const input = contentEl.createEl("input", {
      type: "file",
      attr: { accept: ".csv,text/csv", hidden: "" },
    });
    input.addEventListener("change", () => {
      const file = input.files?.[0];
      if (file) void this.preview(file);
    });

    const chooseBtn = Button.create(Button.createContainer(contentEl), {
      text: t("import.chooseFile"),
      ariaLabel: t("import.chooseFile"),
      variant: BUTTONVARIANT.PRIMARY,
    });
    Button.onClick(chooseBtn, () => input.click());

    this.resultEl = contentEl.createDiv();
  }

  onClose(): void {
    this.contentEl.empty();
  }

  private async preview(file: File): Promise<void> {
    const el = this.resultEl;
    if (!el) return;
    el.empty();

    let exported: WorkoutExport | null;
    let plan: ImportPlan;
    try {
      exported = readWorkoutExport(
        await file.text(),
        this.plugin.settings.weightUnit,
      );
      if (!exported) {
        el.createEl("p", { text: t("import.notAnExport") });
        return;
      }
      if (exported.sets.length === 0) {
        el.createEl("p", { text: t("import.noSets") });
        return;
      }
      const library = this.plugin.getExerciseLibrary();
      plan = planImport(
        exported.sets,
        await this.plugin.getWorkoutLogData(),
        (exercise) => library.find(exercise) !== undefined,
      );
    } catch (error) {
      el.createEl("p", {
        text: t("import.readError", {
          error: ErrorUtils.getErrorMessage(error),
        }),
      });
      return;
    }

    const source = SOURCE_NAME[exported.source];
    el.createEl("h3", { text: t("import.source", { source }) });
    const facts = el.createEl("ul");
    facts.createEl("li", {
      text: t("import.setsFound", { count: exported.sets.length }),
    });
    facts.createEl("li", {
      text: t("import.setsToAdd", { count: plan.toAdd.length }),
    });
    if (plan.duplicates > 0) {
      facts.createEl("li", {
        text: t("import.duplicates", { count: plan.duplicates }),
      });
    }
    if (plan.firstDay && plan.lastDay) {
      facts.createEl("li", {
        text: t("import.dateRange", {
          first: plan.firstDay,
          last: plan.lastDay,
        }),
      });
    }
    if (plan.newExercises.length > 0) {
      facts.createEl("li", {
        text: t("import.newExercises", {
          exercises: plan.newExercises.join(", "),
        }),
      });
    }

    if (plan.toAdd.length === 0) {
      el.createEl("p", { text: t("import.nothingToAdd") });
      return;
    }

    el.createEl("p", { text: t("import.backupNote") });
    const buttons = Button.createContainer(el);
    const cancelBtn = Button.create(buttons, {
      text: t("modal.buttons.cancel"),
      ariaLabel: t("modal.buttons.cancel"),
      variant: BUTTONVARIANT.SECONDARY,
    });
    Button.onClick(cancelBtn, () => this.close());
    const importBtn = Button.create(buttons, {
      text: t("import.importButton"),
      ariaLabel: t("import.importButton"),
      variant: BUTTONVARIANT.PRIMARY,
    });
    Button.onClick(importBtn, () => {
      Button.setDisabled(importBtn, true);
      void this.write(plan).then((done) => {
        if (!done) Button.setDisabled(importBtn, false);
      });
    });
  }

  /** @returns whether the sets were added */
  private async write(plan: ImportPlan): Promise<boolean> {
    try {
      const count = await this.plugin.importWorkoutLogEntries(plan.toAdd);
      new Notice(t("import.imported", { count }));
      this.close();
      return true;
    } catch (error) {
      new Notice(
        t("import.error", { error: ErrorUtils.getErrorMessage(error) }),
      );
      return false;
    }
  }
}
