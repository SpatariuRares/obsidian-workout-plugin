/**
 * Centralized muscle group configurations.
 * Single source of truth for all muscle structures, preventing index misalignment bugs.
 */

import type { MuscleGroupData } from "@app/features/dashboard/body/Muscle";
import type { ArmsData } from "@app/features/dashboard/body/Arms";
import type { BackData } from "@app/features/dashboard/body/Back";
import type { ChestData } from "@app/features/dashboard/body/Chest";
import type { CoreData } from "@app/features/dashboard/body/Core";
import type { LegsData } from "@app/features/dashboard/body/Legs";
import type { ShoulderData } from "@app/features/dashboard/body/Shoulders";

/**
 * Configuration for a muscle type
 */
export interface MuscleConfig<TData> {
	/** Human-readable type identifier */
	type: string;
	/** Function to convert from typed data to MuscleGroupData array */
	toMuscleGroups: (data: TData) => MuscleGroupData[];
	/** Function to convert from MuscleGroupData array back to typed data */
	fromMuscleGroups: (groups: MuscleGroupData[]) => TData;
	/** Mapping of data property names to their [groupIndex, partIndex] locations */
	indexMap: Record<keyof TData, [number, number]>;
}

/**
 * Arms muscle configuration
 */
export const ARMS_CONFIG: MuscleConfig<ArmsData> = {
	type: "arms",
	toMuscleGroups: (data: ArmsData) => [
		{
			title: "Bicipiti",
			parts: [
				{ label: "R", value: data.bicepsRight },
				{ label: "L", value: data.bicepsLeft },
			],
		},
		{
			title: "Tricipiti",
			parts: [
				{ label: "R", value: data.tricepsRight },
				{ label: "L", value: data.tricepsLeft },
			],
		},
		{
			title: "Avambracci",
			parts: [
				{ label: "R", value: data.forearmsRight },
				{ label: "L", value: data.forearmsLeft },
			],
		},
	],
	fromMuscleGroups: (groups: MuscleGroupData[]) => ({
		bicepsRight: groups[0].parts[0].value,
		bicepsLeft: groups[0].parts[1].value,
		tricepsRight: groups[1].parts[0].value,
		tricepsLeft: groups[1].parts[1].value,
		forearmsRight: groups[2].parts[0].value,
		forearmsLeft: groups[2].parts[1].value,
	}),
	indexMap: {
		bicepsRight: [0, 0],
		bicepsLeft: [0, 1],
		tricepsRight: [1, 0],
		tricepsLeft: [1, 1],
		forearmsRight: [2, 0],
		forearmsLeft: [2, 1],
	},
};

/**
 * Back muscle configuration
 */
export const BACK_CONFIG: MuscleConfig<BackData> = {
	type: "back",
	toMuscleGroups: (data: BackData) => [
		{
			title: "Schiena",
			parts: [
				{ label: "Trap", value: data.traps },
				{ label: "TrapMid", value: data.trapsMiddle },
				{ label: "Lats", value: data.lats },
				{ label: "Lower", value: data.lowerBack },
			],
		},
	],
	fromMuscleGroups: (groups: MuscleGroupData[]) => ({
		traps: groups[0].parts[0].value,
		trapsMiddle: groups[0].parts[1].value,
		lats: groups[0].parts[2].value,
		lowerBack: groups[0].parts[3].value,
	}),
	indexMap: {
		traps: [0, 0],
		trapsMiddle: [0, 1],
		lats: [0, 2],
		lowerBack: [0, 3],
	},
};

/**
 * Chest muscle configuration
 */
export const CHEST_CONFIG: MuscleConfig<ChestData> = {
	type: "chest",
	toMuscleGroups: (data: ChestData) => [
		{
			title: "Petto",
			parts: [
				{ label: "Alto", value: data.upper },
				{ label: "Medio", value: data.middle },
				{ label: "Basso", value: data.lower },
			],
		},
	],
	fromMuscleGroups: (groups: MuscleGroupData[]) => ({
		upper: groups[0].parts[0].value,
		middle: groups[0].parts[1].value,
		lower: groups[0].parts[2].value,
	}),
	indexMap: {
		upper: [0, 0],
		middle: [0, 1],
		lower: [0, 2],
	},
};

