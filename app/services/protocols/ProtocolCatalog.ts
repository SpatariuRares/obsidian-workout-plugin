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
  /** Chart color (`chartColor` at the default alpha) */
  color: string;
  /** The chart color with another alpha (a dimmed or highlighted slice) */
  chartColor: (alpha: number) => string;
  /** CSS class of the table badge */
  badgeClass: string;
  /** Badge background for custom protocols (their hex color) */
  badgeColor?: string;
  builtIn: boolean;
}

const CHART_ALPHA = 0.7;
const NEUTRAL_CHART_COLOR = "#808080";

const BUILT_IN: ReadonlyArray<{
  id: WorkoutProtocol;
  nameKey: string;
  abbreviation: string;
  /** Chart color, `#rrggbb` */
  color: string;
  badgeClass: string;
  /** Entry added to the settings list ("Saved protocols"); none for standard */
  defaults?: { abbreviation: string; color: string };
  /** What the protocol is for, in a sentence */
  helpKey?: string;
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
    defaults: { abbreviation: "WU", color: "#9ca3af" },
    helpKey: "settings.protocolHelp.warmup",
  },
  {
    id: WorkoutProtocol.DROP_SET,
    nameKey: "modal.selectOptions.dropSet",
    abbreviation: "Drop",
    color: "#ef4444",
    badgeClass: "workout-protocol-badge-drop",
    defaults: { abbreviation: "DS", color: "#ef4444" },
    helpKey: "settings.protocolHelp.dropSet",
  },
  {
    id: WorkoutProtocol.MYO_REPS,
    nameKey: "modal.selectOptions.myoReps",
    abbreviation: "Myo",
    color: "#a855f7",
    badgeClass: "workout-protocol-badge-myo",
    defaults: { abbreviation: "MYO", color: "#a855f7" },
    helpKey: "settings.protocolHelp.myoReps",
  },
  {
    id: WorkoutProtocol.REST_PAUSE,
    nameKey: "modal.selectOptions.restPause",
    abbreviation: "RP",
    color: "#f97316",
    badgeClass: "workout-protocol-badge-rp",
    defaults: { abbreviation: "RP", color: "#f97316" },
    helpKey: "settings.protocolHelp.restPause",
  },
  {
    id: WorkoutProtocol.SUPERSET,
    nameKey: "modal.selectOptions.superset",
    abbreviation: "SS",
    color: "#3b82f6",
    badgeClass: "workout-protocol-badge-superset",
    defaults: { abbreviation: "SS", color: "#3b82f6" },
    helpKey: "settings.protocolHelp.superset",
  },
  {
    id: WorkoutProtocol.TWENTYONE,
    nameKey: "modal.selectOptions.twentyones",
    abbreviation: "21s",
    color: "#22c55e",
    badgeClass: "workout-protocol-badge-21",
    defaults: { abbreviation: "21", color: "#22c55e" },
    helpKey: "settings.protocolHelp.twentyone",
  },
];

/**
 * The protocol id a set is logged with: lower case, standard when empty.
 * Custom ids are kept as they are, so they survive the CSV round trip.
 */
export function protocolId(raw: string | undefined | null): string {
  return StringUtils.normalize(raw) || WorkoutProtocol.STANDARD;
}

/** Whether a set was logged without a protocol (standard, or none written) */
export function isStandardProtocol(raw: string | undefined | null): boolean {
  return protocolId(raw) === (WorkoutProtocol.STANDARD as string);
}

/** The id a new protocol gets from its name: lower case, `_` for spaces, nothing else but letters and digits */
export function protocolIdFromName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}

/** Sets grouped by protocol id (`protocolId`), groups in the order first seen */
export function groupByProtocol<T extends { protocol?: string | null }>(
  rows: readonly T[],
): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const row of rows) {
    const id = protocolId(row.protocol);
    const group = groups.get(id);
    if (group) group.push(row);
    else groups.set(id, [row]);
  }
  return groups;
}

/** What a built-in protocol is for, in the current language; undefined for others */
export function protocolHelp(raw: string | undefined | null): string | undefined {
  const helpKey = BUILT_IN.find((p) => (p.id as string) === protocolId(raw))?.helpKey;
  return helpKey && t(helpKey);
}

/**
 * The built-in protocols (warm-up, drop set, ...) as entries of the settings
 * list, named in the current language. Standard has none: it is the default
 * and cannot be removed.
 */
