interface CanvasPlacement {
	width: number;
	height: number;
	offsetPx: number;
}

interface OverlayLayout {
	backgroundFill: string;
	canvas: CanvasPlacement;
}

export interface Config {
	apiUrl: string;
	refreshIntervalMs: number;
	waveParticles: number;
	dt: number;
	juiceLevelTargets: number[];
	layouts: {
		"main-screen-center": OverlayLayout;
		"main-screen-right": OverlayLayout;
	};
	colors: {
		orange: string;
		apple: string;
		grape: string;
		cherry: string;
	};
}

export type Fruit = keyof Config["colors"];

const configResponse = await fetch("/config.json", { cache: "no-store" });
const configText = await configResponse.text();
// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
export const config = JSON.parse(configText) as Config;
