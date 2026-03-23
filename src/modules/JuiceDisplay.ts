import { animate } from "motion";
import type p5 from "p5";
import { config } from "./config";
import { layoutMode } from "./mode";

const {
	width: canvasWidth,
	height: canvasHeight,
	offsetPx: canvasOffsetX,
} = config.layouts[layoutMode].canvas;

export class JuiceDisplay {
	public currentLevelY = canvasHeight * config.juiceLevelTargets.at(-1)!;
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

	private drawSurface() {
		this.p.beginShape();
		this.p.vertex(0, canvasHeight);

		for (let x = 0; x <= canvasWidth; x++) {
			const rippleWave = this.p.sin(x * 0.02 + this.p.millis() * 0.003) * 5;
			const surfaceY = this.currentLevelY + rippleWave;
			this.p.vertex(x, surfaceY);
		}

		this.p.vertex(canvasWidth, canvasHeight);
		this.p.endShape();
	}

	render() {
		this.p.push();

		if (layoutMode === "main-screen-center") {
			if (this.index === 0) {
				this.p.translate(canvasOffsetX, 0);
			} else {
				this.p.translate(this.p.width - canvasWidth - canvasOffsetX, 0);
			}
		} else {
			this.p.translate(canvasOffsetX, this.index * canvasHeight);
		}

		this.p.fill(this.fillColor);
		// this.p.fill("black");
		this.drawSurface();
		this.p.noFill();

		// draw bubbles
		{
			this.p.push();

			this.p.clip(() => {
				this.drawSurface();
			});

			this.p.noStroke();

			for (let i = 0; i < config.bubbles.amount; i++) {
				const paceByMode =
					layoutMode === "main-screen-center"
						? config.bubbles.pace
						: config.bubbles.pace / 2;

				const periodMs = paceByMode + (i % 6) * config.bubbles.randomExtraPace;
				const ageMs = (this.p.millis() + i * 1_234_567) % periodMs;
				const progressFrom0To1 = ageMs / periodMs;

				const sway =
					this.p.sin(progressFrom0To1 * this.p.TWO_PI * 2 + i * 0.003) *
					(14 + (i % 7) * 3);

				const alpha = this.p.sin(progressFrom0To1 * Math.PI);
				this.p.fill(255, 255, 255, 150 * alpha + this.p.noise(i) * 100);

				const noiseValue = this.p.noise(i);

				let baseBaseX = noiseValue;

				if (layoutMode === "main-screen-right" && i % 8 !== 0) {
					// move most partiles away from center
					if (noiseValue > 0.5) {
						baseBaseX = (noiseValue - 0.5) * -1 + 1;
					} else {
						baseBaseX = noiseValue * -1 + 0.5;
					}
				}

				const baseX = this.p.map(baseBaseX, 0, 1, -10, canvasWidth + 10);

				const x = baseX + sway;
				const y = this.p.lerp(canvasHeight + 25, 0, progressFrom0To1);
				const size =
					4 + (i % 5) * 6 + this.p.sin(progressFrom0To1 * Math.PI) * 10;

				this.p.circle(x, y, size);
			}

			this.p.noFill();

			this.p.pop();
		}

		this.p.stroke(255);
		this.p.strokeWeight(20);
		this.drawSurface();

		this.p.pop();
	}
}
