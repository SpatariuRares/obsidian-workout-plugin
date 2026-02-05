/**
 * Body visualization utilities
 * Centralized exports for SVG building, intensity calculations, and heat map colors
 */

export {
  SVGBuilder,
  type SVGAttributes,
} from "@app/features/dashboard/widgets/muscle-heat-map/body/utils/SVGBuilder";
export {
  IntensityCalculator,
  type MuscleData,
} from "@app/features/dashboard/widgets/muscle-heat-map/body/utils/IntensityCalculator";
export { HeatMapColors } from "@app/features/dashboard/widgets/muscle-heat-map/body/utils/HeatMapColors";

