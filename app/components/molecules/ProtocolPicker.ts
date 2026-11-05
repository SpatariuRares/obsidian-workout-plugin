/**
 * ProtocolPicker Molecule
 * Picks a set's protocol: a ChipGroup with one chip per protocol.
 */
import { ChipGroup } from "@app/components/molecules/ChipGroup";

export interface ProtocolOption {
  id: string;
  name: string;
}

export interface ProtocolPickerProps {
  /** The group's visible label ("Protocol") */
  label: string;
  /** In order; the caller adds a picked one that is no longer in the list */
  options: ProtocolOption[];
  selected: string;
  /** A different chip was picked */
  onPick: (id: string) => void;
  /** Each chip gets `${prefix}-${id}`, to focus it again after a redraw */
  focusKeyPrefix?: string;
}

export class ProtocolPicker {
  static create(parent: HTMLElement, props: ProtocolPickerProps): HTMLElement {
    return ChipGroup.create(parent, {
      label: props.label,
      options: props.options.map(({ id, name }) => ({ id, label: name })),
      selected: props.selected,
      onPick: props.onPick,
      focusKeyPrefix: props.focusKeyPrefix,
      className: "workout-protocol-picker",
    });
  }
}
