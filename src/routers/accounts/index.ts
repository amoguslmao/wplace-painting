import { Router } from "express";

import getAllAccounts from "../../controllers/accounts/getAllAccounts.js";
import addNewAccount from "../../controllers/accounts/addNewAccount.js";

const router = Router();

router.get(`/`, getAllAccounts);
router.post(`/add`, addNewAccount);

export default router;