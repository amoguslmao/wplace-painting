import { Router } from "express";
import getAppSetting from "../../controllers/app/getSetting.js";
import getAppInformation from "../../controllers/app/getInformation.js";
import updateAppSetting from "../../controllers/app/updateSetting.js";

const router = Router();

router.get("/setting", getAppSetting);
router.put("/setting", updateAppSetting);
router.get("/info", getAppInformation);

export default router;