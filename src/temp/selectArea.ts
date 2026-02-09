import type { Pixel } from "../types/pixel.js";
import * as fs from "node:fs/promises";
import { normalizeSelection } from "../utils/pixel.js";
import { Impit, ImpitResponse } from "impit";
import proxyManager from "../libs/proxyManager.js";

interface Painter {
	painter: {
		avatar: null;
		id: number,
		username: string
	} | null;
}

const BATCH_SIZE = 50;
const TILE_SIZE = 1000;

const FIRST_POINT: Pixel = {
	tile: {
		x: 1631,
		y: 961,
	},
	x: 305,
	y: 654
};

const SECOND_POINT: Pixel = {
	tile: {
		x: 1632,
		y: 962,
	},
	x: 211,
	y: 845
};

interface GetPixelResponse {
	response: Painter | null,
	pixel: Pixel
}

async function getPixelInformation(proxy: string, pixel: Pixel): Promise<GetPixelResponse> {
	const { x, y, tile } = pixel;
	const impit = new Impit({
		proxyUrl: proxy,
		timeout: 6e3,
		browser: "firefox",
		ignoreTlsErrors: true,
		http3: true
	});

	let response: ImpitResponse | null = null;

	while (!response) {
		try {
			response = await impit.fetch(`https://place34.com/api/pixel/${tile.x}/${tile.y}/${x}/${y}`, {
				method: "GET"
			});
		} catch (error) {
			console.log(`Error threw when fetching pixel with proxy ${proxy}`, error);

			response = null;
		}
	}

	if (response.ok) {
		return {
			response: await response.json() as Painter,
			pixel
		};
	}
	else {
		return {
			response: null,
			pixel
		}
	}
}

async function main() {
	await fs.writeFile("./output/text.txt", "", { encoding: 'utf-8' });

	const request: (() => Promise<GetPixelResponse>)[] = [];

	const { startPoint, endPoint } = normalizeSelection(FIRST_POINT, SECOND_POINT);

	for (let globalY = startPoint.y; globalY <= endPoint.y; globalY++) {
		for (let globalX = startPoint.x; globalX <= endPoint.x; globalX++) {
			const tileX = Math.floor(globalX / TILE_SIZE);
			const tileY = Math.floor(globalY / TILE_SIZE);
			const pixelX = globalX % TILE_SIZE;
			const pixelY = globalY % TILE_SIZE;

			request.push(
				() => getPixelInformation(proxyManager.nextProxy(), {
					x: pixelX,
					y: pixelY,
					tile: {
						x: tileX,
						y: tileY
					}
				})
			);
		}
	}

	for (let i = 0; i < request.length; i += BATCH_SIZE) {
		const batch = request.slice(i, i + BATCH_SIZE);

		//console.log(batch);

		const mappedFunc = batch.map(val => val());

		const promises = await Promise.all(mappedFunc);

		for (const result of promises) {
			if (result.response && result.response.painter) {
				const { x, y, tile } = result.pixel;

				await fs.appendFile("./output/text.txt", `Tile: ${tile.x}, ${tile.y} / Pixel: ${x}, ${y} by ${result.response.painter.username}\n`, {
					encoding: "utf-8"
				});
			}
			else {
				const { x, y, tile } = result.pixel;

				await fs.appendFile("./output/text.txt", `Tile: ${tile.x}, ${tile.y} / Pixel: ${x}, ${y} is not painted\n`, {
					encoding: "utf-8"
				});
			}
		}

		//await sleep(3000);
	}
}

main();