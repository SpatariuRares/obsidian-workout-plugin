import { App, Notice } from "obsidian";
import { ModalBase } from "@app/features/modals/base/ModalBase";
import { ExerciseAutocomplete } from "@app/features/modals/components/ExerciseAutocomplete";
import { t } from "@app/i18n";
import { exerciseTypeName } from "@app/constants/ui.constants";
import type {
  ExerciseTypeDefinition,
  ParameterDefinition,
} from "@app/types/ExerciseTypes";
import type { WorkoutPluginContext } from "@app/types/PluginPorts";
import {
  ExerciseConversionService,
  FieldMapping,
} from "@app/features/exercise-conversion/logic/ExerciseConversionService";
import { ConversionTypeSelect } from "@app/features/exercise-conversion/components/ConversionTypeSelect";
import { FieldMappingList } from "@app/features/exercise-conversion/components/FieldMappingList";
import { Button, Feedback } from "@app/components/atoms";
import { StatCard } from "@app/components/molecules";

/**
 * Converts the logged sets of one exercise to another exercise type
 * (built-in or the user's own), moving values between fields. Three section
 * cards: the exercise (with its current type and how many sets change), the
 * type to convert to, the field mapping; the action row stays at the bottom.
 */
export class ConvertExerciseDataModal extends ModalBase {
  private plugin: WorkoutPluginContext;
  private conversionService: ExerciseConversionService;

  private typeSelect: ConversionTypeSelect | null = null;
  private fieldMappingList: FieldMappingList | null = null;

  // State
  private selectedExercise: string = "";
  private currentType: ExerciseTypeDefinition | null = null;
  private sourceFields: ParameterDefinition[] = [];
  private targetType: string = "";
  private updateFrontmatter: boolean = true;
  private entryCount: number = 0;
  private mappings: FieldMapping[] = [];

  // UI Elements
  private summaryEl: HTMLElement | null = null;
  /** Shown once an exercise is picked */
  private laterSections: HTMLElement[] = [];
  private convertButton: HTMLButtonElement | null = null;

  constructor(app: App, plugin: WorkoutPluginContext) {
    super(app);
    this.plugin = plugin;
    this.conversionService = new ExerciseConversionService(plugin);
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("workout-modal");

    contentEl.createEl("h2", { text: t("convert.title") });

    const form = this.createStyledMainContainer(contentEl);
    form.addClass("workout-convert-form");

    this.createExerciseSection(form);

    const typeSection = this.createSection(
      form,
      t("convert.typeSelect.convertTo"),
    );
    this.typeSelect = new ConversionTypeSelect(
      this,
      typeSection,
      this.conversionService.targetTypes(),
      (typeId) => this.handleTargetTypeChange(typeId),
      (update) => {
        this.updateFrontmatter = update;
      },
    );

    const mappingSection = this.createSection(
      form,
      t("convert.fieldMapping.title"),
    );
    this.fieldMappingList = new FieldMappingList(
      this,
      mappingSection,
      (mappings) => {
        this.mappings = mappings;
        this.updateState();
      },
    );

    this.laterSections = [typeSection, mappingSection];
    this.laterSections.forEach((section) => setShown(section, false));

    this.convertButton =
      Button.createModalActions(contentEl, {
        primary: {
          text: t("common.convert"),
          disabled: true,
          onClick: () => this.handleConvert(),
        },
        onCancel: () => this.close(),
      }).primary ?? null;
  }

  onClose(): void {
    this.contentEl.empty();
  }

  private createExerciseSection(parent: HTMLElement): void {
    const section = this.createSection(
      parent,
      t("convert.sectionExercise"),
    );

    const { elements } = ExerciseAutocomplete.create(
      this,
      section,
      this.plugin,
      this.selectedExercise,
      { showCreateButton: false },
    );

    const pick = () => {
      const value = elements.exerciseInput.value.trim();
      if (value === this.selectedExercise) return;
      this.selectedExercise = value;
      void this.handleExerciseChange();
    };
    elements.exerciseInput.addEventListener("change", pick);
    elements.exerciseInput.addEventListener("blur", pick);

    this.summaryEl = section.createDiv({
      cls: "workout-convert-summary",
    });
    setShown(this.summaryEl, false);
  }

  private async handleExerciseChange(): Promise<void> {
    const exercise = this.selectedExercise;
    if (!exercise) {
      this.resetUI();
      return;
    }

    const currentType = await this.plugin
      .getExerciseDefinitionService()
      .getExerciseType(exercise);
    const entryCount = (await this.conversionService.setsOf(exercise))
      .length;
    const sourceFields =
      await this.conversionService.sourceFields(exercise);
    // Another exercise was picked while these were read
    if (exercise !== this.selectedExercise) return;

    this.currentType = currentType;
    this.entryCount = entryCount;
    this.sourceFields = sourceFields;
    this.renderSummary();
    this.laterSections.forEach((section) => setShown(section, true));
    // Offers every type but the current one and maps the pick's fields
    this.typeSelect?.setCurrentType(currentType.id);
  }

  /** "Current type: Strength", then how many sets change (or that none would) */
  private renderSummary(): void {
    const el = this.summaryEl;
    if (!el || !this.currentType) return;
    el.empty();
    setShown(el, true);

    const row = StatCard.row(el);
    StatCard.create(row, {
      label: t("convert.currentType"),
      value: exerciseTypeName(this.currentType),
      detail:
        this.entryCount === 1
          ? t("convert.preview.willConvertOne")
          : this.entryCount > 1
            ? t("convert.preview.willConvertMany", {
                count: this.entryCount,
              })
            : undefined,
    });
    if (this.entryCount === 0) {
      Feedback.renderWarning(el, t("convert.preview.noEntries"), {
        append: true,
      });
    }
  }

  private handleTargetTypeChange(typeId: string): void {
    this.targetType = typeId;
    const target = this.conversionService.resolveType(typeId);
    if (!this.currentType || !target) return;

    this.fieldMappingList?.setFields(
      this.sourceFields,
      target.parameters,
      this.conversionService.suggestInitialMappings(
        this.currentType,
        target,
      ),
    );
  }

  private updateState(): void {
    if (!this.convertButton) return;
    const isValid =
      this.selectedExercise &&
      this.targetType &&
      this.currentType?.id !== this.targetType &&
      this.mappings.length > 0 &&
      this.entryCount > 0;
    this.convertButton.disabled = !isValid;
  }

  private resetUI(): void {
    this.laterSections.forEach((section) => setShown(section, false));
    if (this.summaryEl) setShown(this.summaryEl, false);
    this.currentType = null;
    this.entryCount = 0;
    this.mappings = [];
    this.updateState();
  }

  private async handleConvert(): Promise<void> {
    try {
      const count = await this.conversionService.convertExerciseData(
        this.selectedExercise,
        this.targetType,
        this.mappings,
      );

      if (this.updateFrontmatter) {
        await this.conversionService.updateExerciseFrontmatter(
          this.selectedExercise,
          this.targetType,
        );
      }

      new Notice(t("convert.success", { count }));
      this.close();
    } catch (error) {
      new Notice(
        t("convert.errors.convertError", { error: String(error) }),
      );
    }
  }
}

function setShown(el: HTMLElement, shown: boolean): void {
  el.classList.toggle("workout-display-none", !shown);
}
