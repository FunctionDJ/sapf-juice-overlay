import gsap from "gsap";
import { renderFrame } from "../main-loop";
import { config, type Fruit } from "./config";
import { layout, layoutMode, mode } from "./mode";

interface BubbleParticle {
	position: { x: number; y: number };
	velocity: { x: number; y: number };
	birth: number;
	size: number;
}

// TODO idle conditional might be unnecessary
const initialIndex = mode === "idle" ? config.juiceLevelTargets.length - 1 : 1;

const distanceBetweenParticles =
	(layout.canvas.width + 200) / config.waveParticles;

export class JuiceDisplay {
	readonly canvasElement = document.createElement("canvas");
	readonly bubbleParticles: BubbleParticle[] = [];
	readonly waveParticles = new Array(config.waveParticles)
		.fill(0)
		.map((_, i) => ({
			position: {
				x: distanceBetweenParticles * i - distanceBetweenParticles,
				y: layout.canvas.height / 2 + (Math.random() - 0.5) * 20,
			},
			velocity: 1,
		}));

	public currentColor: string = config.colors.orange;
	public renderY =
		layout.canvas.height * config.juiceLevelTargets[initialIndex]!;

	constructor(slot: "left" | "right") {
		this.canvasElement.width = layout.canvas.width;
		this.canvasElement.height = layout.canvas.height;
		this.canvasElement.style.display = "block";

		if (layoutMode === "main-screen-center") {
			this.canvasElement.style.position = "absolute";
			this.canvasElement.style.top = "0";
			this.canvasElement.style[slot] = `${String(layout.canvas.offsetPx)}px`;
		} else {
			this.canvasElement.style.position = "relative";
			this.canvasElement.style.left = `${String(layout.canvas.offsetPx)}px`;
		}

		gsap.ticker.add(() => {
			renderFrame(this);
		});
	}

	public setJuiceColorByFruit(fruitName: Fruit) {
		gsap.to(this, {
			currentColor: config.colors[fruitName],
			duration: 1,
		});
	}

	public setJuiceTargetByIndex(index: number) {
		const clampedIndex = Math.max(
			0,
			Math.min(index, config.juiceLevelTargets.length - 1),
		);

		gsap.to(this, {
			renderY: layout.canvas.height * config.juiceLevelTargets[clampedIndex]!,
			ease: "power3.out",
			duration: 1,
		});
	}
}
