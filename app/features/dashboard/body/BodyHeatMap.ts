import { type BodyData, Body, VIEW_TYPE } from '@app/features/dashboard/body';

export interface BodyHeatMapOptions {
	view: 'front' | 'back';
	showLabels: boolean;
	maxValue: number;
}

export class BodyHeatMap {
	private body: Body;
	private container: HTMLElement | null = null;

	constructor(bodyData: BodyData, options?: Partial<BodyHeatMapOptions>) {
		this.body = new Body(bodyData, {
			view: options?.view === 'back' ? VIEW_TYPE.BACK : VIEW_TYPE.FRONT,
			showLabels: options?.showLabels ?? true,
			maxValue: options?.maxValue || 1000
		});
	}

	render(container: HTMLElement): void {
		this.container = container;
		this.body.render(container);
	}

	setView(view: 'front' | 'back'): void {
		this.body.setView(view === 'back' ? VIEW_TYPE.BACK : VIEW_TYPE.FRONT);
		if (this.container) {
			this.body.render(this.container);
		}
	}

	updateData(bodyData: Partial<BodyData>): void {
		this.body.updateBodyData(bodyData);
		if (this.container) {
			this.body.render(this.container);
		}
	}

	getBodyData(): BodyData {
		return this.body.getBodyData();
	}
}

