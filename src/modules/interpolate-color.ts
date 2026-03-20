const parseColorToRgb = (color: string) => {
	const hexMatch = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color);

	if (hexMatch) {
		return {
			r: Number.parseInt(hexMatch[1]!, 16),
			g: Number.parseInt(hexMatch[2]!, 16),
			b: Number.parseInt(hexMatch[3]!, 16),
		};
	}

	const rgbMatch =
		/^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/i.exec(color);

	if (rgbMatch) {
		return {
			r: Number.parseInt(rgbMatch[1]!, 10),
			g: Number.parseInt(rgbMatch[2]!, 10),
			b: Number.parseInt(rgbMatch[3]!, 10),
		};
	}

	return null;
};

export const interpolateColor = (
	startColor: string,
	endColor: string,
	progress: number,
) => {
	const startRGB = parseColorToRgb(startColor);
	const endRGB = parseColorToRgb(endColor);

	if (!startRGB || !endRGB) {
		return startColor;
	}

	const r = Math.round(startRGB.r + (endRGB.r - startRGB.r) * progress);
	const g = Math.round(startRGB.g + (endRGB.g - startRGB.g) * progress);
	const b = Math.round(startRGB.b + (endRGB.b - startRGB.b) * progress);

	return `rgb(${String(r)}, ${String(g)}, ${String(b)})`;
};
