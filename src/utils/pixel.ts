import type { GlobalPixel, Pixel } from "../types/pixel.js";

const TILE_SIZE = 1000 as const;

export function toGlobalPixel(pixel: Pixel): GlobalPixel {
	return {
		x: pixel.x + pixel.tile.x * TILE_SIZE,
		y: pixel.y + pixel.tile.y * TILE_SIZE
	}
}

export function toTilePixel(globalPixel: GlobalPixel): Pixel {
	return {
		tile: {
			x: Math.floor(globalPixel.x / TILE_SIZE),
			y: Math.floor(globalPixel.y / TILE_SIZE)
		},
		x: globalPixel.x % TILE_SIZE,
		y: globalPixel.y % TILE_SIZE
	}
}


/**
 * Function bị lách 1 case khá lớn, trong lúc nhắn tin với Louis thì có phát hiện ra cái case này
 * 
 * Link: https://discord.com/channels/@me/1423109986896314543/1443966299821572269
 * 
 */
export function normalizeSelection(first: Pixel, second: Pixel) {
	const globalFirstPoint = toGlobalPixel(first);
	const globalSecondPoint = toGlobalPixel(second);

	const startPoint: GlobalPixel = {
		x: Math.min(globalFirstPoint.x, globalSecondPoint.x),
		y: Math.min(globalFirstPoint.y, globalSecondPoint.y)
	};

	const endPoint: GlobalPixel = {
		x: Math.max(globalFirstPoint.x, globalSecondPoint.x),
		y: Math.max(globalFirstPoint.y, globalSecondPoint.y)
	};

	return { startPoint, endPoint }
}