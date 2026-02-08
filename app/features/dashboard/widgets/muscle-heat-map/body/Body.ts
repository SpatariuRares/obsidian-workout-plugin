import { type BodyData } from "@app/features/dashboard/widgets/muscle-heat-map/body/index";
import { SVGBuilder } from "@app/features/dashboard/widgets/muscle-heat-map/body/utils/SVGBuilder";
import { ViewDataPreparer } from "@app/features/dashboard/widgets/muscle-heat-map/body/renderers/ViewDataPreparer";
import { BODY_VIEWS_SVG } from "@app/features/dashboard/widgets/muscle-heat-map/body/renderers/BodyViewSvg";

export enum VIEW_TYPE {
  FRONT = "front",
  BACK = "back",
}
export interface BodyVisualizationOptions {
  view: VIEW_TYPE;
  showLabels: boolean;
  maxValue: number;
}

export class Body {
  private bodyData: BodyData;
  private options: BodyVisualizationOptions;
  private dataPreparer: ViewDataPreparer;
  private container: HTMLElement | null = null;

  constructor(bodyData: BodyData, options?: Partial<BodyVisualizationOptions>) {
    this.bodyData = bodyData;
    this.options = {
      view: options?.view || VIEW_TYPE.FRONT,
      showLabels: options?.showLabels ?? true,
      maxValue: options?.maxValue || 1000,
    };

    // Initialize data preparer
    this.dataPreparer = new ViewDataPreparer(this.options.maxValue);
  }

  render(container: HTMLElement): void {
    this.container = container;
    container.empty();
    container.addClass("body-visualization");

    // Create SVG
    const svg = this.createSVG(container);

    // Render muscles based on view
    if (this.options.view === VIEW_TYPE.FRONT) {
      this.renderFrontView(svg);
    } else {
      this.renderBackView(svg);
    }
  }

  private createSVG(container: HTMLElement): SVGSVGElement {
    const svg = SVGBuilder.createElementWithAttributes("svg", {
      viewBox: "0 0 660.46 1206.46",
      preserveAspectRatio: "xMidYMid meet",
      class: "body-svg",
    });
    container.appendChild(svg);
    return svg;
  }

  private renderFrontView(svg: SVGSVGElement): void {
    const colors = this.dataPreparer.prepareFrontViewData(this.bodyData);

    const svgContent = BODY_VIEWS_SVG.FRONT(
      colors.traps,
      colors.biceps,
      colors.forearms,
      colors.quads,
      colors.calves,
      colors.abs,
      colors.obliques,
      colors.frontShoulders,
      colors.upperChest,
      colors.middleChest,
    );

    this.appendSvgContent(svgContent, svg);
  }

  private renderBackView(svg: SVGSVGElement): void {
    const colors = this.dataPreparer.prepareBackViewData(this.bodyData);

    const svgContent = BODY_VIEWS_SVG.BACK(
      colors.lowerBack,
      colors.traps,
      colors.trapsMiddle,
      colors.lats,
      colors.triceps,
      colors.forearms,
      colors.glutes,
      colors.quads,
      colors.hamstrings,
      colors.calves,
      colors.rearShoulders,
    );

    this.appendSvgContent(svgContent, svg);
  }

  private appendSvgContent(svgString: string, targetSvg: SVGSVGElement): void {
    const parser = new DOMParser();
    const wrappedSvg = `<svg xmlns="http://www.w3.org/2000/svg">${svgString}</svg>`;
    const doc = parser.parseFromString(wrappedSvg, "image/svg+xml");

    const parseError = doc.querySelector("parsererror");
    if (parseError) {
      return;
    }

    while (doc.documentElement.firstChild) {
      targetSvg.appendChild(doc.documentElement.firstChild);
    }
  }

  updateBodyData(bodyData: Partial<BodyData>): void {
    // Update body data by merging partial data
    if (bodyData.shoulders) {
      this.bodyData.shoulders = {
        ...this.bodyData.shoulders,
        ...bodyData.shoulders,
      };
    }
    if (bodyData.chest) {
      this.bodyData.chest = { ...this.bodyData.chest, ...bodyData.chest };
    }
    if (bodyData.back) {
      this.bodyData.back = { ...this.bodyData.back, ...bodyData.back };
    }
    if (bodyData.arms) {
      this.bodyData.arms = { ...this.bodyData.arms, ...bodyData.arms };
    }
    if (bodyData.legs) {
      this.bodyData.legs = { ...this.bodyData.legs, ...bodyData.legs };
    }
    if (bodyData.core) {
      this.bodyData.core = { ...this.bodyData.core, ...bodyData.core };
    }

    // Re-render if container is available
    if (this.container) {
      this.render(this.container);
    }
  }

  setView(view: VIEW_TYPE): void {
    this.options.view = view;

    // Re-render if container is available
    if (this.container) {
      this.render(this.container);
    }
  }

  getBodyData(): BodyData {
    return {
      shoulders: { ...this.bodyData.shoulders },
      chest: { ...this.bodyData.chest },
      back: { ...this.bodyData.back },
      arms: { ...this.bodyData.arms },
      legs: { ...this.bodyData.legs },
      core: { ...this.bodyData.core },
    };
  }
}
