/**
 * Utility class for creating SVG elements with a cleaner API.
 * Simplifies the verbose DOM API for SVG creation.
 */

const SVG_NS = "http://www.w3.org/2000/svg";

/**
 * Represents SVG element attributes
 */
export interface SVGAttributes {
  [key: string]: string | number;
}

/**
 * Builder for creating SVG elements with a fluent API
 */
export class SVGBuilder {
  /**
   * Creates an SVG element with the specified tag name
   * @param tagName - SVG element tag name (e.g., "rect", "circle", "path")
   * @returns The created SVG element
   */
  static createElement<K extends keyof SVGElementTagNameMap>(
    tagName: K
  ): SVGElementTagNameMap[K] {
    return document.createElementNS(SVG_NS, tagName);
  }

  /**
   * Sets multiple attributes on an SVG element
   * @param element - The SVG element to modify
   * @param attributes - Object containing attribute key-value pairs
   */
  static setAttributes(element: SVGElement, attributes: SVGAttributes): void {
    Object.entries(attributes).forEach(([key, value]) => {
      element.setAttribute(key, String(value));
    });
  }

  /**
   * Creates an SVG element with attributes
   * @param tagName - SVG element tag name
   * @param attributes - Object containing attribute key-value pairs
   * @returns The created and configured SVG element
   */
  static createElementWithAttributes<K extends keyof SVGElementTagNameMap>(
    tagName: K,
    attributes: SVGAttributes
  ): SVGElementTagNameMap[K] {
    const element = this.createElement(tagName);
    this.setAttributes(element, attributes);
    return element;
  }

  /**
   * Creates an SVG path element
   * @param d - Path data string
   * @param attributes - Additional attributes
   * @returns The created path element
   */
  static createPath(d: string, attributes?: SVGAttributes): SVGPathElement {
    return this.createElementWithAttributes("path", {
      d,
      ...attributes,
    });
  }

  /**
   * Creates an SVG rectangle element
   * @param x - X coordinate
   * @param y - Y coordinate
   * @param width - Rectangle width
   * @param height - Rectangle height
   * @param attributes - Additional attributes
   * @returns The created rect element
   */
  static createRect(
    x: number,
    y: number,
    width: number,
    height: number,
    attributes?: SVGAttributes
  ): SVGRectElement {
    return this.createElementWithAttributes("rect", {
      x,
      y,
      width,
      height,
      ...attributes,
    });
  }

  /**
   * Creates an SVG circle element
   * @param cx - Center X coordinate
   * @param cy - Center Y coordinate
   * @param r - Radius
   * @param attributes - Additional attributes
   * @returns The created circle element
   */
  static createCircle(
    cx: number,
    cy: number,
    r: number,
    attributes?: SVGAttributes
  ): SVGCircleElement {
    return this.createElementWithAttributes("circle", {
      cx,
      cy,
      r,
      ...attributes,
    });
  }

  /**
   * Creates an SVG ellipse element
   * @param cx - Center X coordinate
   * @param cy - Center Y coordinate
   * @param rx - X-axis radius
   * @param ry - Y-axis radius
   * @param attributes - Additional attributes
   * @returns The created ellipse element
   */
  static createEllipse(
    cx: number,
    cy: number,
    rx: number,
    ry: number,
    attributes?: SVGAttributes
  ): SVGEllipseElement {
    return this.createElementWithAttributes("ellipse", {
      cx,
      cy,
      rx,
      ry,
      ...attributes,
    });
  }

  /**
   * Creates an SVG group element
   * @param attributes - Group attributes
   * @returns The created g element
   */
  static createGroup(attributes?: SVGAttributes): SVGGElement {
    if (attributes) {
      return this.createElementWithAttributes("g", attributes);
    }
    return this.createElement("g");
  }

  /**
   * Creates an SVG defs element
   * @returns The created defs element
   */
  static createDefs(): SVGDefsElement {
    return this.createElement("defs");
  }

  /**
   * Creates a radial gradient element
   * @param id - Gradient ID
   * @param attributes - Additional gradient attributes
   * @returns The created radialGradient element
   */
  static createRadialGradient(
    id: string,
    attributes?: SVGAttributes
  ): SVGRadialGradientElement {
    return this.createElementWithAttributes("radialGradient", {
      id,
      ...attributes,
    });
  }

  /**
   * Creates a linear gradient element
   * @param id - Gradient ID
   * @param attributes - Additional gradient attributes
   * @returns The created linearGradient element
   */
  static createLinearGradient(
    id: string,
    attributes?: SVGAttributes
  ): SVGLinearGradientElement {
    return this.createElementWithAttributes("linearGradient", {
      id,
      ...attributes,
    });
  }

  /**
   * Creates a gradient stop element
   * @param offset - Stop offset (0-100% or 0-1)
   * @param color - Stop color
   * @param opacity - Stop opacity (optional)
   * @returns The created stop element
   */
  static createStop(
    offset: string | number,
    color: string,
    opacity?: number
  ): SVGStopElement {
    const attributes: SVGAttributes = {
      offset: String(offset),
      "stop-color": color,
    };
    if (opacity !== undefined) {
      attributes["stop-opacity"] = opacity;
    }
    return this.createElementWithAttributes("stop", attributes);
  }

  /**
   * Appends multiple children to an SVG element
   * @param parent - Parent SVG element
   * @param children - Array of child elements to append
   */
  static appendChildren(parent: SVGElement, children: SVGElement[]): void {
    children.forEach((child) => parent.appendChild(child));
  }
}

