import { config } from "dotenv";

config();

const EnvConfig = {
	port: Number(process.env.PORT!),
	logLevel: Number(process.env.LOG_LEVEL!),
	host: process.env.HOST!,
	baseURL: process.env.BASE_URL!
};

export default EnvConfig;