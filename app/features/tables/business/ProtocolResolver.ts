import type { CustomProtocolConfig } from "@app/types/WorkoutLogData";
import { ProtocolCatalog } from "@app/services/protocols/ProtocolCatalog";

export interface ProtocolBadgeConfig {
  label: string;
  className: string;
  tooltip: string;
  color?: string;
}

/** The table badge for a set's protocol (see ProtocolCatalog) */
export class ProtocolResolver {
  /**
   * @returns The badge to show, or null for standard sets (no badge)
   */
  static resolve(
    protocol: string,
    customProtocols?: CustomProtocolConfig[],
  ): ProtocolBadgeConfig | null {
    const info = new ProtocolCatalog(customProtocols).resolve(protocol);
    if (!info.abbreviation) return null;
    return {
      label: info.abbreviation,
      className: `workout-protocol-badge ${info.badgeClass}`,
      tooltip: info.name,
      color: info.badgeColor,
    };
  }
}
