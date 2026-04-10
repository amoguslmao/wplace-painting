import type { Request, Response } from "express";
import { ImageManiputation } from "../../libs/imageManiputation.js";
import { matchingPallete } from "../../libs/color.js";
import type { UsedColor } from "../../types/template.js";

export default async function imagePalleteCheck(req: Request<{}, {}, Express.Multer.File>, res: Response) {
	if (!req.file) {
		return res.status(400).json({
			message: "Field 'image' is required"
		});
	}

	const image = await ImageManiputation.create(req.file.buffer);

	const { width, height } = image.metadata;

	const colors = new Map<number | null, number>();

	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			const rgb = image.getPixel(x, y);

			const colorId = matchingPallete(rgb);

			let total = colors.get(colorId) || 0;

			colors.set(colorId, ++total);
		}
	}

	const result: UsedColor[] = [];

	for (const [colorId, total] of colors.entries()) {
		result.push({
			colorId,
			total
		});
	}

	return res.status(200).json({
		message: "Successfully",
		data: {
			height, width,
			usedColors: result
		}
	});
}