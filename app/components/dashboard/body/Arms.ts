import { Muscle, MuscleGroupData } from '@app/components/dashboard/body/Muscle';

export interface ArmsData {
	bicepsLeft: number;
	bicepsRight: number;
	tricepsLeft: number;
	tricepsRight: number;
	forearmsLeft: number;
	forearmsRight: number;
}

export class Arms extends Muscle {
	constructor(data: ArmsData) {
		const muscleGroups: MuscleGroupData[] = [
			{
				title: 'Bicipiti',
				parts: [
					{
						label: 'R',
						value: data.bicepsRight,

					},
					{
						label: 'L',
						value: data.bicepsLeft,
					}
				]
			},
			{
				title: 'Tricipiti',
				parts: [
					{
						label: 'R',
						value: data.tricepsRight,
					},
					{
						label: 'L',
						value: data.tricepsLeft,
					}
				]
			},
			{
				title: 'Avambracci',
				parts: [
					{
						label: 'R',
						value: data.forearmsRight,
					},
					{
						label: 'L',
						value: data.forearmsLeft,
					}
				]
			}
		];
		super(muscleGroups);
	}

	getType(): string {
		return 'arms';
	}

	getArmsData(): ArmsData {
		return {
			bicepsRight: this.data[0].parts[0].value,
			bicepsLeft: this.data[0].parts[1].value,
			tricepsRight: this.data[1].parts[0].value,
			tricepsLeft: this.data[1].parts[1].value,
			forearmsRight: this.data[2].parts[0].value,
			forearmsLeft: this.data[2].parts[1].value
		};
	}

	updateArmsData(data: Partial<ArmsData>): void {
		if (data.bicepsRight !== undefined) this.updateData(0, 0, data.bicepsRight);
		if (data.bicepsLeft !== undefined) this.updateData(0, 1, data.bicepsLeft);
		if (data.tricepsRight !== undefined) this.updateData(1, 0, data.tricepsRight);
		if (data.tricepsLeft !== undefined) this.updateData(1, 1, data.tricepsLeft);
		if (data.forearmsRight !== undefined) this.updateData(2, 0, data.forearmsRight);
		if (data.forearmsLeft !== undefined) this.updateData(2, 1, data.forearmsLeft);
	}
}
