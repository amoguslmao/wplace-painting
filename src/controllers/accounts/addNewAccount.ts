import type { Request, Response } from "express";
import type { NeedJwtToken } from "../../types/request.js";
import { AccountManager } from "../../services/accountManager.js";
import { sleep } from "../../utils/promises.js";
import { sendSSE } from "../../utils/string.js";

export default async function bulkAddAccounts(req: Request<{}, {}, NeedJwtToken>, res: Response) {
	if (!req.body.tokens) {
		return res.status(400).json({
			message: "Field 'jwtTokens' is required"
		});
	}

	if (!Array.isArray(req.body.tokens)) {
		return res.status(400).json({
			message: `Field "jwtTokens" must be an array`
		});
	}
	
	const { tokens } = req.body;

	try {
		const accountManager = AccountManager.getInstance();

		res.setHeader("Content-Type", "text/event-stream");
		res.setHeader("Cache-Control", "no-cache");
		res.setHeader("Connection", "keep-alive");

		for (let i = 0; i < tokens.length; i++) {
			if (i + 1 <= tokens.length && i > 0) {
				// TODO: change the behavior when fetching each account
				await sleep(5000);
			}

			const result = await accountManager.addAccount(tokens[i]);

			res.write(
				sendSSE(JSON.stringify({ message: result.message }), result.status)
			);
		}

		res.end();
	} catch (error) {
		res.write(
			sendSSE(JSON.stringify({
				message: "An error ocurred when fetching",
				cause: error
			}), "error")
		);

		res.end();

		console.error(`An error occurred in endpoint ${req.url}`, error);
	}
}