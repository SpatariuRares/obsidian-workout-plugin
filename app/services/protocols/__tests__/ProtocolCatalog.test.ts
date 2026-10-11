import {
  ProtocolCatalog,
  protocolId,
} from "@app/services/protocols/ProtocolCatalog";
import { WorkoutProtocol } from "@app/types/WorkoutLogData";
import { t } from "@app/i18n";

const cluster = { id: "cluster", name: "Cluster set", abbreviation: "CL", color: "#ff5733" };

describe("protocolId", () => {
  it("reads a missing protocol as standard and ignores case and spaces", () => {
    expect(protocolId(undefined)).toBe(WorkoutProtocol.STANDARD);
    expect(protocolId("  ")).toBe(WorkoutProtocol.STANDARD);
    expect(protocolId(" Drop_Set ")).toBe(WorkoutProtocol.DROP_SET);
    expect(protocolId("Cluster")).toBe("cluster");
  });
});

describe("ProtocolCatalog", () => {
  const catalog = new ProtocolCatalog([cluster]);

  it("describes a built-in protocol with its translated name, badge and chart color", () => {
    expect(catalog.resolve("drop_set")).toEqual({
      id: "drop_set",
      name: t("modal.selectOptions.dropSet"),
      abbreviation: "Drop",
      color: "rgba(239, 68, 68, 0.7)",
      badgeClass: "workout-protocol-badge-drop",
      builtIn: true,
    });
  });

  it("describes a custom protocol from the settings", () => {
    expect(catalog.resolve("Cluster")).toEqual({
      id: "cluster",
      name: "Cluster set",
      abbreviation: "CL",
      color: "rgba(255, 87, 51, 0.7)",
      badgeColor: "#ff5733",
      badgeClass: "workout-protocol-badge-custom",
      builtIn: false,
    });
  });

  it("still describes a protocol nobody defines any more, by its id", () => {
    expect(catalog.resolve("tempo")).toMatchObject({
      id: "tempo",
      name: "tempo",
      abbreviation: "TEM",
      builtIn: false,
    });
  });

  it("lists built-ins first, standard on top, then custom ones", () => {
    expect(catalog.all().map((p) => p.id)).toEqual([
      "standard",
      "drop_set",
      "myo_reps",
      "rest_pause",
      "superset",
      "twentyone",
      "cluster",
    ]);
  });

  it("gives standard no badge", () => {
    expect(catalog.resolve(undefined).abbreviation).toBe("");
  });
});
