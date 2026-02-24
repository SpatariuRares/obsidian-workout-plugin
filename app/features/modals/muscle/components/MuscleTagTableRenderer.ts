import { CONSTANTS } from "@app/constants";
import { Button } from "@app/components/atoms";
import { t } from "@app/i18n";

interface MuscleTagTableRendererOptions {
  tableBody: HTMLElement;
  tags: Map<string, string>;
  onEdit: (tag: string, muscleGroup: string) => void;
  onDelete: (tag: string) => void;
}

export class MuscleTagTableRenderer {
  static render(options: MuscleTagTableRendererOptions): void {
    const { tableBody, tags, onEdit, onDelete } = options;

    tableBody.empty();

    if (tags.size === 0) {
      const emptyRow = tableBody.createEl("tr");
      const emptyCell = emptyRow.createEl("td", {
        attr: { colspan: "3" },
        cls: "workout-tag-empty",
      });
      emptyCell.createEl("p", {
        text: t("modal.notices.muscleTagNoResults"),
      });
      return;
    }

    const sortedTags = Array.from(tags.entries()).sort((a, b) =>
      a[0].localeCompare(b[0]),
    );

    for (const [tag, muscleGroup] of sortedTags) {
      const row = tableBody.createEl("tr");

      const tagCell = row.createEl("td", {
        text: tag,
        cls: "workout-tag-name workout-tag-clickable",
      });
      tagCell.addEventListener("click", () => onEdit(tag, muscleGroup));

      const groupCell = row.createEl("td", {
        text: muscleGroup,
        cls: "workout-tag-group workout-tag-clickable",
      });
      groupCell.addEventListener("click", () => onEdit(tag, muscleGroup));

      const actionsCell = row.createEl("td", {
        cls: "workout-tag-actions",
      });

      const editButton = Button.create(actionsCell, {
        text: t("modal.editTag"),
        className: "workout-tag-action-btn",
        variant: "secondary",
        ariaLabel: `Edit ${tag}`,
      });
      Button.onClick(editButton, () => onEdit(tag, muscleGroup));

      const deleteButton = Button.create(actionsCell, {
        text: t("modal.delete"),
        className: "workout-tag-action-btn",
        variant: "warning",
        ariaLabel: `Delete ${tag}`,
      });
      Button.onClick(deleteButton, () => onDelete(tag));
    }
  }
}
