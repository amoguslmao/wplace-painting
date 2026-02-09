import { Router } from "express";
import compareImage from "../../controllers/compare/index.js";
import multer from "multer";

const route = Router();

const mt = multer({
	storage: multer.memoryStorage()
})

route.post("/", mt.single("image"), compareImage);

export default route;