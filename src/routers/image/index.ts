import { Router } from "express";
import multer from "multer";

import uploadImage from "../../controllers/image/uploadImage.js";
import getImageByName from "../../controllers/image/getImageByName.js";
import imagePalleteCheck from "../../controllers/image/palleteCheck.js";

const router = Router();

const diskStorage = multer({ 
	storage: multer.diskStorage({
		destination: "./database/uploads",
		filename(_, file, callback) {
			const { originalname } = file;

			callback(null, originalname.trim().replaceAll(" ", "_"));
		}
	})
});

const memStorage = multer({
	storage: multer.memoryStorage(),
})

router.post("/pallete-check", memStorage.single("image"), imagePalleteCheck);
router.post("/", diskStorage.single("image"), uploadImage);
router.get("/:imageName", getImageByName);

export default router;