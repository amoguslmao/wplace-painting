import { Router } from "express";

import addNewTemplate from "../../controllers/templates/addTemplate.js";
import getAllTemplates from "../../controllers/templates/getAllTemplates.js";

const router = Router();

router.get("/", getAllTemplates);
router.post("/", addNewTemplate);

export default router;