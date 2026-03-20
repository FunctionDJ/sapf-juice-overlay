import { config } from "./config";
import { mode } from "./mode";

export class JuiceLevelController {
	private targetIndex = 1;
	private renderY = 0;

	constructor(canvasHeight: number) {
		// TODO "if" might be unnecessary
		if (mode === "idle") {
			this.setJuiceTargetByIndex(config.juiceLevelTargets.length - 1);
		}

		this.renderY = canvasHeight * config.juiceLevelTargets[this.targetIndex]!;
	}

	public setJuiceTargetByIndex(index: number) {
		const levelCount = config.juiceLevelTargets.length;
		this.targetIndex = Math.max(0, Math.min(index, levelCount - 1));
	}

	public getRenderOffsetY(canvasHeight: number) {
		const targetWaveCenterY =
			canvasHeight * config.juiceLevelTargets[this.targetIndex]!;

		const currentWaveCenterY = this.renderY;

		const easedWaveCenterY =
			currentWaveCenterY +
			(targetWaveCenterY - currentWaveCenterY) * config.easingFactor;

		this.renderY = easedWaveCenterY;
		return easedWaveCenterY - canvasHeight / 2;
	}
}
