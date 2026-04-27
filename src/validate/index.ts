import { z } from "zod";

export const UsedColorSchema = z.object({
	total: z.number().int().nonnegative(),
	colorId: z.number().int().nonnegative(),
});

export const TemplateImageInformationSchema = z.object({
	width: z.number().int().positive(),
	height: z.number().int().positive(),
	usedColors: z.array(UsedColorSchema),
});

export const TemplateCoordinatesSchema = z.tuple([
	z.number().int(),      // tileX
	z.number().int(),      // tileY
	z.number().int(),      // pixelX
	z.number().int(),      // pixelY
]);

export const TemplateSettingSchema = z.object({
	paintTransparentPixels: z.boolean(),
	skipPaintedPixels: z.boolean(),
	outlineFirst: z.boolean(),
	autoStart: z.boolean(),
	purchase: z.object({
		buyMaxCharges: z.union([z.literal(false), z.number().int().nonnegative()]),
		buyPaintCharges: z.boolean(),
		buyPremiumColors: z.boolean(),
	}),
});

export const TemplateInformationSchema = z.object({
	name: z.string().min(1),
	imageName: z.string().min(1),

	imageInformation: TemplateImageInformationSchema,
	assignedAccounts: z.array(z.number().int().nonnegative()),
	coordinates: TemplateCoordinatesSchema,
	setting: TemplateSettingSchema,
});

export const UpdateTemplateSchema = z.object({
	name: z.string().min(1),
	assignedAccounts: z.array(z.number().int().nonnegative()),
	coordinates: TemplateCoordinatesSchema,
	setting: TemplateSettingSchema
});

export const AppSettingSchema = z.object({
	bulkOperationCooldown: z.number().int().nonnegative(),
	paintMethod: z.string(),
	accountTurnCooldown: z.number().int().nonnegative()
});