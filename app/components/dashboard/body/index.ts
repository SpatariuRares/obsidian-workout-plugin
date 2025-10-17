import { ArmsData, BackData, ChestData, CoreData, LegsData, ShoulderData } from '@app/components';

export { Muscle, type MusclePartData, type MuscleGroupData } from '@app/components/dashboard/body/Muscle';
export { Shoulders, type ShoulderData } from '@app/components/dashboard/body/Shoulders';
export { Chest, type ChestData } from '@app/components/dashboard/body/Chest';
export { Back, type BackData } from '@app/components/dashboard/body/Back';
export { Arms, type ArmsData } from '@app/components/dashboard/body/Arms';
export { Legs, type LegsData } from '@app/components/dashboard/body/Legs';
export { Core, type CoreData } from '@app/components/dashboard/body/Core';
export { BodyHeatMap, type BodyHeatMapOptions } from '@app/components/dashboard/body/BodyHeatMap';



export interface BodyData {
	shoulders: ShoulderData;
	chest: ChestData;
	back: BackData;
	arms: ArmsData;
	legs: LegsData;
	core: CoreData;
}
