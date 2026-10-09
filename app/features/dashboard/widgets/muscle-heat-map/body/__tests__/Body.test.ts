/** @jest-environment jsdom */

import {
  Body,
  VIEW_TYPE,
  type BodyData,
} from "@app/features/dashboard/widgets/muscle-heat-map/body";
import { createObsidianContainer } from "@app/components/__tests__/obsidianDomMocks";

const emptyBody = (): BodyData => ({
  shoulders: { frontLeft: 0, frontRight: 0, rearLeft: 0, rearRight: 0 },
  chest: { upper: 0, middle: 0, lower: 0 },
  back: { traps: 0, lats: 0, lowerBack: 0, trapsMiddle: 0 },
  arms: {
    bicepsLeft: 0,
    bicepsRight: 0,
    tricepsLeft: 0,
    tricepsRight: 0,
    forearmsLeft: 0,
    forearmsRight: 0,
  },
  legs: {
    quadsLeft: 0,
    quadsRight: 0,
    hamstringsLeft: 0,
    hamstringsRight: 0,
    glutesLeft: 0,
    glutesRight: 0,
    calvesLeft: 0,
    calvesRight: 0,
  },
  core: { abs: 0, obliques: 0 },
});

const colorOf = (container: HTMLElement, id: string) =>
  container.querySelector(`g#${id}`)?.getAttribute("style");

describe.each([
  [VIEW_TYPE.FRONT, "anterior-deltoid"],
  [VIEW_TYPE.BACK, "posterior-deltoid"],
])("Body %s view", (view, otherDeltoid) => {
  it("colors the lateral deltoid from side delt volume alone", () => {
    const data = emptyBody();
    data.shoulders.lateralLeft = 50;
    data.shoulders.lateralRight = 50;
    const container = createObsidianContainer();

    new Body(data, { view, maxValue: 100 }).render(container);

    expect(colorOf(container, "lateral-deltoid")).toBeTruthy();
    expect(colorOf(container, "lateral-deltoid")).not.toBe(
      colorOf(container, otherDeltoid),
    );
  });
});

describe("Body front view chest sections", () => {
  const render = (chest: BodyData["chest"]) => {
    const data = emptyBody();
    data.chest = chest;
    const container = createObsidianContainer();
    new Body(data, { view: VIEW_TYPE.FRONT, maxValue: 100 }).render(container);
    return container;
  };

  it("colors the lower chest independently from the mid chest", () => {
    const container = render({ upper: 0, middle: 0, lower: 100 });

    expect(colorOf(container, "lower-pectoralis")).toBeTruthy();
    expect(colorOf(container, "lower-pectoralis")).not.toBe(
      colorOf(container, "mid-pectoralis"),
    );
  });

  it("clips the shared pectoral shape into a mid and a lower section", () => {
    const container = render({ upper: 0, middle: 100, lower: 0 });
    const clipOf = (id: string) =>
      container.querySelector(`g#${id}`)?.getAttribute("clip-path");

    expect(clipOf("mid-pectoralis")).toMatch(/url\(#.+\)/);
    expect(clipOf("lower-pectoralis")).toMatch(/url\(#.+\)/);
    expect(clipOf("mid-pectoralis")).not.toBe(clipOf("lower-pectoralis"));
  });
});

describe.each([
  {
    view: VIEW_TYPE.BACK,
    zone: "rhomboids",
    sibling: "traps-middle",
    set: (d: BodyData) => (d.back.rhomboids = 100),
  },
  {
    view: VIEW_TYPE.FRONT,
    zone: "serratus",
    sibling: "obliques",
    set: (d: BodyData) => (d.core.serratus = 100),
  },
])("Body $zone section", ({ view, zone, sibling, set }) => {
  const render = () => {
    const data = emptyBody();
    set(data);
    const container = createObsidianContainer();
    new Body(data, { view, maxValue: 100 }).render(container);
    return container;
  };
  const clipOf = (container: HTMLElement, id: string) =>
    container.querySelector(`g#${id}`)?.getAttribute("clip-path");

  it(`colors ${zone} independently from ${sibling}`, () => {
    const container = render();

    expect(colorOf(container, zone)).toBeTruthy();
    expect(colorOf(container, zone)).not.toBe(colorOf(container, sibling));
  });

  it(`clips ${zone} and ${sibling} out of the same shape`, () => {
    const container = render();

    expect(clipOf(container, zone)).toMatch(/url\(#.+\)/);
    expect(clipOf(container, sibling)).toMatch(/url\(#.+\)/);
    expect(clipOf(container, zone)).not.toBe(clipOf(container, sibling));
  });
});
