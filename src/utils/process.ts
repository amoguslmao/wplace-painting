import type { ChildProcess, Serializable } from "node:child_process";
import type { DatabaseInstance } from "../services/database.js";
import { Logger } from "../libs/logger.js";
import type { TemplateManager } from "../services/templateManager.js";

export function exit(db?: DatabaseInstance, templateManager?: TemplateManager) {
	const logger = new Logger(["service"]);

	if (templateManager) {
		const { templates } = templateManager;
		const templateLogger = logger.getLogger("Template Manager");

		let count = 0;

		for (const template of templates.values()) {
			if (template.isRunning()) {
				template.stop();

				count++;

				templateLogger.info(
					`Template ${template.name} has been stopped`,
				);
			}
		}

		if (count > 0) {
			templateLogger.success(
				`Successfully stopped all running templates`,
			);
		}
	}

	if (db) {
		db.close();
		logger.info(`Database closed`);
	}

	process.exit(0);
}

export function sendMessage<Type extends Serializable>(
	process: NodeJS.Process | ChildProcess,
	message: Type,
) {
	return process.send?.(message);
}
