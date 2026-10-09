import {
  convertWeight,
  convertWeightAndVolume,
  isWeightUnit,
} from "@app/utils/WeightUnitUtils";

describe("WeightUnitUtils", () => {
  describe("convertWeight", () => {
    it("should return the same value when units match", () => {
      expect(convertWeight(100, "kg", "kg")).toBe(100);
      expect(convertWeight(45, "lb", "lb")).toBe(45);
    });

    it("should convert lb to kg rounded to 2 decimals", () => {
      expect(convertWeight(45, "lb", "kg")).toBe(20.41);
      expect(convertWeight(225, "lb", "kg")).toBe(102.06);
    });

    it("should convert kg to lb rounded to 2 decimals", () => {
      expect(convertWeight(20, "kg", "lb")).toBe(44.09);
      expect(convertWeight(100, "kg", "lb")).toBe(220.46);
    });

    it("should keep zero as zero", () => {
      expect(convertWeight(0, "kg", "lb")).toBe(0);
    });
  });

  describe("isWeightUnit", () => {
    it("should accept kg and lb only", () => {
      expect(isWeightUnit("kg")).toBe(true);
      expect(isWeightUnit("lb")).toBe(true);
      expect(isWeightUnit("lbs")).toBe(false);
      expect(isWeightUnit(undefined)).toBe(false);
    });
  });
});

describe("convertWeightAndVolume", () => {
  it("should recompute volume when it equals reps × weight", () => {
    // 1102.3 lb converted on its own would give 499.99
    expect(convertWeightAndVolume(5, 220.46, 1102.3, "lb", "kg")).toEqual({
      weight: 100,
      volume: 500,
    });
  });

  it("should convert volume on its own when it is not reps × weight", () => {
    expect(convertWeightAndVolume(0, 100, 500, "kg", "lb")).toEqual({
      weight: 220.46,
      volume: 1102.31,
    });
  });

  it("should return the same values when units match", () => {
    expect(convertWeightAndVolume(5, 100, 500, "kg", "kg")).toEqual({
      weight: 100,
      volume: 500,
    });
  });
});
