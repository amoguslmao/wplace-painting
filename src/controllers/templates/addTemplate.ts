import type { Request, Response } from "express";
import { TemplateInformationSchema } from "../../validate/index.js";
import { z } from "zod";
import { TemplateManager } from "../../services/templateManager.js";
import type { AddNewTemplate } from "../../types/request.js";

export default function addNewTemplate(req: Request<{}, {}, AddNewTemplate>, res: Response) {
	try {
		const template = TemplateInformationSchema.parse(req.body);

		const templateManager = TemplateManager.getInstance();

		templateManager.addTemplate(template);

		res.status(200).json({
			message: "Successfully"
		});
	} catch (error) {
		if (error instanceof z.ZodError) {
			return res.status(400).json({
				message: "Bad request",
				cause: error.issues
			});
		}

		return res.status(500).json({
			message: "Something went wrong when adding template",
			cause: (error as Error).message
		});
	}
}

/**
 * Khi mà tạo 1 template, thì trước tiên sẽ thực hiện /image/compare hoặc kiểu như kiểm tra ảnh có nhiêu màu
 * Sau khi kiểm tra xong thì sẽ add template sau
 * Dùng result của việc kiểm tra ảnh có nhiêu màu vào template
 */