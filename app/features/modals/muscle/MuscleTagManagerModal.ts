import { CONSTANTS } from "@app/constants";
import { App, Notice } from "obsidian";
import { ModalBase } from "@app/features/modals/base/ModalBase";
import { ConfirmModal } from "@app/features/modals/common/ConfirmModal";
import { MuscleTagLayoutRenderer } from "@app/features/modals/muscle/components/MuscleTagLayoutRenderer";
import { MuscleTagTableRenderer } from "@app/features/modals/muscle/components/MuscleTagTableRenderer";
import { MuscleTagSuggestionLogic } from "@app/features/modals/muscle/logic/MuscleTagSuggestionLogic";
import { MuscleTagImportLogic } from "@app/features/modals/muscle/logic/MuscleTagImportLogic";
import { filterMuscleTags } from "@app/features/modals/muscle/logic/MuscleTagFilterLogic";
import { validateMuscleTagSave } from "@app/features/modals/muscle/logic/MuscleTagSaveValidationLogic";
import { mergeMuscleTagImport } from "@app/features/modals/muscle/logic/MuscleTagImportMergeLogic";
import { readTextFile, downloadCsv } from "@app/utils/FileUtils";
import type { MuscleTagFormRenderer } from "@app/features/modals/muscle/components/MuscleTagFormRenderer";
import type { MuscleTagImportPreviewRenderer } from "@app/features/modals/muscle/components/MuscleTagImportPreviewRenderer";
import type { MuscleTagImportMode } from "@app/features/modals/muscle/types";
import type WorkoutChartsPlugin from "main";
import { StringUtils } from "@app/utils";

const DEBOUNCE_DELAY = 150;

export class MuscleTagManagerModal extends ModalBase {
  private readonly plugin: WorkoutChartsPlugin;
  private contentContainer: HTMLElement | null = null;
  private tableBody: HTMLElement | null = null;
  private countDisplay: HTMLElement | null = null;
  private formRenderer: MuscleTagFormRenderer | null = null;
  private importPreviewRenderer: MuscleTagImportPreviewRenderer | null = null;
  private allTags = new Map<string, string>();
  private pendingImportTags = new Map<string, string>();
  private searchValue = "";
  private isEditing = false;
  private editingTag: string | null = null;
  private debounceTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(app: App, plugin: WorkoutChartsPlugin) {
    super(app);
    this.plugin = plugin;
  }

  async onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("workout-modal");

    contentEl.createEl("h2", {
      text: CONSTANTS.WORKOUT.MODAL.TITLES.MUSCLE_TAG_MANAGER,
    });

    this.contentContainer = contentEl.createEl("div", {
      cls: "workout-charts-form",
    });
    this.contentContainer.createEl("p", {
      text: CONSTANTS.WORKOUT.MODAL.NOTICES.MUSCLE_TAG_LOADING,
    });

