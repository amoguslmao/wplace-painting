import type { Request, Response } from "express";
import type { BulkJoinAlliance } from "../../../types/request.js";
import { AccountManager } from "../../../services/accountManager.js";
import { sleep } from "../../../utils/promises.js";
import { sendSSE } from "../../../utils/string.js";

export default async function bulkJoinAlliance(req: Request<{}, {}, BulkJoinAlliance>, res: Response) {
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

	if (!req.body.allianceUUID) {
		return res.status(400).json({
			message: `Field "allianceUUID" is required.`
		});
	}

	const { ids, allianceUUID } = req.body;

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
				}), "failed")
			);
			continue;
		}

		try {
			const result = await account.joinAlliance(allianceUUID);

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
					message: `An error occurred while joining alliance for account ID ${accountId}`,
					cause: error,
					accountId
				}), "error")
			);

			console.error(error);
		}
	}

	res.end();
}