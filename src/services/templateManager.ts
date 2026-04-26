import { Template } from "../base/template.js";
import type { TemplateDatabase, TemplateInformation } from "../types/template.js";
import type { OperationResult } from "../types/utils.js";
import { DatabaseInstance } from "./database.js";
import { ChildProcess, fork } from "node:child_process";

export class TemplateManager {
	private initialized = false;

	private static _instance: TemplateManager | null = null;

	private runningTemplates = new Map<number, ChildProcess>();

	public templates = new Map<number, Template>();

	public constructor() {}

	public static getInstance() {
		if (!this._instance) {
			this._instance = new TemplateManager();
		}

		return this._instance;
	}

	public init() {
		const database = DatabaseInstance.getInstance();

		const getAllTemplates = database.prepare<{}, TemplateDatabase>(`
			SELECT * FROM templates;	
		`);

		for (const _template of getAllTemplates.iterate({})) {
			const template = new Template(_template);

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
			setting: JSON.stringify(data.setting)
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

	public startTemplate(id: number): OperationResult {
		if (!this.initialized) {
			throw new Error("Instance did not created correctly");
		}

		const template = this.templates.get(id);

		if (!template) {
			return {
				message: `Could not find template with id ${id}`,
				status: "failed"
			}
		}

		if (this.runningTemplates.has(template.id)) {
			return {
				message: `The template ${template.name}#${template.id} is currently running`,
				status: "failed"
			}
		}

		const templateProcess = fork(`./dist/workers/paintTemplate.mjs`);

		templateProcess.on("message", (message) => {
			console.log(message);
		});

		templateProcess.send({
			template
		});

		this.runningTemplates.set(template.id, templateProcess);

		return {
			message: `Started template ${template.name}#${template.id}`,
			status: "success"
		}
	}

	public stopTemplate(id: number): OperationResult {
		if (!this.initialized) {
			throw new Error("Instance did not created correctly");
		}

		const template = this.templates.get(id);

		if (!template) {
			throw new Error(`Could not find template with id ${id}`);
		}

		const templateProcess = this.runningTemplates.get(template.id);

		if (!templateProcess) {
			return {
				message: `Template ${template.name}#${template.id} is not started to stop`,
				status: "failed"
			}
		}

		templateProcess.kill();

		console.log(`Stopped template ${template.name}#${template.id}`);

		return {
			message: `Stopped template ${template.name}#${template.id}`,
			status: "success"
		}
	}
}