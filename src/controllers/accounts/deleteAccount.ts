import type { Request, Response } from "express";
import { AccountManager } from "../../services/accountManager.js";
import type { IdParam } from "../../types/request.js";

export default function deleteAccount(req: Request<IdParam, {}, {}>, res: Response) {
	const accountId = Number(req.params.id);

	if (!accountId) {
		return res.status(400).json({
			message: "Account ID doesnt valid."
		});
	}

	const accountManager = AccountManager.getInstance();

	if (!accountManager.accounts.has(accountId)) {
		return res.status(400).json({
			message: `Doesnt have any account with id ${accountId}`
		});
	}

	try {
		accountManager.deleteAccount(accountId);

		res.status(200).json({
			message: `Successfully`
		});
	} catch (err) {
		res.status(500).json({
			message: "Server got an error while deleting account",
			cause: err
		});
	}
}