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
