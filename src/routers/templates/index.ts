import { Router } from "express";

import addNewTemplate from "../../controllers/templates/addTemplate.js";
import getAllTemplates from "../../controllers/templates/getAllTemplates.js";
import getTemplateById from "../../controllers/templates/getTemplateById.js";
import deleteTemplateById from "../../controllers/templates/deleteTemplateById.js";

const router = Router();

router.get("/", getAllTemplates);
router.post("/", addNewTemplate);
router.get("/:id", getTemplateById);
router.delete("/:id", deleteTemplateById);

export default router;