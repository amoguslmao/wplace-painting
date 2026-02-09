import type { Request, Response } from "express";
import { ImageManiputation } from "../../libs/imageManiputation.js";
import { matchingPallete } from "../../libs/color.js";

export default async function compareImage(req: Request<{}, {}, Express.Multer.File>, res: Response) {
	const { file } = req;

	if (!file) {
		return res.status(400).json({
			status: 400,
			error: "Image field is required"
		});
	}

	const image = await ImageManiputation.create(file.buffer);

	const { height, width } = image.metadata;

	let mismatchPixel = 0;
	const pixelsData: Array<Array<number | undefined>> = new Array(height)
		.fill(0)
		.map(() => new Array(width).fill(0));

	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			const current = matchingPallete(image.getPixel(x, y));

			if (!current) {
				mismatchPixel++;
			}

			pixelsData[y][x] = current;
		}
	}

	return res.status(200).json({
		height, width,
		mismatch: mismatchPixel,
		pixels: pixelsData
	});
}