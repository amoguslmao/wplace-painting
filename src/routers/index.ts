import { Router } from "express";

import image from "./image/index.js";
import compare from "./compare/index.js";
import accounts from "./accounts/index.js";

const route = Router();

route.use("/image", image);
route.use("/compare", compare);
route.use("/accounts", accounts);

export default route;