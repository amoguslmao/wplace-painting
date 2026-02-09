import { Router } from "express";
import multer from "multer";

import uploadImage from "../../controllers/image/upload.js";
import getImages from "../../controllers/image/get.js";

const route = Router();

const ml = multer({ 
	storage: multer.diskStorage({
		destination: "./database/uploads",
		filename(_, file, callback) {
			callback(null, file.originalname);
		}
	})
});

route.post("/", ml.single("image"), uploadImage);
route.get("/", getImages);

export default route;