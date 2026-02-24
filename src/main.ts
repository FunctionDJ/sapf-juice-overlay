import { drawPathSpline } from "./spline";

const canvases = document.querySelectorAll("canvas");
const dt = 0.25;
const initialParticleCount = 10;

canvases.forEach((canvas) => {
	const ctx = canvas.getContext("2d")!;
	const distanceBetweenParticles = (canvas.width + 200) / initialParticleCount;

	const waveParticles = new Array(initialParticleCount).fill(0).map((_, i) => ({
		position: {
			x: distanceBetweenParticles * i - distanceBetweenParticles,
			y: canvas.height / 2 + (Math.random() - 0.5) * 20,
		},
		velocity: 1,
	}));

	const bubbleParticles: {
		position: { x: number; y: number };
		velocity: { x: number; y: number };
		birth: number;
		size: number;
	}[] = [];

	mainLoop();

	function mainLoop() {
		window.requestAnimationFrame(mainLoop);

		ctx.fillStyle = "#242321";
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		for (const particle of waveParticles) {
			// add some random vertical velocity

			if (Math.random() < 0.01) {
				particle.velocity += (Math.random() - 0.5) * Math.random();
			}

			// the more distance the particles Y value is from center, the more velocity is applied towards the center
			const centerY = canvas.height / 2;
			const distanceFromCenter = particle.position.y - centerY;
			const currentVelocity = Math.abs(particle.velocity);
			const centeringForce =
				-distanceFromCenter *
				0.003 *
				Math.random() *
				(0.8 + currentVelocity * 0.8);

			particle.velocity += centeringForce;

			// predict position
			particle.position.y += particle.velocity * dt;
		}

		ctx.lineWidth = 20;
		ctx.strokeStyle = "white";

		// fill the space below the wave particles

		ctx.fillStyle = canvas.dataset["fillColor"]!;
		ctx.beginPath();
		ctx.moveTo(0, canvas.height);

		for (const particle of waveParticles) {
			ctx.lineTo(particle.position.x, particle.position.y);
		}

		ctx.lineTo(canvas.width, canvas.height);
		ctx.closePath();
		ctx.fill();

		ctx.save();
		ctx.beginPath();
		ctx.moveTo(0, canvas.height);

		for (const particle of waveParticles) {
			ctx.lineTo(particle.position.x, particle.position.y);
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
						bubbleParticles.length < 200
							? canvas.height * Math.random()
							: canvas.height + 20,
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
				Math.min(...waveParticles.map((p) => p.position.y))
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
			waveParticles.map((p) => p.position),
		);

		// bubble particle failsafe: delete particles over 500 instances (should never happen, but just in case)
		if (bubbleParticles.length > 500) {
			bubbleParticles.splice(0, bubbleParticles.length - 500);
		}

		// write bubble particle count for debugging
		ctx.fillStyle = "black";
		ctx.font = "36px sans-serif";
		ctx.fillText(`Bubbles: ${String(bubbleParticles.length)}`, 10, 1900);
	}
});
