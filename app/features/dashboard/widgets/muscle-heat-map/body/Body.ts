import { SVGBuilder } from "@app/features/dashboard/widgets/muscle-heat-map/body/SVGBuilder";
import { BODY_VIEWS_SVG } from "@app/features/dashboard/widgets/muscle-heat-map/body/BodyViewSvg";
import { HeatMapColors } from "@app/features/dashboard/widgets/muscle-heat-map/body/HeatMapColors";
import {
  maxZoneValue,
  type HeatMapZoneId,
  type ZoneValues,
} from "@app/features/dashboard/widgets/muscle-heat-map/body/zones";

export enum VIEW_TYPE {
  FRONT = "front",
  BACK = "back",
}
export interface BodyVisualizationOptions {
  view: VIEW_TYPE;
  /** Value that maps to full intensity; defaults to the busiest zone */
  maxValue: number;
}

// Clip-path ids must be unique per rendered body on the page
let renderedBodies = 0;

/**
 * Draws the body SVG and colors each `data-muscle` zone by its value.
 */
export class Body {
  private options: BodyVisualizationOptions;

  constructor(
    private zoneValues: ZoneValues,
    options?: Partial<BodyVisualizationOptions>,
  ) {
    this.options = {
      view: options?.view || VIEW_TYPE.FRONT,
      maxValue: options?.maxValue || maxZoneValue(zoneValues),
    };
  }

  render(container: HTMLElement): void {
    container.empty();
    container.addClass("body-visualization");

    const svg = SVGBuilder.createElementWithAttributes("svg", {
      viewBox: "0 0 660.46 1206.46",
      preserveAspectRatio: "xMidYMid meet",
      class: "body-svg",
    });
    container.appendChild(svg);

    const uid = `workout-heatmap-${++renderedBodies}`;
    const markup =
      this.options.view === VIEW_TYPE.BACK
        ? BODY_VIEWS_SVG.BACK(uid)
        : BODY_VIEWS_SVG.FRONT(uid);
    this.appendSvgContent(markup, svg);
    this.colorZones(svg);
  }

  private colorZones(svg: SVGSVGElement): void {
    svg.querySelectorAll("[data-muscle]").forEach((zoneEl) => {
      const zone = zoneEl.getAttribute("data-muscle") as HeatMapZoneId;
      const value = this.zoneValues[zone] ?? 0;
      const intensity = Math.min(value / this.options.maxValue, 1);
      zoneEl.setAttribute(
        "style",
        `color: ${HeatMapColors.getColor(intensity)}`,
      );
    });
  }

  private appendSvgContent(
    svgString: string,
    targetSvg: SVGSVGElement,
  ): void {
    const parser = new DOMParser();
    // eslint-disable-next-line i18next/no-literal-string -- SVG markup
    const wrappedSvg = `<svg xmlns="http://www.w3.org/2000/svg">${svgString}</svg>`;
    const doc = parser.parseFromString(wrappedSvg, "image/svg+xml");

    if (doc.querySelector("parsererror")) {
      return;
    }

    while (doc.documentElement.firstChild) {
      targetSvg.appendChild(doc.documentElement.firstChild);
    }
  }
}
