import { config } from "./config";
import { interpolateColor } from "./interpolate-color";

export class JuiceColorController {
	public currentColor: string = config.colors["orange"]!;
	private targetColor = this.currentColor;
	private startColor = this.currentColor;
	private startTime: number | null = null;

	setJuiceColorByFruit(fruitName: string) {
		const fruitColor = config.colors[fruitName]!;

		if (fruitColor === this.targetColor) {
			return;
		}

		this.startColor = this.currentColor;
		this.targetColor = fruitColor;
		this.startTime = performance.now();
	}

	update() {
		if (this.startTime === null) {
			return;
		}

		const elapsed = performance.now() - this.startTime;
		const progress = Math.min(elapsed / config.colorTransitionDurationMs, 1);

		if (progress < 1) {
			this.currentColor = interpolateColor(
				this.startColor,
				this.targetColor,
				progress,
			);
		} else {
			this.currentColor = this.targetColor;
			this.startColor = this.targetColor;
			this.startTime = null;
		}
	}
}
