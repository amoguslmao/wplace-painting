import { Router } from "express";

import fetchUser from "../../../controllers/accounts/fetchUser.js";
import joinAlliance from "../../../controllers/accounts/joinAlliance.js";
import leaveAlliance from "../../../controllers/accounts/leaveAlliance.js";
import renameUser from "../../../controllers/accounts/renameUser.js";

const router = Router();

router.get(`/user/fetch`, fetchUser);
router.patch(`/user/name`, renameUser);
router.post(`/user/alliance/join`, joinAlliance);
router.delete(`/user/alliance/leave`, leaveAlliance);

export default router;