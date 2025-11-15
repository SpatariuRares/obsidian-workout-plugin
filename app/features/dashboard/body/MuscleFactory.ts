/**
 * Factory for creating muscle instances with type safety.
 * Provides a consistent API for all muscle types.
 */

import { GenericMuscle } from "@app/features/dashboard/body/GenericMuscle";
import {
	ARMS_CONFIG,
	BACK_CONFIG,
	CHEST_CONFIG,
	CORE_CONFIG,
	LEGS_CONFIG,
	SHOULDERS_CONFIG,
} from "@app/features/dashboard/body/config/MuscleConfigurations";
import type { ArmsData } from "@app/features/dashboard/body/Arms";
import type { BackData } from "@app/features/dashboard/body/Back";
import type { ChestData } from "@app/features/dashboard/body/Chest";
import type { CoreData } from "@app/features/dashboard/body/Core";
import type { LegsData } from "@app/features/dashboard/body/Legs";
import type { ShoulderData } from "@app/features/dashboard/body/Shoulders";

/**
 * Factory class for creating muscle instances
 */
export class MuscleFactory {
	/**
	 * Creates an Arms muscle instance
	 * @param data - Arms muscle data
	 * @returns GenericMuscle instance for arms
	 */
	static createArms(data: ArmsData): GenericMuscle<ArmsData> {
		return new GenericMuscle(data, ARMS_CONFIG);
	}

	/**
	 * Creates a Back muscle instance
	 * @param data - Back muscle data
	 * @returns GenericMuscle instance for back
	 */
	static createBack(data: BackData): GenericMuscle<BackData> {
		return new GenericMuscle(data, BACK_CONFIG);
	}

	/**
	 * Creates a Chest muscle instance
	 * @param data - Chest muscle data
	 * @returns GenericMuscle instance for chest
	 */
	static createChest(data: ChestData): GenericMuscle<ChestData> {
		return new GenericMuscle(data, CHEST_CONFIG);
	}

	/**
	 * Creates a Core muscle instance
	 * @param data - Core muscle data
	 * @returns GenericMuscle instance for core
	 */
	static createCore(data: CoreData): GenericMuscle<CoreData> {
		return new GenericMuscle(data, CORE_CONFIG);
	}

	/**
	 * Creates a Legs muscle instance
	 * @param data - Legs muscle data
	 * @returns GenericMuscle instance for legs
	 */
	static createLegs(data: LegsData): GenericMuscle<LegsData> {
		return new GenericMuscle(data, LEGS_CONFIG);
	}

	/**
	 * Creates a Shoulders muscle instance
	 * @param data - Shoulders muscle data
	 * @returns GenericMuscle instance for shoulders
	 */
	static createShoulders(data: ShoulderData): GenericMuscle<ShoulderData> {
		return new GenericMuscle(data, SHOULDERS_CONFIG);
	}
}

