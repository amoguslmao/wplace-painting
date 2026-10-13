export interface AccountInformation {
	id: number;
	jwtToken: string;
	lastFetch: number;
	browserFingerprint: BrowserFingerprint;
	user: WplaceUser;
}

export interface DatabaseAccountInformation {
	id: number;
	jwtToken: string;
	lastFetch: number;
	browserFingerprint: string;
	user: string;
}

export interface AccountPredictedCharge {
	waitTime: number,
	id: number,
	predictedCharges: number,
	maxCharges: number,
	cooldown: number,
}

export interface BrowserFingerprint {
	seed: number;
	platform: "windows" | "macos" | "linux";
	viewport: {
		width: number;
		height: number;
	};
	storageQuotaMb: number;
	locale?: string;
	timezone?: string;
}

export interface EquippedBadge {
	id: number;
	imageUrl: string;
	name: string;
	rarity: string;
}

export interface EquippedNameCosmetic {
	fontId: number;
	styleId: number;
	resolved: {
		text: string;
	};
}

export interface WplaceUser {
	allianceId?: number;
	allianceName?: string;
	allianceRole?: "admin" | "member";
	avatarSeed: string;
	charges: {
		cooldownMs: number;
		count: number;
		max: number;
	};
	country: string;
	discord: string;
	discordId: string;
	droplets: number;
	equippedBadges: (EquippedBadge | null)[];
	equippedFlag: number;
	equippedFrameId: number;
	equippedFrameUrl: string;
	equippedNameCosmetic: EquippedNameCosmetic | null;
	extraColorsBitmap: number;
	favoriteLocations: FavoriteLocation[];
	flagsBitmap: string;
	freeFlag: boolean;
	hotspotsOptOut: boolean;
	id: number;
	isCustomer: boolean;
	level: number;
	maxFavoriteLocations: number;
	name: string;
	picture: string;
	pixelsPainted: number;
	role: string;
	rulesRead: boolean;
	showDiscord: boolean;
	showLastPixel: boolean;
	timeoutUntil: string;
}

export interface FavoriteLocation {
	id: number;
	name: number;
	latitude: number;
	longtitude: number;
}
