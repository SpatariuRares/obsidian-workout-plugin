import type { ArmsData } from "@app/features/dashboard/widgets/muscle-heat-map/body/Arms";
import type { BackData } from "@app/features/dashboard/widgets/muscle-heat-map/body/Back";
import type { ChestData } from "@app/features/dashboard/widgets/muscle-heat-map/body/Chest";
import type { CoreData } from "@app/features/dashboard/widgets/muscle-heat-map/body/Core";
import type { LegsData } from "@app/features/dashboard/widgets/muscle-heat-map/body/Legs";
import type { ShoulderData } from "@app/features/dashboard/widgets/muscle-heat-map/body/Shoulders";

export {
  Muscle,
  type MusclePartData,
  type MuscleGroupData,
} from "@app/features/dashboard/widgets/muscle-heat-map/body/Muscle";
export {
  Shoulders,
  type ShoulderData,
} from "@app/features/dashboard/widgets/muscle-heat-map/body/Shoulders";
export { Chest, type ChestData } from "@app/features/dashboard/widgets/muscle-heat-map/body/Chest";
export { Back, type BackData } from "@app/features/dashboard/widgets/muscle-heat-map/body/Back";
export { Arms, type ArmsData } from "@app/features/dashboard/widgets/muscle-heat-map/body/Arms";
export { Legs, type LegsData } from "@app/features/dashboard/widgets/muscle-heat-map/body/Legs";
export { Core, type CoreData } from "@app/features/dashboard/widgets/muscle-heat-map/body/Core";
export {
  Body,
  type BodyVisualizationOptions,
  VIEW_TYPE,
} from "@app/features/dashboard/widgets/muscle-heat-map/body/Body";

export interface BodyData {
  shoulders: ShoulderData;
  chest: ChestData;
  back: BackData;
  arms: ArmsData;
  legs: LegsData;
  core: CoreData;
}
