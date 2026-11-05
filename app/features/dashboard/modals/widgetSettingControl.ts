import type { ModalBase } from "@app/features/modals/base/ModalBase";
import { dashboardBlock } from "@app/features/dashboard/dashboardBlock";
import type { WidgetSetting } from "@app/features/dashboard/widgets/widgetSettings";
import {
  AdjustField,
  ChipGroup,
  parseNumber,
} from "@app/components/molecules";
import { t } from "@app/i18n";

/** A widget setting's form control */
export interface SettingControl {
  /** The value to write; undefined (the default, or nothing typed) leaves it unset */
  read: () => unknown;
  /** Shows what to fix under the field; false keeps the form from writing */
  check?: () => boolean;
}

/**
 * The control for one widget setting (the registry's `settings`), opened on
 * the block's value or the schema default. Used by the widget menu and the
 * dashboard form, so both show and write a setting the same way.
 */
export function createSettingControl(
  modal: Pick<ModalBase, "createCheckbox">,
  group: HTMLElement,
  setting: WidgetSetting,
  /** The block's value, if it has one */
  current: unknown,
): SettingControl {
  const defaults = dashboardBlock.defaults as Record<string, unknown>;

  if (setting.kind === "number") {
    const fallback = defaults[setting.key];
    // No default: the setting is a limit that may stay unset ("All")
    const optional = typeof fallback !== "number";
    const field = AdjustField.createField(group, {
      label: setting.label(),
      value:
        typeof current === "number"
          ? current
          : typeof fallback === "number"
            ? fallback
            : undefined,
      min: setting.min,
      max: setting.max,
      step: setting.step,
      unit: setting.unit?.(),
      suggestion: optional ? t("dashboard.widgetModal.all") : undefined,
    });
    const typed = () => parseNumber(field.input.value);
    return {
      read: () => {
        const value = typed();
        return Number.isFinite(value) && value !== fallback ? value : undefined;
      },
      check: () => {
        const value = typed();
        const empty = field.input.value.trim() === "";
        // The form's max is for a new value: one the block already
        // holds (written by hand) stays writable
        const valid = empty
          ? optional
          : value === current ||
            (Number.isInteger(value) &&
              value >= setting.min &&
              value <= setting.max);
        field.setError(
          valid
            ? undefined
            : t("dashboard.widgetModal.numberRange", {
                min: setting.min,
                max: setting.max,
              }),
        );
        return valid;
      },
    };
  }

  if (setting.kind === "choice") {
    const fallback = dashboardBlock.defaults[setting.key];
    let picked = typeof current === "string" ? current : fallback;
    ChipGroup.create(group, {
      label: setting.label(),
      options: setting.options.map((o) => ({ id: o.value, label: o.label() })),
      selected: picked,
      className: "workout-widget-setting-chips",
      onPick: (id) => {
        picked = id;
      },
    });
    return { read: () => (picked === fallback ? undefined : picked) };
  }

  if (setting.kind === "toggle") {
    const fallback = dashboardBlock.defaults[setting.key];
    // The group itself is the checkbox row (no group nested in a group)
    group.addClass("workout-charts-checkbox-group");
    const box = modal.createCheckbox(
      group,
      setting.label(),
      typeof current === "boolean" ? current : fallback,
    );
    return {
      read: () => (box.checked === fallback ? undefined : box.checked),
    };
  }

  const chips = ChipGroup.createMulti(group, {
    label: setting.label(),
    options: setting.options.map((o) => ({ id: o.value, label: o.label() })),
    selected: Array.isArray(current)
      ? (current as string[])
      : setting.options.map((o) => o.value),
    className: "workout-widget-setting-chips",
  });
  return {
    // Every option is the default, written as nothing
    read: () => {
      const picked = chips.picked();
      return picked.length === setting.options.length ? undefined : picked;
    },
    // None would be an empty widget: removing it is the way to hide it
    check: () => {
      const valid = chips.picked().length > 0;
      chips.setError(valid ? undefined : t("dashboard.widgetModal.pickOne"));
      return valid;
    },
  };
}
