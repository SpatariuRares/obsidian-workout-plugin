import { GenericMuscle } from "@app/features/dashboard/body/GenericMuscle";
import { SHOULDERS_CONFIG } from "@app/features/dashboard/body/config/MuscleConfigurations";

export interface ShoulderData {
	frontLeft: number;
	frontRight: number;
	lateralLeft?: number;
	lateralRight?: number;
	rearLeft: number;
	rearRight: number;
}

/**
 * Shoulders muscle class using GenericMuscle implementation.
 * Maintains backward compatibility while using the new configuration system.
 */
export class Shoulders extends GenericMuscle<ShoulderData> {
	constructor(data: ShoulderData) {
		super(data, SHOULDERS_CONFIG);
	}

	/**
	 * Gets shoulders-specific data.
	 * @returns ShoulderData object
	 */
	getShouldersData(): ShoulderData {
		return this.getTypedData();
	}

	/**
	 * Updates shoulders-specific data.
	 * @param data - Partial ShoulderData to update
	 */
	updateShouldersData(data: Partial<ShoulderData>): void {
		this.updateTypedData(data);
	}
}

