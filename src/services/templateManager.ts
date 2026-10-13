import { Template } from "../base/template.js";
import { DATA_FOLDER, UPLOADS_FOLDER } from "../const/index.js";
import { Logger } from "../libs/logger.js";
import type { UpdateTemplate } from "../types/request.js";
import type {
	TemplateDatabase,
	TemplateInformation,
} from "../types/template.js";
import { AccountManager } from "./accountManager.js";
import { DatabaseInstance } from "./database.js";
import * as fs from "node:fs/promises";

export class TemplateManager {
	private initialized = false;

	private static _instance: TemplateManager | null = null;

	public templates = new Map<number, Template>();

	public constructor() {}

	public static getInstance() {
		if (!this._instance) {
			this._instance = new TemplateManager();
		}

		return this._instance;
	}

	public async init() {
		const database = DatabaseInstance.getInstance();

		const getAllTemplates = database.prepare<{}, TemplateDatabase>(`
			SELECT * FROM templates;
		`);

		for (const _template of getAllTemplates.iterate({})) {
			const template = new Template(_template);
			const templateLogger = new Logger(["service", "Template Manager"]);

			try {
				await fs.access(
					`./${DATA_FOLDER}/${UPLOADS_FOLDER}/${template.imageName}`,
					fs.constants.F_OK,
				);
			} catch {
				templateLogger.error(
					`Could not find image "${template.imageName}" in folder "${UPLOADS_FOLDER}"`,
				);
				templateLogger.warn(
					`Template "${template.name}" will be disabled and cannot use.`,
				);

				template.disabled = true;
			}

			const { accounts } = AccountManager.getInstance();

			for (let i = 0; i < template.assignedAccounts.length; i++) {
				const account = accounts.get(template.assignedAccounts[i]);

				if (!account) {
					templateLogger.warn(
						`Template "${template.name}" have invalid account with ID ${template.assignedAccounts[i]}, this account will be removed.`,
					);

					template.assignedAccounts.splice(i, 1);
				}
			}

			if (template.assignedAccounts.length === 0) {
				templateLogger.error(
					`Template "${template.name}" doesnt have any account assigned, this template will be disabled and cannot use.`,
				);

				template.disabled = true;
			}

			this.templates.set(template.id, template);
		}

		this.initialized = true;
	}

	public addTemplate(data: Omit<TemplateInformation, "id" | "createdAt">) {
		if (!this.initialized) {
			throw new Error("Instance did not create correctly");
		}

		const database = DatabaseInstance.getInstance();

		const addNewTemplate = database.prepare<Omit<TemplateDatabase, "id" | "createdAt">>(`
			INSERT INTO templates (
				name, imageName, 
				imageInformation, assignedAccounts, 
				coordinates, setting
			)
			VALUES (
				@name, @imageName,
				@imageInformation, @assignedAccounts,
				@coordinates, @setting
			)
		`);

		addNewTemplate.run({
			name: data.name,
			imageName: data.imageName,

			imageInformation: JSON.stringify(data.imageInformation),
			assignedAccounts: JSON.stringify(data.assignedAccounts),
			coordinates: JSON.stringify(data.coordinates),
			setting: JSON.stringify(data.setting),
		});

		const getLastTemplate = database.prepare<{}, TemplateDatabase>(`
			SELECT * FROM templates ORDER BY id DESC LIMIT 1	
		`);

		const lastTemplate = getLastTemplate.get({})!;

		const template = new Template(lastTemplate);

		this.templates.set(template.id, template);

		console.log(`Created template name ${template.name}`);
	}

	public deleteTemplate(id: number) {
		if (!this.initialized) {
			throw new Error("Instance did not create correctly");
		}

		const template = this.templates.get(id);

		if (!template) {
			throw new Error(`Could not find any template with ID ${id}`);
		}

		this.templates.delete(id);

		const database = DatabaseInstance.getInstance();

		const removeTemplate = database.prepare<{ id: number }>(`
			DELETE FROM templates WHERE id = @id
		`);

		removeTemplate.run({ id });

		console.log(`Removed template "${template.name}" with ID ${id}`);
	}
}
