import type { Request, Response } from "express";
import type { SettingFields } from "../../types/settings.js";
import { AppSettingSchema } from "../../validate/index.js";
import { AppSetting } from "../../services/settings.js";
import z from "zod";

export default async function updateAppSetting(req: Request<{}, {}, SettingFields>, res: Response) {
	try {
		const settings = AppSettingSchema.parse(req.body);

		const appSetting = AppSetting.getInstance();

		appSetting.settings = settings;

		await appSetting.save();

		return res.status(200).json({
			message: `New setting has been saved.`
		});
	} catch (error) {
		if (error instanceof z.ZodError) {
			return res.status(400).json({
				message: "Missing field.",
				cause: error.issues
			});
		}

		return res.status(500).json({
			message: "Unknown error when saving new setting",
			cause: (error as Error).message
		});
	}
}