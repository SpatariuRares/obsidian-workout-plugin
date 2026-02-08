export {
  Body,
  type BodyVisualizationOptions,
  VIEW_TYPE,
} from "@app/features/dashboard/widgets/muscle-heat-map/body/Body";

export interface ArmsData {
  bicepsLeft: number;
  bicepsRight: number;
  tricepsLeft: number;
  tricepsRight: number;
  forearmsLeft: number;
  forearmsRight: number;
}

export interface BackData {
  traps: number;
  trapsMiddle: number;
  lats: number;
  lowerBack: number;
}

export interface ChestData {
  upper: number;
  middle: number;
  lower: number;
}

export interface CoreData {
  abs: number;
  obliques: number;
}

export interface LegsData {
  quadsLeft: number;
  quadsRight: number;
  hamstringsLeft: number;
  hamstringsRight: number;
  glutesLeft: number;
  glutesRight: number;
  calvesLeft: number;
  calvesRight: number;
}

export interface ShoulderData {
  frontLeft: number;
  frontRight: number;
  lateralLeft?: number;
  lateralRight?: number;
  rearLeft: number;
  rearRight: number;
}

export interface BodyData {
  shoulders: ShoulderData;
  chest: ChestData;
  back: BackData;
  arms: ArmsData;
  legs: LegsData;
  core: CoreData;
}
