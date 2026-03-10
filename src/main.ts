import { mainLoop } from "./main-loop";

export interface Config {
	apiUrl: string;
	refreshIntervalMs: number;
	writeParticleCountDebug: boolean;
	waveParticles: number;
	dt: number;
	easingFactor: number;
	colorTransitionDurationMs: number;
	colors: Record<string, { side: string }>;
}

export interface BubbleParticle {
	position: { x: number; y: number };
	velocity: { x: number; y: number };
	birth: number;
	size: number;
}

export interface WaveParticle {
	position: { x: number; y: number };
	velocity: number;
}

export interface JuiceLevelController {
	targetIndex: number;
	renderY: number;
	readonly levelTargets: number[];
	easingFactor: number;
}

export interface ColorTransitionController {
	currentColor: string;
	targetColor: string;
	startColor: string;
	startTime: number | null;
	durationMs: number;
}

function setJuiceTargetByIndex(
	controller: JuiceLevelController,
	index: number,
) {
	const levelCount = controller.levelTargets.length;
	controller.targetIndex = ((index % levelCount) + levelCount) % levelCount;
}

function setupDevControls(
	controllers: JuiceLevelController[],
	colorControllers: ColorTransitionController[],
	config: Config,
) {
	const decrementButton =
		document.querySelector<HTMLButtonElement>("#decrement");
	const incrementButton =
		document.querySelector<HTMLButtonElement>("#increment");
	const decrementRightButton =
		document.querySelector<HTMLButtonElement>("#decrement-right");
	const incrementRightButton =
		document.querySelector<HTMLButtonElement>("#increment-right");

	decrementButton?.addEventListener("click", () => {
		setJuiceTargetByIndex(controllers[0], controllers[0].targetIndex - 1);
	});

	incrementButton?.addEventListener("click", () => {
		setJuiceTargetByIndex(controllers[0], controllers[0].targetIndex + 1);
	});

	decrementRightButton?.addEventListener("click", () => {
		setJuiceTargetByIndex(controllers[1], controllers[1].targetIndex - 1);
	});

	incrementRightButton?.addEventListener("click", () => {
		setJuiceTargetByIndex(controllers[1], controllers[1].targetIndex + 1);
	});

	// Setup fruit selectors
	const fruitLeft = document.querySelector<HTMLSelectElement>("#fruit-left");
	const fruitRight = document.querySelector<HTMLSelectElement>("#fruit-right");

	const fruitNames = Object.keys(config.colors);
	const selects = [fruitLeft, fruitRight];

	selects.forEach((select, index) => {
		if (!select) {
			return;
		}

		fruitNames.forEach((fruitName) => {
			const option = document.createElement("option");
			option.value = fruitName;
			option.textContent =
				fruitName.charAt(0).toUpperCase() + fruitName.slice(1);
			select.appendChild(option);
		});

		select.addEventListener("change", (e) => {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
			const target = e.target as HTMLSelectElement;
			const fruitName = target.value;
			const fruitColor = config.colors[fruitName].side;

			const colorController = colorControllers[index];
			colorController.startColor = colorController.currentColor;
			colorController.targetColor = fruitColor;
			colorController.startTime = performance.now();
		});
	});

	// Set initial selections
	if (fruitLeft && fruitRight) {
		fruitLeft.value = fruitNames[0] ?? "orange";
		fruitRight.value = fruitNames[0] ?? "orange";
	}
}

const configResponse = await fetch("/config.json");
// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
const config = (await configResponse.json()) as Config;

const canvases = document.querySelectorAll("canvas");
const juiceLevelControllers: JuiceLevelController[] = Array.from(canvases).map(
	() => ({
		targetIndex: 1,
		renderY: 0,
		levelTargets: [0.9, 0.63, 0.36, 0.1],
		easingFactor: config.easingFactor,
	}),
);

const colorControllers: ColorTransitionController[] = Array.from(canvases).map(
	(canvas) => ({
		currentColor: canvas.dataset["fillColor"] ?? "#fecf64",
		targetColor: canvas.dataset["fillColor"] ?? "#fecf64",
		startColor: canvas.dataset["fillColor"] ?? "#fecf64",
		startTime: null,
		durationMs: config.colorTransitionDurationMs,
	}),
);

setupDevControls(juiceLevelControllers, colorControllers, config);

canvases.forEach((canvas, canvasIndex) => {
	const ctx = canvas.getContext("2d")!;
	const juiceLevelController = juiceLevelControllers[canvasIndex];
	const colorController = colorControllers[canvasIndex];
	const distanceBetweenParticles = (canvas.width + 200) / config.waveParticles;

	const waveParticles: WaveParticle[] = new Array(config.waveParticles)
		.fill(0)
		.map((_, i) => ({
			position: {
				x: distanceBetweenParticles * i - distanceBetweenParticles,
				y: canvas.height / 2 + (Math.random() - 0.5) * 20,
			},
			velocity: 1,
		}));

	const initialRenderY =
		canvas.height *
		juiceLevelController.levelTargets[juiceLevelController.targetIndex];
	juiceLevelController.renderY = initialRenderY;

	const bubbleParticles: BubbleParticle[] = [];

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
