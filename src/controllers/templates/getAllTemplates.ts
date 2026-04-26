import type { Request, Response } from "express";
import { TemplateManager } from "../../services/templateManager.js";
import type { TemplateCoordinates } from "../../types/template.js";

export default async function getAllTemplates(_: Request, res: Response) {
	const templateManager = TemplateManager.getInstance();

	const { templates } = templateManager;

	const result: {
		id: number,
		name: string,
		createdAt: string,
		imageName: string,

		totalAccounts: number,
		coordinates: TemplateCoordinates
	}[] = [];

	for (const template of templates.values()) {
		result.push({
			id: template.id,
			name: template.name,
			createdAt: template.createdAt,
			imageName: template.imageName,

			totalAccounts: template.assignedAccounts.length,
			coordinates: template.coordinates
		});
	}

	res.status(200).json(result);
}