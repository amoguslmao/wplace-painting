import * as fs from "node:fs/promises";
import { DATA_FOLDER, UPLOADS_FOLDER, USERS_FILE_NAME } from "../const/index.js";

async function dataFolderCheck() {
	try {
		await fs.access(`./${DATA_FOLDER}`, fs.constants.F_OK);
	} catch (err) {
		console.log(`Folder "${DATA_FOLDER}" doesnt exist. Creating new one...`);

		await fs.mkdir(`./${DATA_FOLDER}`, { recursive: true });
		
		console.log(`Created "${DATA_FOLDER}" folder`);
	}
}

async function usersJSONCheck() {
	const path = `./${DATA_FOLDER}/${USERS_FILE_NAME}`;

	try {
		await fs.access(path, fs.constants.F_OK);
	}
	catch (err) {
		console.log(`File ${USERS_FILE_NAME} doesnt exist. Creating new one...`);

		await fs.writeFile(path, "[]");

		console.log(`Created file "${USERS_FILE_NAME}"`);
	}
}

async function uploadsFolderCheck() {
	const path = `./${DATA_FOLDER}/${UPLOADS_FOLDER}`;

	try {
		await fs.access(path, fs.constants.F_OK);
	}
	catch (err) {
		console.log(`Folder "${UPLOADS_FOLDER}" doesnt exist. Creating new one...`);

		await fs.mkdir(path, { recursive: true });

		console.log(`Created "${UPLOADS_FOLDER}" folder`);
	}
}

export async function checker() {
	await dataFolderCheck();
	await uploadsFolderCheck();
	await usersJSONCheck();
}