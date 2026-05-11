export interface ChildProcessStatus {
	painted: number
}

export interface ChildProcessMemoryInformation {
	heapUsed: number,
	heapTotal: number,
	rss: number,
	external: number,
}