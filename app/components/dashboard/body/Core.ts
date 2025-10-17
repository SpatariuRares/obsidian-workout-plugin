import { Muscle, MuscleGroupData } from '@app/components/dashboard/body/Muscle';

export interface CoreData {
	abs: number;
	obliques: number;
}

export class Core extends Muscle {
	constructor(data: CoreData) {
		const muscleGroups: MuscleGroupData[] = [
			{
				title: 'Core',
				parts: [
					{
						label: 'Abs',
						value: data.abs,
					},
					{
						label: 'Obl',
						value: data.obliques,
 					}
				]
			}
		];
		super(muscleGroups);
	}

	getType(): string {
		return 'core';
	}

	getCoreData(): CoreData {
		return {
			abs: this.data[0].parts[0].value,
			obliques: this.data[0].parts[1].value
		};
	}

	updateCoreData(data: Partial<CoreData>): void {
		if (data.abs !== undefined) this.updateData(0, 0, data.abs);
		if (data.obliques !== undefined) this.updateData(0, 1, data.obliques);
	}
}
