import EnvConfig from "./config.js";
import { checkFiles } from "./utils/checkFiles.js";
import express from "express";
import cors from "cors";

import routers from "./routers/index.js";
import { exit } from "./utils/process.js";
import { DatabaseInstance } from "./services/database.js";
import { AccountManager } from "./services/accountManager.js";
import { TemplateManager } from "./services/templateManager.js";

// Database
const db = DatabaseInstance.getInstance();
console.log(`Database started`);

process.on("SIGINT", () => exit(db));
process.on("SIGKILL", () => exit(db));
process.on("SIGTERM", () => exit(db));

// Checking the folder and some important file
await checkFiles();

// Accounts
const accountManager = AccountManager.getInstance();

await accountManager.init();

console.log(`Account Manager is initilized`);

// Templates
const templateManager = TemplateManager.getInstance();

templateManager.init();

console.log(`Template Manager is initilized`);

// API
const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.static("./public"));
app.use("/api", routers);

app.listen(EnvConfig.port, EnvConfig.host, (err) => {
	if (err) {
		console.error("Error occured when making Express Instance", err);

		process.exit(1);
	}

	console.log(`API running on ${EnvConfig.host}:${EnvConfig.port}`);
});