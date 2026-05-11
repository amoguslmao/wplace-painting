import type { ChildProcess, Serializable } from "node:child_process";
import type { DatabaseInstance } from "../services/database.js";

export function exit(db: DatabaseInstance) {
	db.close();

	console.log(`Database closed`);

	process.exit(0);
}

export function sendMessage<Type extends Serializable>(process: NodeJS.Process | ChildProcess, message: Type) {
	return process.send?.(message);
}