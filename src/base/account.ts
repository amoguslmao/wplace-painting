import { Impit } from "impit";
import { Cookie, CookieJar } from "tough-cookie";
import { DatabaseInstance } from "../services/database.js";
import { BrowserFingerprintSchema } from "../validate/index.js";
import {
	ENDPOINT_CLASS_METHODS,
	FLAG_ITEM,
	MAX_CHARGE_ITEM,
	PAINT_CHARGE_ITEM,
	USER_CLASS_METHODS,
	WPLACE_BACKEND_DOMAIN,
	WPLACE_FLAGS,
} from "../const/index.js";
import EnvConfig from "../config.js";

import type { BrowserFingerprint, DatabaseAccountInformation, WplaceUser } from "../types/users.js";
import type { OperationResult } from "../types/utils.js";
import type { PaintingTile, Pixel } from "../types/pixel.js";
import { launchPersistentContext } from "cloakbrowser";
import { launchProfile } from "../libs/browser.js";
import { sleep } from "../utils/promises.js";
import { pixelToLatLon } from "../libs/pixel.js";
import { randomInt } from "node:crypto";

export class Account {
	private impit!: Impit;
	private cookieJar!: CookieJar;
	private init = false;

	private _rawUser: string;
	private _jwtToken: string;
	private _browserFingerprint: string;

	public lastFetch: number;
	public readonly id: number;

	public constructor(data: DatabaseAccountInformation) {
		this.id = data.id;
		this.lastFetch = data.lastFetch;

		this._jwtToken = data.jwtToken;
		this._browserFingerprint = data.browserFingerprint;
		this._rawUser = data.user;
	}

	public async start() {
		this.cookieJar = new CookieJar();

		const jwtValue = `j=${this.jwtToken}; Path=/`;

		await this.cookieJar.setCookie(jwtValue, "https://backend.wplace.live/");
		await this.cookieJar.setCookie(jwtValue, "https://wplace.live/");

		this.impit = new Impit({
			browser: "chrome142",
			cookieJar: this.cookieJar,
			ignoreTlsErrors: true,
		});

		this.init = true;
	}

	public get jwtToken() {
		return this._jwtToken;
	}

	public set jwtToken(value: string) {
		this._jwtToken = value;

		const jwtValue = `j=${value}; Path=/`;
		this.cookieJar.setCookieSync(jwtValue, "https://backend.wplace.live/");
		this.cookieJar.setCookieSync(jwtValue, "https://wplace.live/");

		const database = DatabaseInstance.getInstance();

		const updateJwtToken = database.prepare<{
			jwtToken: string;
			id: number;
		}>(`
			UPDATE users
			SET jwtToken = @jwtToken
			WHERE id = @id
		`);

		updateJwtToken.run({
			jwtToken: value,
			id: this.id,
		});

		console.log(`New token has been setted.`);
	}

	public get user(): WplaceUser {
		return JSON.parse(this._rawUser) as WplaceUser;
	}

	public set user(value: WplaceUser) {
		this.lastFetch = Date.now();
		this._rawUser = JSON.stringify(value);

		const database = DatabaseInstance.getInstance();

		const updateAccount = database.prepare<{
			lastFetch: number;
			user: string;
			id: number;
		}>(`
			UPDATE users
			SET lastFetch = @lastFetch, user = @user
			WHERE id = @id
		`);

		updateAccount.run({
			lastFetch: this.lastFetch,
			user: JSON.stringify(value),
			id: this.id,
		});

		console.debug(`Account updated.`);
	}

	public get browserFingerprint(): BrowserFingerprint {
		return JSON.parse(this._browserFingerprint) as BrowserFingerprint;
	}

