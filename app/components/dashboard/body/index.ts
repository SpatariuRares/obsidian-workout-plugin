export { Muscle, type MusclePartData, type MuscleGroupData } from './Muscle';
export { Shoulders, type ShoulderData } from './Shoulders';
export { Chest, type ChestData } from './Chest';
export { Back, type BackData } from './Back';
export { Arms, type ArmsData } from './Arms';
export { Legs, type LegsData } from './Legs';
export { Core, type CoreData } from './Core';
export { BodyHeatMap, type BodyHeatMapOptions } from './BodyHeatMap';

import type { ShoulderData } from './Shoulders';
import type { ChestData } from './Chest';
import type { BackData } from './Back';
import type { ArmsData } from './Arms';
import type { LegsData } from './Legs';
import type { CoreData } from './Core';

export interface BodyData {
	shoulders: ShoulderData;
	chest: ChestData;
	back: BackData;
	arms: ArmsData;
	legs: LegsData;
	core: CoreData;
}
