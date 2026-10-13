import type { EventStreamType } from "../types/utils.js";

export function sendSSE(data: string, event: EventStreamType): string {
	const eventLine = `event: ${event}`;
	const dataLine = `data: ${data}`;

	return `${eventLine}\n${dataLine}\n\n`;
}

export function formatTime(time: number) {
	const second = Math.floor(time / 1000) % 60;
	const minute = Math.floor(time / 1000 / 60) % 60;
	const hour = Math.floor(time / 1000 / 60 / 60) % 24;
	const day = Math.floor(time / 1000 / 60 / 60 / 24);

	const padding = (num: number) => String(num).padStart(2, "0");

	if (day > 0) {
		return `${padding(day)}d ${padding(hour)}h ${padding(minute)}m ${padding(second)}s`;
	}

	return `${padding(hour)}h ${padding(minute)}m ${padding(second)}s`;
}