	public set browserFingerprint(value: BrowserFingerprint) {
		const browserFingerprint = BrowserFingerprintSchema.parse(value);

		const database = DatabaseInstance.getInstance();

		const updateFingerprint = database.prepare<{
			browserFingerprint: string,
			id: number
		}>(`
			UPDATE users
			SET browserFingerprint = @browserFingerprint
			WHERE id = @id	
		`);

		updateFingerprint.run({
			browserFingerprint: JSON.stringify(browserFingerprint),
			id: this.id
		});

		console.log(`Browser Fingerprint updated.`);
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
				"Sec-Fetch-Dest": "empty",
				"Sec-Fetch-Mode": "cors",
				"Sec-Fetch-Site": "same-site",
			},
		});

		if (response.ok) {
			const result = (await response.json()) as WplaceUser;

			const setCookies = response.headers.getSetCookie();

			const newToken = setCookies
				.map((cookie) => Cookie.parse(cookie))
				.find((cookie) => cookie?.key === "j");

			if (newToken) {
				console.log(`Got a new JWT Token when fetching /me`);

				this.jwtToken = newToken.value;
			}

			this.user = result;

			return result;
		} else {
			// TODO: kiểm tra xem response code là gì và trả về error tối ưu hơn
			const { name, id } = this.user;

			throw new Error(
				`Could not fetch user ${name}#${id}\n${await response.text()}`,
			);
		}
	}

	public async updateUser(
		name: string,
		showLastPixel: boolean = this.user.showLastPixel,
	): Promise<OperationResult> {
		if (!this.init) {
			throw new Error("Account didnt started correctly");
		}

		if (name === this.user.name) {
			return {
				status: "success",
				message: "Username is the same as the current one",
			};
		}

		const lastUsername = this.user.name;

		const response = await this.impit.fetch(
			`${EnvConfig.baseURL}/me/update`,
			{
				method: "POST",
				body: JSON.stringify({
					name,
					showLastPixel,
				}),
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
					"User-Agent":
						"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36",
				},
			},
		);

		if (!response.ok) {
			// Nghĩa là có thể không thể thay đổi tên được
			if (response.status === 400) {
				const result = (await response.json()) as {
					error: string;
					status: number;
				};

				const [reason, days] = result.error.split(":");

				return {
					status: "failed",
					message: `Need to wait ${days} days before changing new name`,
				};
			} else if (response.status === 401) {
				const { name, id } = this.user;

				throw new Error(
					`Could not fetch user ${name}#${id}\n${await response.text()}`,
				);
			}
		}

		// Hành vi fetch `/me` sau khi rename như trên web
		await this.me();

		const message = `Renamed successfully from ${lastUsername}#${this.user.id} to ${this.user.name}#${this.user.id}`;

		console.log(message);

		return {
			status: "success",
			message: message,
		};
	}

	public async joinAlliance(allianceUUID: string): Promise<OperationResult<object>> {
		if (!this.init) {
			throw new Error("Account didnt started correctly");
		}

		if (this.user.allianceId) {
			return {
				status: "success",
				message: "User has been joined an alliance before",
			};
		}

		const response = await this.impit.fetch(
			`${EnvConfig.baseURL}/alliance/join/${allianceUUID}`,
			{
				method: "POST",
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
					"User-Agent":
						"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36",
				},
			},
		);

		if (!response.ok) {
			switch (response.status) {
				case 401: {
					console.error(
						`Got 401 when joining alliance, does something get bugged?`,
					);

					return {
						message: "Unauthorized.",
						status: "failed",
					};
				}
				case 403: {
					return {
						message: "User has been banned from this alliance.",
						status: "failed",
					};
				}
				case 400:
				case 404: {
					return {
						message:
							"Alliance UUID doesnt exists or invalid invite.",
						status: "failed",
					};
				}

				default: {
					throw new Error("Unknow error when joining alliance.");
				}
			}
		}

		console.log(
			`User ${this.user.name}#${this.user.id} has been joined alliance successfully.`,
		);

		return {
			status: "success",
			message: "User has been joined alliance successfully.",
			data: await response.json(),
		};
	}

	public async leaveAlliance(): Promise<OperationResult<string>> {
		if (!this.init) {
			throw new Error("Account didnt started correctly.");
		}

		if (!this.user.allianceId) {
			return {
				status: "failed",
				message: "User doesnt in any alliance to leave.",
			};
		}

		const response = await this.impit.fetch(
			`${EnvConfig.baseURL}/alliance/leave`,
			{
				method: "POST",
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
					"User-Agent":
						"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36",
				},
			},
		);

		if (!response.ok) {
			console.error(
				`An error occured when leaving alliance for user ${this.user.name}#${this.user.id}`,
			);

			console.error(await response.text());

			return {
				status: "failed",
				message: "An error occured when leaving alliance.",
				data: await response.text(),
			};
		}

		console.log(
			`User ${this.user.name}#${this.user.id} has been left the alliance.`,
		);

		return {
			status: "success",
			message: "User has been left the alliance",
		};
	}

	public async purchaseCharges(
		type: "paint_charge" | "max_charge",
		amount: number,
	): Promise<OperationResult<string>> {
		if (!this.init) {
			throw new Error("Instance did not create correctly");
		}

		if (!Number.isInteger(amount)) {
			throw new Error(`Param "amount" must be an integer`);
		}

		if (type === "paint_charge") {
			const neededDroplet = PAINT_CHARGE_ITEM.value * amount;

			if (this.user.droplets < neededDroplet) {
				return {
					message: `Account doesnt have enough droplet`,
					status: "failed",
				};
			}

			const response = await this.impit.fetch(
				`${EnvConfig.baseURL}/purchase`,
				{
					method: "POST",
					body: JSON.stringify({
						product: {
							id: PAINT_CHARGE_ITEM.itemId,
							amount,
						},
					}),
					headers: {
						Accept: "*/*",
						"Accept-Encoding": "gzip, deflate, br, zstd",
						"Accept-Language":
							"vi,en-US;q=0.9,en;q=0.8,vi-VN;q=0.7",
						"Cache-Control": "no-cache",
						Origin: "https://wplace.live",
						Pragma: "no-cache",
						Priority: "u=1, i",
						Referer: "https://wplace.live/",
						"Sec-Ch-Ua": `"Not(A:Brand";v="8", "Chromium";v="144", "Google Chrome";v="144"`,
						"Sec-Ch-Ua-Mobile": `?0`,
						"Sec-Ch-Ua-Platform": `"Windows"`,
						"Sec-Fetch-Dest": "empty",
						"Sec-Fetch-Mode": "cors",
						"Sec-Fetch-Site": "same-site",
						"User-Agent":
							"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36",
					},
				},
			);

			if (!response.ok) {
				switch (response.status) {
					case 403: {
						return {
							message: `Account do not have enough droplet`,
							status: "failed",
						};
					}
					default: {
						return {
							message: `Unknow error`,
							status: "failed",
							data: await response.text(),
						};
					}
				}
			}

			await this.me();

			return {
				message: `Successfully purchase ${amount} paint charge`,
				status: "success",
			};
		} else {
			const neededDroplet = MAX_CHARGE_ITEM.value * amount;

			if (this.user.droplets < neededDroplet) {
				return {
					message: `Account doesnt have enough droplet`,
					status: "failed",
				};
			}

			const response = await this.impit.fetch(
				`${EnvConfig.baseURL}/purchase`,
				{
					method: "POST",
					body: JSON.stringify({
						product: {
							id: MAX_CHARGE_ITEM.itemId,
							amount,
						},
					}),
					headers: {
						Accept: "*/*",
						"Accept-Encoding": "gzip, deflate, br, zstd",
						"Accept-Language":
							"vi,en-US;q=0.9,en;q=0.8,vi-VN;q=0.7",
						"Cache-Control": "no-cache",
						Origin: "https://wplace.live",
						Pragma: "no-cache",
						Priority: "u=1, i",
						Referer: "https://wplace.live/",
						"Sec-Ch-Ua": `"Not(A:Brand";v="8", "Chromium";v="144", "Google Chrome";v="144"`,
						"Sec-Ch-Ua-Mobile": `?0`,
						"Sec-Ch-Ua-Platform": `"Windows"`,
						"Sec-Fetch-Dest": "empty",
						"Sec-Fetch-Mode": "cors",
						"Sec-Fetch-Site": "same-site",
						"User-Agent":
							"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36",
					},
				},
			);

			if (!response.ok) {
				switch (response.status) {
					case 403: {
						return {
							message: `Account do not have enough droplet`,
							status: "failed",
						};
					}
					case 409: {
						return {
							message: `This account already have this item`,
							status: "failed",
						};
					}
					default: {
						return {
							message: `Unknow error`,
							status: "failed",
							data: await response.text(),
						};
					}
				}
			}

			await this.me();

			return {
				message: `Successfully purchase ${amount} max charge`,
				status: "success",
			};
		}
	}

	public async purchaseFlags(flagId: number): Promise<OperationResult<string>> {
		if (!this.init) {
			throw new Error("Instance did not create correctly");
		}

		const allFlagIds = Object.keys(WPLACE_FLAGS);

		if (!allFlagIds.includes(String(flagId))) {
			throw new Error(`Could not find any flag with ID ${flagId}`);
		}

		if (this.user.droplets < FLAG_ITEM.value) {
			return {
				message: "User doesnt have enough droplets",
				status: "failed",
			};
		}

		const response = await this.impit.fetch(
			`${EnvConfig.baseURL}/purchase`,
			{
				method: "POST",
				body: JSON.stringify({
					product: {
						id: FLAG_ITEM.itemId,
						amount: 1,
						variant: flagId,
					},
				}),
				headers: {
					Accept: "*/*",
					"Accept-Encoding": "gzip, deflate, br, zstd",
					"Accept-Language": "vi,en-US;q=0.9,en;q=0.8,vi-VN;q=0.7",
					"Cache-Control": "no-cache",
					Origin: "https://wplace.live",
					Pragma: "no-cache",
					Priority: "u=1, i",
					Referer: "https://wplace.live/",
					"Sec-Ch-Ua": `"Not(A:Brand";v="8", "Chromium";v="144", "Google Chrome";v="144"`,
					"Sec-Ch-Ua-Mobile": `?0`,
					"Sec-Ch-Ua-Platform": `"Windows"`,
					"Sec-Fetch-Dest": "empty",
					"Sec-Fetch-Mode": "cors",
					"Sec-Fetch-Site": "same-site",
					"User-Agent":
						"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36",
				},
			},
		);

		if (!response.ok) {
			switch (response.status) {
				case 403: {
					return {
						message: `Account do not have enough droplet`,
						status: "failed",
					};
				}
				case 409: {
					return {
						message: `Account already have this flag`,
						status: "failed",
					};
				}
				default: {
					return {
						message: `Unknow error`,
						status: "failed",
						data: await response.text(),
					};
				}
			}
		}

		await this.me();

		return {
			message: `Successfully purchased flag with ID ${flagId}`,
			status: "success",
		};
	}

	public async paint(data: PaintingTile[]) {
		if (!this.init) {
			throw new Error("Instance did not create correctly");
		}

		if (EnvConfig.instanceType === "wplace") {
			return await this.browserPaint(data);
		}
		else {
			console.log("openplace's paint function has not been implement yet.");
		}
	}

	private async browserPaint(data: PaintingTile[]) {
		const firstPixel: Pixel = {
			x: data[0].pixels.x[0],
			y: data[0].pixels.y[0],
			tile: {
				x: data[0].x,
				y: data[0].y
			}
		}
		const latLon = pixelToLatLon(firstPixel);

		const browser = await launchProfile(this, {
			lat: latLon.lat,
			lng: latLon.lon,
			zoom: 12
		});

		const page = browser.pages()[0] || await browser.newPage();

		const jsFiles: string[] = [];
		const CHUNKS_PATH = "https://wplace.live/_app/immutable/chunks";

		page.on("response", async (response) => {
			if (response.url().startsWith(CHUNKS_PATH)) {
				const part = response.url().split("/");

				jsFiles.push(part[part.length - 1]);
			}
		});

		// page.route(`${WPLACE_BACKEND_DOMAIN}/paint`, async (route) => {
		// 	const response = await route.fetch();
			
		// 	if (response.status() === 403) {
		// 		const contentType = response.headersArray().find((header) => header.name === "content-type");

		// 		if (contentType && contentType.value.startsWith("application/json;")) {
		// 			const body = await response.json();

		// 			if (body.error === "verification-required") {
		// 				await browser.close();

		// 				throw new Error("WE GOT DETECTED AND NOW WE NEED TO VERIFY BY FINGERPRINT JS PRO!!!");
		// 			}
		// 		}
		// 	}

		// 	await route.fulfill({ response });
		// });

		await page.goto("https://wplace.live");

		try {
			await page.waitForLoadState("networkidle");
		} catch (error) {
			console.error(`Wait after 30s but still wait so browser lowkey ignore that shi`);
			console.error(error);
		}

		try {
			// await page
			// 	.locator("div.absolute.bottom-3.left-1\\/2")
			// 	.locator("button.btn-primary")
			// 	.filter({ has: page.locator('svg path[d^="M240-120"]') })
			// 	.click();
			const target = `div.absolute.bottom-3.left-1\\/2 button.btn-primary:has(svg path[d^="M240-120"])`;

			await page.locator(target).click();
		} catch (error) {
			console.error(`Failed to click the button, guess it is deprecated now lol.`);
			console.error(error);
		}

		console.log(`All the JS files:`, jsFiles);
		page.off("response", () => null);

		await sleep(1500);

		interface ReturnValue {
			endpoint: {
				exportedName: string,
				filename: string
			},
			user: {
				exportedName: string,
				filename: string
			}
		}

		const result = await page.evaluate<ReturnValue, [string[], string[], string, string[]]>(async ([endpointClassMethod, userClassMethods, chunksPath, jsFiles]) => {
			const isObject = (value: any) => value !== null && typeof value === "object";

			function getAllMethodsName(instance: object, includeAccessors: boolean = false) {
				const names = new Set<string>();

				for (
					let proto = Object.getPrototypeOf(instance);
					proto && proto !== Object.prototype;
					proto = Object.getPrototypeOf(proto)
				) {
					for (const key of Object.getOwnPropertyNames(proto)) {
						if (key === "constructor") continue;

						const descriptor = Object.getOwnPropertyDescriptor(proto, key);

						const isMethod = typeof descriptor?.value === "function";
						
						const isAccessor = includeAccessors && (
							typeof descriptor?.get === "function" ||
							typeof descriptor?.set === "function"
						);

						if (isMethod || isAccessor) {
							names.add(key);
						}
					}
				}

				return Array.from(names);
			}

			const result = {
				endpoint: {
					exportedName: "",
					filename: ""
				},
				user: {
					exportedName: "",
					filename: ""
				}
			}

			for (const filename of jsFiles) {
				const modules = await import(`${chunksPath}/${filename}`);				

				for (const module of Object.keys(modules)) {
					const exported = modules[module];

					if (!isObject(exported)) {
						continue;
					}

					if (!exported.__proto__) {
						continue;
					}

					// @ts-ignore
					const totalMatchItemForEndpoint = window.countMatchItem(
						getAllMethodsName(exported),
						endpointClassMethod
					);

					// @ts-ignore
					const totalMatchItemForUser = window.countMatchItem(
						getAllMethodsName(exported, true),
						userClassMethods
					)

					if (totalMatchItemForEndpoint / endpointClassMethod.length >= 0.80) {
						result.endpoint.exportedName = module;
						result.endpoint.filename = filename;
					}

					if (totalMatchItemForUser / userClassMethods.length >= 0.85) {
						result.user.exportedName = module;
						result.user.filename = filename;
					}
				}
			}

			return result;
		}, [ENDPOINT_CLASS_METHODS, USER_CLASS_METHODS, CHUNKS_PATH, jsFiles]);

		console.log(result);

		if (this.user.rulesRead === false) {
			const marked = await page.evaluate<boolean, [ReturnValue, string]>(async ([result, chunksPath]) => {
				const modules = await import(`${chunksPath}/${result.endpoint.filename}`);

				const targetEndpoint = modules[result.endpoint.exportedName];

				return await targetEndpoint.markRulesAsRead();
			}, [result, CHUNKS_PATH]);

			console.log(`The rules has been read.`);
		}

		//await sleep(5000);
		const wait = randomInt(5000, 10_000);
		console.log(`Wait about ${wait}ms before paint.`);
		await sleep(wait);

		interface WplaceColor {
			tile: [number, number],
			pixel: [number, number],
			season: number,
			colorIdx: number
		}

		const response = await page.evaluate<object, [ReturnValue, PaintingTile[], string]>(async ([result, data, chunksPath]) => {
			const modules = await import(`${chunksPath}/${result.endpoint.filename}`);

			const targetEndpointModule = modules[result.endpoint.exportedName];
			
			const convertedColor: WplaceColor[] = [];

			for (const tile of data) {
				const { pixels } = tile;

				for (let i = 0; i < pixels.x.length; i++) {
					convertedColor.push({
						tile: [tile.x, tile.y],
						pixel: [pixels.x[i], pixels.y[i]],
						season: 0,
						colorIdx: pixels.colors[i]
					});
				}
			}

			const idk = await targetEndpointModule.paint(convertedColor);

			return idk;

		}, [result, data, CHUNKS_PATH]);

		console.log(response);

		// không re-fetch lại `/me` mà hãy sử dụng class có sẵn của Wplace để lấy data.
		const me = await page.evaluate<WplaceUser, [ReturnValue, string]>(async ([result, chunksPath]) => {
			const modulesUser = await import(`${chunksPath}/${result.user.filename}`);

			const targetUserModule = modulesUser[result.user.exportedName];
			
			await targetUserModule.refresh();

			return targetUserModule.data;

		}, [result, CHUNKS_PATH]);

		console.log(`Fetch me from browser:`);
		console.log(me);

		this.user = me;

		const cookies = await page.context().cookies();

		const jwtToken = cookies.find((cookie) => cookie.name === "j");

		console.log(`JWT Token field:`);
		console.log(jwtToken);

		if (jwtToken && (this.jwtToken !== jwtToken.value)) {
			this.jwtToken = jwtToken.value;
		}

		await sleep(2000);

		await browser.close();
	}

	private async legacyPaint(data: PaintingTile[]) {
		for (const tile of data) {
			const { pixels } = tile;

			const groupPixels: number[] = [];

			for (let i = 0; i < pixels.colors.length; i++) {
				groupPixels.push(pixels.x[i], pixels.y[i]);
			}

			const response = await this.impit.fetch(`${EnvConfig.baseURL}/s0/pixel/${tile.x}/${tile.y}`, {
				method: "POST",
				body: JSON.stringify({
					coords: groupPixels,
					colors: pixels.colors,
				}),
				headers: {
					"accept": "*/*",
					"accept-encoding": "gzip, deflate, br, zstd",
					"cache-control": "no-cache",
					"content-type": "text/plain;charset=UTF-8",
					"origin": "https://openplace.live",
					"pragma": "no-cache",
					"priority": "u=1, i",
					"referer": "https://openplace.live",
					"x-pawtect-token": "",
					"x-pawtect-variant": "disabled"
				}
			});

			console.log(`Painted on tile ${tile.x},${tile.y} successfully.`);
			console.log(await response.json());
		}
	}
}