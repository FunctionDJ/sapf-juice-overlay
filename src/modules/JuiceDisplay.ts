import { mainLoop } from "../main-loop";
import { config } from "./config";
import { JuiceColorController } from "./JuiceColorController";
import { JuiceLevelController } from "./JuiceLevelController";
import { layout, layoutMode } from "./mode";

interface BubbleParticle {
	position: { x: number; y: number };
	velocity: { x: number; y: number };
	birth: number;
	size: number;
}

interface WaveParticle {
	position: { x: number; y: number };
	velocity: number;
}

export class JuiceDisplay {
	readonly canvasElement = document.createElement("canvas");
	readonly levelController;
	readonly colorController = new JuiceColorController();
	readonly bubbleParticles: BubbleParticle[] = [];
	readonly waveParticles: WaveParticle[];

	constructor(slot: "left" | "right") {
		this.canvasElement.width = layout.canvas.width;
		this.canvasElement.height = layout.canvas.height;
		this.levelController = new JuiceLevelController(this.canvasElement.height);
		this.canvasElement.style.display = "block";
		const canvasConfig = layout.canvas;

		if (layoutMode === "main-screen-center") {
			this.canvasElement.style.position = "absolute";
			this.canvasElement.style.top = "0";
			this.canvasElement.style[slot] = `${String(canvasConfig.offsetPx)}px`;
		} else {
			this.canvasElement.style.position = "relative";
			this.canvasElement.style.left = `${String(canvasConfig.offsetPx)}px`;
		}

		const distanceBetweenParticles =
			(this.canvasElement.width + 200) / config.waveParticles;

		this.waveParticles = new Array(config.waveParticles)
			.fill(0)
			.map((_, i) => ({
				position: {
					x: distanceBetweenParticles * i - distanceBetweenParticles,
					y: this.canvasElement.height / 2 + (Math.random() - 0.5) * 20,
				},
				velocity: 1,
			}));

		mainLoop(this);
	}
}
