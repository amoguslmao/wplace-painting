import type { ChildProcess, Serializable } from "node:child_process";
import type { DatabaseInstance } from "../services/database.js";
import { Logger } from "../libs/logger.js";

export function exit(db: DatabaseInstance) {
	const logger = new Logger(["service"]);

	db.close();

	logger.info(`Database closed`);

	process.exit(0);
}

export function sendMessage<Type extends Serializable>(process: NodeJS.Process | ChildProcess, message: Type) {
	return process.send?.(message);
}