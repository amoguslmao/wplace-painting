import type { Request, Response } from "express";
import { AppSetting } from "../../services/settings.js";

export default function getAppSetting(_: Request, res: Response) {
	const appSetting = AppSetting.getInstance();

	return res.status(200).json(appSetting.settings);
}