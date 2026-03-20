import { config } from "./modules/config";
import type { JuiceDisplay } from "./modules/JuiceDisplay";
import { layout } from "./modules/mode";
import { drawPathSpline } from "./spline";

export function renderFrame(display: JuiceDisplay) {
	const { waveParticles, bubbleParticles } = display;
	const ctx = display.canvasElement.getContext("2d")!;
	const { width, height } = layout.canvas;
	const renderOffsetY = display.renderY - height / 2;
	ctx.clearRect(0, 0, width, height);

	for (const particle of waveParticles) {
		// add some random vertical velocity

		if (Math.random() < 0.01) {
			particle.velocity += (Math.random() - 0.5) * Math.random();
		}

		// the more distance the particles Y value is from center, the more velocity is applied towards the center
		const centerY = height / 2;
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

	ctx.fillStyle = display.currentColor;
	ctx.beginPath();
	ctx.moveTo(0, height);

	for (const particle of waveParticles) {
		ctx.lineTo(particle.position.x, particle.position.y + renderOffsetY);
	}

	ctx.lineTo(width, height);
	ctx.closePath();
	ctx.fill();

	ctx.save();
	ctx.beginPath();
	ctx.moveTo(0, height);

	for (const particle of waveParticles) {
		ctx.lineTo(particle.position.x, particle.position.y + renderOffsetY);
	}

	ctx.lineTo(width, height);
	ctx.closePath();
	ctx.clip();

	ctx.fillStyle = "rgba(255, 255, 255, 0.7)";

	// add new bubble particles
	if (bubbleParticles.length < 50 || Math.random() < 0.1) {
		bubbleParticles.push({
			position: {
				x: Math.random() * width,
				y:
					Math.random() < bubbleParticles.length / 200
						? height + 20 - Math.random() * 40
						: height * Math.random(),
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
			bubbleParticles[i]!.position.x + bubbleParticles[i]!.size < 0 ||
			bubbleParticles[i]!.position.x - bubbleParticles[i]!.size > width
		) {
			bubbleParticles.splice(i, 1);
			continue;
		}

		// kill bubble particle if their Y value is above every wave particle Y value
		if (
			bubbleParticles[i]!.position.y + bubbleParticles[i]!.size <
			Math.min(...waveParticles.map((p) => p.position.y + renderOffsetY))
		) {
			bubbleParticles.splice(i, 1);
			continue;
		}

		const particle = bubbleParticles[i]!;
		// add some side-to-side swaying motion to the bubbles
		particle.velocity.x +=
			Math.sin((performance.now() * 0.5) / (particle.size * 10)) * 0.01;

		// update bubble particle movement
		particle.position.x += particle.velocity.x;
		particle.position.y += particle.velocity.y;

		ctx.beginPath();

		ctx.arc(
			particle.position.x,
			particle.position.y,
			particle.size * Math.min((performance.now() - particle.birth) * 0.002, 1),
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
}
