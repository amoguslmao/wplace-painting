export interface OperationResult<Data = void> {
	status: "success" | "failed",
	message: string,
	data?: Data
}

export type LogLevel = "error" | "warn" | "success" | "info" | "log" | "debug";

export type EventStreamType = "success" | "failed" | "error";