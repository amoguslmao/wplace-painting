export interface OperationResult<Data = void> {
	status: "success" | "failed",
	message: string,
	data?: Data
}