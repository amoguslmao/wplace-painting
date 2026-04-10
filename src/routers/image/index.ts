import { Router } from "express";
import multer from "multer";

import uploadImage from "../../controllers/image/upload.js";
import getImages from "../../controllers/image/get.js";
import listImages from "../../controllers/image/list.js";

const router = Router();

const ml = multer({ 
	storage: multer.diskStorage({
		destination: "./database/uploads",
		filename(_, file, callback) {
			callback(null, file.originalname);
		}
	})
});

route.post("/upload", ml.single("image"), uploadImage);
route.get("/list", listImages);
route.get("/:imageName", getImages);

export default router;