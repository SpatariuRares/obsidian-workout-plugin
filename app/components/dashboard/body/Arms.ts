import { GenericMuscle } from "@app/components/dashboard/body/GenericMuscle";
import { ARMS_CONFIG } from "@app/components/dashboard/body/config/MuscleConfigurations";

export interface ArmsData {
	bicepsLeft: number;
	bicepsRight: number;
	tricepsLeft: number;
	tricepsRight: number;
	forearmsLeft: number;
	forearmsRight: number;
}

/**
 * Arms muscle class using GenericMuscle implementation.
 * Maintains backward compatibility while using the new configuration system.
 */
export class Arms extends GenericMuscle<ArmsData> {
	constructor(data: ArmsData) {
		super(data, ARMS_CONFIG);
	}

	/**
	 * Gets arms-specific data.
	 * @returns ArmsData object
	 */
	getArmsData(): ArmsData {
		return this.getTypedData();
	}

	/**
	 * Updates arms-specific data.
	 * @param data - Partial ArmsData to update
	 */
	updateArmsData(data: Partial<ArmsData>): void {
		this.updateTypedData(data);
	}
}
