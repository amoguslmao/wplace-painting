import type { HeaderJWT, ParsedJWT, PayloadJWT } from "../types/jwt.js";

export function parseJWT(token: string): ParsedJWT {
	const [headerB64, payloadB64, signature] = token.split(".");

	const header = JSON.parse(Buffer.from(headerB64, "base64").toString()) as HeaderJWT;

	const payload = JSON.parse(Buffer.from(payloadB64, "base64").toString()) as PayloadJWT;

	return {
		header, payload, signature
	};
}