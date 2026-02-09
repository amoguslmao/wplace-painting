export interface HeaderJWT {
	alg: string,
	typ: string
}

export interface PayloadJWT {
	userId: number,
	sessionId: string,
	hasPermission: boolean,
	iss: string,
	exp: number,
	iat: number
}

export interface ParsedJWT {
	header: HeaderJWT,
	payload: PayloadJWT,
	signature: string
}