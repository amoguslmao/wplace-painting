import { Router } from "express";

import getAllAccounts from "../../controllers/accounts/getAllAccounts.js";
import addNewAccount from "../../controllers/accounts/addNewAccount.js";
import deleteAccount from "../../controllers/accounts/deleteAccount.js";

const router = Router();

router.get(`/`, getAllAccounts);
router.post(`/add`, addNewAccount);
router.delete(`/:id`, deleteAccount)

export default router;