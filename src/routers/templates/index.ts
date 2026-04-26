import { Router } from "express";

import addNewTemplate from "../../controllers/templates/addTemplate.js";
import getAllTemplates from "../../controllers/templates/getAllTemplates.js";
import getTemplateById from "../../controllers/templates/getTemplateById.js";
import deleteTemplateById from "../../controllers/templates/deleteTemplateById.js";
import changeTemplateStatus from "../../controllers/templates/changeTemplateStatus.js";
import getAssignedAccountsById from "../../controllers/templates/getAssignedAccountsById.js";
import updateTemplateById from "../../controllers/templates/updateTemplateById.js";

const router = Router();

router.get("/", getAllTemplates);
router.post("/", addNewTemplate);

router.get("/:id", getTemplateById);
router.delete("/:id", deleteTemplateById);
router.put("/:id", updateTemplateById);

router.patch("/:id/status", changeTemplateStatus);
router.get("/:id/assigned-accounts", getAssignedAccountsById);

export default router;