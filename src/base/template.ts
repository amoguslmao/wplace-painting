import { DatabaseInstance } from "../services/database.js";
import type { 
	TemplateDatabase, 
	TemplateCoordinates, 
	TemplateSetting, 
	TemplateImageInformation 
} from "../types/template.js";
import type { ChildProcessMessage, MainProcessEvents, MainProcessMessage } from "../types/event.js";
import { sendMessage } from "../utils/process.js";
import { fork, type ChildProcess } from "node:child_process";
import EventEmitter from "node:events";
import type { OperationResult } from "../types/utils.js";

export class Template {
	public readonly id: number;
	public createdAt: string;
	public imageName: string;

	private process: ChildProcess | null;
	private event: EventEmitter<MainProcessEvents> | null;

	private _name: string;
	private _imageInformation: string;
	private _assignedAccounts: string;
	private _coordinates: string;
	private _setting: string;
	

	public constructor(data: TemplateDatabase) {
		this.id = data.id;
		this.createdAt = data.createdAt;
		this.imageName = data.imageName;
		
		this.process = null;
		this.event = null;

		this._name = data.name;
		this._assignedAccounts = data.assignedAccounts;
		this._coordinates = data.coordinates;
		this._imageInformation = data.imageInformation;
		this._setting = data.setting;
	}

	public get name() {
		return this._name;
	}

	public set name(value: string) {
		this._name = value;

		const database = DatabaseInstance.getInstance();

		const updateTemplateName = database.prepare<{ name: string, id: number }>(`
			UPDATE templates
			SET name = @name
			WHERE id = @id	
		`);

		updateTemplateName.run({
			name: value,
			id: this.id
		});
	}

	public get assignedAccounts(): number[] {
		return JSON.parse(this._assignedAccounts);
	}

	public set assignedAccounts(value: number[]) {
		this._assignedAccounts = JSON.stringify(value);

		const database = DatabaseInstance.getInstance();

		const updateTemplateAssignedAccounts = database.prepare<{
			assignedAccounts: string,
			id: number
		}>(`
			UPDATE templates
			SET assignedAccounts = @assignedAccounts
			WHERE id = @id	
		`);

		updateTemplateAssignedAccounts.run({
			assignedAccounts: JSON.stringify(value),
			id: this.id
		});
	}

	public get coordinates(): TemplateCoordinates {
		return JSON.parse(this._coordinates);
	}

	public set coordinates(value: TemplateCoordinates) {
		this._coordinates = JSON.stringify(value);

		const database = DatabaseInstance.getInstance();

		const updateTemplateCoordinates = database.prepare<{
			coordinates: string,
			id: number
		}>(`
			UPDATE templates
			SET coordinates = @coordinates
			WHERE id = @id	
		`);

		updateTemplateCoordinates.run({
			coordinates: JSON.stringify(value),
			id: this.id
		});
	}

	public get setting(): TemplateSetting {
		return JSON.parse(this._setting);
	}

	public set setting(value: TemplateSetting) {
		this._setting = JSON.stringify(value);

		const database = DatabaseInstance.getInstance();

		const updateTemplateSetting = database.prepare<{
			setting: string,
			id: number
		}>(`
			UPDATE templates
			SET setting = @setting
			WHERE id = @id
		`);

		updateTemplateSetting.run({
			setting: JSON.stringify(value),
			id: this.id
		});
	}

	public get imageInformation(): TemplateImageInformation {
		return JSON.parse(this._imageInformation);
	}

	public start(): OperationResult {
		if (this.process || this.event) {
			return {
				message: `Template ${this.name} has been started before`,
				status: "failed"
			}
		}

		this.process = fork("./dist/workers/paintTemplate.mjs");
		this.event = new EventEmitter<MainProcessEvents>();

		this.process.on("message", (message: MainProcessMessage) => {
			if (!this.event) {
				throw new Error("Property 'event' must be not null when template is running");
			}

			switch (message.op) {
				case "response_status": {
					this.event.emit("response_status", message.data.painted, message.sequence);
					break;
				}
				case "response_info": {
					this.event.emit("response_info", message.data.memory, message.sequence);
					break;
				}
				default: {
					console.error("Unknown message op received from child");
				}
			}
		});

		this.process.on("exit", (code) => {
			console.error(`Process exited with code ${code}`);
		})

		sendMessage<ChildProcessMessage>(this.process, {
			op: "init_process",
			data: { 
				template: 
				{
					id: this.id,
					name: this.name,
					createdAt: this.createdAt,
					imageName: this.imageName,

					imageInformation: this.imageInformation,
					assignedAccounts: this.assignedAccounts,
					coordinates: this.coordinates,
					setting: this.setting
				} 
			}
		})

		return {
			message: `Started template ${this.name}`,
			status: "success"
		}
	}

	public stop(): OperationResult {
		if (!this.process || !this.event) {
			return {
				message: `Template ${this.name} has not started before`,
				status: "failed"
			}
		}

		this.process.removeAllListeners();
		this.event.removeAllListeners();

		this.process.kill();

		this.process = null;
		this.event = null;

		return {
			message: `Stopped template ${this.name}`,
			status: "success"
		}
	}

	public isRunning(): boolean {
		return this.process !== null;
	}

	public getStatus() {
		return new Promise((resolve, reject) => {
			if (!this.event) {
				reject(new Error("Template didnt started before to use this method."));
				return;
			}

			// làm đại đại chứ chưa biết như nào
			this.event.once("get_status", (result: any) => {
				resolve(result);
			});
		});
	}
}