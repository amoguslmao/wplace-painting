import { config } from "dotenv";

config();

const EnvConfig = {
	port: Number(process.env.PORT!),
	host: process.env.HOST!,
	baseURL: process.env.BASE_URL!
};

export default EnvConfig;