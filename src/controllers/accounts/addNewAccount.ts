import type { Request, Response } from "express";
import type { NeedJwtToken } from "../../types/request.js";
import { AccountManager } from "../../services/accountManager.js";

export default async function addNewAccount(req: Request<{}, {}, NeedJwtToken>, res: Response) {
	if (!req.body.jwtToken) {
		return res.status(400).json({
			message: "Field 'jwtToken' is required"
		});
	}
	
	const { jwtToken } = req.body;

	try {
		const accountManager = AccountManager.getInstance();

		const result = await accountManager.addAccount(jwtToken);

		res.status(200).json({
			message: "Successfully",
			addition: result
		});
	} catch (error) {
		res.status(502).json({
			message: "Could not add account",
			cause: error
		});
	}
}