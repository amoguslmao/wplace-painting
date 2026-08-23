import type { Request, Response } from "express";
import type { IdParam, JoinAlliance } from "../../../types/request.js";
import { AccountManager } from "../../../services/accountManager.js";

export default async function joinAlliance(
	req: Request<IdParam, {}, JoinAlliance>,
	res: Response,
) {
	if (!req.body || !req.body.allianceUUID) {
		return res.status(400).json({
			message: `Field "allianceUUID" is required.`,
		});
	}

	const accountId = Number(req.params.id);

	const accountManager = AccountManager.getInstance();

	const account = accountManager.accounts.get(accountId);

	if (!account) {
		return res.status(404).json({
			message: `Could not find account with ID ${accountId}`,
		});
	}

	try {
		const result = await account.joinAlliance(req.body.allianceUUID);

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
	} catch (error) {
		res.status(500).json({
			message: `An error occured while joining alliance for account ID ${accountId}`,
			cause: error,
		});

		console.error(error);
	}
}
