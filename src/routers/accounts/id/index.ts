import { Router } from "express";

import fetchUser from "../../../controllers/accounts/id/fetchUser.js";
import joinAlliance from "../../../controllers/accounts/id/joinAlliance.js";
import leaveAlliance from "../../../controllers/accounts/id/leaveAlliance.js";
import renameUser from "../../../controllers/accounts/id/renameUser.js";
import purchaseChargesUser from "../../../controllers/accounts/id/purchaseCharges.js";
import purchaseFlagUser from "../../../controllers/accounts/id/purchaseFlag.js";

const router = Router({ mergeParams: true });

router.get(`/user/fetch`, fetchUser);
router.patch(`/user/name`, renameUser);
router.post(`/user/alliance/join`, joinAlliance);
router.delete(`/user/alliance/leave`, leaveAlliance);
router.post(`/user/purchase/charge`, purchaseChargesUser);
router.post(`/user/purchase/flag`, purchaseFlagUser);

export default router;