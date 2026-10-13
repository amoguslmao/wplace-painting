import EnvConfig from "./config.js";
import express from "express";
import cors from "cors";
import routers from "./routers/index.js";

import { exit } from "./utils/process.js";
import { checkFiles } from "./utils/checkFiles.js";
import { DatabaseInstance } from "./services/database.js";
import { AccountManager } from "./services/accountManager.js";
import { TemplateManager } from "./services/templateManager.js";
import { AppSetting } from "./services/settings.js";
import { Logger } from "./libs/logger.js";

const logger = new Logger();
const servicesLogger = logger.getLogger("service");
const apiLogger = logger.getLogger("API");

let templateManager: TemplateManager | undefined, database: DatabaseInstance | undefined;

process.on("SIGINT", () => exit(database, templateManager));
process.on("SIGTERM", () => exit(database, templateManager));

// Database
database = DatabaseInstance.getInstance();
servicesLogger.success("Database started");

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
templateManager = TemplateManager.getInstance();

await templateManager.init();

servicesLogger.success("Template Manager is initilized");

if (EnvConfig.instanceType === "openplace") {
	logger.warn(`Currently using "${EnvConfig.instanceType}" instance! Some function will be restricted,`);
	logger.warn("because openplace instance did not up-to-date with wplace.");
}

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

	apiLogger.success(`API is running on ${EnvConfig.host}:${EnvConfig.port}`);
});