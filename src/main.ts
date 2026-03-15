import { mainLoop } from "./main-loop";

export interface Config {
	apiUrl: string;
	refreshIntervalMs: number;
	writeParticleCountDebug: boolean;
	waveParticles: number;
	dt: number;
	easingFactor: number;
	colorTransitionDurationMs: number;
	canvases: {
		left: {
			width: number;
			height: number;
			offsetPx: number;
		};
		right: {
			width: number;
			height: number;
			offsetPx: number;
		};
	};
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

type OverlayMode = "singles" | "doubles" | "idle";

function resolveModeFromUrl(): OverlayMode {
	const modeParam = new URLSearchParams(window.location.search).get("mode");

	if (modeParam === "doubles") {
		return "doubles";
	}

	if (modeParam === "idle") {
		return "idle";
	}

	return "singles";
}

function setJuiceTargetByIndex(
	controller: JuiceLevelController,
	index: number,
) {
	const levelCount = controller.levelTargets.length;
	controller.targetIndex = Math.max(0, Math.min(index, levelCount - 1));
}

function setJuiceColorByFruit(
	colorController: ColorTransitionController,
	fruitName: string,
	config: Config,
) {
	const fruitColor = config.colors[fruitName]?.side;

	if (fruitColor === undefined || fruitColor === colorController.targetColor) {
		return;
	}

	colorController.startColor = colorController.currentColor;
	colorController.targetColor = fruitColor;
	colorController.startTime = performance.now();
}

interface ApiSinglesResponse {
	setNumber: number;
	player1: { score: number };
	player2: { score: number };
	winner: string | null;
}

interface ApiDoublesResponse {
	setNumber: number;
	team1: { score: number };
	team2: { score: number };
	winner: string | null;
}

interface ApiJuiceResponse {
	singles: Record<string, string>;
	doubles: Record<string, string>;
}

interface ApiSnapshot {
	setNumber: number;
	winner: string | null;
	leftScore: number;
	rightScore: number;
	leftFruit: string;
	rightFruit: string;
}

let previousSnapshot: ApiSnapshot | null = null;

function logApiChanges(previous: ApiSnapshot, current: ApiSnapshot) {
	const changed: Record<
		string,
		{ from: string | number | null; to: string | number | null }
	> = {};

	if (previous.setNumber !== current.setNumber) {
		changed["setNumber"] = { from: previous.setNumber, to: current.setNumber };
	}

	if (previous.winner !== current.winner) {
		changed["winner"] = { from: previous.winner, to: current.winner };
	}

	if (previous.leftScore !== current.leftScore) {
		changed["leftScore"] = {
			from: previous.leftScore,
			to: current.leftScore,
		};
	}

	if (previous.rightScore !== current.rightScore) {
		changed["rightScore"] = {
			from: previous.rightScore,
			to: current.rightScore,
		};
	}

	if (previous.leftFruit !== current.leftFruit) {
		changed["leftFruit"] = {
			from: previous.leftFruit,
			to: current.leftFruit,
		};
	}

	if (previous.rightFruit !== current.rightFruit) {
		changed["rightFruit"] = {
			from: previous.rightFruit,
			to: current.rightFruit,
		};
	}

	if (Object.keys(changed).length > 0) {
		console.log("[juice-api] change", changed);
	}
}

async function pollApi(
	config: Config,
	mode: Exclude<OverlayMode, "idle">,
	levelControllers: JuiceLevelController[],
	colorControllers: ColorTransitionController[],
) {
	try {
		const scoresEndpoint = mode === "doubles" ? "/doubles" : "/singles";
		const scoresResponse = await fetch(`${config.apiUrl}${scoresEndpoint}`);
		const juiceResponse = await fetch(`${config.apiUrl}/juice`);

		if (!scoresResponse.ok || !juiceResponse.ok) {
			return;
		}

		let leftScore = 0;
		let rightScore = 0;
		let winner: string | null = null;
		let setNumber = 1;
		let leftFruit = "";
		let rightFruit = "";

		if (mode === "doubles") {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
			const scores = (await scoresResponse.json()) as ApiDoublesResponse;
			const {
				setNumber: nextSetNumber,
				winner: nextWinner,
				team1,
				team2,
			} = scores;
			setNumber = nextSetNumber;
			winner = nextWinner;
			leftScore = team1.score;
			rightScore = team2.score;
		} else {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
			const scores = (await scoresResponse.json()) as ApiSinglesResponse;
			const {
				setNumber: nextSetNumber,
				winner: nextWinner,
				player1,
				player2,
			} = scores;
			setNumber = nextSetNumber;
			winner = nextWinner;
			leftScore = player1.score;
			rightScore = player2.score;
		}

		// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
		const juices = (await juiceResponse.json()) as ApiJuiceResponse;

		if (mode === "doubles") {
			leftFruit = juices.doubles["team1"] ?? "";
			rightFruit = juices.doubles["team2"] ?? "";
		} else {
			leftFruit = juices.singles["player1"] ?? "";
			rightFruit = juices.singles["player2"] ?? "";
		}

		const currentSnapshot: ApiSnapshot = {
			setNumber,
			winner,
			leftScore,
			rightScore,
			leftFruit,
			rightFruit,
		};

		if (previousSnapshot !== null) {
			logApiChanges(previousSnapshot, currentSnapshot);
		}

		previousSnapshot = currentSnapshot;

		setJuiceTargetByIndex(levelControllers[0]!, leftScore);
		if (leftFruit) {
			setJuiceColorByFruit(colorControllers[0]!, leftFruit, config);
		}

		setJuiceTargetByIndex(levelControllers[1]!, rightScore);
		if (rightFruit) {
			setJuiceColorByFruit(colorControllers[1]!, rightFruit, config);
		}
	} catch (error) {
		console.error("Failed to poll API:", error);
	}
}

const configResponse = await fetch("/config.json");
// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
const config = (await configResponse.json()) as Config;

const overlayMode = resolveModeFromUrl();

const availableFruitNames = Object.keys(config.colors);
const idleFruit = "orange";

const leftDefaultFruit =
	overlayMode === "idle"
		? idleFruit
		: overlayMode === "doubles"
			? "apple"
			: "orange";
const rightDefaultFruit =
	overlayMode === "idle"
		? idleFruit
		: overlayMode === "doubles"
			? "apple"
			: "apple";

const resolvedLeftFruit = config.colors[leftDefaultFruit]
	? leftDefaultFruit
	: (availableFruitNames[0] ?? "orange");
const resolvedRightFruit = config.colors[rightDefaultFruit]
	? rightDefaultFruit
	: (availableFruitNames[1] ?? resolvedLeftFruit);

const leftDefaultColor = config.colors[resolvedLeftFruit]?.side ?? "#fecf64";
const rightDefaultColor =
	config.colors[resolvedRightFruit]?.side ?? leftDefaultColor;

const overlayRoot = document.querySelector<HTMLElement>(
	"#overlay-canvases-root",
)!;

const canvases = (["left", "right"] as const).map((side) => {
	const canvas = document.createElement("canvas");
	canvas.id = `canvas-${side}`;
	canvas.width = config.canvases[side].width;
	canvas.height = config.canvases[side].height;
	canvas.style.display = "block";
	canvas.style.height = "100%";
	canvas.style.width = "auto";
	canvas.style.position = "absolute";
	canvas.style[side] = `${String(config.canvases[side].offsetPx)}px`;
	overlayRoot.append(canvas);
	return canvas;
});

const juiceLevelControllers: JuiceLevelController[] = canvases.map(() => ({
	targetIndex: 1,
	renderY: 0,
	levelTargets: [0.9, 0.63, 0.36, 0.1],
	easingFactor: config.easingFactor,
}));

const colorControllers: ColorTransitionController[] = canvases.map(
	(_, canvasIndex) => ({
		currentColor: canvasIndex === 0 ? leftDefaultColor : rightDefaultColor,
		targetColor: canvasIndex === 0 ? leftDefaultColor : rightDefaultColor,
		startColor: canvasIndex === 0 ? leftDefaultColor : rightDefaultColor,
		startTime: null,
		durationMs: config.colorTransitionDurationMs,
	}),
);

if (overlayMode === "idle") {
	juiceLevelControllers.forEach((controller) => {
		setJuiceTargetByIndex(controller, controller.levelTargets.length - 1);
	});

	colorControllers.forEach((controller) => {
		const idleColor = config.colors[idleFruit]?.side ?? leftDefaultColor;
		controller.currentColor = idleColor;
		controller.targetColor = idleColor;
		controller.startColor = idleColor;
		controller.startTime = null;
	});
} else {
	void pollApi(config, overlayMode, juiceLevelControllers, colorControllers);
	setInterval(
		() =>
			void pollApi(
				config,
				overlayMode,
				juiceLevelControllers,
				colorControllers,
			),
		config.refreshIntervalMs,
	);
}

canvases.forEach((canvas, canvasIndex) => {
	const ctx = canvas.getContext("2d")!;
	const juiceLevelController = juiceLevelControllers[canvasIndex]!;
	const colorController = colorControllers[canvasIndex]!;
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
		juiceLevelController.levelTargets[juiceLevelController.targetIndex]!;
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
