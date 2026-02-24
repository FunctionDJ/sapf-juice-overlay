interface XY {
	x: number;
	y: number;
}

export const drawPathSpline = function (
	ctx: CanvasRenderingContext2D,
	nodes: XY[],
) {
	const splinePts: XY[] = [];

	for (let i = 1; i < nodes.length - 2; ++i) {
		calcPathSpline(nodes, i, splinePts);
	}

	splinePts.push(nodes.at(-2)!, nodes.at(-1)!);
	ctx.beginPath();
	ctx.moveTo(splinePts[0].x, splinePts[0].y);

	for (const pt of splinePts) {
		ctx.lineTo(pt.x, pt.y);
	}

	ctx.stroke();
};

const len = 8;

const calcPathSpline = function (
	nodes: XY[],
	nodeIndex: number,
	splinePts: XY[],
) {
	for (let n = 0; n < len; ++n) {
		const p = n / (len - 1);

		const subNodes = nodes.slice(nodeIndex - 1, nodeIndex + 3);

		splinePts.push({
			x: nspline(p, ...subNodes.map((node) => node.x)),
			y: nspline(p, ...subNodes.map((node) => node.y)),
		});
	}
};

const nspline = function (x: number, ...f: number[]) {
	const [f0, f1, f2, f3] = f;
	const c3 = -0.5 * f0 + 1.5 * f1 - 1.5 * f2 + 0.5 * f3;
	const c2 = 1.0 * f0 - 2.5 * f1 + 2.0 * f2 - 0.5 * f3;
	const c1 = -0.5 * f0 + 0.5 * f2;
	return ((c3 * x + c2) * x + c1) * x + f1;
};
