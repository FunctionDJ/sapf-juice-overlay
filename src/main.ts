import { mainLoop } from "./main-loop";

export interface Config {
	apiUrl: string;
	refreshIntervalMs: number;
	writeParticleCountDebug: boolean;
	waveParticles: number;
	dt: number;
}

export interface BubbleParticle {
	position: { x: number; y: number };
	velocity: { x: number; y: number };
	birth: number;
	size: number;
}

export interface WaveParticle {
	position: { x: number; y: number };
	velocity: number;
}

const configResponse = await fetch("/config.json");
// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
const config = (await configResponse.json()) as Config;

const canvases = document.querySelectorAll("canvas");

canvases.forEach((canvas) => {
	const ctx = canvas.getContext("2d")!;
	const distanceBetweenParticles = (canvas.width + 200) / config.waveParticles;

	const waveParticles: WaveParticle[] = new Array(config.waveParticles)
		.fill(0)
		.map((_, i) => ({
			position: {
				x: distanceBetweenParticles * i - distanceBetweenParticles,
				y: canvas.height / 2 + (Math.random() - 0.5) * 20,
			},
			velocity: 1,
		}));

	const bubbleParticles: BubbleParticle[] = [];

	mainLoop(ctx, canvas, config, waveParticles, bubbleParticles);
});
