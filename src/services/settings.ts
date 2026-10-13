import {
	DATA_FOLDER,
	DEFAULT_APP_SETTINGS,
	SETTINGS_FILE_NAME,
} from "../const/index.js";
import type { SettingFields } from "../types/settings.js";
import * as fs from "node:fs/promises";
import { AppSettingSchema } from "../validate/index.js";
import { ZodError } from "zod";
import { Logger } from "../libs/logger.js";

export class AppSetting {
	private initialized = false;

	private settingFilePath = `./${DATA_FOLDER}/${SETTINGS_FILE_NAME}`;

	private static _instance: AppSetting | null = null;

	private _settings?: SettingFields;

	public constructor() {}

	public get settings() {
		if (!this.initialized || !this._settings) {
			throw new Error("Instance did not created correctly.");
		}

		return this._settings;
	}

	public set settings(value: SettingFields) {
		if (!this.initialized) {
			throw new Error("Instance did not created correctly.");
		}

		this._settings = value;
	}

	public static getInstance() {
		if (!this._instance) {
			this._instance = new AppSetting();
		}

		return this._instance;
	}

	public async loadSetting() {
		if (this.initialized) return;

		try {
			await fs.access(this.settingFilePath, fs.constants.F_OK);

			const raw = await fs.readFile(this.settingFilePath, "utf-8");

			const setting = AppSettingSchema.parse(JSON.parse(raw));

			this._settings = setting;
		} catch (error) {
			const settingLogger = new Logger(["Service", "Setting"]);

			if (error instanceof ZodError) {
				settingLogger.error(
					`Invalid setting from "${SETTINGS_FILE_NAME}". Make sure you are not breaking anything.`,
				);
				settingLogger.error(error);
				settingLogger.warn(`Default setting will be used for fallback`);

				this._settings = DEFAULT_APP_SETTINGS;
				return;
			}

			if (error instanceof SyntaxError) {
				settingLogger.error(
					`Invalid JSON parse when reading file "${SETTINGS_FILE_NAME}". Check again your file.`,
				);
				settingLogger.error(error);
				settingLogger.warn(`Default setting will be used for fallback`);

				this._settings = DEFAULT_APP_SETTINGS;
				return;
			}

			settingLogger.error(
				`An unknown error occured when loading settings`,
			);
			settingLogger.error(error);
			settingLogger.warn(`Default setting will be used for fallback`);

			this._settings = DEFAULT_APP_SETTINGS;
		}

		this.initialized = true;
	}

	public async save() {
		await fs.writeFile(
			this.settingFilePath,
			JSON.stringify(this._settings, null, 4),
		);
	}
}
