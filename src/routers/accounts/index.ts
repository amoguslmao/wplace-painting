import { Router } from "express";

import getAllAccounts from "../../controllers/accounts/getAllAccounts.js";
import bulkAddAccounts from "../../controllers/accounts/addNewAccount.js";
import deleteAccount from "../../controllers/accounts/deleteAccount.js";
import fetchUser from "../../controllers/accounts/fetchUser.js";
import renameUser from "../../controllers/accounts/renameUser.js";

const router = Router();

router.get(`/`, getAllAccounts);
router.post(`/add`, bulkAddAccounts);
router.delete(`/:id`, deleteAccount)

router.get(`/:id/user/fetch`, fetchUser);
router.patch(`/:id/user/name`, renameUser);

export default router;