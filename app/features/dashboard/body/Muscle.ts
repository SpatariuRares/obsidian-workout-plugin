export interface MusclePartData {
	label: string;
	value: number;
	id?: string;

}

export interface MuscleGroupData {
	title: string;
	parts: MusclePartData[];
}

export abstract class Muscle {
	protected data: MuscleGroupData[];

	constructor(data: MuscleGroupData[]) {
		this.data = data;
	}

	getData(): MuscleGroupData[] {
		return this.data.map(group => ({
			title: group.title,
			parts: group.parts.map(part => ({ ...part }))
		}));
	}

	updateData(groupIndex: number, partIndex: number, value: number): void {
		if (this.data[groupIndex]?.parts[partIndex]) {
			this.data[groupIndex].parts[partIndex].value = value;
		}
	}

	updateGroup(groupIndex: number, parts: MusclePartData[]): void {
		if (this.data[groupIndex]) {
			this.data[groupIndex].parts = parts.map(part => ({ ...part }));
		}
	}

	abstract getType(): string;
}

