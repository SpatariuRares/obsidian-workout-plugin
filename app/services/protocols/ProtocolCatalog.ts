import { t } from "@app/i18n";
import {
  WorkoutProtocol,
  type CustomProtocolConfig,
} from "@app/types/WorkoutLogData";
import { StringUtils } from "@app/utils/StringUtils";
import { hexToRgba } from "@app/utils/ColorUtils";

/** Everything the UI shows about a protocol */
export interface ProtocolInfo {
  id: string;
  /** Name in menus, legends and tooltips */
  name: string;
  /** Text of the table badge; empty for standard (no badge) */
  abbreviation: string;
  /** Chart color */
  color: string;
  /** CSS class of the table badge */
  badgeClass: string;
  /** Badge background for custom protocols (their hex color) */
  badgeColor?: string;
  builtIn: boolean;
}

const CHART_ALPHA = 0.7;
const NEUTRAL_CHART_COLOR = "rgba(128, 128, 128, 0.7)";

const BUILT_IN: ReadonlyArray<{
  id: WorkoutProtocol;
  nameKey: string;
  abbreviation: string;
  color: string;
  badgeClass: string;
}> = [
  {
    id: WorkoutProtocol.STANDARD,
    nameKey: "modal.selectOptions.standard",
    abbreviation: "",
    color: NEUTRAL_CHART_COLOR,
    badgeClass: "",
  },
  {
    id: WorkoutProtocol.WARMUP,
    nameKey: "modal.selectOptions.warmup",
    abbreviation: "WU",
    color: NEUTRAL_CHART_COLOR,
    badgeClass: "workout-protocol-badge-warmup",
  },
  {
    id: WorkoutProtocol.DROP_SET,
    nameKey: "modal.selectOptions.dropSet",
    abbreviation: "Drop",
    color: "rgba(239, 68, 68, 0.7)",
    badgeClass: "workout-protocol-badge-drop",
  },
  {
    id: WorkoutProtocol.MYO_REPS,
    nameKey: "modal.selectOptions.myoReps",
    abbreviation: "Myo",
    color: "rgba(168, 85, 247, 0.7)",
    badgeClass: "workout-protocol-badge-myo",
  },
  {
    id: WorkoutProtocol.REST_PAUSE,
    nameKey: "modal.selectOptions.restPause",
    abbreviation: "RP",
    color: "rgba(249, 115, 22, 0.7)",
    badgeClass: "workout-protocol-badge-rp",
  },
  {
    id: WorkoutProtocol.SUPERSET,
    nameKey: "modal.selectOptions.superset",
    abbreviation: "SS",
    color: "rgba(59, 130, 246, 0.7)",
    badgeClass: "workout-protocol-badge-superset",
  },
  {
    id: WorkoutProtocol.TWENTYONE,
    nameKey: "modal.selectOptions.twentyones",
    abbreviation: "21s",
    color: "rgba(34, 197, 94, 0.7)",
    badgeClass: "workout-protocol-badge-21",
  },
];

/**
 * The protocol id a set is logged with: lower case, standard when empty.
 * Custom ids are kept as they are, so they survive the CSV round trip.
 */
export function protocolId(raw: string | undefined | null): string {
  return StringUtils.normalize(raw) || WorkoutProtocol.STANDARD;
}

/**
 * The built-in protocols plus the user's custom ones (settings). The one
 * place that knows a protocol's name, badge and color.
 */
export class ProtocolCatalog {
  constructor(private custom: CustomProtocolConfig[] = []) {}

  resolve(raw: string | undefined | null): ProtocolInfo {
    const id = protocolId(raw);
    const builtIn = BUILT_IN.find((p) => (p.id as string) === id);
    if (builtIn) return toInfo(builtIn);

    const custom = this.custom.find((p) => protocolId(p.id) === id);
    if (custom) {
      return {
        id,
        name: custom.name,
        abbreviation: custom.abbreviation,
        color: hexToRgba(custom.color, CHART_ALPHA),
        badgeColor: custom.color,
        badgeClass: "workout-protocol-badge-custom",
        builtIn: false,
      };
    }

    // Logged with a custom protocol that was later deleted
    return {
      id,
      name: id,
      abbreviation: id.slice(0, 3).toUpperCase(),
      color: BUILT_IN[0].color,
      badgeClass: "workout-protocol-badge-custom",
      builtIn: false,
    };
  }

  /** Built-ins (standard first), then the custom protocols */
  all(): ProtocolInfo[] {
    return [
      ...BUILT_IN.map(toInfo),
      ...this.custom.map((p) => this.resolve(p.id)),
    ];
  }
}

function toInfo(p: (typeof BUILT_IN)[number]): ProtocolInfo {
  return {
    id: p.id,
    name: t(p.nameKey),
    abbreviation: p.abbreviation,
    color: p.color,
    badgeClass: p.badgeClass,
    builtIn: true,
  };
}
