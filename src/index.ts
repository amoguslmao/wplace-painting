import EnvConfig from "./config.js";
import { checker } from "./utils/checker.js";
import express from "express";
import cors from "cors";

import routers from "./routers/index.js";

// First, run checking the folder and some important file
await checker();

// API
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("./public"));
app.use("/api", routers);

app.listen(EnvConfig.port, EnvConfig.host, (err) => {
	if (err) {
		console.error("Error occured when making Express Instance", err);

		process.exit(1);
	}

	console.log(`API running on ${EnvConfig.host}:${EnvConfig.port}`);
});