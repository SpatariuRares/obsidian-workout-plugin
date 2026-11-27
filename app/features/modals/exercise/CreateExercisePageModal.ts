// Refactored CreateExercisePageModal using reusable components

import { DEFAULT_EXERCISE_TYPE_ID } from "@app/constants/exerciseTypes.constants";
import { App, normalizePath, Notice } from "obsidian";
import type {
  WorkoutPluginContext,
  TemplateGeneratorPort,
} from "@app/types/PluginPorts";
import { WizardModal, type WizardStep } from "@app/features/modals/base/WizardModal";
import { ErrorUtils } from "@app/utils/ErrorUtils";
import { ExerciseAutocomplete } from "@app/features/modals/components/ExerciseAutocomplete";
import { MuscleTagSelector } from "@app/features/modals/components/MuscleTagSelector";
import { Button } from "@app/components/atoms";
import { t } from "@app/i18n";
import { fillExercisePageTemplate } from "@app/services/exercise/ExercisePageContent";
import {
  BUTTONSIZE,
  BUTTONVARIANT,
} from "@app/components/atoms/Button";
import { exerciseTypeName } from "@app/constants/ui.constants";
import type { CustomExerciseType } from "@app/types/WorkoutLogData";
import { ExerciseTypeCatalog } from "@app/services/exercise/ExerciseTypeCatalog";
import { ExerciseTypeEditorModal } from "@app/features/settings/modals/ExerciseTypeEditorModal";
import { saveExerciseType } from "@app/features/settings/business/saveExerciseType";
import { describeFields } from "@app/features/settings/components/ExerciseTypesSettings";

/**
 * Creates an exercise page through two steps: Name and type (exercise name
 * and its type with the fields it logs), then Muscles and folder. The page
 * text is written by `fillExercisePageTemplate`, as before.
 */
export class CreateExercisePageModal extends WizardModal {
  private exerciseName?: string;
  private getSelectedTags?: () => string[];
  private exerciseInput?: HTMLInputElement;
  private typeSelect?: HTMLSelectElement;
  private folderInput?: HTMLInputElement;

  constructor(
    app: App,
    private host: WorkoutPluginContext & TemplateGeneratorPort,
    exerciseName?: string,
  ) {
    super(app, host);
    this.exerciseName = exerciseName;
  }

  protected getModalTitle(): string {
    return t("modal.titles.createExercisePage");
  }

  protected getButtonText(): string {
    return t("modal.buttons.createExercise");
  }

  protected getSuccessMessage(): string {
    return t("modal.notices.exercisePageCreated");
  }

  protected generateCode(): string {
    return "";
  }

  protected getSteps(): WizardStep[] {
    return [
      {
        id: "exercise",
        label: t("createExercisePageWizard.steps.nameAndType"),
        render: (el) => this.renderNameStep(el),
        validate: () => this.validateName(),
        isComplete: () => this.name() !== "",
      },
      {
        id: "details",
        label: t("createExercisePageWizard.steps.musclesAndFolder"),
        render: (el) => this.renderDetailsStep(el),
      },
    ];
  }

  private name(): string {
    return this.exerciseInput?.value.trim() ?? "";
  }

  private validateName(): boolean {
    const ok = this.name() !== "";
    this.setStepError(
      "exercise",
      ok ? null : t("modal.notices.exercisePageNameRequired"),
      this.exerciseInput,
    );
    return ok;
  }

  private renderNameStep(el: HTMLElement): void {
    const { elements } = ExerciseAutocomplete.create(this, el, this.host, this.exerciseName, {
      showCreateButton: false,
    });
    this.exerciseInput = elements.exerciseInput;
    this.typeSelect = this.createSelectField(el, t("modal.exerciseType"), []);
    this.createTypePicker(this.typeSelect);
  }

  private renderDetailsStep(el: HTMLElement): void {
    this.getSelectedTags = MuscleTagSelector.create(el, this.host).getSelectedTags;
    this.folderInput = this.createTextField(
      el,
      t("modal.folderPath"),
      t("modal.placeholders.folderPath"),
      this.host.settings.exerciseFolderPath,
    );
  }

  protected async submit(): Promise<void> {
    try {
      await this.createExercisePage(
        this.name(),
        this.typeSelect?.value ?? DEFAULT_EXERCISE_TYPE_ID,
        this.getSelectedTags ? this.getSelectedTags() : [],
        this.folderInput?.value.trim() ?? "",
      );
      this.close();
      new Notice(this.getSuccessMessage());
    } catch (error) {
      new Notice(t("modal.notices.exercisePageError", { error: ErrorUtils.getErrorMessage(error) }));
    }
  }

  /**
   * The exercise types to pick from (built-in, then the user's), the fields
   * the picked one logs, and a button that makes a new type and picks it
   */
  private createTypePicker(select: HTMLSelectElement): void {
    const fields = select.parentElement!.createDiv({
      cls: "workout-exercise-type-preview setting-item-description",
    });
    const catalog = () => new ExerciseTypeCatalog(this.host.settings.exerciseTypes);
    const show = () => {
      const type = catalog().resolve(select.value);
      fields.setText(type ? describeFields(type.parameters) : "");
    };
    const fill = (selected: string) => {
      select.empty();
      for (const type of catalog().pickable()) {
        select.createEl("option", { text: exerciseTypeName(type), value: type.id });
      }
      select.value = selected;
      show();
    };
    select.addEventListener("change", show);

    const add = Button.create(select.parentElement!, {
      text: t("settings.exerciseTypes.newType"),
      icon: "plus",
      variant: BUTTONVARIANT.SECONDARY,
      size: BUTTONSIZE.SMALL,
    });
    Button.onClick(add, () => {
      const draft: CustomExerciseType = { id: "", name: "", parameters: [] };
      new ExerciseTypeEditorModal(this.app, draft, null, async () => {
        const saved = await saveExerciseType(this.plugin, draft, null);
        if (saved) fill(draft.id);
        return saved;
      }).open();
    });
    fill(DEFAULT_EXERCISE_TYPE_ID);
  }

  private async createExercisePage(
    exerciseName: string,
    exerciseType: string,
    tags: string[],
    folderPath: string,
  ) {
    const template =
      await this.host.templateGeneratorService.getExercisePageTemplate();

    const content = fillExercisePageTemplate(
      template,
      { name: exerciseName, typeId: exerciseType, muscleGroups: tags },
      new ExerciseTypeCatalog(this.host.settings.exerciseTypes).resolve(exerciseType)?.name,
    );

    const safeExerciseName = exerciseName.replace(
      /[\\/:"*?<>|]/g,
      "_",
    );
    const fileName = normalizePath(
      folderPath + "/" + safeExerciseName + ".md",
    );
    await this.app.vault.create(fileName, content);
  }
}
