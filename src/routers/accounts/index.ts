import { Router } from "express";

import idRouter from "./id/index.js";
import bulkRouter from "./bulk/index.js";

import getAllAccounts from "../../controllers/accounts/getAllAccounts.js";
import bulkAddAccounts from "../../controllers/accounts/addNewAccount.js";
import deleteAccount from "../../controllers/accounts/deleteAccount.js";
import getAccountById from "../../controllers/accounts/getAccountById.js";

const router = Router();

router.get(`/`, getAllAccounts);
router.post(`/`, bulkAddAccounts);
router.get(`/:id`, getAccountById);
router.delete(`/:id`, deleteAccount);

router.use(`/bulk`, bulkRouter);
router.use(`/:id`, idRouter);

export default router;