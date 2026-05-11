import { WPLACE_PALLETE } from "../const/index.js";
import type { RGBArray } from "../types/color.js";

export function arrayEquals(a: RGBArray, b: RGBArray): boolean {
	return a.length === b.length && a.every((value, index) => value === b[index]);
}

export function matchingPallete(rgb: RGBArray) {
	const result = Object.keys(WPLACE_PALLETE).find((key) => {
		const keyNumber = Number(key);

		const current = WPLACE_PALLETE[keyNumber];

		return arrayEquals(rgb, current.rgb);
	});

	return result ? Number(result) : null;
}