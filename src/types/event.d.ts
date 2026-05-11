import type { ChildProcessMemoryInformation, ChildProcessStatus } from "./process.js"
import type { TemplateInformation } from "./template.js";

export type ChildProcessMessage = {
	[Key in keyof ChildProcessMessageData]: { op: Key } & ChildProcessMessageData[Key]
}[keyof ChildProcessMessageData];

export interface ChildProcessMessageData {
	get_status: { sequence: string },
	get_info: { sequence: string },
	init_process: { 
		data: { template: TemplateInformation } 
	}
}

export interface ChildProcessEvents {
	get_status: [sequence: string],
	get_info: [sequence: string]
}

export type MainProcessMessage = {
	[Key in keyof MainProcessMessageData]: { op: Key } & MainProcessMessageData[Key]
}[keyof MainProcessMessageData]

export interface MainProcessMessageData {
	response_status: { 
		data: { painted: number }, 
		sequence: string 
	},
	response_info: {
		data: { memory: ChildProcessMemoryInformation },
		sequence: string
	}
}

export interface MainProcessEvents {
	response_status: [painted: number, sequence: string],
	response_info: [memory: ChildProcessMemoryInformation, sequence: string]
}