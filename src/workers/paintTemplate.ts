import EventEmitter from "node:events";
import { type ChildEvent, type EventBody } from "../types/event.js";
import type { Template } from "./../base/template.js";
import { AccountManager } from "./../services/accountManager.js";
import { DatabaseInstance } from "./../services/database.js";
import { sleep } from "../utils/promises.js";
import { calculateLastPixel, getTile, localToGlobalPixel, PaintingMethod, toGlobalPixel, toPixel, toTilePixel } from "../libs/pixel.js";
import { ImageManiputation, merge2dImages } from "../libs/imageManiputation.js";
import { DATABASE_NAME, UPLOADS_FOLDER } from "../const/index.js";
import type { PaintingTile } from "../types/pixel.js";

/////////////////////////////
// Initilize
/////////////////////////////
console.log(`[Child Process] Child process started`);

DatabaseInstance.getInstance();
console.log(`[Child Process] Database started`);

const accountManager = AccountManager.getInstance();
await accountManager.init();
console.log(`[Child Process] account manager initilized`);

/////////////////////////////
// Const
/////////////////////////////
const state: { template: Template | null, painted: number } = {
	template: null,
	painted: 0
}
const event = new EventEmitter<ChildEvent>();

/////////////////////////////
// Event
/////////////////////////////
process.on("message", (message: EventBody) => {
	switch (message.op) {
		case "init_process": {
			state.template = message.data as unknown as any; // Override type tạm thời, sẽ fix sau
		}
	}
})

/////////////////////////////
// Main part
/////////////////////////////
while (true) {
	if (!state.template) {
		await sleep(3500);
		continue;
	}
	
	const { template } = state;

	const firstPixel = toPixel(template.coordinates);
	const globalFirstPixel = toGlobalPixel(firstPixel);
	const lastPixel = calculateLastPixel(
		firstPixel, 
		template.imageInformation.height, 
		template.imageInformation.width
	);

	const originImage = await ImageManiputation.create(`./${DATABASE_NAME}/${UPLOADS_FOLDER}/${template.imageName}`);
	const requiredTiles: ImageManiputation[][] = new Array().fill([]);

	for (let tileY = firstPixel.tile.y; tileY <= lastPixel.tile.y; tileY++) {
		const rowIndex = tileY - firstPixel.tile.y;

		for (let tileX = firstPixel.tile.x; tileX <= lastPixel.tile.x; tileX++) {
			requiredTiles[rowIndex].push(await getTile(tileX, tileY));
		}
	}

	const tiles = await Promise.all(requiredTiles);

	const finalImage = await merge2dImages(tiles);

	await finalImage.crop({
		left: firstPixel.x,
		top: firstPixel.y,
		width: template.imageInformation.width,
		height: template.imageInformation.height
	}).flush();

	// Cần chỉ định acc nào có cái charge bao nhiêu rồi bỏ vào param thứ 3
	const paintMethod = new PaintingMethod(finalImage, originImage, 10);

	const totalPixels = paintMethod.linear();

	const tileMap = new Map<string, PaintingTile>();

	for (const pixelInfo of totalPixels) {
		const globalPixel = localToGlobalPixel(pixelInfo, globalFirstPixel);

		const pixel = toTilePixel(globalPixel);

		const tileKey = `${pixel.tile.x},${pixel.tile.y}`;

		if (!tileMap.has(tileKey)) {
			tileMap.set(tileKey, {
				x: pixel.tile.x,
				y: pixel.tile.y,
				pixels: {
					x: [],
					y: [],
					colors: []
				}
			});
		}

		const tile = tileMap.get(tileKey)!;

		tile.pixels.x.push(pixel.x);
		tile.pixels.y.push(pixel.y);
		tile.pixels.colors.push(pixelInfo.color);
	}

	const paintingTiles = Array.from(tileMap.values());

	// Tiếp theo là phần paint, nhưng mà chưa chỉ định acc nào nên chịu.
}