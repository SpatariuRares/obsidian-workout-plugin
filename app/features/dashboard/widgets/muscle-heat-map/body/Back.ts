import { GenericMuscle } from "@app/features/dashboard/widgets/muscle-heat-map/body/GenericMuscle";
import { BACK_CONFIG } from "@app/features/dashboard/widgets/muscle-heat-map/body/config/MuscleConfigurations";

export interface BackData {
	traps: number;
	trapsMiddle: number;
	lats: number;
	lowerBack: number;
}

/**
 * Back muscle class using GenericMuscle implementation.
 * Maintains backward compatibility while using the new configuration system.
 */
export class Back extends GenericMuscle<BackData> {
	constructor(data: BackData) {
		super(data, BACK_CONFIG);
	}

	/**
	 * Gets back-specific data.
	 * @returns BackData object
	 */
	getBackData(): BackData {
		return this.getTypedData();
	}

	/**
	 * Updates back-specific data.
	 * @param data - Partial BackData to update
	 */
	updateBackData(data: Partial<BackData>): void {
		this.updateTypedData(data);
	}
}

