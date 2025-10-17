import { Muscle, MuscleGroupData } from '@app/components/dashboard/body/Muscle';

export interface ShoulderData {
	frontLeft: number;
	frontRight: number;
	rearLeft: number;
	rearRight: number;
}

export class Shoulders extends Muscle {
	constructor(data: ShoulderData) {
		const muscleGroups: MuscleGroupData[] = [
			{
				title: 'Spalle Anteriori',
				parts: [
					{
						label: 'D',
						value: data.frontRight,
					},
					{
						label: 'S',
						value: data.frontLeft,

					}
				]
			},
			{
				title: 'Spalle Posteriori',
				parts: [
					{
						label: 'D',
						value: data.rearRight,

					},
					{
						label: 'S',
						value: data.rearLeft,

					}
				]
			}
		];
		super(muscleGroups);
	}

	getType(): string {
		return 'shoulders';
	}

	getShouldersData(): ShoulderData {
		return {
			frontRight: this.data[0].parts[0].value,
			frontLeft: this.data[0].parts[1].value,
			rearRight: this.data[1].parts[0].value,
			rearLeft: this.data[1].parts[1].value
		};
	}

	updateShoulderData(data: Partial<ShoulderData>): void {
		if (data.frontRight !== undefined) this.updateData(0, 0, data.frontRight);
		if (data.frontLeft !== undefined) this.updateData(0, 1, data.frontLeft);
		if (data.rearRight !== undefined) this.updateData(1, 0, data.rearRight);
		if (data.rearLeft !== undefined) this.updateData(1, 1, data.rearLeft);
	}
}
