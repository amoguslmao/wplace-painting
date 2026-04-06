import type { Request, Response } from "express";
import type { PurchaseCharges } from "../../../types/request.js";
import { AccountManager } from "../../../services/accountManager.js";

export default async function purchaseChargesUser(req: Request<{ id: number }, {}, PurchaseCharges>, res: Response) {
	const accountId = Number(req.params.id);

	const accountManager = AccountManager.getInstance();

	const account = accountManager.accounts.get(accountId);

	if (!account) {
		return res.status(400).json({
			message: `Could not find account with ID ${req.params.id}`
		});
	}

	const { type, amount } = req.body;

	if (!Number.isInteger(amount)) {
		return res.status(400).json({
			message: `Field "amount" must be an integer`
		});
	}

	if (!["paint_charge", "max_charge"].includes(type)) {
		return res.status(400).json({
			message: `Field "type" can only has two values are 'paint_charge' and 'max_charge'`
		});
	}

	try {
		const result = await account.purchaseCharges(type, amount);

		if (result.status === "success") {
			res.status(200).json({
				message: result.message
			});
		}
		else {
			res.status(400).json({
				message: result.message
			});
		}
	} catch (error) {
		res.status(500).json({
			message: "Got an error when purchase charge",
			cause: (error as Error).message
		});
	}
}