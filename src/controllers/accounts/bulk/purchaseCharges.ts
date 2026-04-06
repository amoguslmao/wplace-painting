import type { Request, Response } from "express";
import type { BulkPurchaseCharges } from "../../../types/request.js";
import { AccountManager } from "../../../services/accountManager.js";
import { sleep } from "../../../utils/promises.js";
import { sendSSE } from "../../../utils/string.js";

export default async function bulkPurchaseCharges(req: Request<{}, {}, BulkPurchaseCharges>, res: Response) {
	if (!req.body.ids) {
		return res.status(400).json({
			message: "Field 'ids' is required"
		});
	}

	if (!Array.isArray(req.body.ids)) {
		return res.status(400).json({
			message: `Field "ids" must be an array`
		});
	}

	if (!req.body.type) {
		return res.status(400).json({
			message: `Field "type" is required.`
		});
	}

	if (!["paint_charge", "max_charge"].includes(req.body.type)) {
		return res.status(400).json({
			message: `Field "type" can only has two values are 'paint_charge' and 'max_charge'`
		});
	}

	if (!req.body.amount) {
		return res.status(400).json({
			message: `Field "amount" is required.`
		});
	}

	if (!Number.isInteger(req.body.amount)) {
		return res.status(400).json({
			message: `Field "amount" must be an integer`
		});
	}

	const { ids, type, amount } = req.body;

	const accountManager = AccountManager.getInstance();

	res.setHeader("Content-Type", "text/event-stream");
	res.setHeader("Cache-Control", "no-cache");
	res.setHeader("Connection", "keep-alive");

	for (let i = 0; i < ids.length; i++) {
		if (i > 0) {
			// Add delay between requests
			await sleep(3500);
		}

		const accountId = ids[i];

		const account = accountManager.accounts.get(accountId);

		if (!account) {
			res.write(
				sendSSE(JSON.stringify({
					message: `Could not find account with ID ${accountId}`,
					accountId
				}), "error")
			);
			continue;
		}

		try {
			const result = await account.purchaseCharges(type, amount);

			if (result.status === "success") {
				res.write(
					sendSSE(JSON.stringify({
						message: result.message,
						accountId
					}), "success")
				);
			} else {
				res.write(
					sendSSE(JSON.stringify({
						message: result.message,
						accountId
					}), "failed")
				);
			}
		} catch (error) {
			res.write(
				sendSSE(JSON.stringify({
					message: `An error occurred while purchasing charges for account ID ${accountId}`,
					cause: (error as Error).message,
					accountId
				}), "error")
			);
		}
	}

	res.end();
}
