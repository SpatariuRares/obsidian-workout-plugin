import { Muscle, MuscleGroupData } from './Muscle';

export interface LegsData {
	quadsLeft: number;
	quadsRight: number;
	hamstringsLeft: number;
	hamstringsRight: number;
	glutesLeft: number;
	glutesRight: number;
	calvesLeft: number;
	calvesRight: number;
}

export class Legs extends Muscle {
	constructor(data: LegsData) {
		const muscleGroups: MuscleGroupData[] = [
			{
				title: 'Glutei',
				parts: [
					{
						label: 'R',
						value: data.glutesRight,

					},
					{
						label: 'L',
						value: data.glutesLeft,

					}
				]
			},
			{
				title: 'Quadricipiti',
				parts: [
					{
						label: 'R',
						value: data.quadsRight,

					},
					{
						label: 'L',
						value: data.quadsLeft,
					}
				]
			},
			{
				title: 'Femorali',
				parts: [
					{
						label: 'R',
						value: data.hamstringsRight,
					},
					{
						label: 'L',
						value: data.hamstringsLeft,
					}
				]
			},
			{
				title: 'Polpacci',
				parts: [
					{
						label: 'R',
						value: data.calvesRight,
					},
					{
						label: 'L',
						value: data.calvesLeft,
					}
				]
			}
		];
		super(muscleGroups);
	}

	getType(): string {
		return 'legs';
	}

	getLegsData(): LegsData {
		return {
			glutesRight: this.data[0].parts[0].value,
			glutesLeft: this.data[0].parts[1].value,
			quadsRight: this.data[1].parts[0].value,
			quadsLeft: this.data[1].parts[1].value,
			hamstringsRight: this.data[2].parts[0].value,
			hamstringsLeft: this.data[2].parts[1].value,
			calvesRight: this.data[3].parts[0].value,
			calvesLeft: this.data[3].parts[1].value
		};
	}

	updateLegsData(data: Partial<LegsData>): void {
		if (data.glutesRight !== undefined) this.updateData(0, 0, data.glutesRight);
		if (data.glutesLeft !== undefined) this.updateData(0, 1, data.glutesLeft);
		if (data.quadsRight !== undefined) this.updateData(1, 0, data.quadsRight);
		if (data.quadsLeft !== undefined) this.updateData(1, 1, data.quadsLeft);
		if (data.hamstringsRight !== undefined) this.updateData(2, 0, data.hamstringsRight);
		if (data.hamstringsLeft !== undefined) this.updateData(2, 1, data.hamstringsLeft);
		if (data.calvesRight !== undefined) this.updateData(3, 0, data.calvesRight);
		if (data.calvesLeft !== undefined) this.updateData(3, 1, data.calvesLeft);
	}
}
