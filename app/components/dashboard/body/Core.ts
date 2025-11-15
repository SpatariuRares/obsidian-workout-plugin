import { GenericMuscle } from "@app/components/dashboard/body/GenericMuscle";
import { CORE_CONFIG } from "@app/components/dashboard/body/config/MuscleConfigurations";

export interface CoreData {
	abs: number;
	obliques: number;
}

/**
 * Core muscle class using GenericMuscle implementation.
 * Maintains backward compatibility while using the new configuration system.
 */
export class Core extends GenericMuscle<CoreData> {
	constructor(data: CoreData) {
		super(data, CORE_CONFIG);
	}

	/**
	 * Gets core-specific data.
	 * @returns CoreData object
	 */
	getCoreData(): CoreData {
		return this.getTypedData();
	}

	/**
	 * Updates core-specific data.
	 * @param data - Partial CoreData to update
	 */
	updateCoreData(data: Partial<CoreData>): void {
		this.updateTypedData(data);
	}
}
