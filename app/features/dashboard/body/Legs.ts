import { GenericMuscle } from "@app/features/dashboard/body/GenericMuscle";
import { LEGS_CONFIG } from "@app/features/dashboard/body/config/MuscleConfigurations";

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

/**
 * Legs muscle class using GenericMuscle implementation.
 * Maintains backward compatibility while using the new configuration system.
 */
export class Legs extends GenericMuscle<LegsData> {
	constructor(data: LegsData) {
		super(data, LEGS_CONFIG);
	}

	/**
	 * Gets legs-specific data.
	 * @returns LegsData object
	 */
	getLegsData(): LegsData {
		return this.getTypedData();
	}

	/**
	 * Updates legs-specific data.
	 * @param data - Partial LegsData to update
	 */
	updateLegsData(data: Partial<LegsData>): void {
		this.updateTypedData(data);
	}
}

