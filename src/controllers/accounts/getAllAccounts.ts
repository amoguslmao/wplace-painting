import type { Request, Response } from "express";
import { AccountManager } from "../../services/accountManager.js";
import type { Account } from "../../base/account.js";

export default async function getAllAccounts(_: Request,res: Response) {
	const accountManager = AccountManager.getInstance();

	const { accounts } = accountManager;

	const result: Pick<Account, "jwtToken" | "user" | "lastFetch" | "id">[] = [];

	//console.log(accounts);

	for (const account of accounts.values()) {
		result.push({
			id: account.id,
			user: account.user,
			jwtToken: account.jwtToken,
			lastFetch: account.lastFetch,
		});
	}

	return res.status(200).json(result);
}