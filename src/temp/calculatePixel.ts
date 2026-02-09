import type { Pixel } from "../types/pixel.js";

const TILE_SIZE = 1_000;

function toGlobalPixel(pixel: Pixel): Omit<Pixel, "tile"> {
	return {
		x: pixel.x + pixel.tile.x * TILE_SIZE,
		y: pixel.y + pixel.tile.y * TILE_SIZE
	};
}

function normalizeSelection(a: Pixel, b: Pixel) {
	const globalA = toGlobalPixel(a);
	const globalB = toGlobalPixel(b);

	const start = { x: Math.min(globalA.x, globalB.x), y: Math.min(globalA.y, globalB.y) };
	const end = { x: Math.max(globalA.x, globalB.x), y: Math.max(globalA.y, globalB.y) };

	return { start, end };
}

function calculateArea(a: Pixel, b: Pixel) {
	const { start, end } = normalizeSelection(a, b);

	const width = end.x - start.x + 1;
	const height = end.y - start.y + 1;

	return { width, height, area: width * height };
}

//const a: Pixel = {
//	x: 999,
//	y: 194,
//	tile: {
//		x: 1630,
//		y: 194,
//	}
//}

//const b: Pixel = {
//	x: 2,
//	y: 196,
//	tile: {
//		x: 1631,
//		y: 194,
//	}
//}

const a: Pixel = {
	x: 531,
	y: 38,
	tile: {
		x: 1630,
		y: 962,
	}
}

const b: Pixel = {
	x: 558,
	y: 50,
	tile: {
		x: 1630,
		y: 962,
	}
}

console.log("a - b", calculateArea(a, b));
console.log("b - a", calculateArea(b, a));