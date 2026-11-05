import {
  ProtocolCatalog,
  defaultProtocolEntries,
  groupByProtocol,
  isStandardProtocol,
  isUnchangedDefaultProtocol,
  protocolId,
  protocolIdFromName,
  withDefaultProtocols,
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

  it("describes a built-in protocol missing from the list with its translated name, badge and chart color", () => {
    expect(catalog.resolve("drop_set")).toMatchObject({
      id: "drop_set",
      name: t("modal.selectOptions.dropSet"),
      abbreviation: "Drop",
      color: "rgba(239, 68, 68, 0.7)",
      badgeClass: "workout-protocol-badge-drop",
      builtIn: true,
    });
  });

  it("describes a custom protocol from the settings", () => {
    expect(catalog.resolve("Cluster")).toMatchObject({
      id: "cluster",
      name: "Cluster set",
      abbreviation: "CL",
      color: "rgba(255, 87, 51, 0.7)",
      badgeColor: "#ff5733",
      badgeClass: "workout-protocol-badge-custom",
      builtIn: false,
    });
  });

  it("uses the settings entry of a built-in protocol, so the user can edit it", () => {
    const edited = new ProtocolCatalog([
      { id: "drop_set", name: "Stripping", abbreviation: "STR", color: "#000000" },
    ]);

    expect(edited.resolve("drop_set")).toMatchObject({
      name: "Stripping",
      abbreviation: "STR",
      badgeColor: "#000000",
    });
  });

  it("keeps standard built in even if the list has an entry with its id", () => {
    const odd = new ProtocolCatalog([
      { id: "standard", name: "Normal", abbreviation: "N", color: "#000000" },
    ]);

    expect(odd.resolve("standard").abbreviation).toBe("");
    expect(odd.all().map((p) => p.id)).toEqual(["standard"]);
  });

  it("still describes a protocol nobody defines any more, by its id", () => {
    expect(catalog.resolve("tempo")).toMatchObject({
      id: "tempo",
      name: "tempo",
      abbreviation: "TEM",
      builtIn: false,
    });
  });

  it("lists standard, then the settings list in its order", () => {
    expect(catalog.all().map((p) => p.id)).toEqual(["standard", "cluster"]);
    expect(
      new ProtocolCatalog(withDefaultProtocols([cluster])).all().map((p) => p.id),
    ).toEqual([
      "standard",
      "cluster",
      "warmup",
      "drop_set",
      "myo_reps",
      "rest_pause",
      "superset",
      "twentyone",
    ]);
  });

  it("gives standard no badge", () => {
    expect(catalog.resolve(undefined).abbreviation).toBe("");
  });
});

