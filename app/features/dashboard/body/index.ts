import type { ArmsData } from "@app/features/dashboard/body/Arms";
import type { BackData } from "@app/features/dashboard/body/Back";
import type { ChestData } from "@app/features/dashboard/body/Chest";
import type { CoreData } from "@app/features/dashboard/body/Core";
import type { LegsData } from "@app/features/dashboard/body/Legs";
import type { ShoulderData } from "@app/features/dashboard/body/Shoulders";

export {
  Muscle,
  type MusclePartData,
  type MuscleGroupData,
} from "@app/features/dashboard/body/Muscle";
export {
  Shoulders,
  type ShoulderData,
} from "@app/features/dashboard/body/Shoulders";
export { Chest, type ChestData } from "@app/features/dashboard/body/Chest";
export { Back, type BackData } from "@app/features/dashboard/body/Back";
export { Arms, type ArmsData } from "@app/features/dashboard/body/Arms";
export { Legs, type LegsData } from "@app/features/dashboard/body/Legs";
export { Core, type CoreData } from "@app/features/dashboard/body/Core";
export {
  Body,
  type BodyVisualizationOptions,
  VIEW_TYPE,
} from "@app/features/dashboard/body/Body";

export interface BodyData {
  shoulders: ShoulderData;
  chest: ChestData;
  back: BackData;
  arms: ArmsData;
  legs: LegsData;
  core: CoreData;
}
