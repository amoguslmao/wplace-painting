import type { Request, Response } from "express";
import { TemplateManager } from "../../services/templateManager.js";

export default async function deleteTemplateById(req: Request<{ id: number }>, res: Response) {
	const templateId = Number(req.params.id);

	const templateManager = TemplateManager.getInstance();

	const template = templateManager.templates.get(templateId);

	if (!template) {
		return res.status(404).json({
			message: `Could not found template with ID ${req.params.id}`
		});
	}

	try {
		templateManager.deleteTemplate(templateId);

		return res.status(200).json({
			message: "Successfully"
		});
	} catch (error) {
		return res.status(500).json({
			message: `An error occured when delete template ${req.params.id}`,
			cause: (error as Error).message
		});
	}
}