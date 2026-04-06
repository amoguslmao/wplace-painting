import type { Request, Response } from "express";
import { TemplateManager } from "../../services/templateManager.js";
import type { TemplateInformation } from "../../types/template.js";

export default async function getAllTemplates(_: Request, res: Response) {
	const templateManager = TemplateManager.getInstance();

	const { templates } = templateManager;

	const result: TemplateInformation[] = [];

	for (const template of templates.values()) {
		result.push({
			id: template.id,
			name: template.name,
			createdAt: template.createdAt,
			imageName: template.imageName,

			imageInformation: template.imageInformation,
			assignedAccounts: template.assignedAccounts,
			coordinates: template.coordinates,
			setting: template.setting
		});
	}

	res.status(200).json(result);
}