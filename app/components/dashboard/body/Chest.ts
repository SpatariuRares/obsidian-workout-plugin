import { Muscle, MuscleGroupData } from '@app/components/dashboard/body/Muscle';

export interface ChestData {
	upper: number;
	middle: number;
	lower: number;
}

export class Chest extends Muscle {
	constructor(data: ChestData) {
		const muscleGroups: MuscleGroupData[] = [
			{
				title: 'Petto',
				parts: [
					{
						label: 'Sup',
						value: data.upper,
					},
					{
						label: 'Mid',
						value: data.middle,
					},
					{
						label: 'Inf',
						value: data.lower,
					}
				]
			}
		];
		super(muscleGroups);
	}

	getType(): string {
		return 'chest';
	}

	getChestData(): ChestData {
		return {
			upper: this.data[0].parts[0].value,
			middle: this.data[0].parts[1].value,
			lower: this.data[0].parts[2].value
		};
	}

	updateChestData(data: Partial<ChestData>): void {
		if (data.upper !== undefined) this.updateData(0, 0, data.upper);
		if (data.middle !== undefined) this.updateData(0, 1, data.middle);
		if (data.lower !== undefined) this.updateData(0, 2, data.lower);
	}
}
