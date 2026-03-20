import { fetchApi } from "./modules/api";
import { config } from "./modules/config";
import { getFruitByTag } from "./modules/juice";
import { JuiceDisplay } from "./modules/JuiceDisplay";
import { layout, layoutMode, mode } from "./modules/mode";
import "./modules/reload-on-config-change";

const juiceDisplays = [
	new JuiceDisplay("left"),
	new JuiceDisplay("right"),
] as const;

async function pollApi() {
	const scoresEndpoint = mode === "doubles" ? "/doubles" : "/singles";
	const scoresResponse = await fetch(`${config.apiUrl}${scoresEndpoint}`);

	if (!scoresResponse.ok) {
		return;
	}

	let leftScore: number;
	let rightScore: number;
	let leftTags: (string | undefined)[];
	let rightTags: (string | undefined)[];

	if (mode === "doubles") {
		const { team1, team2 } = await fetchApi("/doubles");
		leftScore = team1.score;
		rightScore = team2.score;
		leftTags = [team1.player1?.tag, team1.player2?.tag];
		rightTags = [team2.player1?.tag, team2.player2?.tag];
	} else {
		const { player1, player2 } = await fetchApi("/singles");
		leftScore = player1.score;
		rightScore = player2.score;
		leftTags = [player1.tag];
		rightTags = [player2.tag];
	}

	const scores = [leftScore, rightScore] as const;
	const tags = [leftTags, rightTags] as const;

	for (const i of [0, 1] as const) {
		juiceDisplays[i].levelController.setJuiceTargetByIndex(scores[i]);

		const fruit = getFruitByTag(tags[i]);

		if (fruit !== null) {
			juiceDisplays[i].colorController.setJuiceColorByFruit(fruit);
		}
	}
}

document.documentElement.style.background = layout.backgroundFill;
document.body.style.background = layout.backgroundFill;

const overlayRoot = document.querySelector("#overlay-canvases-root")!;

if (layoutMode === "main-screen-center") {
	overlayRoot.append(...juiceDisplays.map((display) => display.canvasElement));
} else {
	const leftStack = document.createElement("div");
	leftStack.style.position = "absolute";
	leftStack.style.top = "0";
	leftStack.style.left = "0";
	leftStack.style.display = "flex";
	leftStack.style.flexDirection = "column";
	leftStack.append(...juiceDisplays.map((display) => display.canvasElement));
	overlayRoot.append(leftStack);
}

if (mode !== "idle") {
	void pollApi();
	setInterval(() => void pollApi(), config.refreshIntervalMs);
}
