import { isInViewport, placeCard } from "@app/features/tour/tourPlacement";

const viewport = { width: 1000, height: 800 };
const card = { width: 300, height: 150 };

describe("placeCard", () => {
  it("centres without a target", () => {
    expect(placeCard(null, card, viewport, false)).toEqual({
      mode: "centered",
    });
  });

  it("goes below the target, then above when there is no room", () => {
    const high = { left: 100, top: 100, width: 50, height: 20 };
    expect(placeCard(high, card, viewport, false)).toEqual({
      mode: "floating",
      left: 100,
      top: 132,
    });
    const low = { left: 100, top: 700, width: 50, height: 20 };
    expect(placeCard(low, card, viewport, false)).toEqual({
      mode: "floating",
      left: 100,
      top: 538,
    });
  });

  it("keeps the card inside the viewport horizontally", () => {
    const right = { left: 950, top: 100, width: 40, height: 20 };
    expect(placeCard(right, card, viewport, false)).toMatchObject({
      mode: "floating",
      left: 688,
    });
  });

  it("docks on the side opposite the target on mobile", () => {
    const top = { left: 10, top: 50, width: 50, height: 20 };
    const bottom = { left: 10, top: 700, width: 50, height: 20 };
    expect(placeCard(top, card, viewport, true)).toEqual({
      mode: "docked",
      edge: "bottom",
    });
    expect(placeCard(bottom, card, viewport, true)).toEqual({
      mode: "docked",
      edge: "top",
    });
  });
});

describe("isInViewport", () => {
  it("is false when scrolled out of view", () => {
    expect(
      isInViewport({ left: 0, top: 900, width: 10, height: 10 }, viewport),
    ).toBe(false);
    expect(
      isInViewport({ left: 0, top: 100, width: 10, height: 10 }, viewport),
    ).toBe(true);
  });
});
