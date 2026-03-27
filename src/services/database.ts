import Database from "better-sqlite3";
import { DATA_FOLDER, DATABASE_NAME } from "../const/index.js";

export class DatabaseInstance extends Database {
	private static instance: DatabaseInstance | null = null;

	public constructor() {
		super(`./${DATA_FOLDER}/${DATABASE_NAME}`, {
			// verbose: console.log
		});

		this.pragma(`journal_mode = WAL;`);

		this.exec(`
			CREATE TABLE IF NOT EXISTS users(
				id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
				jwtToken TEXT NOT NULL,
				lastFetch INT NOT NULL,
				user TEXT NOT NULL
			);
		`);

		this.exec(`
			CREATE TABLE IF NOT EXISTS templates(
				id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
				createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
				name TEXT NOT NULL DEFAULT '',
				imageName TEXT NOT NULL,

				imageInformation TEXT NOT NULL,
				assignedAccounts TEXT NOT NULL,
				coordinates TEXT NOT NULL,
				setting TEXT NOT NULL
			);
		`);
	}

	public static getInstance() {
		if (!this.instance) {
			this.instance = new DatabaseInstance();
		}

		return this.instance;
	}
}