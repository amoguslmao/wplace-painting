import type { Request, Response } from "express";
import { AccountManager } from "../../../services/accountManager.js";

export default async function leaveAlliance(req: Request<{ id: string }>, res: Response) {
	const accountId = Number(req.params.id);

	const accountManager = AccountManager.getInstance();

	const account = accountManager.accounts.get(accountId);

	if (!account) {
		return res.status(404).json({
			message: `Could not find account with ID ${accountId}`
		});
	}

	try {
		const result = await account.leaveAlliance();

		if (result.status === "success") {
			res.status(200).json({
				message: result.message
			});
		} else {
			res.status(400).json({
				message: result.message
			});
		}
	} catch (error) {
		res.status(500).json({
			message: `An error occurred while leaving alliance for account ID ${accountId}`,
			cause: error
		});

		console.error(error);
	}
}