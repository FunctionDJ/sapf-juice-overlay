import p5 from "p5";
import { fetchApi } from "./modules/api";
import { config } from "./modules/config";
import { getFruitByTag } from "./modules/juice";
import { JuiceDisplay } from "./modules/JuiceDisplay";
import { layout, mode } from "./modules/mode";
import "./modules/reload-on-config-change";
import { SCENE_HEIGHT, SCENE_WIDTH } from "./modules/consts";

const host = document.querySelector("#app")!;

document.body.style.background = import.meta.env.DEV
	? "grey"
	: layout.backgroundFill;

const juiceDisplay1 = new JuiceDisplay(0);
const juiceDisplay2 = new JuiceDisplay(1);

async function pollApi() {
	if (mode === "doubles") {
		const { team1, team2 } = await fetchApi("/doubles");

		juiceDisplay1.setJuiceTarget(team1.score);
		juiceDisplay2.setJuiceTarget(team2.score);
		juiceDisplay1.setJuiceColor("orange");
		juiceDisplay2.setJuiceColor("orange");
		return;
	}

	const { player1, player2 } = await fetchApi("/singles");

	juiceDisplay1.setJuiceTarget(player1.score);
	juiceDisplay2.setJuiceTarget(player2.score);
	juiceDisplay1.setJuiceColor(getFruitByTag(player1.tag));
	juiceDisplay2.setJuiceColor(getFruitByTag(player2.tag));
}

new p5((p) => {
	const overlayImage = new Image();
	overlayImage.src = mode === "doubles" ? "/doubles.png" : "/normal.png";

	p.setup = () => {
		const canvas = p.createCanvas(SCENE_WIDTH, SCENE_HEIGHT);
		canvas.parent(host);
		canvas.style("display", "block");
		canvas.style("width", "100%");
		canvas.style("height", "100%");
		p.pixelDensity(1);

		if (mode !== "idle") {
			void pollApi();
			window.setInterval(() => void pollApi(), config.refreshIntervalMs);
		}
	};

	p.draw = () => {
		p.clear();

		const ctx = p.drawingContext;

		if (!(ctx instanceof CanvasRenderingContext2D)) {
			return;
		}

		juiceDisplay1.update();
		juiceDisplay2.update();
		juiceDisplay1.render(ctx);
		juiceDisplay2.render(ctx);

		if (import.meta.env.DEV) {
			ctx.drawImage(overlayImage, 0, 0, SCENE_WIDTH, SCENE_HEIGHT);
		}
	};
});
