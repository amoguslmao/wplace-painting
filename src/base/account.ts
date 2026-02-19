import { Impit } from "impit";
import { CookieJar } from "tough-cookie";
import { DatabaseInstance } from "../services/database.js";

import EnvConfig from "../config.js";
import type { DatabaseAccountInformation, WplaceUser } from "../types/users.js";

export class Account {
	private impit!: Impit;
	private cookieJar!: CookieJar;
	private init = false;

	private _rawUser: string;
	private _jwtToken: string;

	public lastFetch: number;
	public readonly id: number;

	public constructor(information: DatabaseAccountInformation) {
		this.id = information.id;
		this.lastFetch = information.lastFetch;

		this._jwtToken = information.jwtToken;
		this._rawUser = information.user;
	}

	public async start() {
		this.cookieJar = new CookieJar();

		const jwtValue = `j=${this.jwtToken}; Path=/`;

		await this.cookieJar.setCookie(jwtValue, "https://backend.wplace.live/");
		await this.cookieJar.setCookie(jwtValue, "https://wplace.live/");

		this.impit = new Impit({
			browser: "chrome142",
			cookieJar: this.cookieJar,
			ignoreTlsErrors: true
		});

		this.init = true;
	}

	public get jwtToken() {
		return this._jwtToken;
	}

	public set jwtToken(value: string) {
		this._jwtToken = value;

		const database = DatabaseInstance.getInstance();

		const updateJwtToken = database.prepare<{
			jwtToken: string,
			id: number
		}>(`
			UPDATE users
			SET jwtToken = @jwtToken
			WHERE id = @id
		`);

		updateJwtToken.run({
			jwtToken: value,
			id: this.id
		});
	}

	public get user(): WplaceUser {
		return JSON.parse(this._rawUser) as WplaceUser;
	}

	public set user(value: WplaceUser) {
		this.lastFetch = Date.now();
		this._rawUser = JSON.stringify(value);

		const database = DatabaseInstance.getInstance();

		const updateAccount = database.prepare<{
			lastFetch: number,
			user: string,
			id: number
		}>(`
			UPDATE users
			SET lastFetch = @lastFetch, user = @user
			WHERE id = @id
		`);

		updateAccount.run({
			lastFetch: this.lastFetch,
			user: JSON.stringify(value),
			id: this.id
		});
	}

	public async me() {
		if (!this.init) {
			throw new Error("Account didnt started correctly");
		}

		const response = await this.impit.fetch(`${EnvConfig.baseURL}/me`, {
			headers: {
				"Accept": "*/*",
				"Accept-Encoding": "gzip, deflate, br, zstd",
				"Accept-Language": "vi,en-US;q=0.9,en;q=0.8,vi-VN;q=0.7",
				"Cache-Control": "no-cache",
				"Origin": "https://wplace.live",
				"Pragma": "no-cache",
				"Priority": "u=1, i",
				"Referer": "https://wplace.live/",
				"Sec-Ch-Ua": `"Not(A:Brand";v="8", "Chromium";v="144", "Google Chrome";v="144"`,
				"Sec-Ch-Ua-Mobile": `?0`,
				"Sec-Ch-Ua-Platform": `"Windows"`,
				"Sec-Fetch-Dest": "empty",
				"Sec-Fetch-Mode": "cors",
				"Sec-Fetch-Site": "same-site",
				"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36",
			}
		});

		if (response.ok) {
			const result = await response.json() as WplaceUser;

			this.user = result;

			return result
		}
		else {
			const { name, id } = this.user;

			throw new Error(`Could not fetch user ${name}#${id}\n${await response.text()}`);
		}
	}
}