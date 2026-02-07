import { WorkoutProtocol, CustomProtocolConfig } from "@app/types/WorkoutLogData";

export interface ProtocolBadgeConfig {
  label: string;
  className: string;
  tooltip: string;
  color?: string;
}

/**
 * Protocol display configuration for built-in protocols
 */
const PROTOCOL_DISPLAY: Record<string, { label: string; className: string }> = {
  [WorkoutProtocol.STANDARD]: { label: "", className: "" },
  [WorkoutProtocol.DROP_SET]: {
    label: "Drop",
    className: "workout-protocol-badge-drop",
  },
  [WorkoutProtocol.MYO_REPS]: {
    label: "Myo",
    className: "workout-protocol-badge-myo",
  },
  [WorkoutProtocol.REST_PAUSE]: {
    label: "RP",
    className: "workout-protocol-badge-rp",
  },
  [WorkoutProtocol.SUPERSET]: {
    label: "SS",
    className: "workout-protocol-badge-superset",
  },
  [WorkoutProtocol.TWENTYONE]: {
    label: "21s",
    className: "workout-protocol-badge-21",
  },
};

/**
 * Resolves a protocol string into badge configuration.
 * Supports both built-in protocols and custom protocols from settings.
 */
export class ProtocolResolver {
  /**
   * Resolve a protocol to its badge configuration.
   * @param protocol - The protocol identifier string
   * @param customProtocols - Optional array of custom protocol configs from settings
   * @returns Badge configuration, or null if no badge should be shown
   */
  static resolve(
    protocol: string,
    customProtocols?: CustomProtocolConfig[],
  ): ProtocolBadgeConfig | null {
    // Check built-in protocols
    const builtInConfig = PROTOCOL_DISPLAY[protocol];

    if (builtInConfig) {
      // Standard protocol has empty label - no badge
      if (!builtInConfig.label) {
        return null;
      }

      return {
        label: builtInConfig.label,
        className: `workout-protocol-badge ${builtInConfig.className}`,
        tooltip: protocol.replace(/_/g, " "),
      };
    }

    // Check custom protocols
    if (customProtocols) {
      const customProtocol = customProtocols.find((p) => p.id === protocol);

      if (customProtocol) {
        return {
          label: customProtocol.abbreviation,
          className: "workout-protocol-badge workout-protocol-badge-custom",
          tooltip: customProtocol.name,
          color: customProtocol.color,
        };
      }
    }

    return null;
  }
}
