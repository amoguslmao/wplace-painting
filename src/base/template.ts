import { DatabaseInstance } from "../services/database.js";
import { Logger } from "../libs/logger.js";
import { AccountQueue } from "../libs/queue.js";
import { ImageManiputation, merge2dImages } from "../libs/imageManiputation.js";
import { DATA_FOLDER, UPLOADS_FOLDER } from "../const/index.js";
import { AccountManager } from "../services/accountManager.js";
import { AppSetting } from "../services/settings.js";
import { sleep } from "../utils/promises.js";
import { formatTime } from "../utils/string.js";
import {
	calculateLastPixel,
	getTile,
	localToGlobalPixel,
	PaintingMethod,
	toGlobalPixel,
	toPixel,
	toTilePixel,
} from "../libs/pixel.js";

import type {
	TemplateDatabase,
	TemplateCoordinates,
	TemplateSetting,
	TemplateImageInformation,
} from "../types/template.js";
import type { OperationResult } from "../types/utils.js";
import type { PaintingTile } from "../types/pixel.js";
import type { UpdateTemplate } from "../types/request.js";

export class Template {
	public readonly id: number;
	public createdAt: string;
	public imageName: string;
	public disabled: boolean;

	private controller: AbortController | null;

	private _name: string;
	private _imageInformation: string;
	private _assignedAccounts: string;
	private _coordinates: string;
	private _setting: string;

	public constructor(data: TemplateDatabase) {
		this.id = data.id;
		this.createdAt = data.createdAt;
		this.imageName = data.imageName;
		this.disabled = false;

		this.controller = null;

		this._name = data.name;
		this._assignedAccounts = data.assignedAccounts;
		this._coordinates = data.coordinates;
		this._imageInformation = data.imageInformation;
		this._setting = data.setting;
	}

	public get name() {
		return this._name;
	}

	public set name(value: string) {
		this._name = value;

		const database = DatabaseInstance.getInstance();

		const updateTemplateName = database.prepare<{
			name: string;
			id: number;
		}>(`
			UPDATE templates
			SET name = @name
			WHERE id = @id	
		`);

		updateTemplateName.run({
			name: value,
			id: this.id,
		});
	}

	public get assignedAccounts(): number[] {
		return JSON.parse(this._assignedAccounts);
	}

	public set assignedAccounts(value: number[]) {
		this._assignedAccounts = JSON.stringify(value);

		const database = DatabaseInstance.getInstance();

		const updateTemplateAssignedAccounts = database.prepare<{
			assignedAccounts: string;
			id: number;
		}>(`
			UPDATE templates
			SET assignedAccounts = @assignedAccounts
			WHERE id = @id	
		`);

		updateTemplateAssignedAccounts.run({
			assignedAccounts: JSON.stringify(value),
			id: this.id,
		});
	}

	public get coordinates(): TemplateCoordinates {
		return JSON.parse(this._coordinates);
	}

	public set coordinates(value: TemplateCoordinates) {
		this._coordinates = JSON.stringify(value);

		const database = DatabaseInstance.getInstance();

		const updateTemplateCoordinates = database.prepare<{
			coordinates: string;
			id: number;
		}>(`
			UPDATE templates
			SET coordinates = @coordinates
			WHERE id = @id	
		`);

		updateTemplateCoordinates.run({
			coordinates: JSON.stringify(value),
			id: this.id,
		});
	}

	public get setting(): TemplateSetting {
		return JSON.parse(this._setting);
	}

	public set setting(value: TemplateSetting) {
		this._setting = JSON.stringify(value);

		const database = DatabaseInstance.getInstance();

		const updateTemplateSetting = database.prepare<{
			setting: string;
			id: number;
		}>(`
			UPDATE templates
			SET setting = @setting
			WHERE id = @id
		`);

		updateTemplateSetting.run({
			setting: JSON.stringify(value),
			id: this.id,
		});
	}

	public get imageInformation(): TemplateImageInformation {
		return JSON.parse(this._imageInformation);
	}

	public update(updateTemplate: UpdateTemplate) {
		this.name = updateTemplate.name;
		this.assignedAccounts = updateTemplate.assignedAccounts;
		this.coordinates = updateTemplate.coordinates;
		this.setting = updateTemplate.setting;

		console.log(
			`Updated the template ${this.name}#${this.id} successfully`,
		);
	}

	public start(): OperationResult {
		if (this.disabled) {
			return {
				message: `Template ${this.name} is disabled and cannot paint.`,
				status: "failed",
			};
		}

		if (this.controller) {
			return {
				message: `Template ${this.name} has been started before.`,
				status: "failed",
			};
		}

		this.controller = new AbortController();

		this.paintTemplate();

		return {
			message: `Started template ${this.name}.`,
			status: "success",
		};
	}

	public stop(): OperationResult {
		if (!this.controller) {
			return {
				message: `Template ${this.name} has not started before.`,
				status: "failed",
			};
		}

		this.controller.abort();

		return {
			message: `Stopped template ${this.name}`,
			status: "success",
		};
	}

	public isRunning(): boolean {
		return this.controller !== null;
	}

	public getStatus() {
		
	}

	private async paintTemplate() {
		if (!this.controller) {
			throw new Error(`AbortController doesnt init before to paint.`);
		}

		const logger = new Logger();
		const templateLogger = logger.getLogger("template");
		const queueLogger = logger.getLogger("account").getLogger("queue");
		const accountManager = AccountManager.getInstance();
		const appSetting = AppSetting.getInstance();

		templateLogger.info(`Started painting template ${this.name}`);

		while (!this.controller.signal.aborted) {
			const queue = new AccountQueue(this.assignedAccounts);
			let accountPredictedCharge = queue.getFirstRefillingAccount();

			if (accountPredictedCharge.waitTime > 0) {
				queueLogger.info(
					`Need to wait ${formatTime(accountPredictedCharge.waitTime)} to refill account.`,
				);

				try {
					await sleep(accountPredictedCharge.waitTime, this.controller.signal);
				} catch {
					break;
				}
			}

			const firstPixel = toPixel(this.coordinates);
			const globalFirstPixel = toGlobalPixel(firstPixel);
			const lastPixel = calculateLastPixel(
				firstPixel,
				this.imageInformation.height,
				this.imageInformation.width,
			);

			const originImage = await ImageManiputation.create(
				`./${DATA_FOLDER}/${UPLOADS_FOLDER}/${this.imageName}`,
			);
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
			const mergedTileImage = await finalImage
				.crop({
					left: firstPixel.x,
					top: firstPixel.y,
					width: this.imageInformation.width,
					height: this.imageInformation.height,
				})
				.flush();

			accountPredictedCharge = queue.getFirstRefillingAccount();
			const paintMethod = new PaintingMethod(
				mergedTileImage,
				originImage,
				Math.floor(accountPredictedCharge.predictedCharges),
			);

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
							colors: [],
						},
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

			templateLogger.success(`Painted successfully. (Total ${totalPixels.length} pixels)`);

			templateLogger.info(
				`Waiting ${appSetting.settings.accountTurnCooldown}ms to paint next account.`,
			);

			try {
				await sleep(
					appSetting.settings.accountTurnCooldown,
					this.controller.signal,
				);
			} catch {
				break;
			}
		}

		if (this.controller.signal.aborted) {
			templateLogger.info(`Template ${this.name} has been stopped.`);

			this.controller = null;

			return;
		}

		templateLogger.success(`Template ${this.name} is done.`);

		this.controller = null;
	}
}
