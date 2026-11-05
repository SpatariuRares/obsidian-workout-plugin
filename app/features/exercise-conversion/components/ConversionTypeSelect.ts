import {
  ChipGroup,
  type ChipGroupResult,
} from "@app/components/molecules";
import { exerciseTypeName } from "@app/constants/ui.constants";
import type { ModalBase } from "@app/features/modals/base/ModalBase";
import { t } from "@app/i18n";
import type { ExerciseTypeDefinition } from "@app/types/ExerciseTypes";

/**
 * The type to convert to, as chips (DESIGN.md "Modal forms": one of a few
 * options is a ChipGroup, wrapped so every type is in sight), and whether the
 * exercise page's `exercise_type` follows.
 */
export class ConversionTypeSelect {
  private chips: ChipGroupResult;

  constructor(
    modal: ModalBase,
    parent: HTMLElement,
    /** The types offered, built-in and the user's own */
    private readonly types: readonly ExerciseTypeDefinition[],
    private readonly onTypeChange: (typeId: string) => void,
    onUpdateFrontmatterChange: (update: boolean) => void,
  ) {
    this.chips = ChipGroup.create(parent, {
      label: t("convert.typeSelect.convertTo"),
      labelHidden: true,
      options: this.optionsWithout(undefined),
      selected: types[0]?.id ?? "",
      className: "workout-modal-type-chips",
      onPick: (id) => this.onTypeChange(id),
    });

    const update = modal.createCheckboxField(
      parent,
      t("convert.typeSelect.updateFileType"),
      true,
    );
    update.addEventListener("change", () =>
      onUpdateFrontmatterChange(update.checked),
    );
  }

  /**
   * Offers every type but the exercise's own, keeping the pick when it is
   * still offered, and reports the pick (the first type otherwise)
   */
  public setCurrentType(currentId: string): void {
    const options = this.optionsWithout(currentId);
    this.chips.setOptions(options, this.chips.value());
    if (options.length > 0) this.onTypeChange(this.chips.value());
  }

  private optionsWithout(currentId: string | undefined) {
    return this.types
      .filter((type) => type.id !== currentId)
      .map((type) => ({
        id: type.id,
        label: exerciseTypeName(type),
      }));
  }
}
