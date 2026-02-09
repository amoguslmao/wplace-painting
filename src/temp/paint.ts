function pack(p: [x: number, y: number, r: number, g: number, b: number, a: number][]) {
	const buf = new ArrayBuffer(p.length * 8);
	const dv = new DataView(buf);
	for (let i = 0; i < p.length; i++) {
		const baseBuf = i * 8;
		dv.setUint16(baseBuf + 0, p[i][0]);
		dv.setUint16(baseBuf + 2, p[i][1]);
		dv.setUint8(baseBuf + 4, p[i][2]);
		dv.setUint8(baseBuf + 5, p[i][3]);
		dv.setUint8(baseBuf + 6, p[i][4]);
		dv.setUint8(baseBuf + 7, p[i][5]);
	}
	return buf;
}

const BASE_URL = "https://place34.com/api/paint/1631/962";
const COOKIE = "p=s%3A6BBQ0_RC_1DxTpfwdo-4FVNHrzm1ZFXx.VtIojMFR2jCIjt2GwDK79kBRj4%2BcqritiPtzaKPSprI";

const pixel: [x: number, y: number, r: number, g: number, b: number, a: number] = [
	78, 364,
	127, 69, 255, 50
];

const response = await fetch(BASE_URL, {
	method: "POST",
	headers: {
		"Content-Type": "application/octet-stream",
		"Accept": "application/json, text/plain, */*",
		"Cookie": COOKIE
	},
	body: pack([pixel])
});

if (response.ok) {
	console.log(`Paint successfully!\n`, await response.json());
}
else {
	console.log(`Paint not successfully! Code: ${response.status}\n`, await response.text());
}