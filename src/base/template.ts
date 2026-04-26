import { DatabaseInstance } from "../services/database.js";
import type { 
	TemplateDatabase, 
	TemplateCoordinates, 
	TemplateSetting, 
	TemplateImageInformation 
} from "../types/template.js";

export class Template {
	public readonly id: number;
	public createdAt: string;
	public imageName: string;

	private _name: string;

	private _imageInformation: string;
	private _assignedAccounts: string;
	private _coordinates: string;
	private _setting: string;

	public constructor(data: TemplateDatabase) {
		this.id = data.id;
		this.createdAt = data.createdAt;
		this.imageName = data.imageName;
		
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
}