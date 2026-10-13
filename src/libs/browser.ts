import fs from "node:fs/promises";
import { BROWSER_FOLDER, DATA_FOLDER } from "../const/index.js";
import type { BrowserFingerprint } from "../types/users.js";
import { launchPersistentContext } from "cloakbrowser";
import type { Account } from "../base/account.js";
import { parseJWT } from "./token.js";

type WeightedViewport = BrowserFingerprint["viewport"] & {
	weight: number;
};

const PLATFORM_SHARE = {
	windows: 77.9,
	macos: 18.3,
	linux: 3.9,
} as const;

const VIEWPORTS_BY_PLATFORM = {
	windows: [
		{ width: 1920, height: 1080, weight: 53.6 },
		{ width: 2560, height: 1440, weight: 21.8 },
		{ width: 1536, height: 864, weight: 7.15 },
		{ width: 2560, height: 1600, weight: 5.17 },
		{ width: 3840, height: 2160, weight: 5.06 },
		{ width: 3440, height: 1440, weight: 3.18 },
		{ width: 1920, height: 1200, weight: 2.5 },
		{ width: 1366, height: 768, weight: 2.42 },
		{ width: 1600, height: 900, weight: 0.71 },
		{ width: 2560, height: 1080, weight: 0.71 },
		{ width: 5120, height: 2880, weight: 0.64 },
		{ width: 5120, height: 1440, weight: 0.41 },
		{ width: 5120, height: 2160, weight: 0.25 },
	],
	macos: [
		{ width: 2560, height: 1600, weight: 22 },
		{ width: 2560, height: 1664, weight: 20 },
		{ width: 3024, height: 1964, weight: 13 },
		{ width: 2880, height: 1864, weight: 11 },
		{ width: 3456, height: 2234, weight: 8 },
		{ width: 2880, height: 1800, weight: 6 },
		{ width: 2408, height: 1506, weight: 4 },
		{ width: 3072, height: 1920, weight: 4 },
		{ width: 4480, height: 2520, weight: 4 },
		{ width: 2304, height: 1440, weight: 2.5 },
		{ width: 5120, height: 2880, weight: 2 },
		{ width: 1440, height: 900, weight: 1.5 },
		{ width: 4096, height: 2304, weight: 1 },
		{ width: 1920, height: 1080, weight: 1 },
		{ width: 1366, height: 768, weight: 0.6 },
		{ width: 5120, height: 2160, weight: 0.4 },
		{ width: 6016, height: 3384, weight: 0.35 },
	],
	linux: [
		{ width: 1920, height: 1080, weight: 35.64 },
		{ width: 2560, height: 1440, weight: 15.29 },
		{ width: 3840, height: 2160, weight: 5.91 },
		{ width: 3440, height: 1440, weight: 4.33 },
		{ width: 1366, height: 768, weight: 3.37 },
		{ width: 1920, height: 1200, weight: 3.3 },
		{ width: 2560, height: 1600, weight: 1.58 },
		{ width: 1600, height: 900, weight: 0.71 },
		{ width: 2560, height: 1080, weight: 0.71 },
		{ width: 5120, height: 1440, weight: 0.7 },
		{ width: 5120, height: 2880, weight: 0.31 },
		{ width: 5120, height: 2160, weight: 0.3 },
	],
} satisfies Record<BrowserFingerprint["platform"], WeightedViewport[]>;

export async function isEmptyProfileDir(profileName: string) {
	try {
		const files = await fs.readdir(`./${DATA_FOLDER}/${BROWSER_FOLDER}/${profileName}`, {
			recursive: true,
		});

		if (files.length === 0) {
			return true;
		}

		return false;
	} catch {
		return true;
	}
}

export async function launchProfile(account: Account, location?: { lat: number, lng: number, zoom: number }) {
	const isEmptyDir = await isEmptyProfileDir(String(account.id));

	if (isEmptyDir) {
		await fs.mkdir(`./${DATA_FOLDER}/${BROWSER_FOLDER}/${account.id}`);
	}

	const browser = await launchPersistentContext({
		userDataDir: `./${DATA_FOLDER}/${BROWSER_FOLDER}/${account.id}`,
		headless: false,
		humanize: true,
		humanPreset: "careful",
		locale: account.browserFingerprint.locale,
		timezone: account.browserFingerprint.timezone,
		viewport: account.browserFingerprint.viewport,
		args: [
			`--fingerprint=${account.browserFingerprint.seed}`,
			`--fingerprint-platform=${account.browserFingerprint.platform}`,
			`--fingerprint-screen-width=${account.browserFingerprint.viewport.width}`,
			`--fingerprint-screen-height=${account.browserFingerprint.viewport.height}`,
			`--fingerprint-noise=false`,
			`--fingerprint-windows-font-metrics`,
			`--fingerprint-fonts-dir=/home/admin/.local/share/fonts/windows`,
			`--fingerprint-storage-quota=${account.browserFingerprint.storageQuotaMb}`
		],
		extensionPaths: [
			"./chromium_automation"
		]
	});

	if (isEmptyDir) {
		await browser.addCookies([{
			name: "j",
			value: account.jwtToken,
			expires: parseJWT(account.jwtToken).payload.exp,
			domain: ".wplace.live",
			path: "/",
			httpOnly: true,
			secure: true,
			sameSite: "Lax",
		}]);
	}

	const allCookies = await browser.cookies("https://wplace.live");

	const jwtToken = allCookies.find(cookie => cookie.name === "j");

	// code them cho nay de set lai jwt token cho browser khi jwt token hien tai luu trong db la khac nhau.
	if (jwtToken && jwtToken.value !== account.jwtToken) {

	}

	// Helper function
	await browser.addInitScript(() => {
		// @ts-ignore
		window.countMatchItem = (a: any[], b: any[]) => {
			let count = 0;

			const setA = new Set(a);

			for (const item of b) {
				if (setA.has(item)) {
					count++;
				}
			}

			return count;
		}
	});

	if (location) {
		await browser.addInitScript<{ lat: number, lng: number, zoom: number }>((initLocation) => {
			localStorage.setItem("location", JSON.stringify({
				lat: initLocation.lat,
				lng: initLocation.lng,
				zoom: initLocation.zoom
			}));
		}, location);
	}

	return browser;
}

export function randomPlatform(): BrowserFingerprint["platform"] {
	const totalWeight = PLATFORM_SHARE.windows + PLATFORM_SHARE.macos + PLATFORM_SHARE.linux;
	const platformRoll = Math.random() * totalWeight;

	if (platformRoll < PLATFORM_SHARE.windows) {
		return "windows";
	}

	if (platformRoll < PLATFORM_SHARE.windows + PLATFORM_SHARE.macos) {
		return "macos";
	}

	return "linux";
}

export function randomViewport(platform: BrowserFingerprint["platform"]): BrowserFingerprint["viewport"] {
	const viewports = VIEWPORTS_BY_PLATFORM[platform];
	const totalWeight = viewports.reduce((total, viewport) => total + viewport.weight, 0);
	let viewportRoll = Math.random() * totalWeight;

	for (const viewport of viewports) {
		viewportRoll -= viewport.weight;

		if (viewportRoll <= 0) {
			return {
				width: viewport.width,
				height: viewport.height,
			};
		}
	}

	const viewport = viewports[viewports.length - 1];

	return {
		width: viewport.width,
		height: viewport.height,
	};
}
