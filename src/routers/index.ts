import { Router } from "express";

import image from "./image/index.js";
import compare from "./compare/index.js";

const route = Router();

route.use("/image", image);
route.use("/compare", compare);

export default route;