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

export type BulkJoinAlliance =  BulkAccountAction & JoinAlliance;

export type BulkFetchUser = BulkAccountAction;

export type BulkLeaveAlliance = BulkAccountAction;