import EnvConfig from "./config.js";
import { checkFiles } from "./utils/checkFiles.js";
import express from "express";
import cors from "cors";

import routers from "./routers/index.js";
import { exit } from "./utils/process.js";
import { DatabaseInstance } from "./services/database.js";
import { AccountManager } from "./services/accountManager.js";
import { TemplateManager } from "./services/templateManager.js";
import { AppSetting } from "./services/settings.js";
import { Logger } from "./libs/logger.js";

const logger = new Logger();

const servicesLogger = logger.getLogger("service");
const apiLogger = logger.getLogger("API");

// Database
const db = DatabaseInstance.getInstance();
servicesLogger.success("Database started");

process.on("SIGINT", () => exit(db));
process.on("SIGKILL", () => exit(db));
process.on("SIGTERM", () => exit(db));

// Checking the folder and some important file
await checkFiles();

// Setting
const appSetting = AppSetting.getInstance();

await appSetting.loadSetting();

servicesLogger.success(`App Setting is loaded`);

// Accounts
const accountManager = AccountManager.getInstance();

await accountManager.init();

servicesLogger.success("Account Manager is initilized");

// Templates
const templateManager = TemplateManager.getInstance();

templateManager.init();

servicesLogger.success("Template Manager is initilized");

// API
const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.static("./public"));
app.use("/api", routers);

app.listen(EnvConfig.port, EnvConfig.host, (err) => {
	if (err) {
		apiLogger.error("Error occured when making Express Instance", err);

		process.exit(1);
	}

	apiLogger.success(`API running on ${EnvConfig.host}:${EnvConfig.port}`);
});