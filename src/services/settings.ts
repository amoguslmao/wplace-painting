import { DATA_FOLDER, SETTINGS_FILE_NAME } from "../const/index.js";
import type { SettingFields } from "../types/settings.js";
import * as fs from "node:fs/promises";

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

			this._settings = JSON.parse(raw) as SettingFields;
		} catch (error) {
			console.error(`An error occured when loading settings`, error);
		}

		this.initialized = true;
	}

	public async save() {
		await fs.writeFile(this.settingFilePath, JSON.stringify(this._settings, null, 4));
	}
}