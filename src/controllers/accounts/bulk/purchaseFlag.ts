import type { Request, Response } from "express";
import type { BulkPurchaseFlags } from "../../../types/request.js";
import { AccountManager } from "../../../services/accountManager.js";
import { sleep } from "../../../utils/promises.js";
import { sendSSE } from "../../../utils/string.js";

export default async function bulkPurchaseFlags(
	req: Request<{}, {}, BulkPurchaseFlags>,
	res: Response,
) {
	if (!req.body.ids) {
		return res.status(400).json({
			message: "Field 'ids' is required",
		});
	}

	if (!Array.isArray(req.body.ids)) {
		return res.status(400).json({
			message: `Field "ids" must be an array`,
		});
	}

	if (!req.body.flagId) {
		return res.status(400).json({
			message: `Field "flagId" is required.`,
		});
	}

	const { ids, flagId } = req.body;

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
				sendSSE(
					JSON.stringify({
						message: `Could not find account with ID ${accountId}`,
						accountId,
					}),
					"error",
				),
			);
			continue;
		}

		try {
			const result = await account.purchaseFlags(flagId);

			if (result.status === "success") {
				res.write(
					sendSSE(
						JSON.stringify({
							message: result.message,
							accountId,
						}),
						"success",
					),
				);
			} else {
				res.write(
					sendSSE(
						JSON.stringify({
							message: result.message,
							accountId,
						}),
						"failed",
					),
				);
			}
		} catch (error) {
			res.write(
				sendSSE(
					JSON.stringify({
						message: `An error occurred while purchasing flag for account ID ${accountId}`,
						cause: (error as Error).message,
						accountId,
					}),
					"error",
				),
			);
		}
	}

	res.end();
}
