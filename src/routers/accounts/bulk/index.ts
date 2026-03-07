import { Router } from "express";

import bulkFetchUser from "../../../controllers/accounts/bulk/fetchUser.js";
import bulkJoinAlliance from "../../../controllers/accounts/bulk/joinAlliance.js";
import bulkLeaveAlliance from "../../../controllers/accounts/bulk/leaveAlliance.js";

const router = Router();

router.post(`/user/fetch`, bulkFetchUser);
router.post(`/user/alliance/join`, bulkJoinAlliance);
router.delete(`/user/alliance/leave`, bulkLeaveAlliance);

export default router;