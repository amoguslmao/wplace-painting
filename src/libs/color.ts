import { WPLACE_PALLETE } from "../const/index.js";
import type { RGBA } from "../types/color.js";

export function arrayEquals(a: RGBA, b: RGBA): boolean {
	return a.length === b.length && a.every((value, index) => value === b[index]);
}

export function matchingPallete(rgba: RGBA) {
	const result = Object.keys(WPLACE_PALLETE).find((key) => {
		const keyNumber = Number(key);

		const current = WPLACE_PALLETE[keyNumber];

		return arrayEquals(rgba, current.rgba);
	});

	return result ? Number(result) : null;
}