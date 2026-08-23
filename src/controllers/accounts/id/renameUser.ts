import type { Request, Response } from "express";
import { AccountManager } from "../../../services/accountManager.js";
import type { IdParam, RenameUser } from "../../../types/request.js";

export default async function renameUser(
	req: Request<IdParam, {}, RenameUser>,
	res: Response,
) {
	const accountId = Number(req.params.id);

	const accountManager = AccountManager.getInstance();

	const account = accountManager.accounts.get(accountId);

	if (!account) {
		return res.status(400).json({
			message: `Could not find account with ID ${req.params.id}`,
		});
	}

	if (!req.body.name || req.body.name.length > 16) {
		return res.status(400).json({
			message: `Name length is too long`,
		});
	}

	try {
		const result = await account.updateUser(req.body.name);

		if (result.status === "success") {
			res.status(200).json({
				message: result.message,
			});
		}
		else {
			res.status(400).json({
				message: result.message,
			});
		}
	} catch (err) {
		res.status(500).json({
			message: `Got an error when renaming user`,
			cause: (err as Error).message,
		});
	}
}
