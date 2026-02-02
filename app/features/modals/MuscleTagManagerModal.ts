/**
 * Modal for managing muscle tags - view, search, add, edit, and delete custom muscle tag mappings.
 *
 * @module MuscleTagManagerModal
 */

import { CONSTANTS } from "@app/constants";
import { CANONICAL_MUSCLE_GROUPS } from "@app/constants/muscles.constants";
import { App, Notice } from "obsidian";
import { ModalBase } from "@app/features/modals/base/ModalBase";
import { SearchBox } from "@app/components/molecules";
import { Button, Input } from "@app/components/atoms";
import { ConfirmModal } from "@app/features/modals/ConfirmModal";
import { StringUtils } from "@app/utils/StringUtils";
import { DomUtils } from "@app/utils/DomUtils";
import type WorkoutChartsPlugin from "main";

/** Maximum Levenshtein distance to consider a tag as similar */
const FUZZY_MAX_DISTANCE = 2;
/** Distance at which to show a warning icon (very similar = possible duplicate) */
const FUZZY_WARNING_DISTANCE = 1;
/** Debounce delay for suggestions in milliseconds */
const DEBOUNCE_DELAY = 150;

/**
 * Modal for viewing, searching, and managing muscle tags.
 * Displays all tags from MuscleTagService with search filtering capability
 * and CRUD operations (Create, Read, Update, Delete).
 */
export class MuscleTagManagerModal extends ModalBase {
  private plugin: WorkoutChartsPlugin;
  private contentContainer: HTMLElement | null = null;
  private tableBody: HTMLElement | null = null;
  private countDisplay: HTMLElement | null = null;
  private formContainer: HTMLElement | null = null;
  private allTags: Map<string, string> = new Map();
  private isEditing = false;
  private editingTag: string | null = null;
  private searchValue = "";
  private suggestionsContainer: HTMLElement | null = null;
  private debounceTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(app: App, plugin: WorkoutChartsPlugin) {
    super(app);
    this.plugin = plugin;
  }

  async onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("workout-charts-modal");

    // Title
    contentEl.createEl("h2", {
      text: CONSTANTS.WORKOUT.MODAL.TITLES.MUSCLE_TAG_MANAGER,
    });

    // Main container
    this.contentContainer = contentEl.createEl("div", {
      cls: "workout-charts-form",
    });

    // Show loading message
    this.contentContainer.createEl("p", {
      text: CONSTANTS.WORKOUT.MODAL.NOTICES.MUSCLE_TAG_LOADING,
    });

    // Load tags
    await this.loadTags();

