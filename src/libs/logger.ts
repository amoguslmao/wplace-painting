import chalk from "chalk";
import EnvConfig from "../config.js";
import type { LogLevel } from "../types/utils.js";
import { LOG_LEVEL_STYLES } from "../const/index.js";

export class Logger {
	private namespace: string[];

	public constructor(namespace: string[] = []) {
		this.namespace = namespace;
	}

	public getLogger(namespace: string) {
		return new Logger([...this.namespace, namespace]);
	}

	public error(...args: any[]) {
		if (EnvConfig.logLevel >= 0) {
			this.write("error", ...args);
		}
	}

	public warn(...args: any[]) {
		if (EnvConfig.logLevel >= 1) {
			this.write("warn", ...args);
		}
	}

	public success(...args: any[]) {
		if (EnvConfig.logLevel >= 2) {
			this.write("success", ...args);
		}
	}

	public info(...args: any[]) {
		if (EnvConfig.logLevel >= 3) {
			this.write("info", ...args);
		}
	}

	public debug(...args: any[]) {
		if (EnvConfig.logLevel >= 4) {
			this.write("debug", ...args);
		}
	}

	private write(level: LogLevel, ...args: any[]) {
		const time = this.getTime();
		const namespaces = this.formatNamespace();
		const { color, icon } = LOG_LEVEL_STYLES[level];

		const prefix = [chalk.gray(time), color(icon), color(namespaces)]
			.filter(Boolean)
			.join(" ");

		console.log(prefix, ...args);
	}

	private captalize(value: string) {
		if (!value) return value;

		return value.charAt(0).toUpperCase() + value.slice(1);
	}

	private formatNamespace() {
		if (this.namespace.length === 0) return "";

		return this.namespace.map((ns) => `[${this.captalize(ns)}]`).join(" ");
	}

	private getTime() {
		const date = new Date();

		return date
			.toLocaleString("en-US", {
				year: "numeric",
				month: "2-digit",
				day: "2-digit",
				hour: "2-digit",
				minute: "2-digit",
				second: "2-digit",
				hour12: false,
			})
			.replace(/,/g, "");
	}
}
