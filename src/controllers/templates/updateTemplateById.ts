import type { Request, Response } from "express";
import { UpdateTemplateSchema } from "../../validate/index.js";
import type { IdParam, UpdateTemplate } from "../../types/request.js";
import { TemplateManager } from "../../services/templateManager.js";
import { z } from "zod";

export default function updateTemplateById(req: Request<IdParam, {}, UpdateTemplate>, res: Response) {
	try {
		const templateId = Number(req.params.id);

		const templateManager = TemplateManager.getInstance();

		if (!templateManager.templates.has(templateId)) {
			return res.status(404).json({
				message: `Could not find template with ID ${templateId}`
			});
		}

		const template = UpdateTemplateSchema.parse(req.body);

		templateManager.updateTemplate(templateId, template);

		return res.status(200).json({
			message: `Successfully updated template ${template.name}#${templateId}`
		});
	} catch (error) {
		if (error instanceof z.ZodError) {
			return res.status(400).json({
				message: "Missing field",
				cause: error.issues
			});
		}

		return res.status(500).json({
			message: "Something went wrong when updating template",
			cause: (error as Error).message
		});
	}
}