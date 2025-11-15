import { GenericMuscle } from "@app/components/dashboard/body/GenericMuscle";
import { CHEST_CONFIG } from "@app/components/dashboard/body/config/MuscleConfigurations";

export interface ChestData {
	upper: number;
	middle: number;
	lower: number;
}

/**
 * Chest muscle class using GenericMuscle implementation.
 * Maintains backward compatibility while using the new configuration system.
 */
export class Chest extends GenericMuscle<ChestData> {
	constructor(data: ChestData) {
		super(data, CHEST_CONFIG);
	}

	/**
	 * Gets chest-specific data.
	 * @returns ChestData object
	 */
	getChestData(): ChestData {
		return this.getTypedData();
	}

	/**
	 * Updates chest-specific data.
	 * @param data - Partial ChestData to update
	 */
	updateChestData(data: Partial<ChestData>): void {
		this.updateTypedData(data);
	}
}
