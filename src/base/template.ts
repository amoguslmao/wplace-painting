import type { 
	TemplateDatabase, 
	TemplateCoordinates, 
	TemplateSetting, 
	TemplateImageInformation 
} from "../types/template.js";

export class Template {
	public readonly id: number;
	public name: string;
	public createdAt: string;
	public imageName: string;

	private _imageInformation: string;
	private _assignedAccounts: string;
	private _coordinates: string;
	private _setting: string;

	public constructor(data: TemplateDatabase) {
		this.id = data.id;
		this.name = data.name;
		this.createdAt = data.createdAt;
		this.imageName = data.imageName;

		this._assignedAccounts = data.assignedAccounts;
		this._coordinates = data.coordinates;
		this._imageInformation = data.imageInformation;
		this._setting = data.setting;
	}

	public get assignedAccounts(): number[] {
		return JSON.parse(this._assignedAccounts);
	}

	public get imageInformation(): TemplateImageInformation {
		return JSON.parse(this._imageInformation);
	}

	public get coordinates(): TemplateCoordinates {
		return JSON.parse(this._coordinates);
	}

	public get setting(): TemplateSetting {
		return JSON.parse(this._setting);
	}
}