export function defaultProtocolEntries(): CustomProtocolConfig[] {
  return BUILT_IN.flatMap((p) =>
    p.defaults
      ? [
          {
            id: p.id,
            name: t(p.nameKey),
            abbreviation: p.defaults.abbreviation,
            color: p.defaults.color,
          },
        ]
      : [],
  );
}

/**
 * The settings list with the built-in entries it lacks added after the user's
 * own (so their order stays). Run once per vault (see `protocolDefaultsAdded`),
 * so a built-in the user deletes stays deleted. A built-in is skipped when the
 * user already has a protocol with its id or its name: two entries with one
 * name could not be saved any more.
 */
export function withDefaultProtocols(
  custom: CustomProtocolConfig[] | null | undefined,
): CustomProtocolConfig[] {
  const mine = custom ?? [];
  const ids = new Set(mine.map((p) => protocolId(p.id)));
  const names = new Set(mine.map((p) => StringUtils.normalize(p.name)));
  return [
    ...mine,
    ...defaultProtocolEntries().filter(
      (p) => !ids.has(p.id) && !names.has(StringUtils.normalize(p.name)),
    ),
  ];
}

/**
 * Whether this entry is a built-in protocol as the plugin added it (name in
 * the current language, default badge), so its explanation still applies
 */
export function isUnchangedDefaultProtocol(
  protocol: CustomProtocolConfig,
): boolean {
  return defaultProtocolEntries().some(
    (p) =>
      p.id === protocolId(protocol.id) &&
      p.name === protocol.name &&
      p.abbreviation === protocol.abbreviation &&
      p.color.toLowerCase() === protocol.color.toLowerCase(),
  );
}

/**
 * Standard plus the protocols in the settings list, where the built-ins
 * (warm-up, drop set, ...) are entries the user can edit or delete. The one
 * place that knows a protocol's name, badge and color.
 */
export class ProtocolCatalog {
  constructor(private custom: CustomProtocolConfig[] = []) {}

  resolve(raw: string | undefined | null): ProtocolInfo {
    const id = protocolId(raw);
    if (id === (WorkoutProtocol.STANDARD as string)) return toInfo(BUILT_IN[0]);

    const custom = this.custom.find((p) => protocolId(p.id) === id);
    if (custom) {
      return {
        id,
        name: custom.name,
        abbreviation: custom.abbreviation,
        ...chartColors(custom.color),
        badgeColor: custom.color,
        badgeClass: "workout-protocol-badge-custom",
        builtIn: false,
      };
    }

    // A built-in removed from the settings list: sets logged with it keep their name
    const builtIn = BUILT_IN.find((p) => (p.id as string) === id);
    if (builtIn) return toInfo(builtIn);

    // Logged with a custom protocol that was later deleted
    return {
      id,
      name: id,
      abbreviation: id.slice(0, 3).toUpperCase(),
      ...chartColors(NEUTRAL_CHART_COLOR),
      badgeClass: "workout-protocol-badge-custom",
      builtIn: false,
    };
  }

  /** What a set can be logged with: standard, then the settings list in order */
  all(): ProtocolInfo[] {
    const byId = new Map<string, ProtocolInfo>();
    for (const info of [
      toInfo(BUILT_IN[0]),
      ...this.custom.map((p) => this.resolve(p.id)),
    ]) {
      if (!byId.has(info.id)) byId.set(info.id, info);
    }
    return [...byId.values()];
  }

  /**
   * `all()`, plus the protocol a set already has when it is no longer in the
   * settings (e.g. a deleted drop set), so picking from the list keeps it
   * instead of turning it into standard
   */
  optionsIncluding(raw: string | undefined | null): ProtocolInfo[] {
    const options = this.all();
    const id = protocolId(raw);
    if (!options.some((p) => p.id === id)) options.push(this.resolve(id));
    return options;
  }
}

function chartColors(hex: string): Pick<ProtocolInfo, "color" | "chartColor"> {
  return {
    color: hexToRgba(hex, CHART_ALPHA),
    chartColor: (alpha) => hexToRgba(hex, alpha),
  };
}

function toInfo(p: (typeof BUILT_IN)[number]): ProtocolInfo {
  return {
    id: p.id,
    name: t(p.nameKey),
    abbreviation: p.abbreviation,
    ...chartColors(p.color),
    badgeClass: p.badgeClass,
    builtIn: true,
  };
}
