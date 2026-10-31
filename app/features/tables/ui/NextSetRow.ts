import { Notice, setIcon } from "obsidian";
import type { WorkoutPluginContext } from "@app/types/PluginPorts";
import { TrainingHistory } from "@app/services/history/TrainingHistory";
import { ProtocolCatalog } from "@app/services/protocols/ProtocolCatalog";
import { DynamicFieldsRenderer } from "@app/features/modals/base/components/DynamicFieldsRenderer";
import { readLogFields } from "@app/features/modals/base/components/readLogForm";
import {
  toEntry,
  validate,
} from "@app/features/modals/base/logic/LogEntryDraft";
import { Button, BUTTONVARIANT } from "@app/components/atoms";
import { ErrorUtils } from "@app/utils/ErrorUtils";
import { t } from "@app/i18n";

/** A single pending set; the normal log event refreshes the table and timer. */
export class NextSetRow {
  static async render(
    container: HTMLElement,
    plugin: WorkoutPluginContext,
    exercise: string,
    workout: string,
    pageLink: string,
    signal: AbortSignal,
  ): Promise<void> {
    const history = new TrainingHistory(
      await plugin.getWorkoutLogData(),
    );
    const last = history.lastSet(exercise);
    // Without an exact prior set, the existing modal guides the first entry.
    if (!last || signal.aborted) return;
    const parameters = await plugin
      .getExerciseDefinitionService()
      .getParametersForExercise(exercise);
    if (signal.aborted) return;
    const row = container.createDiv({ cls: "workout-next-set" });
    row.createEl("strong", {
      text: t("logs.nextSet", {
        number: history.nextSetNumber(exercise, workout),
      }),
    });
    const fieldsContainer = row.createDiv({
      cls: "workout-next-set-fields",
    });
    const inputs = await new DynamicFieldsRenderer(
      plugin,
    ).renderDynamicFields(fieldsContainer, parameters, {
      exerciseName: exercise,
      workoutName: workout,
    });
    if (signal.aborted) {
      row.remove();
      return;
    }
    DynamicFieldsRenderer.fillFromLog(inputs, last);
    const protocol = row.createEl("select", {
      cls: "dropdown",
      attr: { "aria-label": t("modal.protocol") },
    });
    for (const p of new ProtocolCatalog(
      plugin.settings.customProtocols,
    ).all()) {
      protocol.createEl("option", { text: p.name, value: p.id });
    }
    protocol.value = new ProtocolCatalog(
      plugin.settings.customProtocols,
    ).resolve(last.protocol).id;
    if (!protocol.value) protocol.value = "standard";
    const save = Button.create(row, {
      text: t("logs.saveNextSet"),
      ariaLabel: t("logs.saveNextSet"),
      variant: BUTTONVARIANT.PRIMARY,
    });
    const icon = save.createSpan();
    setIcon(icon, "check");
    let saving = false;
    Button.onClick(
      save,
      () => {
        if (saving) return;
        const { fields, ...reading } = readLogFields(
          inputs,
          parameters,
        );
        const error = validate(exercise, fields, parameters);
        if (error) {
          new Notice(error);
          return;
        }
        saving = true;
        save.disabled = true;
        row.setAttribute("aria-busy", "true");
        void plugin
          .addWorkoutLogEntry(
            toEntry(
              {
                exercise,
                ...reading,
                workout,
                notes: "",
                protocol: protocol.value,
              },
              { now: new Date(), pageLink },
            ),
          )
          .then(() => {
            new Notice(t("modal.notices.logCreated"));
            // Keep disabled until the event-driven render replaces this row.
          })
          .catch((error: unknown) => {
            saving = false;
            save.disabled = false;
            row.removeAttribute("aria-busy");
            new Notice(
              t("modal.notices.genericError", {
                error: ErrorUtils.getErrorMessage(error),
              }),
            );
          });
      },
      signal,
    );
  }
}
