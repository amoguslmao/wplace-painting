import { Router } from "express";

import bulkFetchUser from "../../../controllers/accounts/bulk/fetchUser.js";
import bulkJoinAlliance from "../../../controllers/accounts/bulk/joinAlliance.js";
import bulkLeaveAlliance from "../../../controllers/accounts/bulk/leaveAlliance.js";
import bulkPurchaseCharges from "../../../controllers/accounts/bulk/purchaseCharges.js";
import bulkPurchaseFlags from "../../../controllers/accounts/bulk/purchaseFlag.js";

const router = Router();

router.post(`/user/fetch`, bulkFetchUser);
router.post(`/user/alliance/join`, bulkJoinAlliance);
router.delete(`/user/alliance/leave`, bulkLeaveAlliance);
router.post(`/user/purchase/charge`, bulkPurchaseCharges);
router.post(`/user/purchase/flag`, bulkPurchaseFlags);

export default router;