describe("default protocol entries", () => {
  it("are the built-ins except standard, translated and valid for the protocol editor", () => {
    const entries = defaultProtocolEntries();

    expect(entries.map((p) => p.id)).toEqual([
      "warmup",
      "drop_set",
      "myo_reps",
      "rest_pause",
      "superset",
      "twentyone",
    ]);
    expect(entries[1].name).toBe(t("modal.selectOptions.dropSet"));
    for (const entry of entries) {
      expect(entry.abbreviation.length).toBeLessThanOrEqual(3);
      expect(entry.abbreviation).toBe(entry.abbreviation.toUpperCase());
      expect(entry.color).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it("are added after the user's protocols without replacing one with the same id", () => {
    const mine = { id: "Warmup", name: "Ramp-up", abbreviation: "RU", color: "#123456" };

    const list = withDefaultProtocols([mine, cluster]);

    expect(list.map((p) => p.id)).toEqual([
      "Warmup",
      "cluster",
      "drop_set",
      "myo_reps",
      "rest_pause",
      "superset",
      "twentyone",
    ]);
    expect(list).toContain(mine);
  });

  it("skip a built-in whose name the user already gave a protocol of their own", () => {
    const mine = {
      id: "restpause",
      name: ` ${t("modal.selectOptions.restPause").toUpperCase()} `,
      abbreviation: "RP",
      color: "#123456",
    };

    const ids = withDefaultProtocols([mine]).map((p) => p.id);

    expect(ids).toContain("restpause");
    expect(ids).not.toContain("rest_pause");
  });

  it("cope with a missing list in the saved settings", () => {
    expect(withDefaultProtocols(null)).toHaveLength(6);
  });

  it("count as unchanged only while name, badge and color are as added", () => {
    const [warmup] = defaultProtocolEntries();

    expect(isUnchangedDefaultProtocol(warmup)).toBe(true);
    expect(isUnchangedDefaultProtocol({ ...warmup, color: warmup.color.toUpperCase() })).toBe(true);
    expect(isUnchangedDefaultProtocol({ ...warmup, name: "Ramp-up" })).toBe(false);
    expect(isUnchangedDefaultProtocol(cluster)).toBe(false);
  });
});

describe("protocolIdFromName", () => {
  it("turns a name into a lower-case id with underscores and no other symbols", () => {
    expect(protocolIdFromName("Cluster Set")).toBe("cluster_set");
    expect(protocolIdFromName("  Pyramid  up! ")).toBe("pyramid_up");
    expect(protocolIdFromName("5x5 (heavy)")).toBe("5x5_heavy");
  });
});

describe("isStandardProtocol", () => {
  it("is true for standard and for a missing protocol, whatever the case", () => {
    expect(isStandardProtocol(undefined)).toBe(true);
    expect(isStandardProtocol("")).toBe(true);
    expect(isStandardProtocol(" Standard ")).toBe(true);
    expect(isStandardProtocol("drop_set")).toBe(false);
    expect(isStandardProtocol("cluster")).toBe(false);
  });
});

describe("ProtocolCatalog.optionsIncluding", () => {
  const catalog = new ProtocolCatalog([cluster]);

  it("is the list of protocols when the id is in it", () => {
    expect(catalog.optionsIncluding("Cluster").map((p) => p.id)).toEqual([
      "standard",
      "cluster",
    ]);
  });

  it("adds a protocol no longer in the settings at the end, so it stays picked", () => {
    const options = catalog.optionsIncluding("drop_set");
    expect(options.map((p) => p.id)).toEqual(["standard", "cluster", "drop_set"]);
    expect(options[2].name).toBe(t("modal.selectOptions.dropSet"));
  });
});

describe("ProtocolInfo.chartColor", () => {
  const catalog = new ProtocolCatalog([cluster]);

  it("gives the protocol's chart color with the alpha asked for", () => {
    expect(catalog.resolve("cluster").chartColor(0.3)).toBe("rgba(255, 87, 51, 0.3)");
    expect(catalog.resolve("drop_set").chartColor(1)).toBe("rgba(239, 68, 68, 1)");
    expect(catalog.resolve("standard").chartColor(0.8)).toBe("rgba(128, 128, 128, 0.8)");
    expect(catalog.resolve("deleted_one").chartColor(0.3)).toBe("rgba(128, 128, 128, 0.3)");
  });

  it("matches the default chart color at 0.7", () => {
    for (const id of ["cluster", "drop_set", "myo_reps", "standard"]) {
      const info = catalog.resolve(id);
      expect(info.chartColor(0.7)).toBe(info.color);
    }
  });
});

describe("groupByProtocol", () => {
  it("groups sets by protocol id, a missing protocol counted as standard, in first-seen order", () => {
    const rows = [
      { protocol: "Drop_Set", n: 1 },
      { protocol: undefined, n: 2 },
      { protocol: "standard", n: 3 },
      { protocol: "drop_set", n: 4 },
    ];
    const groups = groupByProtocol(rows);
    expect([...groups.keys()]).toEqual(["drop_set", "standard"]);
    expect(groups.get("drop_set")?.map((r) => r.n)).toEqual([1, 4]);
    expect(groups.get("standard")?.map((r) => r.n)).toEqual([2, 3]);
  });
});
