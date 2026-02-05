import { CONSTANTS } from "@app/constants";
import { CANONICAL_MUSCLE_GROUPS } from "@app/constants/muscles.constants";
import { Button, Input } from "@app/components/atoms";
import { DomUtils } from "@app/utils/DomUtils";
import type { MuscleTagSuggestionItem } from "@app/features/modals/muscle/types";

interface RenderMuscleTagFormOptions {
  title: string;
  tagValue: string;
  muscleGroupValue: string;
  isEditing: boolean;
  onCancel: () => void;
  onSave: (tagInput: HTMLInputElement, groupSelect: HTMLSelectElement) => void;
  onTagInputChange: (value: string) => void;
  onSuggestionClick: (tag: string, muscleGroup: string) => void;
}

export class MuscleTagFormRenderer {
  private suggestionsContainer: HTMLElement | null = null;

  constructor(private readonly formContainer: HTMLElement) {}

  render(options: RenderMuscleTagFormOptions): void {
    this.formContainer.empty();
    DomUtils.setCssProps(this.formContainer, { display: "block" });

    this.formContainer.createEl("h4", { text: options.title });

    const fieldsContainer = this.formContainer.createEl("div", {
      cls: "workout-tag-form-fields",
    });

    const tagFieldContainer = fieldsContainer.createEl("div", {
      cls: "workout-tag-field",
    });
    tagFieldContainer.createEl("label", {
      text: CONSTANTS.WORKOUT.MODAL.LABELS.TAG,
      cls: "workout-tag-label",
    });

    const tagInput = Input.create(tagFieldContainer, {
      placeholder: CONSTANTS.WORKOUT.MODAL.PLACEHOLDERS.ENTER_TAG_NAME,
      value: options.tagValue,
      className: "workout-tag-input",
    });

    if (options.isEditing) {
      tagInput.disabled = true;
      tagInput.classList.add("workout-tag-input-disabled");
    }

    this.suggestionsContainer = tagFieldContainer.createEl("div", {
      cls: "workout-tag-suggestions",
    });
    DomUtils.setCssProps(this.suggestionsContainer, { display: "none" });

    if (!options.isEditing) {
      tagInput.addEventListener("input", () => {
        options.onTagInputChange(tagInput.value);
      });
    }

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

    const emptyOption = groupSelect.createEl("option", {
      text: "Select muscle group...",
      value: "",
    });
    emptyOption.disabled = true;
    if (!options.muscleGroupValue) {
      emptyOption.selected = true;
    }

    for (const group of CANONICAL_MUSCLE_GROUPS) {
      const option = groupSelect.createEl("option", {
        text: group,
        value: group,
      });
      if (group === options.muscleGroupValue) {
        option.selected = true;
      }
    }

    const buttonContainer = this.formContainer.createEl("div", {
      cls: "workout-tag-form-buttons",
    });

    const cancelButton = Button.create(buttonContainer, {
      text: CONSTANTS.WORKOUT.MODAL.BUTTONS.CANCEL,
      ariaLabel: CONSTANTS.WORKOUT.MODAL.BUTTONS.CANCEL,
    });
    Button.onClick(cancelButton, options.onCancel);

    const saveButton = Button.create(buttonContainer, {
      text: CONSTANTS.WORKOUT.MODAL.LABELS.SAVE,
      className: "mod-cta",
      ariaLabel: CONSTANTS.WORKOUT.MODAL.LABELS.SAVE,
    });
    Button.onClick(saveButton, () => options.onSave(tagInput, groupSelect));

    if (options.isEditing) {
      groupSelect.focus();
      return;
    }

    tagInput.focus();
  }

  hide(): void {
    this.formContainer.empty();
    DomUtils.setCssProps(this.formContainer, { display: "none" });
    this.suggestionsContainer = null;
  }

  clearSuggestions(): void {
    if (!this.suggestionsContainer) {
      return;
    }

    this.suggestionsContainer.empty();
    DomUtils.setCssProps(this.suggestionsContainer, { display: "none" });
  }

  renderSuggestions(
    suggestions: MuscleTagSuggestionItem[],
    onSuggestionClick: (tag: string, muscleGroup: string) => void,
  ): void {
    if (!this.suggestionsContainer) {
      return;
    }

    this.suggestionsContainer.empty();

    if (suggestions.length === 0) {
      DomUtils.setCssProps(this.suggestionsContainer, { display: "none" });
      return;
    }

    DomUtils.setCssProps(this.suggestionsContainer, { display: "block" });

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

    const list = this.suggestionsContainer.createEl("div", {
      cls: "workout-tag-suggestions-list",
    });

    for (const suggestion of suggestions) {
      const item = list.createEl("div", {
        cls: `workout-tag-suggestion-item${
          suggestion.isVeryClose ? " workout-tag-suggestion-warning" : ""
        }`,
      });

      if (suggestion.isVeryClose) {
        item.createEl("span", {
          text: "!",
          cls: "workout-tag-suggestion-warning-icon",
          attr: {
            title: CONSTANTS.WORKOUT.MODAL.NOTICES.MUSCLE_TAG_SIMILAR_WARNING,
          },
        });
      }

      item.createEl("span", {
        text: suggestion.tag,
        cls: "workout-tag-suggestion-name",
      });

      item.createEl("span", {
        text: suggestion.muscleGroup,
        cls: "workout-tag-suggestion-group",
      });

      item.addEventListener("click", () => {
        onSuggestionClick(suggestion.tag, suggestion.muscleGroup);
      });
    }
  }
}
