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
import { AccountQueue } from "../libs/queue.js";
import { AppSetting } from "../services/settings.js";
import { Logger } from "../libs/logger.js";

/////////////////////////////
// Initilize
/////////////////////////////
const logger = new Logger(["Child Process"]);

const servicesLogger = logger.getLogger("service");
const templateLogger = logger.getLogger("template");

logger.info(`Child process started`);

const database = DatabaseInstance.getInstance();
servicesLogger.success(`Database started`);

const accountManager = AccountManager.getInstance();
await accountManager.init();
servicesLogger.success(`Account Manager initilized`);

const appSetting = AppSetting.getInstance();

await appSetting.loadSetting();
servicesLogger.success(`App setting is loaded`);

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
			logger.info(`Received template ${state.template.name} from main`);
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
	const queue = new AccountQueue(template.assignedAccounts);
	const accountPredictedCharge = await queue.getFirstRefillingAccount();

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

	const tiles = await Promise.all(requiredTiles);

	const finalImage = await merge2dImages(tiles);

	const mergedTileImage = await finalImage.crop({
		left: firstPixel.x,
		top: firstPixel.y,
		width: template.imageInformation.width,
		height: template.imageInformation.height
	}).flush();

	const paintMethod = new PaintingMethod(mergedTileImage, originImage, accountPredictedCharge.predictedCharges);

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

	if (paintingTiles.length === 0) {
		templateLogger.success("Template is done.");

		break;
	}

	const account = accountManager.accounts.get(accountPredictedCharge.id)!;

	await account.paint(paintingTiles);

	templateLogger.success(`Painted successfully. (or ig)`);

	if (accountPredictedCharge.predictedCharges >= totalPixels.length) {
		templateLogger.info(`That is the last paint of this template.`);
		templateLogger.success(`Template is done.`);

		break;
	}

	await sleep(appSetting.settings.accountTurnCooldown);
}

logger.info(`Exiting process...`);

database.close();

process.exit(0);