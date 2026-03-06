import { Impit } from "impit";
import { Account } from "../base/account.js";
import { DatabaseInstance } from "./database.js";
import { Cookie, CookieJar } from "tough-cookie";
import EnvConfig from "../config.js";
import type { DatabaseAccountInformation, WplaceUser } from "../types/users.js";
import type { OperationResult } from "../types/utils.js";

export class AccountManager {
	private initialized = false;

	private static _instance: AccountManager | null = null;

	public accounts = new Map<number, Account>();

	public constructor() {
		// console.debug(`Instance 'AccountManager' has been called`);
	}

	public static getInstance() {
		if (!this._instance) {
			this._instance = new AccountManager();
		}

		return this._instance;
	}

	public async init() {
		const database = DatabaseInstance.getInstance();

		const getAllAccounts = database.prepare<{}, DatabaseAccountInformation>(`
			SELECT * FROM users;
		`);

		for (const account of getAllAccounts.iterate({})) {
			const acc = new Account(account);

			await acc.start();

			this.accounts.set(account.id, acc);
		}

		this.initialized = true;
	}

	public async addAccount(jwtToken: string): Promise<OperationResult<string | object>> {
		if (!this.initialized) {
			throw new Error("Instance did not create correctly");
		}

		const cookieJar = new CookieJar();

		const jwtValue = `j=${jwtToken}; Path=/`;

		await cookieJar.setCookie(jwtValue, "https://backend.wplace.live/");
		await cookieJar.setCookie(jwtValue, "https://wplace.live/");

		const impit = new Impit({
			browser: "chrome142",
			ignoreTlsErrors: true,
			cookieJar
		});

		const response = await impit.fetch(`${EnvConfig.baseURL}/me`, {
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

		if (!response.ok) {
			// Cần kiểm tra xem có phải mã 401 không
			// Nếu là mã 401 thì báo lại là token hết hạn hoặc không tồn tại
			const contentType = response.headers.get("Content-Type");

			let responseText: string | object;

			if (contentType && contentType.includes("application/json")) {
				responseText = await response.json();
			}
			else {
				responseText = await response.text();
			}

			console.warn(`An error occured when fetching:`, responseText);

			return {
				status: "failed",
				message: `An error occured when fetching`,
				data: responseText
			}
		}

		const result = await response.json() as WplaceUser;

		const database = DatabaseInstance.getInstance();

		// TODO: kiểm tra xem có token mới nhất include trong response header hay ko
		const setCookies = response.headers.getSetCookie();

		const newToken = setCookies.map(cookie => Cookie.parse(cookie)).find(cookie => cookie?.key === "j");

		if (newToken) {
			console.log(`Got a new JWT Token when adding user ${result.name}#${result.id}`);

			jwtToken = newToken.value;
		}

		// Cần implement để check xem đã có account nào trước đã add vào chưa
		// Nếu mà jwt token này đã có cái user id trong db và map rồi
		// Thì jwt token này phải được update vào db và cả cái user fetch này luôn
		for (const account of this.accounts.values()) {
			if (account.user.id === result.id) {
				console.log(`User ${account.user.name}#${account.user.id} has been added before, updating information...`);

				// Update account vào map và db bằng set
				account.user = result;
				
				account.jwtToken = jwtToken;

				return {
					status: "success",
					message: `User ${account.user.name}#${account.user.id} has been added before`
				};
			}
		}

		// Nên nhớ rằng cho dù không có account nào trong db
		// Thì cái query này đã add sẵn 1 account vào trước rồi
		const addNewAccount = database.prepare<{
			jwtToken: string,
			lastFetch: number,
			user: string
		}>(`
			INSERT INTO users (jwtToken, lastFetch, user)
			VALUES (@jwtToken, @lastFetch, @user)
		`);

		addNewAccount.run({
			jwtToken,
			lastFetch: Date.now(),
			user: JSON.stringify(result)
		});

		const getLastAccount = database.prepare<{}, DatabaseAccountInformation>(`
			SELECT * FROM users ORDER BY id DESC LIMIT 1
		`);

		const lastAccount = getLastAccount.get({})!;

		const account = new Account(lastAccount);

		await account.start();

		this.accounts.set(lastAccount.id, account);

		console.log(`Added user ${result.name}#${result.id}`);

		return {
			status: "success",
			message: `Added user ${result.name}#${result.id}`
		};
	}

	public deleteAccount(id: number) {
		if (!this.initialized) {
			throw new Error("Instance did not create correctly");
		}

		const account = this.accounts.get(id);

		if (!account) {
			throw new Error(`Account with id ${id} doesnt exists`);
		}

		this.accounts.delete(id);

		const database = DatabaseInstance.getInstance();

		const deleteAccount = database.prepare<{ id: number }>(`
			DELETE FROM users WHERE id = @id
		`);

		deleteAccount.run({ id });

		console.log(`User ${account.user.name}#${account.user.id} with Account ID ${id} has been deleted`);
	}
}