/**
 * Core muscle configuration
 */
export const CORE_CONFIG: MuscleConfig<CoreData> = {
	type: "core",
	toMuscleGroups: (data: CoreData) => [
		{
			title: "Core",
			parts: [
				{ label: "Addominali", value: data.abs },
				{ label: "Obliqui", value: data.obliques },
			],
		},
	],
	fromMuscleGroups: (groups: MuscleGroupData[]) => ({
		abs: groups[0].parts[0].value,
		obliques: groups[0].parts[1].value,
	}),
	indexMap: {
		abs: [0, 0],
		obliques: [0, 1],
	},
};

/**
 * Legs muscle configuration
 */
export const LEGS_CONFIG: MuscleConfig<LegsData> = {
	type: "legs",
	toMuscleGroups: (data: LegsData) => [
		{
			title: "Quadricipiti",
			parts: [
				{ label: "R", value: data.quadsRight },
				{ label: "L", value: data.quadsLeft },
			],
		},
		{
			title: "Femorali",
			parts: [
				{ label: "R", value: data.hamstringsRight },
				{ label: "L", value: data.hamstringsLeft },
			],
		},
		{
			title: "Glutei",
			parts: [
				{ label: "R", value: data.glutesRight },
				{ label: "L", value: data.glutesLeft },
			],
		},
		{
			title: "Polpacci",
			parts: [
				{ label: "R", value: data.calvesRight },
				{ label: "L", value: data.calvesLeft },
			],
		},
	],
	fromMuscleGroups: (groups: MuscleGroupData[]) => ({
		quadsRight: groups[0].parts[0].value,
		quadsLeft: groups[0].parts[1].value,
		hamstringsRight: groups[1].parts[0].value,
		hamstringsLeft: groups[1].parts[1].value,
		glutesRight: groups[2].parts[0].value,
		glutesLeft: groups[2].parts[1].value,
		calvesRight: groups[3].parts[0].value,
		calvesLeft: groups[3].parts[1].value,
	}),
	indexMap: {
		quadsRight: [0, 0],
		quadsLeft: [0, 1],
		hamstringsRight: [1, 0],
		hamstringsLeft: [1, 1],
		glutesRight: [2, 0],
		glutesLeft: [2, 1],
		calvesRight: [3, 0],
		calvesLeft: [3, 1],
	},
};

/**
 * Shoulders muscle configuration
 */
export const SHOULDERS_CONFIG: MuscleConfig<ShoulderData> = {
	type: "shoulders",
	toMuscleGroups: (data: ShoulderData) => {
		const groups: MuscleGroupData[] = [
			{
				title: "Spalle Anteriori",
				parts: [
					{ label: "R", value: data.frontRight },
					{ label: "L", value: data.frontLeft },
				],
			},
		];

		// Add lateral shoulders if provided
		if (data.lateralRight !== undefined || data.lateralLeft !== undefined) {
			groups.push({
				title: "Spalle Laterali",
				parts: [
					{ label: "R", value: data.lateralRight || 0 },
					{ label: "L", value: data.lateralLeft || 0 },
				],
			});
		}

		groups.push({
			title: "Spalle Posteriori",
			parts: [
				{ label: "R", value: data.rearRight },
				{ label: "L", value: data.rearLeft },
			],
		});

		return groups;
	},
	fromMuscleGroups: (groups: MuscleGroupData[]) => {
		const result: ShoulderData = {
			frontRight: groups[0].parts[0].value,
			frontLeft: groups[0].parts[1].value,
			rearRight: 0,
			rearLeft: 0,
		};

		// Handle both 2-group and 3-group configurations
		if (groups.length === 3) {
			result.lateralRight = groups[1].parts[0].value;
			result.lateralLeft = groups[1].parts[1].value;
			result.rearRight = groups[2].parts[0].value;
			result.rearLeft = groups[2].parts[1].value;
		} else {
			result.rearRight = groups[1].parts[0].value;
			result.rearLeft = groups[1].parts[1].value;
		}

		return result;
	},
	indexMap: {
		frontRight: [0, 0],
		frontLeft: [0, 1],
		lateralRight: [1, 0],
		lateralLeft: [1, 1],
		rearRight: [2, 0],
		rearLeft: [2, 1],
	},
};

