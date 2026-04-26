import { Router } from "express";

import addNewTemplate from "../../controllers/templates/addTemplate.js";
import getAllTemplates from "../../controllers/templates/getAllTemplates.js";
import getTemplateById from "../../controllers/templates/getTemplateById.js";

const router = Router();

router.get("/", getAllTemplates);
router.post("/", addNewTemplate);
router.get("/:id", getTemplateById);

export default router;