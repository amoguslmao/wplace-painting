import EventEmitter from "node:events";
import type { ChildProcessEvents, ChildProcessMessage, MainProcessMessage } from "../types/event.js";
import { AccountManager } from "./../services/accountManager.js";
import { DatabaseInstance } from "./../services/database.js";
import { sleep } from "../utils/promises.js";
import { calculateLastPixel, getTile, localToGlobalPixel, PaintingMethod, toGlobalPixel, toPixel, toTilePixel } from "../libs/pixel.js";
import { ImageManiputation, merge2dImages } from "../libs/imageManiputation.js";
import { DATA_FOLDER, UPLOADS_FOLDER } from "../const/index.js";
import type { PaintingTile } from "../types/pixel.js";
import { sendMessage } from "../utils/process.js";
import type { TemplateInformation } from "../types/template.js";

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
const state: { template: TemplateInformation | null, painted: number } = {
	template: null,
	painted: 0
}
const event = new EventEmitter<ChildProcessEvents>();

/////////////////////////////
// Event
/////////////////////////////
process.on("message", (message: ChildProcessMessage) => {
	switch (message.op) {
		case "init_process": {
			state.template = message.data.template;
			console.log(`Received template ${state.template.name} from main`);
			break;
		}
		case "get_status": {
			event.emit("get_status", message.sequence);
			break;
		}
		case "get_info": {
			event.emit("get_info", message.sequence);
			break;
		}
		default: {
			console.error(`Unknown message op received from main`);
		}
	}
});

event.on("get_info", (sequence) => {
	const memoryUsage = process.memoryUsage();

	sendMessage<MainProcessMessage>(process, {
		op: "response_info",
		data: {
			memory: {
				heapUsed: memoryUsage.heapUsed / 1024 / 1024,
				heapTotal: memoryUsage.heapTotal / 1024 / 1024,
				rss: memoryUsage.rss / 1024 / 1024,
				external: memoryUsage.external / 1024 / 1024,
			}
		},
		sequence
	})
});

event.on("get_status", (sequence) => {
	sendMessage<MainProcessMessage>(process, {
		op: "response_status",
		data: {
			painted: state.painted
		},
		sequence
	});
});

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

	const originImage = await ImageManiputation.create(`./${DATA_FOLDER}/${UPLOADS_FOLDER}/${template.imageName}`);
	const requiredTiles: ImageManiputation[][] = new Array().fill([]);

	for (let tileY = firstPixel.tile.y; tileY <= lastPixel.tile.y; tileY++) {
		const rowIndex = tileY - firstPixel.tile.y;

		requiredTiles[rowIndex] = [];

		for (let tileX = firstPixel.tile.x; tileX <= lastPixel.tile.x; tileX++) {
			requiredTiles[rowIndex].push(await getTile(tileX, tileY));
		}
	}

	console.debug(`Required tiles:`, requiredTiles);

	const tiles = await Promise.all(requiredTiles);

	const finalImage = await merge2dImages(tiles);

	console.log(`First pixel in template:`, firstPixel);
	console.log(`Width and height from template: ${template.imageInformation.width}x${template.imageInformation.height}`);

	const mergedTileImage = await finalImage.crop({
		left: firstPixel.x,
		top: firstPixel.y,
		width: template.imageInformation.width,
		height: template.imageInformation.height
	}).flush();

	// Cần chỉ định acc nào có cái charge bao nhiêu rồi bỏ vào param thứ 3
	const paintMethod = new PaintingMethod(mergedTileImage, originImage, 10);

	const totalPixels = paintMethod.linear();

	console.debug(`Total pixel painted:`, totalPixels);

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

	console.log(`Painting Tile:`);
	console.log(paintingTiles);
	console.log(`Pixels:`);
	console.log(paintingTiles[0].pixels);


	await sleep(5000);

	// Tiếp theo là phần paint, nhưng mà chưa chỉ định acc nào nên chịu.
}