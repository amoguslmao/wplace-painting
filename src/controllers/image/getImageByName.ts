import type { NextFunction, Request, Response } from "express";
import * as fs from "node:fs/promises";
import { DATA_FOLDER, UPLOADS_FOLDER } from "../../const/index.js";

export default async function getImageByName(req: Request<{ imageName: string }>, res: Response, next: NextFunction) {
	const { imageName } = req.params;

	if (!imageName) {
		return res.status(400).json({
			message: "Image name is required"
		});
	}

	const files = await fs.readdir(`./${DATA_FOLDER}/${UPLOADS_FOLDER}`);

	const targetFile = files.find((value) => value === imageName);

	if (targetFile) {
		return res.status(200).sendFile(`/${targetFile}`, { root: `./${DATA_FOLDER}/${UPLOADS_FOLDER}/` } ,(err) => {
			if (err) {
				console.error(err);
				
				next(err);				
			}
		});
	}
	else {
		return res.status(404).json({
			message: "Not found"
		});
	}
}

