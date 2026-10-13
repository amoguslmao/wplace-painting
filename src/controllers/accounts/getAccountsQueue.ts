import type { Request, Response } from "express";
import { AccountManager } from "../../services/accountManager.js";
import { AccountQueue } from "../../libs/queue.js";

export default function getAccountsQueue(_: Request, res: Response) {
    const { accounts } = AccountManager.getInstance();

    const accIds = Array.from(accounts.keys());

    const accountQueue = new AccountQueue(accIds);

    return res.status(200).json(accountQueue.getQueue());
}