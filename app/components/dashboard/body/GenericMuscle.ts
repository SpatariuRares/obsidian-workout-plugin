/**
 * Generic muscle implementation using configuration-driven approach.
 * Eliminates code duplication across muscle classes.
 */

import { Muscle, type MuscleGroupData } from "@app/components/dashboard/body/Muscle";
import type { MuscleConfig } from "@app/components/dashboard/body/config/MuscleConfigurations";

/**
 * Generic muscle class that uses configuration to handle any muscle type
 * @template TData - The specific data type for this muscle (e.g., ArmsData, LegsData)
 */
export class GenericMuscle<TData> extends Muscle {
	private config: MuscleConfig<TData>;
	private typedData: TData;

	/**
	 * Creates a generic muscle instance
	 * @param data - Typed muscle data (e.g., ArmsData)
	 * @param config - Configuration defining structure and conversions
	 */
	constructor(data: TData, config: MuscleConfig<TData>) {
		super(config.toMuscleGroups(data));
		this.config = config;
		this.typedData = { ...data };
	}

	/**
	 * Returns the muscle type identifier
	 * @returns Type string (e.g., "arms", "legs")
	 */
	getType(): string {
		return this.config.type;
	}

	/**
	 * Gets the typed muscle data
	 * @returns Typed data object
	 */
	getTypedData(): TData {
		return this.config.fromMuscleGroups(this.data);
	}

	/**
	 * Updates typed muscle data
	 * @param partialData - Partial data to update
	 */
	updateTypedData(partialData: Partial<TData>): void {
		// Update each provided property using the index map
		for (const [key, value] of Object.entries(partialData)) {
			if (value !== undefined) {
				const indices = this.config.indexMap[key as keyof TData];
				if (indices) {
					const [groupIndex, partIndex] = indices;
					this.updateData(groupIndex, partIndex, value as number);
				}
			}
		}

		// Update internal typed data cache
		this.typedData = this.getTypedData();
	}

	/**
	 * Overrides base getData to ensure consistency
	 * @returns Copy of muscle group data
	 */
	override getData(): MuscleGroupData[] {
		return super.getData();
	}
}
