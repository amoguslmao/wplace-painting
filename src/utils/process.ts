import type { DatabaseInstance } from "../services/database.js";

export function exit(db: DatabaseInstance) {
	db.close();

	console.log(`Database closed`);

	process.exit(0);
}