    // Render UI
    this.renderUI();
  }

  onClose() {
    // Clean up debounce timeout
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
      this.debounceTimeout = null;
    }

    const { contentEl } = this;
    contentEl.empty();
  }

  /**
   * Loads muscle tags from the service.
   */
  private async loadTags(): Promise<void> {
    try {
      const muscleTagService = this.plugin.getMuscleTagService();
      this.allTags = await muscleTagService.loadTags();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      new Notice(`Error loading muscle tags: ${errorMessage}`);
      this.allTags = new Map();
    }
  }

  /**
   * Renders the modal UI with search box, add button, form, and tag table.
   */
  private renderUI(): void {
    if (!this.contentContainer) return;

    this.contentContainer.empty();

    // Header section with search and add button
    const headerSection = this.contentContainer.createEl("div", {
      cls: "workout-modal-section workout-tag-header",
    });

    // Search box
    const searchBox = SearchBox.create(headerSection, {
      placeholder: CONSTANTS.WORKOUT.MODAL.PLACEHOLDERS.SEARCH_TAGS,
    });

    // Restore search value if any
    if (this.searchValue) {
      searchBox.input.value = this.searchValue;
    }

    // Add input event listener for real-time filtering
    searchBox.input.addEventListener("input", () => {
      this.searchValue = SearchBox.getValue(searchBox).toLowerCase();
      this.filterTags(this.searchValue);
    });

    // Button container for actions
    const buttonContainer = headerSection.createEl("div", {
      cls: "workout-tag-header-buttons",
    });

    // Add tag button
    const addButton = Button.create(buttonContainer, {
      text: CONSTANTS.WORKOUT.MODAL.LABELS.ADD_TAG,
      className: "mod-cta workout-tag-add-btn",
      ariaLabel: CONSTANTS.WORKOUT.MODAL.LABELS.ADD_TAG,
    });
    Button.onClick(addButton, () => this.showAddForm());

    // Export button
    const exportButton = Button.create(buttonContainer, {
      text: CONSTANTS.WORKOUT.MODAL.LABELS.EXPORT_TAGS,
      className: "workout-tag-export-btn",
      ariaLabel: CONSTANTS.WORKOUT.MODAL.LABELS.EXPORT_TAGS,
    });
    Button.onClick(exportButton, () => this.handleExport());

    // Form container (hidden by default)
    this.formContainer = this.contentContainer.createEl("div", {
      cls: "workout-tag-form-container workout-modal-section",
    });
    DomUtils.setCssProps(this.formContainer, { display: "none" });

    // Tag count display
    this.countDisplay = this.contentContainer.createEl("p", {
      cls: "workout-tag-count",
    });
    this.updateCountDisplay(this.allTags.size);

    // Table container
    const tableContainer = this.contentContainer.createEl("div", {
      cls: "workout-tag-table-container",
    });

    // Create table
    const table = tableContainer.createEl("table", {
      cls: "workout-tag-table",
    });

    // Table header
    const thead = table.createEl("thead");
    const headerRow = thead.createEl("tr");
    headerRow.createEl("th", {
      text: CONSTANTS.WORKOUT.MODAL.LABELS.TAG,
    });
    headerRow.createEl("th", {
      text: CONSTANTS.WORKOUT.MODAL.LABELS.MUSCLE_GROUP,
    });
    headerRow.createEl("th", {
      text: CONSTANTS.WORKOUT.MODAL.LABELS.ACTIONS,
      cls: "workout-tag-actions-header",
    });

    // Table body
    this.tableBody = table.createEl("tbody");
    this.renderTagRows(this.getFilteredTags());
  }

  /**
   * Gets filtered tags based on current search value.
   */
  private getFilteredTags(): Map<string, string> {
    if (!this.searchValue) {
      return this.allTags;
    }

    const filteredTags = new Map<string, string>();
    for (const [tag, muscleGroup] of this.allTags) {
      if (
        tag.toLowerCase().includes(this.searchValue) ||
        muscleGroup.toLowerCase().includes(this.searchValue)
      ) {
        filteredTags.set(tag, muscleGroup);
      }
    }
    return filteredTags;
  }

  /**
   * Renders tag rows in the table with edit and delete actions.
   * @param tags - Map of tags to display
   */
  private renderTagRows(tags: Map<string, string>): void {
    if (!this.tableBody) return;

    this.tableBody.empty();

    if (tags.size === 0) {
      const emptyRow = this.tableBody.createEl("tr");
      const emptyCell = emptyRow.createEl("td", {
        attr: { colspan: "3" },
        cls: "workout-tag-empty",
      });
      emptyCell.createEl("p", {
        text: CONSTANTS.WORKOUT.MODAL.NOTICES.MUSCLE_TAG_NO_RESULTS,
      });
      return;
    }

    // Sort tags alphabetically
    const sortedTags = Array.from(tags.entries()).sort((a, b) =>
      a[0].localeCompare(b[0]),
    );

    for (const [tag, muscleGroup] of sortedTags) {
      const row = this.tableBody.createEl("tr");

      // Tag cell (clickable to edit)
      const tagCell = row.createEl("td", {
        text: tag,
        cls: "workout-tag-name workout-tag-clickable",
      });
      tagCell.addEventListener("click", () =>
        this.showEditForm(tag, muscleGroup),
      );

      // Muscle group cell (clickable to edit)
      const groupCell = row.createEl("td", {
        text: muscleGroup,
        cls: "workout-tag-group workout-tag-clickable",
      });
      groupCell.addEventListener("click", () =>
        this.showEditForm(tag, muscleGroup),
      );

      // Actions cell
      const actionsCell = row.createEl("td", {
        cls: "workout-tag-actions",
      });

      // Edit button
      const editButton = Button.create(actionsCell, {
        text: CONSTANTS.WORKOUT.MODAL.LABELS.EDIT_TAG,
        className: "workout-tag-action-btn",
        ariaLabel: `Edit ${tag}`,
      });
      Button.onClick(editButton, () => this.showEditForm(tag, muscleGroup));

      // Delete button
      const deleteButton = Button.create(actionsCell, {
        text: CONSTANTS.WORKOUT.MODAL.LABELS.DELETE,
        className: "workout-tag-action-btn mod-warning",
        ariaLabel: `Delete ${tag}`,
      });
      Button.onClick(deleteButton, () => this.confirmDelete(tag));
    }
  }

  /**
   * Shows the add form for creating a new tag.
   */
  private showAddForm(): void {
    this.isEditing = false;
    this.editingTag = null;
    this.renderForm(CONSTANTS.WORKOUT.MODAL.LABELS.NEW_TAG, "", "");
  }

  /**
   * Shows the edit form for an existing tag.
   * @param tag - The tag name to edit
   * @param muscleGroup - The current muscle group mapping
   */
  private showEditForm(tag: string, muscleGroup: string): void {
    this.isEditing = true;
    this.editingTag = tag;
    this.renderForm(CONSTANTS.WORKOUT.MODAL.LABELS.EDIT_TAG, tag, muscleGroup);
  }

  /**
   * Renders the add/edit form.
   * @param title - Form title
   * @param tagValue - Initial tag value
   * @param muscleGroupValue - Initial muscle group value
   */
  private renderForm(
    title: string,
    tagValue: string,
    muscleGroupValue: string,
  ): void {
    if (!this.formContainer) return;

    this.formContainer.empty();
    DomUtils.setCssProps(this.formContainer, { display: "block" });

    // Form title
    this.formContainer.createEl("h4", { text: title });

    // Form fields container
    const fieldsContainer = this.formContainer.createEl("div", {
      cls: "workout-tag-form-fields",
    });

    // Tag input
    const tagFieldContainer = fieldsContainer.createEl("div", {
      cls: "workout-tag-field",
    });
    tagFieldContainer.createEl("label", {
      text: CONSTANTS.WORKOUT.MODAL.LABELS.TAG,
      cls: "workout-tag-label",
    });
    const tagInput = Input.create(tagFieldContainer, {
      placeholder: CONSTANTS.WORKOUT.MODAL.PLACEHOLDERS.ENTER_TAG_NAME,
      value: tagValue,
      className: "workout-tag-input",
    });
    // Disable tag input when editing (tag name is the key)
    if (this.isEditing) {
      tagInput.disabled = true;
      tagInput.classList.add("workout-tag-input-disabled");
    }

    // Suggestions container (only for add mode)
    this.suggestionsContainer = tagFieldContainer.createEl("div", {
      cls: "workout-tag-suggestions",
    });
    DomUtils.setCssProps(this.suggestionsContainer, { display: "none" });

    // Add debounced input handler for fuzzy matching (only in add mode)
    if (!this.isEditing) {
      tagInput.addEventListener("input", () => {
        this.handleTagInputChange(tagInput.value);
      });
    }

    // Muscle group dropdown
    const groupFieldContainer = fieldsContainer.createEl("div", {
      cls: "workout-tag-field",
    });
    groupFieldContainer.createEl("label", {
      text: CONSTANTS.WORKOUT.MODAL.LABELS.MUSCLE_GROUP,
      cls: "workout-tag-label",
    });
    const groupSelect = groupFieldContainer.createEl("select", {
      cls: "dropdown workout-tag-select",
    });

    // Add empty option
    const emptyOption = groupSelect.createEl("option", {
      text: "Select muscle group...",
      value: "",
    });
    emptyOption.disabled = true;
    if (!muscleGroupValue) {
      emptyOption.selected = true;
    }

    // Add canonical muscle group options
    for (const group of CANONICAL_MUSCLE_GROUPS) {
      const option = groupSelect.createEl("option", {
        text: group,
        value: group,
      });
      if (group === muscleGroupValue) {
        option.selected = true;
      }
    }

    // Button container
    const buttonContainer = this.formContainer.createEl("div", {
      cls: "workout-tag-form-buttons",
    });

    // Cancel button
    const cancelButton = Button.create(buttonContainer, {
      text: CONSTANTS.WORKOUT.MODAL.BUTTONS.CANCEL,
      ariaLabel: CONSTANTS.WORKOUT.MODAL.BUTTONS.CANCEL,
    });
    Button.onClick(cancelButton, () => this.hideForm());

    // Save button
    const saveButton = Button.create(buttonContainer, {
      text: CONSTANTS.WORKOUT.MODAL.LABELS.SAVE,
      className: "mod-cta",
      ariaLabel: CONSTANTS.WORKOUT.MODAL.LABELS.SAVE,
    });
    Button.onClick(saveButton, () => this.handleSave(tagInput, groupSelect));

    // Focus on the appropriate field
    if (this.isEditing) {
      groupSelect.focus();
    } else {
      tagInput.focus();
    }
  }

  /**
   * Hides the add/edit form.
   */
  private hideForm(): void {
    // Clear debounce timeout
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
      this.debounceTimeout = null;
    }

    if (!this.formContainer) return;
    DomUtils.setCssProps(this.formContainer, { display: "none" });
    this.formContainer.empty();
    this.isEditing = false;
    this.editingTag = null;
    this.suggestionsContainer = null;
  }

  /**
   * Handles save action for add/edit.
   * @param tagInput - The tag input element
   * @param groupSelect - The muscle group select element
   */
  private async handleSave(
    tagInput: HTMLInputElement,
    groupSelect: HTMLSelectElement,
  ): Promise<void> {
    const tag = tagInput.value.trim().toLowerCase();
    const muscleGroup = groupSelect.value;

    // Validation
    if (!tag) {
      new Notice("Please enter a tag name");
      tagInput.focus();
      return;
    }

    if (!muscleGroup) {
      new Notice("Please select a muscle group");
      groupSelect.focus();
      return;
    }

    // Check for duplicate when adding new tag
    if (!this.isEditing && this.allTags.has(tag)) {
      new Notice(CONSTANTS.WORKOUT.MODAL.NOTICES.MUSCLE_TAG_EXISTS(tag));
      tagInput.focus();
      return;
    }

    try {
      // Update the map
      this.allTags.set(tag, muscleGroup);

      // Save to CSV
      const muscleTagService = this.plugin.getMuscleTagService();
      await muscleTagService.saveTags(this.allTags);

      new Notice(CONSTANTS.WORKOUT.MODAL.NOTICES.MUSCLE_TAG_SAVED);
      this.hideForm();
      this.renderTagRows(this.getFilteredTags());
      this.updateCountDisplay(this.allTags.size);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      new Notice(
        CONSTANTS.WORKOUT.MODAL.NOTICES.MUSCLE_TAG_SAVE_ERROR(errorMessage),
      );
    }
  }

  /**
   * Shows confirmation modal for delete action.
   * @param tag - The tag to delete
   */
  private confirmDelete(tag: string): void {
    const confirmModal = new ConfirmModal(
      this.app,
      CONSTANTS.WORKOUT.MODAL.NOTICES.MUSCLE_TAG_DELETE_CONFIRM(tag),
      () => this.handleDelete(tag),
    );
    confirmModal.open();
  }

  /**
   * Handles delete action.
   * @param tag - The tag to delete
   */
  private async handleDelete(tag: string): Promise<void> {
    try {
      // Remove from map
      this.allTags.delete(tag);

      // Save to CSV
      const muscleTagService = this.plugin.getMuscleTagService();
      await muscleTagService.saveTags(this.allTags);

      new Notice(CONSTANTS.WORKOUT.MODAL.NOTICES.MUSCLE_TAG_DELETED);
      this.renderTagRows(this.getFilteredTags());
      this.updateCountDisplay(this.allTags.size);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      new Notice(
        CONSTANTS.WORKOUT.MODAL.NOTICES.MUSCLE_TAG_SAVE_ERROR(errorMessage),
      );
    }
  }

  /**
   * Handles export action - downloads current tags as CSV.
   */
  private handleExport(): void {
    try {
      // Generate CSV content with header
      const csvLines: string[] = ["tag,muscleGroup"];

      // Sort tags alphabetically and add to CSV
      const sortedTags = Array.from(this.allTags.entries()).sort((a, b) =>
        a[0].localeCompare(b[0]),
      );

      for (const [tag, muscleGroup] of sortedTags) {
        // Escape values that contain commas or quotes
        const escapedTag = this.escapeCsvValue(tag);
        const escapedGroup = this.escapeCsvValue(muscleGroup);
        csvLines.push(`${escapedTag},${escapedGroup}`);
      }

      const csvContent = csvLines.join("\n");

      // Create blob and download link
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);

      // Create temporary anchor element for download
      const link = document.createElement("a");
      link.href = url;
      link.download = "muscle-tags-export.csv";
      DomUtils.setCssProps(link, { display: "none" });
      document.body.appendChild(link);

      // Trigger download
      link.click();

      // Clean up
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      new Notice(CONSTANTS.WORKOUT.MODAL.NOTICES.MUSCLE_TAG_EXPORTED);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      new Notice(
        CONSTANTS.WORKOUT.MODAL.NOTICES.MUSCLE_TAG_EXPORT_ERROR(errorMessage),
      );
    }
  }

  /**
   * Escapes a value for CSV format.
   * @param value - The value to escape
   * @returns The escaped value
   */
  private escapeCsvValue(value: string): string {
    // If value contains comma, quote, or newline, wrap in quotes and escape internal quotes
    if (value.includes(",") || value.includes('"') || value.includes("\n")) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  /**
   * Filters tags based on search input.
   * @param searchValue - The search string to filter by
   */
  private filterTags(searchValue: string): void {
    this.searchValue = searchValue;
    const filteredTags = this.getFilteredTags();
    this.renderTagRows(filteredTags);
    this.updateCountDisplay(filteredTags.size);
  }

  /**
   * Handles tag input changes with debouncing for fuzzy matching suggestions.
   * @param value - The current input value
   */
  private handleTagInputChange(value: string): void {
    // Clear any pending debounce
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }

    // Debounce the suggestions update
    this.debounceTimeout = setTimeout(() => {
      this.updateSuggestions(value.trim().toLowerCase());
    }, DEBOUNCE_DELAY);
  }

  /**
   * Updates the suggestions container with similar existing tags.
   * @param needle - The search string to find similar tags for
   */
  private updateSuggestions(needle: string): void {
    if (!this.suggestionsContainer) return;

    // Clear suggestions container
    this.suggestionsContainer.empty();

    // Don't show suggestions for very short input
    if (needle.length < 2) {
      DomUtils.setCssProps(this.suggestionsContainer, { display: "none" });
      return;
    }

    // Get all existing tag names
    const existingTags = Array.from(this.allTags.keys());

    // Find similar tags using Levenshtein distance
    const similarTags = this.findSimilarTagsWithDistance(needle, existingTags);

    // Filter out exact matches (they should trigger the "already exists" validation)
    const suggestions = similarTags.filter(
      (item) => item.tag.toLowerCase() !== needle,
    );

    if (suggestions.length === 0) {
      DomUtils.setCssProps(this.suggestionsContainer, { display: "none" });
      return;
    }

    // Show suggestions container
    DomUtils.setCssProps(this.suggestionsContainer, { display: "block" });

    // Header with count
    const header = this.suggestionsContainer.createEl("div", {
      cls: "workout-tag-suggestions-header",
    });
    header.createEl("span", {
      text: CONSTANTS.WORKOUT.MODAL.LABELS.SIMILAR_TAGS,
      cls: "workout-tag-suggestions-label",
    });
    header.createEl("span", {
      text: CONSTANTS.WORKOUT.MODAL.NOTICES.MUSCLE_TAG_SIMILAR_FOUND(
        suggestions.length,
      ),
      cls: "workout-tag-suggestions-count",
    });

    // Suggestions list
    const list = this.suggestionsContainer.createEl("div", {
      cls: "workout-tag-suggestions-list",
    });

    for (const { tag, distance } of suggestions) {
      const muscleGroup = this.allTags.get(tag) || "";
      const isVeryClose = distance <= FUZZY_WARNING_DISTANCE;

      const item = list.createEl("div", {
        cls: `workout-tag-suggestion-item${isVeryClose ? " workout-tag-suggestion-warning" : ""}`,
      });

      // Warning icon for very similar tags
      if (isVeryClose) {
        item.createEl("span", {
          text: "⚠️",
          cls: "workout-tag-suggestion-warning-icon",
          attr: {
            title: CONSTANTS.WORKOUT.MODAL.NOTICES.MUSCLE_TAG_SIMILAR_WARNING,
          },
        });
      }

      // Tag name
      item.createEl("span", {
        text: tag,
        cls: "workout-tag-suggestion-name",
      });

      // Muscle group
      item.createEl("span", {
        text: muscleGroup,
        cls: "workout-tag-suggestion-group",
      });

      // Click to edit the existing tag
      item.addEventListener("click", () => {
        this.showEditForm(tag, muscleGroup);
      });
    }
  }

  /**
   * Finds similar tags with their Levenshtein distance.
   * @param needle - The string to search for
   * @param haystack - Array of existing tag names
   * @returns Array of objects with tag and distance, sorted by distance
   */
  private findSimilarTagsWithDistance(
    needle: string,
    haystack: string[],
  ): Array<{ tag: string; distance: number }> {
    const matches: Array<{ tag: string; distance: number }> = [];

    for (const tag of haystack) {
      const distance = StringUtils.levenshteinDistance(needle, tag);
      if (distance <= FUZZY_MAX_DISTANCE && distance > 0) {
        matches.push({ tag, distance });
      }
    }

    // Sort by distance (closest first), then alphabetically
    matches.sort((a, b) => {
      if (a.distance !== b.distance) {
        return a.distance - b.distance;
      }
      return a.tag.localeCompare(b.tag);
    });

    return matches;
  }

  /**
   * Updates the count display element.
   * @param count - Number of tags to display
   */
  private updateCountDisplay(count: number): void {
    if (this.countDisplay) {
      this.countDisplay.textContent =
        CONSTANTS.WORKOUT.MODAL.NOTICES.MUSCLE_TAG_COUNT(count);
    }
  }
}
