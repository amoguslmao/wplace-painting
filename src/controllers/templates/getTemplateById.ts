import type { Request, Response } from "express";
import { TemplateManager } from "../../services/templateManager.js";
import type { IdParam } from "../../types/request.js";

export default async function getTemplateById(
	req: Request<IdParam>,
	res: Response,
) {
	const templateId = Number(req.params.id);

	const templateManager = TemplateManager.getInstance();

	const template = templateManager.templates.get(templateId);

	if (!template) {
		return res.status(404).json({
			message: `Could not find template with ID ${req.params.id}`,
		});
	}

	return res.status(200).json({
		id: template.id,
		name: template.name,
		createdAt: template.createdAt,
		imageName: template.imageName,

		imageInformation: template.imageInformation,
		assignedAccounts: template.assignedAccounts,
		coordinates: template.coordinates,
		setting: template.setting,
	});
}
