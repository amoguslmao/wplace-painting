import type { Request, Response } from "express";
import { TemplateManager } from "../../services/templateManager.js";

export default function changeTemplateStatus(req: Request<{ id: number}, {}, { status: "start" | "stop" }>, res: Response) {
	const templateId = Number(req.params.id);

	const templateManager = TemplateManager.getInstance();

	const template = templateManager.templates.get(templateId);

	if (!template) {
		return res.status(404).json({
			message: `Could not found template with id ${templateId}`
		})
	}

	if (!req.body.status) {
		return res.status(400).json({
			message: `Field "status" in body is required`
		});
	}

	try {
		switch (req.body.status) {
			case "start": {
				const result = templateManager.startTemplate(template.id);

				return res.status(result.status === "success" ? 200 : 400).json({
					message: result.message
				});
			}
			case "stop": {
				const result = templateManager.stopTemplate(template.id);

				return res.status(result.status === "success" ? 200 : 400).json({
					message: result.message
				});
			}
			default: {
				return res.status(400).json({
					message: `Field "status" only have 2 values: "start" or "stop"`
				});
			}
		}
	} catch (error) {
		return res.status(500).json({
			message: `An error occured when changing status template ${template.name}#${template.id}`,
			cause: (error as Error).message
		})
	}
}