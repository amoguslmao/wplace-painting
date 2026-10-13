import { config } from "dotenv";
import { WPLACE_BACKEND_DOMAIN } from "./const/index.js";

config();

const EnvConfig = {
	port: Number(process.env.PORT!),
	logLevel: Number(process.env.LOG_LEVEL!),
	host: process.env.HOST!,
	baseURL: process.env.BASE_URL!,
	instanceType: process.env.BASE_URL! === WPLACE_BACKEND_DOMAIN ? "wplace" : "openplace" as "wplace" | "openplace",
};

export default EnvConfig;
