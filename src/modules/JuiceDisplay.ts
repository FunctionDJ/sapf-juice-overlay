import { animate } from "motion";
import type p5 from "p5";
import { config } from "./config";
import { SCENE_WIDTH } from "./consts";
import { layoutMode, mode } from "./mode";

const {
	width: canvasWidth,
	height: canvasHeight,
	offsetPx: canvasOffsetX,
} = config.layouts[layoutMode].canvas;

const initialIndex = mode === "idle" ? config.juiceLevelTargets.length - 1 : 1;
const surfaceSteps = 16;

export class JuiceDisplay {
	private readonly waveSeed = Math.random() * 10_000;
	private readonly bubbleCount = Math.max(
		16,
		Math.floor(config.waveParticles * 0.7),
	);
	public currentLevelY = canvasHeight * config.juiceLevelTargets[initialIndex]!;
	public fillColor = config.colors.orange;

	constructor(
		private readonly index: 0 | 1,
		private readonly p: p5,
	) {}

	setJuiceTarget(index: number) {
		animate<JuiceDisplay>(
			this,
			{
				currentLevelY: canvasHeight * (config.juiceLevelTargets[index] ?? 0.5),
			},
			{ duration: 1, ease: "easeOut" },
		);
	}

	private getSurfaceY(x: number) {
		const t = this.p.millis() * 0.0012;

		const smoothWave =
			(this.p.noise(this.waveSeed + x * 0.008, t * 0.6) - 0.5) * 30;

		const rippleWave =
			this.p.sin(x * 0.045 + t * 3 + this.waveSeed * 0.002) * 9;

		return this.currentLevelY + smoothWave + rippleWave;
	}

	private drawSurface(closeShape: boolean) {
		const stepWidth = canvasWidth / surfaceSteps;

		if (closeShape) {
			this.p.vertex(0, canvasHeight);
		}

		const firstY = this.getSurfaceY(0);
		this.p.vertex(0, firstY);

		for (let index = 0; index <= surfaceSteps; index += 1) {
			const x = index * stepWidth;
			this.p.vertex(x, this.getSurfaceY(x));
		}

		const lastY = this.getSurfaceY(canvasWidth);
		this.p.vertex(canvasWidth, lastY);

		if (closeShape) {
			this.p.vertex(canvasWidth, canvasHeight);
			this.p.endShape(this.p.CLOSE);
			return;
		}

		this.p.endShape();
	}

	// TODO clip the bubbles so they dont render outside of the juice area
	private drawBubbles() {
		for (let index = 0; index < this.bubbleCount; index += 1) {
			const seed = this.waveSeed + index * 17.13;
			const periodMs = 5200 + (index % 6) * 320;
			const ageMs = (this.p.millis() + index * 190) % periodMs;
			const progress = ageMs / periodMs;

			const baseX = this.p.noise(seed) * canvasWidth;

			const sway =
				this.p.sin(progress * this.p.TWO_PI * 2 + seed * 0.003) *
				(14 + (index % 4) * 1.5);

			const x = this.p.constrain(baseX + sway, 6, canvasWidth - 6);
			const size = 12 + (index % 5) * 2 + this.p.noise(seed, progress * 4) * 4;
			const startY = canvasHeight + 25 + size;
			const endY = this.getSurfaceY(x) + size * 0.8; // TODO replace getSurfaceY with 0 so that particles dont shift when the juice level changes
			const y = this.p.lerp(startY, endY, progress);
			const alpha = this.p.sin(progress * Math.PI);

			this.p.fill(255, 255, 255, 150 * alpha);
			this.p.stroke(255, 255, 255, 90 * alpha);
			this.p.strokeWeight(1.5);
			this.p.circle(x, y, size);
		}
	}

	render() {
		this.p.push();

		if (layoutMode === "main-screen-center") {
			if (this.index === 0) {
				this.p.translate(canvasOffsetX, 0);
			} else {
				this.p.translate(SCENE_WIDTH - canvasWidth - canvasOffsetX, 0);
			}
		} else {
			this.p.translate(canvasOffsetX, this.index * canvasHeight);
		}

		this.p.noStroke();
		this.p.fill(this.fillColor);
		this.p.beginShape();
		this.drawSurface(true);
		this.drawBubbles();
		this.p.noFill();
		this.p.stroke(255);
		this.p.strokeWeight(20);
		this.p.strokeJoin(this.p.ROUND);
		this.p.strokeCap(this.p.ROUND);
		this.p.beginShape();
		this.drawSurface(false);
		this.p.pop();
	}
}
