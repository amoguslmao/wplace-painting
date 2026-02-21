import type { Request, Response } from "express";
import { AccountManager } from "../../services/accountManager.js";

export default async function fetchUser(req: Request<{ id: string }>, res: Response) {
	const accountId = Number(req.params.id);

	if (!accountId) {
		return res.status(400).json({
			message: "Param `accountId` is required."
		});
	}

	const accountManager = AccountManager.getInstance();

	const account = accountManager.accounts.get(accountId);

	if (!account) {
		return res.status(404).json({
			message: `Could not find account with ID ${accountId}`
		});
	}

	try {
		console.log(`Website asked to fetch user with account ID ${accountId}, fetching...`);

		const me = await account.me();

		res.status(200).json({
			message: `Fetched user ${me.name}#${me.id} with account ID ${accountId}`,
			user: me
		});
	} catch (error) {
		res.status(500).json({
			message: `An error occurred while fetching user with account ID ${accountId}`,
			cause: error
		});

		console.error(error);
	}
}