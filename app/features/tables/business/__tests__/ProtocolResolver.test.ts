import { ProtocolResolver } from "@app/features/tables/business/ProtocolResolver";
import { WorkoutProtocol, CustomProtocolConfig } from "@app/types/WorkoutLogData";

describe("ProtocolResolver", () => {
  describe("built-in protocols", () => {
    it("returns null for standard protocol (no badge)", () => {
      expect(ProtocolResolver.resolve(WorkoutProtocol.STANDARD)).toBeNull();
    });

    it("resolves drop_set protocol", () => {
      const config = ProtocolResolver.resolve(WorkoutProtocol.DROP_SET);

      expect(config).not.toBeNull();
      expect(config!.label).toBe("Drop");
      expect(config!.className).toContain("workout-protocol-badge-drop");
      expect(config!.tooltip).toBe("drop set");
    });

    it("resolves myo_reps protocol", () => {
      const config = ProtocolResolver.resolve(WorkoutProtocol.MYO_REPS);

      expect(config).not.toBeNull();
      expect(config!.label).toBe("Myo");
      expect(config!.className).toContain("workout-protocol-badge-myo");
    });

    it("resolves rest_pause protocol", () => {
      const config = ProtocolResolver.resolve(WorkoutProtocol.REST_PAUSE);

      expect(config).not.toBeNull();
      expect(config!.label).toBe("RP");
      expect(config!.className).toContain("workout-protocol-badge-rp");
    });

    it("resolves superset protocol", () => {
      const config = ProtocolResolver.resolve(WorkoutProtocol.SUPERSET);

      expect(config).not.toBeNull();
      expect(config!.label).toBe("SS");
      expect(config!.className).toContain("workout-protocol-badge-superset");
    });

    it("resolves twentyone protocol", () => {
      const config = ProtocolResolver.resolve(WorkoutProtocol.TWENTYONE);

      expect(config).not.toBeNull();
      expect(config!.label).toBe("21s");
      expect(config!.className).toContain("workout-protocol-badge-21");
    });

    it("includes base className for all non-standard protocols", () => {
      const config = ProtocolResolver.resolve(WorkoutProtocol.DROP_SET);
      expect(config!.className).toContain("workout-protocol-badge");
    });

    it("formats tooltip by replacing underscores with spaces", () => {
      const config = ProtocolResolver.resolve(WorkoutProtocol.REST_PAUSE);
      expect(config!.tooltip).toBe("rest pause");
    });
  });

  describe("custom protocols", () => {
    const customProtocols: CustomProtocolConfig[] = [
      {
        id: "giant_set",
        name: "Giant Set",
        abbreviation: "GS",
        color: "#FF5733",
      },
      {
        id: "amrap",
        name: "AMRAP",
        abbreviation: "AM",
        color: "#33FF57",
      },
    ];

    it("resolves custom protocol by id", () => {
      const config = ProtocolResolver.resolve("giant_set", customProtocols);

      expect(config).not.toBeNull();
      expect(config!.label).toBe("GS");
      expect(config!.tooltip).toBe("Giant Set");
      expect(config!.color).toBe("#FF5733");
      expect(config!.className).toContain("workout-protocol-badge-custom");
    });

    it("resolves second custom protocol", () => {
      const config = ProtocolResolver.resolve("amrap", customProtocols);

      expect(config).not.toBeNull();
      expect(config!.label).toBe("AM");
    });

    it("returns null for unknown protocol with no custom protocols", () => {
      expect(ProtocolResolver.resolve("unknown")).toBeNull();
    });

    it("returns null for unknown protocol not in custom list", () => {
      expect(ProtocolResolver.resolve("unknown", customProtocols)).toBeNull();
    });

    it("built-in protocols take priority over custom", () => {
      const conflicting: CustomProtocolConfig[] = [
        {
          id: WorkoutProtocol.DROP_SET,
          name: "Custom Drop",
          abbreviation: "CD",
          color: "#000000",
        },
      ];

      const config = ProtocolResolver.resolve(WorkoutProtocol.DROP_SET, conflicting);

      // Should use built-in, not custom
      expect(config!.label).toBe("Drop");
    });
  });
});
