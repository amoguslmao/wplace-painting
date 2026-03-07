import type { EventStreamType } from "../types/utils.js";

export function sendSSE(data: string, event: EventStreamType): string {
	const eventLine = `event: ${event}`;
	const dataLine = `data: ${data}`;

	return `${eventLine}\n${dataLine}\n\n`;
}