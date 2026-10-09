/** @jest-environment jsdom */

import {
  Body,
  HEAT_MAP_ZONES,
  VIEW_TYPE,
  type HeatMapZoneId,
  type ZoneValues,
} from "@app/features/dashboard/widgets/muscle-heat-map/body";
import { BODY_VIEWS_SVG } from "@app/features/dashboard/widgets/muscle-heat-map/body/BodyViewSvg";
import { createObsidianContainer } from "@app/components/__tests__/obsidianDomMocks";

const zones = (values: Partial<ZoneValues> = {}): ZoneValues =>
  Object.fromEntries(
    Object.keys(HEAT_MAP_ZONES).map((zone) => [
      zone,
      values[zone as HeatMapZoneId] ?? 0,
    ]),
  ) as ZoneValues;

const render = (values: Partial<ZoneValues>, view: VIEW_TYPE) => {
  const container = createObsidianContainer();
  new Body(zones(values), { view, maxValue: 100 }).render(container);
  return container;
};

const colorOf = (container: HTMLElement, id: string) =>
  container.querySelector(`g#${id}`)?.getAttribute("style");

const clipOf = (container: HTMLElement, id: string) =>
  container.querySelector(`g#${id}`)?.getAttribute("clip-path");

describe("Body SVG and zone registry", () => {
  const zoneIdsIn = (svg: string) =>
    new Set([...svg.matchAll(/data-muscle="([^"]+)"/g)].map((m) => m[1]));
  const drawn = new Set([
    ...zoneIdsIn(BODY_VIEWS_SVG.FRONT("x")),
    ...zoneIdsIn(BODY_VIEWS_SVG.BACK("x")),
  ]);

  it("only uses zones that exist in HEAT_MAP_ZONES", () => {
    expect([...drawn].filter((zone) => !(zone in HEAT_MAP_ZONES))).toEqual(
      [],
    );
  });

  it("draws every zone of HEAT_MAP_ZONES in at least one view", () => {
    expect(Object.keys(HEAT_MAP_ZONES).filter((z) => !drawn.has(z))).toEqual(
      [],
    );
  });

  it("gives each rendered body its own clip-path ids", () => {
    const first = render({}, VIEW_TYPE.FRONT);
    const second = render({}, VIEW_TYPE.FRONT);
    const clipIds = (c: HTMLElement) =>
      [...c.querySelectorAll("clipPath")].map((el) => el.id);

    expect(clipIds(first).length).toBeGreaterThan(0);
    expect(clipIds(first)).not.toEqual(clipIds(second));
    expect(clipOf(first, "mid-pectoralis")).toBe(
      `url(#${clipIds(first).find((id) => id.endsWith("pec-mid-clip"))})`,
    );
  });
});

describe.each([
  [VIEW_TYPE.FRONT, "anterior-deltoid"],
  [VIEW_TYPE.BACK, "posterior-deltoid"],
])("Body %s view", (view, otherDeltoid) => {
  it("colors the lateral deltoid from side delt volume alone", () => {
    const container = render({ sideShoulders: 50 }, view);

    expect(colorOf(container, "lateral-deltoid")).toBeTruthy();
    expect(colorOf(container, "lateral-deltoid")).not.toBe(
      colorOf(container, otherDeltoid),
    );
  });
});

describe.each([
  {
    view: VIEW_TYPE.FRONT,
    zone: "lower-pectoralis",
    sibling: "mid-pectoralis",
    values: { lowerChest: 100 },
  },
  {
    view: VIEW_TYPE.BACK,
    zone: "rhomboids",
    sibling: "traps-middle",
    values: { rhomboids: 100 },
  },
  {
    view: VIEW_TYPE.FRONT,
    zone: "serratus",
    sibling: "obliques",
    values: { serratus: 100 },
  },
])("Body $zone section", ({ view, zone, sibling, values }) => {
  it(`colors ${zone} independently from ${sibling}`, () => {
    const container = render(values, view);

    expect(colorOf(container, zone)).toBeTruthy();
    expect(colorOf(container, zone)).not.toBe(colorOf(container, sibling));
  });

  it(`clips ${zone} and ${sibling} out of the same shape`, () => {
    const container = render(values, view);

    expect(clipOf(container, zone)).toMatch(/url\(#.+\)/);
    expect(clipOf(container, sibling)).toMatch(/url\(#.+\)/);
    expect(clipOf(container, zone)).not.toBe(clipOf(container, sibling));
  });
});
