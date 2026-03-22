import gsap from "gsap";
import p5 from "p5";
import { fetchApi } from "./modules/api";
import { config } from "./modules/config";
import { SCENE_HEIGHT, SCENE_WIDTH } from "./modules/consts";
import { juiceLookup } from "./modules/juice";
import { JuiceDisplay } from "./modules/JuiceDisplay";
import { layoutMode, mode } from "./modules/mode";
import "./modules/reload-on-config-change";

const host = document.querySelector("#app")!;

document.body.style.background = import.meta.env.DEV
	? "grey"
	: config.layouts[layoutMode].backgroundFill;

new p5((p) => {
	const juiceDisplay1 = new JuiceDisplay(0, p);
	const juiceDisplay2 = new JuiceDisplay(1, p);

	async function pollApi() {
		if (mode === "doubles") {
			const { team1, team2 } = await fetchApi("/doubles");

			juiceDisplay1.setJuiceTarget(team1.score);
			juiceDisplay2.setJuiceTarget(team2.score);
		} else {
			const { player1, player2 } = await fetchApi("/singles");

			juiceDisplay1.setJuiceTarget(player1.score);
			juiceDisplay2.setJuiceTarget(player2.score);

			gsap.to(juiceDisplay1, {
				juiceColor: config.colors[juiceLookup.get(player1.tag) ?? "orange"],
				duration: 1,
			});

			gsap.to(juiceDisplay2, {
				juiceColor: config.colors[juiceLookup.get(player2.tag) ?? "orange"],
				duration: 1,
			});
		}
	}

	const overlayImage = new Image();
	overlayImage.src = mode === "doubles" ? "/doubles.png" : "/normal.png";
	let overlay: p5.Image | null = null;

// https://github.com/processing/p5.js/issues/8662
	// eslint-disable-next-line @typescript-eslint/no-misused-promises, @typescript-eslint/strict-void-return
	p.setup = async () => {
		const canvas = p.createCanvas(SCENE_WIDTH, SCENE_HEIGHT);
		canvas.parent(host);
		canvas.style("display", "block");
		canvas.style("width", "100%");
		canvas.style("height", "100%");
		p.pixelDensity(1);

		if (mode !== "idle") {
			void pollApi();
			window.setInterval(() => void pollApi(), config.apiRefreshIntervalMs);
		}

		if (import.meta.env.DEV) {
			overlay = await p.loadImage(
				mode === "doubles" ? "/doubles.png" : "/normal.png",
			);
		}
	};

	p.draw = () => {
		p.clear();
		juiceDisplay1.render();
		juiceDisplay2.render();

		if (overlay !== null) {
			p.image(overlay, 0, 0, SCENE_WIDTH, SCENE_HEIGHT);
		}
	};
});
