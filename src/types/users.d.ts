export interface AccountInformation {
	id: number,
	user: WplaceUser,
	jwtToken: string,
	lastFetch: number,
}

export interface DatabaseAccountInformation {
	id: number,
	user: string,
	jwtToken: string,
	lastFetch: number
}

export interface WplaceUser {
	allianceId: number,
	allianceRole: "admin" | "member",
	charges: {
		cooldownMs: number,
		count: number,
		max: number
	},
	country: string,
	discord: string,
	discordId: string,
	droplets: number,
	equippedBadges: (null | number)[],
	equippedFlag: number,
	equippedFrameId: number,
	equippedFrameUrl: string,
	equippedNameCosmetic: null | string,
    experiments: {
        "2025-09_discord_linking": {
            "enabled": true
        },
        "2025-09_pawtect": {
            "variant": "koala"
        }
    },
	extraColorsBitmap: number,
	favoriteLocations: FavoriteLocation[],
	flagsBitmap: string,
	freeFlag: boolean,
	id: number,
	isCustomer: boolean,
	level: number,
	maxFavoriteLocations: number,
	name: string,
	needsPhoneVerification: boolean,
	picture: string,
	pixelsPainted: number,
	role: string,
	showLastPixel: boolean,
	suspensionReason?: string,
	timeoutUntil: string
}

export interface FavoriteLocation {
	id: number,
	name: number,
	latitude: number,
	longtitude: number
}