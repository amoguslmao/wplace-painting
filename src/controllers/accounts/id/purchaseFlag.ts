import type { Request, Response } from "express";
import type { IdParam, PurchaseFlags } from "../../../types/request.js";
import { AccountManager } from "../../../services/accountManager.js";

export default async function purchaseFlagUser(
	req: Request<IdParam, {}, PurchaseFlags>,
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

	const { flagId } = req.body;

	try {
		const result = await account.purchaseFlags(flagId);

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
			message: "Got an error when purchase flag",
			cause: (error as Error).message,
		});
	}
}
