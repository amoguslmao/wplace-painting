import EnvConfig from "../config.js";
import { TILE_SIZE } from "../const/index.js";
import type { GlobalPixel, PaintingTile, Pixel, PixelInformation } from "../types/pixel.js";
import type { TemplateCoordinates } from "../types/template.js";
import { matchingPallete } from "./color.js";
import { ImageManiputation } from "./imageManiputation.js";

export function toPixel(coordinates: TemplateCoordinates): Pixel {
	return {
		x: coordinates[2],
		y: coordinates[3],
		tile: {
			x: coordinates[0],
			y: coordinates[1]
		}
	}
}

export function toGlobalPixel(pixel: Pixel): Omit<Pixel, "tile"> {
	return {
		x: pixel.x + pixel.tile.x * TILE_SIZE,
		y: pixel.y + pixel.tile.y * TILE_SIZE
	};
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

export function localToGlobalPixel(localPixel: GlobalPixel, globalPixel: GlobalPixel): GlobalPixel {
	return {
		x: globalPixel.x + localPixel.x,
		y: globalPixel.y + localPixel.y
	}
}

export function normalizeSelection(first: Pixel, second: Pixel) {
	const globalFirstPoint = toGlobalPixel(first);
	const globalSecondPoint = toGlobalPixel(second);

	const start: GlobalPixel = { 
		x: Math.min(globalFirstPoint.x, globalSecondPoint.x), 
		y: Math.min(globalFirstPoint.y, globalSecondPoint.y) 
	}
	const end: GlobalPixel = { 
		x: Math.max(globalFirstPoint.x, globalSecondPoint.x), 
		y: Math.max(globalFirstPoint.y, globalSecondPoint.y) 
	}

	return { start, end };
}

export function calculateArea(a: Pixel, b: Pixel) {
	const { start, end } = normalizeSelection(a, b);

	const width = end.x - start.x + 1;
	const height = end.y - start.y + 1;

	return { width, height, area: width * height };
}

/**
 * Tính toán pixel cuối cùng của 1 hình ảnh dựa vào pixel đầu tiên
 * @param firstPixel Pixel ở hàng đầu bên trái
 * @param height Chiều rộng hình ảnh
 * @param width Chiều dài hình ảnh
 * @returns Pixel cuối cùng của bức ảnh trên tọa độ Wplace
 */
export function calculateLastPixel(firstPixel: Pixel, height: number, width: number): Pixel {
	const globalPixel = toGlobalPixel(firstPixel);

	const lastPixel = toTilePixel({
		x: globalPixel.x + width - 1,
		y: globalPixel.y + height - 1
	});

	return lastPixel;
}

export async function getTile(tileX: number, tileY: number): Promise<ImageManiputation> {
	const response = await fetch(`${EnvConfig.baseURL}/files/s0/tiles/${tileX}/${tileY}.png?t=${Date.now()}`, {
		method: "GET",
		headers: {
			"cache-control": "no-cache",
			"pragma": "no-cache",
			"priority": "u=1, i",
			"accept": "image/webp,*/*",
			"accept-encoding": "gzip, deflate, zstd",
			"origin": "https://wplace.live",
			"referer": "https://wplace.live",
			"sec-ch-ua": `"Chromium";v="148", "Google Chrome";v="148", "Not/A)Brand";v="99"`,
			"sec-ch-ua-mobile": "?0",
			"sec-ch-ua-platform": `"Windows"`,
			"sec-fetch-dest": "empty",
			"sec-fetch-mode": "cors",
			"sec-fetch-site": "same-site"
		}
	});

	const image = ImageManiputation.create(await response.arrayBuffer());

	return image;
}

export class PaintingMethod {
	public constructor(private imageFromTiles: ImageManiputation, private originImage: ImageManiputation, private count: number) {}

	public linear(reverse: boolean = false): PixelInformation[] {
		const { width, height } = this.imageFromTiles.metadata;
		const result: PixelInformation[] = [];

		for (let y = 0; y < height; y++) {
			for (let x = 0; x < width; x++) {
				if (result.length >= this.count) {
					return result;
				}

				const colorId = matchingPallete(this.originImage.getPixel(x, y));

				if (
					colorId &&
					this.imageFromTiles.getPixel(x, y) === this.originImage.getPixel(x, y)
				) {
					result.push({
						x, y,
						color: colorId
					});
				}
			}
		}

		return result;
	}

	public random() {
		// TODO: sẽ implement cái này sau
	}
	
	// TODO: thêm các hàm để kiểm tra ảnh
}