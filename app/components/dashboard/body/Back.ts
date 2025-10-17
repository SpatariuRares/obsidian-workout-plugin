import { Muscle, MuscleGroupData } from '@app/components/dashboard/body/Muscle';

export interface BackData {
	traps: number;
	trapsMiddle: number;
	lats: number;
	lowerBack: number;
}

export class Back extends Muscle {
	constructor(data: BackData) {
		const muscleGroups: MuscleGroupData[] = [
			{
				title: 'Schiena',
				parts: [
					{
						label: 'Trap',
						value: data.traps,
					},
					{
						label: 'TrapMid',
						value: data.trapsMiddle,
					},
					{
						label: 'Lats',
						value: data.lats,
					},
					{
						label: 'Lower',
						value: data.lowerBack,
					}
				]
			}
		];
		super(muscleGroups);
	}

	getType(): string {
		return 'back';
	}

	getBackData(): BackData {
		return {
			traps: this.data[0].parts[0].value,
			trapsMiddle: this.data[0].parts[0].value,
			lats: this.data[0].parts[1].value,
			lowerBack: this.data[0].parts[2].value
		};
	}

	updateBackData(data: Partial<BackData>): void {
		if (data.traps !== undefined) this.updateData(0, 0, data.traps);
		if (data.trapsMiddle !== undefined) this.updateData(0, 0, data.trapsMiddle);
		if (data.lats !== undefined) this.updateData(0, 1, data.lats);
		if (data.lowerBack !== undefined) this.updateData(0, 2, data.lowerBack);
	}
}
