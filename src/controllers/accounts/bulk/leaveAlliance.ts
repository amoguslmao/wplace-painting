import type { Request, Response } from "express";
import type { BulkLeaveAlliance } from "../../../types/request.js";
import { AccountManager } from "../../../services/accountManager.js";
import { sleep } from "../../../utils/promises.js";
import { sendSSE } from "../../../utils/string.js";

export default async function bulkLeaveAlliance(req: Request<{}, {}, BulkLeaveAlliance>, res: Response) {
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

	const { ids } = req.body;

	const accountManager = AccountManager.getInstance();

	res.setHeader("Content-Type", "text/event-stream");
	res.setHeader("Cache-Control", "no-cache");
	res.setHeader("Connection", "keep-alive");

	for (let i = 0; i < ids.length; i++) {
		if (i > 0) {
			// Add delay between requests
			await sleep(1000);
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
			const result = await account.leaveAlliance();

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
					message: `An error occurred while leaving alliance for account ID ${accountId}`,
					cause: error,
					accountId
				}), "error")
			);

			console.error(error);
		}
	}

	res.end();
}