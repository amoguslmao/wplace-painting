import type { TemplateInformation } from "./template.js"

export interface NeedJwtToken {
	tokens: string[]
}

export interface RenameUser {
	name: string
}

export interface JoinAlliance {
	allianceUUID: string
}

export interface BulkAccountAction {
	ids: number[]
}

export interface PurchaseCharges {
	type: "paint_charge" | "max_charge",
	amount: number
}

export interface PurchaseFlags {
	flagId: number
}

export type BulkJoinAlliance =  BulkAccountAction & JoinAlliance;

export type BulkFetchUser = BulkAccountAction;

export type BulkLeaveAlliance = BulkAccountAction;

export type BulkPurchaseCharges = BulkAccountAction & PurchaseCharges;

export type BulkPurchaseFlags = BulkAccountAction & PurchaseFlags;

export type AddNewTemplate = Omit<TemplateInformation, "id" | "createdAt">;