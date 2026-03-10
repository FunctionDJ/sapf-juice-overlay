import type {
	BubbleParticle,
	ColorTransitionController,
	Config,
	JuiceLevelController,
	WaveParticle,
} from "./main";
import { drawPathSpline } from "./spline";

function interpolateColor(
	startHex: string,
	endHex: string,
	progress: number,
): string {
	const startRGB = hexToRgb(startHex);
	const endRGB = hexToRgb(endHex);

	if (!startRGB || !endRGB) {
		return startHex;
	}

	const r = Math.round(startRGB.r + (endRGB.r - startRGB.r) * progress);
	const g = Math.round(startRGB.g + (endRGB.g - startRGB.g) * progress);
	const b = Math.round(startRGB.b + (endRGB.b - startRGB.b) * progress);

	return `rgb(${String(r)}, ${String(g)}, ${String(b)})`;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	return result
		? {
				r: Number.parseInt(result[1], 16),
				g: Number.parseInt(result[2], 16),
				b: Number.parseInt(result[3], 16),
			}
		: null;
}

export function mainLoop(
	ctx: CanvasRenderingContext2D,
	canvas: HTMLCanvasElement,
	config: Config,
	waveParticles: WaveParticle[],
	bubbleParticles: BubbleParticle[],
	juiceLevelController: JuiceLevelController,
	colorController: ColorTransitionController,
) {
	window.requestAnimationFrame(() => {
		mainLoop(
			ctx,
			canvas,
			config,
			waveParticles,
			bubbleParticles,
			juiceLevelController,
			colorController,
		);
	});

	const baseWaveCenterY = canvas.height / 2;
	const targetWaveCenterY =
		canvas.height *
		juiceLevelController.levelTargets[juiceLevelController.targetIndex];
	const currentWaveCenterY = juiceLevelController.renderY;
	const easedWaveCenterY =
		currentWaveCenterY +
		(targetWaveCenterY - currentWaveCenterY) *
			juiceLevelController.easingFactor;

	juiceLevelController.renderY = easedWaveCenterY;
	const renderOffsetY = easedWaveCenterY - baseWaveCenterY;

	// Ease color transitions
	let fillColor = colorController.currentColor;

	if (colorController.startTime !== null) {
		const elapsed = performance.now() - colorController.startTime;
		const progress = Math.min(elapsed / colorController.durationMs, 1);

		if (progress < 1) {
			fillColor = interpolateColor(
				colorController.startColor,
				colorController.targetColor,
				progress,
			);
		} else {
			fillColor = colorController.targetColor;
			colorController.currentColor = colorController.targetColor;
			colorController.startTime = null;
		}
	}

	ctx.fillStyle = "#242321";
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	for (const particle of waveParticles) {
		// add some random vertical velocity

		if (Math.random() < 0.01) {
			particle.velocity += (Math.random() - 0.5) * Math.random();
		}

		// the more distance the particles Y value is from center, the more velocity is applied towards the center
		const centerY = baseWaveCenterY;
		const distanceFromCenter = particle.position.y - centerY;
		const currentVelocity = Math.abs(particle.velocity);

		const centeringForce =
			-distanceFromCenter *
			0.003 *
			Math.random() *
			(0.8 + currentVelocity * 0.8);

		particle.velocity += centeringForce;

		// predict position
		particle.position.y += particle.velocity * config.dt;
	}

	ctx.lineWidth = 20;
	ctx.strokeStyle = "white";

	// fill the space below the wave particles

	ctx.fillStyle = fillColor;
	ctx.beginPath();
	ctx.moveTo(0, canvas.height);

	for (const particle of waveParticles) {
		ctx.lineTo(particle.position.x, particle.position.y + renderOffsetY);
	}

	ctx.lineTo(canvas.width, canvas.height);
	ctx.closePath();
	ctx.fill();

	ctx.save();
	ctx.beginPath();
	ctx.moveTo(0, canvas.height);

	for (const particle of waveParticles) {
		ctx.lineTo(particle.position.x, particle.position.y + renderOffsetY);
	}

	ctx.lineTo(canvas.width, canvas.height);
	ctx.closePath();
	ctx.clip();

	ctx.fillStyle = "rgba(255, 255, 255, 0.7)";

	// add new bubble particles
	if (bubbleParticles.length < 50 || Math.random() < 0.1) {
		bubbleParticles.push({
			position: {
				x: Math.random() * canvas.width,
				y:
					Math.random() < bubbleParticles.length / 200
						? canvas.height + 20 - Math.random() * 40
						: canvas.height * Math.random(),
			},
			velocity: {
				x: (Math.random() - 0.5) * 0.3,
				// x: 0,
				y: (-1 - Math.random()) * 0.5,
			},
			birth: performance.now(),
			size: 3 + Math.random() * 18,
		});
	}

	for (let i = bubbleParticles.length - 1; i >= 0; --i) {
		// kill bubble particles if their X value is more than their radius/size out of canvas bounds
		if (
			bubbleParticles[i].position.x + bubbleParticles[i].size < 0 ||
			bubbleParticles[i].position.x - bubbleParticles[i].size > canvas.width
		) {
			bubbleParticles.splice(i, 1);
			continue;
		}

		// kill bubble particle if their Y value is above every wave particle Y value
		if (
			bubbleParticles[i].position.y + bubbleParticles[i].size <
			Math.min(...waveParticles.map((p) => p.position.y + renderOffsetY))
		) {
			bubbleParticles.splice(i, 1);
			continue;
		}

		const bubble = bubbleParticles[i];
		// add some side-to-side swaying motion to the bubbles
		bubble.velocity.x +=
			Math.sin((performance.now() * 0.5) / (bubble.size * 10)) * 0.01;

		// update bubble particle movement
		bubble.position.x += bubble.velocity.x;
		bubble.position.y += bubble.velocity.y;

		ctx.beginPath();
		ctx.arc(
			bubble.position.x,
			bubble.position.y,
			bubble.size * Math.min((performance.now() - bubble.birth) * 0.002, 1),
			0,
			Math.PI * 2,
		);
		ctx.fill();
		ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
		ctx.lineWidth = 2;
		ctx.stroke();
	}

	ctx.restore();

	drawPathSpline(
		ctx,
		waveParticles.map((p) => ({
			x: p.position.x,
			y: p.position.y + renderOffsetY,
		})),
	);

	// bubble particle failsafe: delete particles over 500 instances (should never happen, but just in case)
	if (bubbleParticles.length > 500) {
		bubbleParticles.splice(0, bubbleParticles.length - 500);
	}

	if (config.writeParticleCountDebug) {
		// write bubble particle count for debugging
		ctx.fillStyle = "black";
		ctx.font = "36px sans-serif";
		ctx.fillText(`Bubbles: ${String(bubbleParticles.length)}`, 10, 1000);
	}
}