    await this.loadTags();
    this.renderLayout();
    this.renderTags();
  }

  onClose() {
    this.clearDebounce();
    this.contentEl.empty();
  }

  private async loadTags(): Promise<void> {
    try {
      this.allTags = await this.plugin.getMuscleTagService().loadTags();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      new Notice(`Error loading muscle tags: ${message}`);
      this.allTags = new Map();
    }
  }

  private renderLayout(): void {
    if (!this.contentContainer) {
      return;
    }

    const layout = MuscleTagLayoutRenderer.render(
      this.contentContainer,
      {
        onSearch: (value) => this.handleSearch(value),
        onAdd: () => this.showAddForm(),
        onExport: () => this.handleExport(),
        onFileSelect: (event) => {
          void this.handleFileSelect(event);
        },
      },
      this.searchValue,
    );

    this.tableBody = layout.tableBody;
    this.countDisplay = layout.countDisplay;
    this.formRenderer = layout.formRenderer;
    this.importPreviewRenderer = layout.importPreviewRenderer;
  }

  private renderTags(): void {
    if (!this.tableBody) {
      return;
    }

    const filteredTags = filterMuscleTags(this.allTags, this.searchValue);

    MuscleTagTableRenderer.render({
      tableBody: this.tableBody,
      tags: filteredTags,
      onEdit: (tag, muscleGroup) => this.showEditForm(tag, muscleGroup),
      onDelete: (tag) => this.confirmDelete(tag),
    });

    if (this.countDisplay) {
      this.countDisplay.textContent =
        CONSTANTS.WORKOUT.MODAL.NOTICES.MUSCLE_TAG_COUNT(filteredTags.size);
    }
  }

  private showAddForm(): void {
    this.isEditing = false;
    this.editingTag = null;
    this.renderForm(CONSTANTS.WORKOUT.MODAL.LABELS.NEW_TAG, "", "");
  }

  private showEditForm(tag: string, muscleGroup: string): void {
    this.isEditing = true;
    this.editingTag = tag;
    this.renderForm(CONSTANTS.WORKOUT.MODAL.LABELS.EDIT_TAG, tag, muscleGroup);
  }

  private renderForm(
    title: string,
    tagValue: string,
    muscleGroupValue: string,
  ): void {
    if (!this.formRenderer) {
      return;
    }

    this.formRenderer.render({
      title,
      tagValue,
      muscleGroupValue,
      isEditing: this.isEditing,
      onCancel: () => this.hideForm(),
      onSave: (tagInput, groupSelect) => {
        void this.handleSave(tagInput, groupSelect);
      },
      onTagInputChange: (value) => this.handleTagInputChange(value),
      onSuggestionClick: (tag, muscleGroup) =>
        this.showEditForm(tag, muscleGroup),
    });
  }

  private hideForm(): void {
    this.clearDebounce();
    this.formRenderer?.hide();
    this.isEditing = false;
    this.editingTag = null;
  }

  private async handleSave(
    tagInput: HTMLInputElement,
    groupSelect: HTMLSelectElement,
  ): Promise<void> {
    const tag = StringUtils.normalize(tagInput.value);
    const muscleGroup = groupSelect.value;

    const validation = validateMuscleTagSave(
      tag,
      muscleGroup,
      this.isEditing,
      this.allTags,
    );

    if (!validation.isValid) {
      if (validation.notice) {
        new Notice(validation.notice);
      }
      if (validation.focusTarget === "tag") {
        tagInput.focus();
      }
      if (validation.focusTarget === "group") {
        groupSelect.focus();
      }
      return;
    }

    const nextTags = new Map(this.allTags);
    if (this.isEditing && this.editingTag && this.editingTag !== tag) {
      nextTags.delete(this.editingTag);
    }
    nextTags.set(tag, muscleGroup);

    try {
      await this.plugin.getMuscleTagService().saveTags(nextTags);
      this.allTags = nextTags;
      new Notice(CONSTANTS.WORKOUT.MODAL.NOTICES.MUSCLE_TAG_SAVED);
      this.hideForm();
      this.renderTags();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      new Notice(
        CONSTANTS.WORKOUT.MODAL.NOTICES.MUSCLE_TAG_SAVE_ERROR(message),
      );
    }
  }

  private confirmDelete(tag: string): void {
    new ConfirmModal(
      this.app,
      CONSTANTS.WORKOUT.MODAL.NOTICES.MUSCLE_TAG_DELETE_CONFIRM(tag),
      () => {
        void this.handleDelete(tag);
      },
    ).open();
  }

  private async handleDelete(tag: string): Promise<void> {
    const nextTags = new Map(this.allTags);
    nextTags.delete(tag);

    try {
      await this.plugin.getMuscleTagService().saveTags(nextTags);
      this.allTags = nextTags;
      new Notice(CONSTANTS.WORKOUT.MODAL.NOTICES.MUSCLE_TAG_DELETED);
      this.renderTags();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      new Notice(
        CONSTANTS.WORKOUT.MODAL.NOTICES.MUSCLE_TAG_SAVE_ERROR(message),
      );
    }
  }

  private handleExport(): void {
    try {
      const csvContent = this.plugin
        .getMuscleTagService()
        .exportToCsv(this.allTags);
      downloadCsv(csvContent, "muscle-tags-export.csv");
      new Notice(CONSTANTS.WORKOUT.MODAL.NOTICES.MUSCLE_TAG_EXPORTED);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      new Notice(
        CONSTANTS.WORKOUT.MODAL.NOTICES.MUSCLE_TAG_EXPORT_ERROR(message),
      );
    }
  }

  private handleSearch(value: string): void {
    this.searchValue = value;
    this.renderTags();
  }

  private handleTagInputChange(value: string): void {
    this.clearDebounce();
    this.debounceTimeout = setTimeout(() => {
      this.updateSuggestions(StringUtils.normalize(value));
    }, DEBOUNCE_DELAY);
  }

  private updateSuggestions(needle: string): void {
    if (!this.formRenderer) {
      return;
    }

    if (needle.length < 2) {
      this.formRenderer.clearSuggestions();
      return;
    }

    const suggestions = MuscleTagSuggestionLogic.getSuggestions(
      needle,
      this.allTags,
    );
    this.formRenderer.renderSuggestions(suggestions, (tag, muscleGroup) => {
      this.showEditForm(tag, muscleGroup);
    });
  }

  private async handleFileSelect(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    input.value = "";

    try {
      const content = await readTextFile(file);
      this.processImportFile(content);
    } catch {
      new Notice(
        CONSTANTS.WORKOUT.MODAL.NOTICES.MUSCLE_TAG_IMPORT_ERROR(
          "Failed to read file",
        ),
      );
    }
  }

  private processImportFile(content: string): void {
    const result = MuscleTagImportLogic.parseImportFileContent(content);

    if (!result.isValidFormat) {
      new Notice(
        CONSTANTS.WORKOUT.MODAL.NOTICES.MUSCLE_TAG_IMPORT_INVALID_FORMAT,
      );
      return;
    }

    if (result.validTags.size === 0) {
      new Notice(
        result.errors[0] ||
          CONSTANTS.WORKOUT.MODAL.NOTICES.MUSCLE_TAG_IMPORT_NO_VALID,
      );
      return;
    }

    this.pendingImportTags = result.validTags;
    this.showImportPreview(result.validTags, result.errors);
  }

  private showImportPreview(tags: Map<string, string>, errors: string[]): void {
    if (!this.importPreviewRenderer) {
      return;
    }

    this.importPreviewRenderer.render({
      tags,
      errors,
      onCancel: () => this.hideImportPreview(),
      onMerge: () => {
        void this.executeImport("merge");
      },
      onReplace: () => {
        void this.executeImport("replace");
      },
    });
  }

  private hideImportPreview(): void {
    this.importPreviewRenderer?.hide();
    this.pendingImportTags.clear();
  }

  private async executeImport(mode: MuscleTagImportMode): Promise<void> {
    const { finalTags, importedCount } = mergeMuscleTagImport(
      mode,
      this.allTags,
      this.pendingImportTags,
    );

    try {
      await this.plugin.getMuscleTagService().saveTags(finalTags);
      this.allTags = finalTags;
      new Notice(
        CONSTANTS.WORKOUT.MODAL.NOTICES.MUSCLE_TAG_IMPORTED(importedCount),
      );
      this.hideImportPreview();
      this.renderTags();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      new Notice(
        CONSTANTS.WORKOUT.MODAL.NOTICES.MUSCLE_TAG_IMPORT_ERROR(message),
      );
    }
  }

  private clearDebounce(): void {
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
      this.debounceTimeout = null;
    }
  }
}
