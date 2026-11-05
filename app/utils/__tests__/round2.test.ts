import { round2 } from "@app/utils/round2";

describe("round2", () => {
  it("rounds to 2 decimals", () => {
    expect(round2(82.567)).toBe(82.57);
    expect(round2(80)).toBe(80);
    expect(round2(-2.344)).toBe(-2.34);
    expect(round2(0.1 + 0.2)).toBe(0.3);
  });
});
