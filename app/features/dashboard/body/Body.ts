import { type BodyData } from "@app/features/dashboard/body/index";
import { SVGBuilder } from "@app/features/dashboard/body/utils/SVGBuilder";
import { HeatMapColors } from "@app/features/dashboard/body/utils/HeatMapColors";
import { ViewDataPreparer } from "@app/features/dashboard/body/renderers/ViewDataPrepar";
import { BODY_VIEWS_SVG } from "@app/features/dashboard/body/renderers/FrontView";

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

    // Draw body outline
    this.drawBodyOutline(svg);

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
      width: "100%",
      height: "100%",
      class: "body-svg",
    });
    container.appendChild(svg);
    return svg;
  }

  private drawBodyOutline(svg: SVGSVGElement): void {
    if (this.options.view === VIEW_TYPE.FRONT) {
      this.drawFemaleFrontOutline(svg);
    } else {
      this.drawFemaleBackOutline(svg);
    }
  }

  private drawFemaleFrontOutline(_svg: SVGSVGElement): void {
    // TODO: Implement new back outline rendering
  }

  private drawFemaleBackOutline(svg: SVGSVGElement): void {
    // Create SVG defs using SVGBuilder
    const defs = SVGBuilder.createDefs();

    const gradient = SVGBuilder.createRadialGradient("jointradial", {
      cx: "50%",
      cy: "50%",
      r: "50%",
      fx: "50%",
      fy: "50%",
    });

    const stop1 = SVGBuilder.createStop("0%", "rgb(254, 91, 127)", 1);
    const stop2 = SVGBuilder.createStop("100%", "rgb(231, 236, 239)", 1);

    SVGBuilder.appendChildren(gradient, [stop1, stop2]);
    defs.appendChild(gradient);
    svg.appendChild(defs);
  }

  private renderFrontView(svg: SVGSVGElement): void {
    // Prepare muscle colors using ViewDataPreparer
    const colors = this.dataPreparer.prepareFrontViewData(this.bodyData);

    // Destructure colors for easier access in template
    const trapsColor = colors.traps;
    const bicepsColor = colors.biceps;
    const forearmsColor = colors.forearms;
    const quadsColor = colors.quads;
    const calvesColor = colors.calves;
    const absColor = colors.abs;
    const obliquesColor = colors.obliques;
    const frontShouldersColor = colors.frontShoulders;
    const upperChestColor = colors.upperChest;
    const middleChestColor = colors.middleChest;

    // Render SVG parts with colors

    const bodyG = BODY_VIEWS_SVG.FRONT(
      trapsColor,
      bicepsColor,
      forearmsColor,
      quadsColor,
      calvesColor,
      absColor,
      obliquesColor,
      frontShouldersColor,
      upperChestColor,
      middleChestColor,
    );

    // Parse the SVG string into DOM nodes safely
    const parser = new DOMParser();
    const doc = parser.parseFromString(bodyG, "image/svg+xml");

    // Move children from parsed document to the main SVG
    while (doc.documentElement.firstChild) {
      svg.appendChild(doc.documentElement.firstChild);
    }
  }

  private renderBackView(svg: SVGSVGElement): void {
    // Prepare muscle colors using ViewDataPreparer
    const colors = this.dataPreparer.prepareBackViewData(this.bodyData);

    // Destructure colors for easier access in template
    const lowerBackColor = colors.lowerBack;
    const trapsColor = colors.traps;
    const trapsMiddleColor = colors.trapsMiddle;
    const latsColor = colors.lats;
    const tricepsColor = colors.triceps;
    const forearmsColor = colors.forearms;
    const glutesColor = colors.glutes;
    const quadsColor = colors.quads;
    const hamstringsColor = colors.hamstrings;
    const calvesColor = colors.calves;
    const rearShouldersColor = colors.rearShoulders;

    // Render SVG parts with colors

    const bodyG = BODY_VIEWS_SVG.BACK(
      lowerBackColor,
      trapsColor,
      trapsMiddleColor,
      latsColor,
      tricepsColor,
      forearmsColor,
      glutesColor,
      quadsColor,
      hamstringsColor,
      calvesColor,
      rearShouldersColor,
    );

    // Parse the SVG string into DOM nodes safely
    const parser = new DOMParser();
    const doc = parser.parseFromString(bodyG, "image/svg+xml");

    // Move children from parsed document to the main SVG
    // We iterate backwards or while firstChild exists to ensure we get all nodes
    while (doc.documentElement.firstChild) {
      svg.appendChild(doc.documentElement.firstChild);
    }
  }

  private getHeatMapColor(intensity: number): string {
    return HeatMapColors.getColor(intensity);
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
    return { ...this.bodyData };
  }
}
