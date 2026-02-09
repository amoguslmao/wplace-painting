import type { Request, Response } from "express";

import * as fs from "node:fs/promises";
import { DATA_FOLDER, UPLOADS_FOLDER } from "../../const/index.js";

export default async function listImages(req: Request, res: Response) {
	const files = await fs.readdir(`./${DATA_FOLDER}/${UPLOADS_FOLDER}`);

	return res.status(200).json({
		files: files
	});
}