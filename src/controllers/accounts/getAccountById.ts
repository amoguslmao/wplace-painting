import type { Request, Response } from "express";
import { AccountManager } from "../../services/accountManager.js";
import type { IdParam } from "../../types/request.js";

export default async function getAccountById(req: Request<IdParam>, res: Response) {
	const accountId = Number(req.params.id);

	const accountManager = AccountManager.getInstance();

	const account = accountManager.accounts.get(accountId);

	if (!account) {
		return res.status(404).json({
			message: `Could not found account with ID ${accountId}`
		});
	}

	return res.status(200).json({
		id: account.id,
		user: account.user,
		jwtToken: account.jwtToken,
		lastFetch: account.lastFetch
	});
}