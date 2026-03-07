export interface OperationResult<Data = void> {
	status: "success" | "failed",
	message: string,
	data?: Data
}

export type EventStreamType = "success" | "failed" | "error";