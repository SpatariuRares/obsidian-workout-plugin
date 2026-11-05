import { t } from "@app/i18n";
import { InsertSetsModal } from "@app/features/tables/modals/InsertSetsModal";

/**
 * Adds an exercise to the workout note: a `## <exercise>` section holding
 * its `workout-sets` block, with its own rest (the example notes' layout)
 */
export class AddExerciseBlockModal extends InsertSetsModal {
  protected defaultRest = 90;

  protected getModalTitle(): string {
    return t("modal.titles.addExerciseBlock");
  }

  protected getButtonText(): string {
    return t("modal.buttons.insertExerciseBlock");
  }

  protected getSuccessMessage(): string {
    return t("modal.notices.exerciseBlockInserted");
  }

  protected generateCode(): string {
    const block = super.generateCode();
    // eslint-disable-next-line i18next/no-literal-string -- markdown heading
    return `## ${this.collectParams().exercise}\n\n${block}`;
  }
}
