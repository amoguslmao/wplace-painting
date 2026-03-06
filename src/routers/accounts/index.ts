import { Router } from "express";

import idRouter from "./id/index.js";
import bulkRouter from "./bulk/index.js";

import getAllAccounts from "../../controllers/accounts/getAllAccounts.js";
import bulkAddAccounts from "../../controllers/accounts/addNewAccount.js";
import deleteAccount from "../../controllers/accounts/deleteAccount.js";

const router = Router();

router.get(`/`, getAllAccounts);
router.post(`/add`, bulkAddAccounts);
router.delete(`/:id`, deleteAccount)

router.use(`/bulk`, bulkRouter);
router.use(`/:id`, idRouter);

export default router;