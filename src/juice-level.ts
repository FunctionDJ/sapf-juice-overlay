const canvases = document.querySelectorAll("canvas");
const topValues = ["90%", "63%", "36%", "10%"];

let leftCanvasState = 1;

document.querySelector("#decrement")!.addEventListener("click", () => {
	leftCanvasState--;

	if (leftCanvasState === -1) {
		leftCanvasState = 3;
	}

	canvases[0].parentElement!.style.top = topValues[leftCanvasState];
});

document.querySelector("#increment")!.addEventListener("click", () => {
	leftCanvasState++;

	if (leftCanvasState === 4) {
		leftCanvasState = 0;
	}

	canvases[0].parentElement!.style.top = topValues[leftCanvasState];
});
