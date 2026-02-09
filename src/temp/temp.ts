//import { ImageManiputation } from "../libs/imageManiputation.js";
//import type { PixelPacking, RGBAChannel } from "../types/pixel.js";

//const MY_COOKIE = "p=s%3A6BBQ0_RC_1DxTpfwdo-4FVNHrzm1ZFXx.VtIojMFR2jCIjt2GwDK79kBRj4%2BcqritiPtzaKPSprI";

//// Load image
//const imageFromInput = await ImageManiputation.create("./input/940_cropped.png");

//const getPlace34Tile = await fetch("https://place34.com/api/tile/1630/962.png", {
//	method: "GET"
//});

//const imageFromPlace34 = await ImageManiputation.create(await getPlace34Tile.arrayBuffer());

//// Function to packing pixel into buffer
//function pack(p: PixelPacking[]) {
//	const buf = new ArrayBuffer(p.length * 8);

//	const dv = new DataView(buf);

//	for (let i = 0; i < p.length; i++) {
//		const baseBuf = i * 8;
//		dv.setUint16(baseBuf + 0, p[i][0]);
//		dv.setUint16(baseBuf + 2, p[i][1]);
//		dv.setUint8(baseBuf + 4, p[i][2]);
//		dv.setUint8(baseBuf + 5, p[i][3]);
//		dv.setUint8(baseBuf + 6, p[i][4]);
//		dv.setUint8(baseBuf + 7, p[i][5]);
//	}
//	return buf;
//}

//function isMatching(firstPixel: RGBAChannel, secondPixel: RGBAChannel) {
//	return Object.keys(firstPixel).every((prop) => (firstPixel as any)[prop] === (secondPixel as any)[prop]);
//}

//const { height, width } = imageFromInput.metadata;

//const BASE_COORD = {
//	x: 832,
//	y: 470
//}

//const pixels: PixelPacking[] = [];

//for (let y = 0; y < height; y++) {
//	for (let x = 0; x < width; x++) {

//		//if (pixels.length > 222) {
//		//	// I dont have enough charge to paint lol
//		//	break;
//		//}

//		const pixelFromInput = imageFromInput.getPixel(x, y);
//		const pixelFromPlace34 = imageFromPlace34.getPixel(BASE_COORD.x + x, BASE_COORD.y + y);

//		if (pixelFromInput.a === 0) {
//			continue;
//			// Because this pixel is transparent, we dont need to paint it
//		}

//		if (isMatching(pixelFromInput, pixelFromPlace34)) {
//			continue;
//			// Pixel is right, we can let it continue
//		}
//		else {
//			console.log(`Pixel (${BASE_COORD.x + x}, ${BASE_COORD.y + y}) is mismatching! Fixing it...`);
//		}

//		const {r,g,b,a} = pixelFromInput;

//		pixels.push([
//			BASE_COORD.x + x, BASE_COORD.y + y,
//			r,g,b,a
//		]);
//	}
//}

//const response = await fetch("https://place34.com/api/paint/1630/962", {
//	method: "POST",
//	headers: {
//		"Content-Type": "application/octet-stream",
//		"Accept": "application/json, text/plain, */*",
//		"Cookie": MY_COOKIE
//	},
//	body: pack(pixels)
//});

//if (response.ok) {
//	console.log(`Paint successfully!\n`, await response.json());
//}
//else {
//	console.log(`Paint not successfully\n`, await response.text());
//}