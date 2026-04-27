import { Router } from "express";

import image from "./image/index.js";
import accounts from "./accounts/index.js";
import templates from "./templates/index.js";
import app from "./app/index.js";

const route = Router();

route.use("/image", image);
route.use("/accounts", accounts);
route.use("/templates", templates);
route.use("/app", app);

export default route;