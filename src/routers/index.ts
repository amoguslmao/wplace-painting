import { Router } from "express";

import image from "./image/index.js";
import accounts from "./accounts/index.js";
import templates from "./templates/index.js";

const route = Router();

route.use("/image", image);
route.use("/accounts", accounts);
route.use("/templates", templates);

export default route;