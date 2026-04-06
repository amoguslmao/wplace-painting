import type { Request, Response } from "express";
import type { BulkFetchUser } from "../../../types/request.js";
import { AccountManager } from "../../../services/accountManager.js";
import { sleep } from "../../../utils/promises.js";
import { sendSSE } from "../../../utils/string.js";

export default async function bulkFetchUser(req: Request<{}, {}, BulkFetchUser>, res: Response) {
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
			console.log(`Website asked to fetch user with account ID ${accountId}, fetching...`);

			const me = await account.me();

			res.write(
				sendSSE(JSON.stringify({
					message: `Fetched user ${me.name}#${me.id} with account ID ${accountId}`,
					user: me,
					accountId
				}), "success")
			);
		} catch (error) {
			res.write(
				sendSSE(JSON.stringify({
					message: `An error occurred while fetching user with account ID ${accountId}`,
					cause: error,
					accountId
				}), "error")
			);

			console.error(error);
		}
	}

	res.end();
}