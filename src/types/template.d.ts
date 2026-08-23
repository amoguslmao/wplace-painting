export interface TemplateDatabase {
	id: number;
	name: string;
	createdAt: string;
	imageName: string;

	imageInformation: string;
	assignedAccounts: string;
	coordinates: string;
	setting: string;
}

export interface TemplateInformation {
	id: number;
	name: string;
	createdAt: string;
	imageName: string;

	imageInformation: TemplateImageInformation;
	assignedAccounts: number[];
	coordinates: TemplateCoordinates;
	setting: TemplateSetting;
}

export interface TemplateImageInformation {
	width: number;
	height: number;
	usedColors: UsedColor[];
}

export interface UsedColor {
	total: number;
	colorId: number | null;
}

export type TemplateCoordinates = [
	tileX: number,
	tileY: number,
	pixelX: number,
	pixelY: number,
];

export interface TemplateSetting {
	paintTransparentPixels: boolean;
	skipPaintedPixels: boolean;
	outlineFirst: boolean;
	autoStart: boolean;
	purchase: {
		/**
		 * false = không bật auto purchase max charge
		 * number = có bật auto mua, nhưng mà sẽ dừng ở 1 con số nào đó
		 */
		buyMaxCharges: false | number;
		buyPaintCharges: boolean;
		buyPremiumColors: boolean;
	};
}
