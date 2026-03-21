import gsap from "gsap";
import { config, type Fruit } from "./config";
import { layout, layoutMode, mode } from "./mode";
import { SCENE_WIDTH } from "./consts";

function drawSurfacePath(
	ctx: CanvasRenderingContext2D,
	points: { x: number; y: number }[],
	baseY: number,
	renderWidth: number,
) {
	ctx.beginPath();
	ctx.moveTo(0, baseY);
	ctx.lineTo(points[0]!.x, points[0]!.y);

	for (let index = 1; index < points.length - 1; index += 1) {
		const current = points[index]!;
		const next = points[index + 1]!;
		ctx.quadraticCurveTo(
			current.x,
			current.y,
			(current.x + next.x) / 2,
			(current.y + next.y) / 2,
		);
	}

	const last = points.at(-1)!;
	ctx.lineTo(last.x, last.y);
	ctx.lineTo(renderWidth, baseY);
	ctx.closePath();
}

interface BubbleParticle {
	position: { x: number; y: number };
	velocity: { x: number; y: number };
	birth: number;
	size: number;
}

const {
	width: canvasWidth,
	height: canvasHeight,
	offsetPx: canvasOffsetX,
} = layout.canvas;

const distanceBetweenParticles = (canvasWidth + 200) / config.waveParticles;
const initialIndex = mode === "idle" ? config.juiceLevelTargets.length - 1 : 1;

export class JuiceDisplay {
	private readonly x: number;
	private readonly y: number;
	private currentLevelY =
		canvasHeight * config.juiceLevelTargets[initialIndex]!;
	private currentColor = config.colors.orange;
	private readonly waveParticles = Array.from(
		{ length: config.waveParticles },
		(_, particleIndex) => ({
			position: {
				x: distanceBetweenParticles * particleIndex - distanceBetweenParticles,
				y: canvasHeight / 2 + (Math.random() - 0.5) * 20,
			},
			velocity: 1,
		}),
	);
	private readonly bubbleParticles: BubbleParticle[] = [];

	constructor(index: 0 | 1) {
		this.x =
			layoutMode === "main-screen-center"
				? index === 0
					? canvasOffsetX
					: SCENE_WIDTH - canvasWidth - canvasOffsetX
				: canvasOffsetX;

		this.y = layoutMode === "main-screen-center" ? 0 : index * canvasHeight;
	}

	setJuiceColor(fruitName: Fruit) {
		gsap.to(this, { currentColor: config.colors[fruitName], duration: 1 });
	}

	setJuiceTarget(index: number) {
		const clampedIndex = Math.max(
			0,
			Math.min(index, config.juiceLevelTargets.length - 1),
		);

		gsap.to(this, {
			currentLevelY: canvasHeight * config.juiceLevelTargets[clampedIndex]!,
			ease: "power3.out",
			duration: 1,
		});
	}

	update() {
		for (const particle of this.waveParticles) {
			if (Math.random() < 0.01) {
				particle.velocity += (Math.random() - 0.5) * Math.random();
			}

			const centerY = canvasHeight / 2;
			const distanceFromCenter = particle.position.y - centerY;
			const currentVelocity = Math.abs(particle.velocity);
			const centeringForce =
				-distanceFromCenter *
				0.003 *
				Math.random() *
				(0.8 + currentVelocity * 0.8);

			particle.velocity += centeringForce;
			particle.position.y += particle.velocity * config.dt;
		}

		if (this.bubbleParticles.length < 50 || Math.random() < 0.1) {
			this.bubbleParticles.push({
				position: {
					x: Math.random() * canvasWidth,
					y:
						Math.random() < this.bubbleParticles.length / 200
							? canvasHeight + 20 - Math.random() * 40
							: canvasHeight * Math.random(),
				},
				velocity: {
					x: (Math.random() - 0.5) * 0.3,
					y: (-1 - Math.random()) * 0.5,
				},
				birth: performance.now(),
				size: 3 + Math.random() * 18,
			});
		}
	}

	render(ctx: CanvasRenderingContext2D) {
		const renderOffsetY = this.currentLevelY - canvasHeight / 2;

		const surfacePoints = this.waveParticles.map((particle) => ({
			x: particle.position.x,
			y: particle.position.y + renderOffsetY,
		}));

		const surfaceMinY = Math.min(...surfacePoints.map((point) => point.y));
		const now = performance.now();

		ctx.save();
		ctx.translate(this.x, this.y);

		drawSurfacePath(ctx, surfacePoints, canvasHeight, canvasWidth);
		ctx.fillStyle = this.currentColor;
		ctx.fill();

		ctx.save();
		drawSurfacePath(ctx, surfacePoints, canvasHeight, canvasWidth);
		ctx.clip();
		ctx.fillStyle = "rgba(255, 255, 255, 0.7)";

		for (let index = this.bubbleParticles.length - 1; index >= 0; index -= 1) {
			const particle = this.bubbleParticles[index]!;

			if (
				particle.position.x + particle.size < 0 ||
				particle.position.x - particle.size > canvasWidth ||
				particle.position.y + particle.size < surfaceMinY
			) {
				this.bubbleParticles.splice(index, 1);
				continue;
			}

			particle.velocity.x +=
				Math.sin((now * 0.5) / (particle.size * 10)) * 0.01;

			particle.position.x += particle.velocity.x;
			particle.position.y += particle.velocity.y;

			ctx.beginPath();

			ctx.arc(
				particle.position.x,
				particle.position.y,
				particle.size * Math.min((now - particle.birth) * 0.002, 1),
				0,
				Math.PI * 2,
			);

			ctx.fill();
			ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
			ctx.lineWidth = 2;
			ctx.stroke();
		}

		ctx.restore();
		ctx.strokeStyle = "white";
		ctx.lineWidth = 20;
		ctx.lineJoin = "round";
		ctx.lineCap = "round";
		ctx.beginPath();
		ctx.moveTo(surfacePoints[0]!.x, surfacePoints[0]!.y);

		for (let index = 1; index < surfacePoints.length - 1; index += 1) {
			const current = surfacePoints[index]!;
			const next = surfacePoints[index + 1]!;

			ctx.quadraticCurveTo(
				current.x,
				current.y,
				(current.x + next.x) / 2,
				(current.y + next.y) / 2,
			);
		}

		const last = surfacePoints.at(-1)!;
		ctx.lineTo(last.x, last.y);
		ctx.stroke();
		ctx.restore();

		if (this.bubbleParticles.length > 500) {
			this.bubbleParticles.splice(0, this.bubbleParticles.length - 500);
		}
	}
}
