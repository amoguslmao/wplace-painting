import type { Request, Response } from "express";

export default async function uploadImage(req: Request<{}, {}, Express.Multer.File>, res: Response) {
	//console.log(req.body);

	const { file } = req;

	if (!file) {
		return res.status(400).json({
			message: "Image field is required"
		});
	}

	res.status(200).json({
		path: req.file?.path,
		message: "successfully"
	});
}