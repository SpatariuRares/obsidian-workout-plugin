/**
 * Prepares muscle data for rendering by calculating intensities and colors.
 * Separates data preparation logic from SVG rendering.
 */

import type { BodyData } from "@app/features/dashboard/widgets/muscle-heat-map/body/index";
import { IntensityCalculator } from "@app/features/dashboard/widgets/muscle-heat-map/body/IntensityCalculator";
import { HeatMapColors } from "@app/features/dashboard/widgets/muscle-heat-map/body/HeatMapColors";

/**
 * Muscle colors for visualization
 */
export interface MuscleColors {
	[key: string]: string;
}

/**
 * Prepares visualization data for body views
 */
export class ViewDataPreparer {
	private intensityCalc: IntensityCalculator;

	constructor(maxValue: number) {
		this.intensityCalc = new IntensityCalculator(maxValue);
	}

	/**
	 * Prepares data for back view rendering
	 * @param bodyData - Complete body data
	 * @returns Object with muscle colors
	 */
	prepareBackViewData(bodyData: BodyData): MuscleColors {
		const backData = bodyData.back;
		const armsData = bodyData.arms;
		const legsData = bodyData.legs;
		const shouldersData = bodyData.shoulders;

		// Calculate intensities
		const intensities = {
			lowerBack: this.intensityCalc.normalize(backData.lowerBack),
			traps: this.intensityCalc.normalize(backData.traps),
			trapsMiddle: this.intensityCalc.normalize(backData.trapsMiddle),
			lats: this.intensityCalc.normalize(backData.lats),
			triceps: this.intensityCalc.normalizeBilateral(
				armsData.tricepsLeft,
				armsData.tricepsRight
			),
			forearms: this.intensityCalc.normalizeBilateral(
				armsData.forearmsLeft,
				armsData.forearmsRight
			),
			glutes: this.intensityCalc.normalizeBilateral(
				legsData.glutesLeft,
				legsData.glutesRight
			),
			quads: this.intensityCalc.normalizeBilateral(
				legsData.quadsLeft,
				legsData.quadsRight
			),
			hamstrings: this.intensityCalc.normalizeBilateral(
				legsData.hamstringsLeft,
				legsData.hamstringsRight
			),
			calves: this.intensityCalc.normalizeBilateral(
				legsData.calvesLeft,
				legsData.calvesRight
			),
			rearShoulders: this.intensityCalc.normalizeBilateral(
				shouldersData.rearLeft,
				shouldersData.rearRight
			),
		};

		// Convert intensities to colors
		return HeatMapColors.getColors(intensities);
	}

	/**
	 * Prepares data for front view rendering
	 * @param bodyData - Complete body data
	 * @returns Object with muscle colors
	 */
	prepareFrontViewData(bodyData: BodyData): MuscleColors {
		const backData = bodyData.back;
		const armsData = bodyData.arms;
		const legsData = bodyData.legs;
		const coreData = bodyData.core;
		const shouldersData = bodyData.shoulders;
		const chestData = bodyData.chest;

		// Calculate intensities
		const intensities = {
			traps: this.intensityCalc.normalize(backData.traps),
			biceps: this.intensityCalc.normalizeBilateral(
				armsData.bicepsLeft,
				armsData.bicepsRight
			),
			forearms: this.intensityCalc.normalizeBilateral(
				armsData.forearmsLeft,
				armsData.forearmsRight
			),
			quads: this.intensityCalc.normalizeBilateral(
				legsData.quadsLeft,
				legsData.quadsRight
			),
			calves: this.intensityCalc.normalizeBilateral(
				legsData.calvesLeft,
				legsData.calvesRight
			),
			abs: this.intensityCalc.normalize(coreData.abs),
			obliques: this.intensityCalc.normalize(coreData.obliques),
			frontShoulders: this.intensityCalc.normalizeBilateral(
				shouldersData.frontLeft,
				shouldersData.frontRight
			),
			upperChest: this.intensityCalc.normalize(chestData.upper),
			middleChest: this.intensityCalc.normalizeAverage([chestData.middle, chestData.lower]),
		};

		// Convert intensities to colors
		return HeatMapColors.getColors(intensities);
	}

	/**
	 * Updates the maximum value for intensity normalization
	 * @param maxValue - New maximum value
	 */
	setMaxValue(maxValue: number): void {
		this.intensityCalc.setMaxValue(maxValue);
	}
}

