import type { Request, Response } from "express";
import type { IdParam } from "../../types/request.js";
import { TemplateManager } from "../../services/templateManager.js";
import { AccountManager } from "../../services/accountManager.js";

export default function getAssignedAccountsById(req: Request<IdParam>, res: Response) {
	const templateId = Number(req.params.id);

	const templateManager = TemplateManager.getInstance();
	const accountManager = AccountManager.getInstance();

	const template = templateManager.templates.get(templateId);

	if (!template) {
		return res.status(404).json({
			message: `Could not find template with ID ${templateId}`
		});
	}

	const result: string[] = [];

	for (const accountId of template.assignedAccounts) {
		const account = accountManager.accounts.get(accountId);

		if (!account) {
			// chắc là gió thôi
			console.error(`Found unknown account with ID ${accountId} when get all assigned account in template ${template.name}#${template.id}`);
			continue;
		}
		
		result.push(`${account.user.name}#${account.user.id}`);
	}

	return res.status(200).json(result);
}