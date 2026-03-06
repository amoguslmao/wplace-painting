import { Router } from "express";

import fetchUser from "../../../controllers/accounts/id/fetchUser.js";
import joinAlliance from "../../../controllers/accounts/id/joinAlliance.js";
import leaveAlliance from "../../../controllers/accounts/id/leaveAlliance.js";
import renameUser from "../../../controllers/accounts/id/renameUser.js";

const router = Router();

router.get(`/user/fetch`, fetchUser);
router.patch(`/user/name`, renameUser);
router.post(`/user/alliance/join`, joinAlliance);
router.delete(`/user/alliance/leave`, leaveAlliance);

export default router;