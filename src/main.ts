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
	if (mode === "doubles") {
		const { team1, team2 } = await fetchApi("/doubles");

		juiceDisplays[0].setJuiceTargetByIndex(team1.score);
		juiceDisplays[1].setJuiceTargetByIndex(team2.score);

		juiceDisplays[0].setJuiceColorByFruit("orange");
		juiceDisplays[1].setJuiceColorByFruit("orange");
	} else {
		const { player1, player2 } = await fetchApi("/singles");

		juiceDisplays[0].setJuiceTargetByIndex(player1.score);
		juiceDisplays[1].setJuiceTargetByIndex(player2.score);

		juiceDisplays[0].setJuiceColorByFruit(getFruitByTag(player1.tag));
		juiceDisplays[1].setJuiceColorByFruit(getFruitByTag(player2.tag));
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
