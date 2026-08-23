import type { Request, Response } from "express";
import { AccountManager } from "../../../services/accountManager.js";
import type { IdParam } from "../../../types/request.js";

export default async function fetchUser(req: Request<IdParam>, res: Response) {
	const accountId = Number(req.params.id);

	const accountManager = AccountManager.getInstance();

	const account = accountManager.accounts.get(accountId);

	if (!account) {
		return res.status(404).json({
			message: `Could not find account with ID ${accountId}`,
		});
	}

	try {
		console.log(`Website asked to fetch user with account ID ${accountId}, fetching...`);

		const me = await account.me();

		res.status(200).json({
			message: `Fetched user ${me.name}#${me.id} with account ID ${accountId}`,
			user: me,
		});
	} catch (error) {
		res.status(500).json({
			message: `An error occurred while fetching user with account ID ${accountId}`,
			cause: (error as Error).message,
		});

		console.error((error as Error).message);
	}
}
