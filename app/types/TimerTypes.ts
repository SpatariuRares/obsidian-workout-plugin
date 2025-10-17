export interface EmbeddedTimerParams {
	duration?: number; // Duration in seconds
	type?: "countdown";
	autoStart?: boolean;
	showControls?: boolean;
	title?: string;
	intervalTime?: number; // For interval timer
	rounds?: number; // For interval timer
	sound?: boolean;
	debug?: boolean;
}
