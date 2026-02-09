//import { ImageManiputation } from "../libs/imageManiputation.js";
//import type { Pixel, PixelPacking, Tile } from "../types/pixel.js";
//import { packingPixel, toGlobalPixel, toTilePixel } from "../utils/pixel.js";
//import { sleep } from "../utils/sleep.js";

//const IMAGE_NAME = "test.png";
//const PAINT_TRANSPARENT = false;
//const MY_COOKIE = "p=s%3A6BBQ0_RC_1DxTpfwdo-4FVNHrzm1ZFXx.VtIojMFR2jCIjt2GwDK79kBRj4%2BcqritiPtzaKPSprI";
//const LOCATION_PAINT: Pixel = {
//	tile: {
//		x: 1630,
//		y: 962
//	},
//	x: 754,
//	y: 583
//}

//interface PaintPixel {
//	tile: Tile,
//	data: PixelPacking
//}

//const image = await ImageManiputation.create(`./input/${IMAGE_NAME}`);
//const { width, height } = image.metadata;

//const globalLocationPaint = toGlobalPixel(LOCATION_PAINT);

//const arr: PaintPixel[] = new Array(width * height);
//let arrIndex = 0;

//for (let imageY = 0; imageY < height; imageY++) {
//	for (let imageX = 0; imageX < width; imageX++) {
//		const { r, g, b, a } = image.getPixel(imageX, imageY);

//		if (a === 0 && !PAINT_TRANSPARENT) {
//			continue;
//		}

//		const globalX = imageX + globalLocationPaint.x;
//		const globalY = imageY + globalLocationPaint.y;

//		const { tile, x, y } = toTilePixel({
//			x: globalX,
//			y: globalY
//		});

//		arr[arrIndex] = {
//			tile,
//			data: [
//				x, y,
//				r, g, b, a
//			]
//		};

//		arrIndex++;
//	}
//}

//console.log(`Length of "arr": ${arr.length}`);

//let position = 0;

//while (position < arr.length) {
//	const tempArr: PaintPixel[] = [];

//	let i = position;
//	for (; i < arr.length; i++) {
//		const lastElement = tempArr.at(-1);

//		if (lastElement &&
//			(
//				lastElement.tile.x !== arr[i].tile.x ||
//				lastElement.tile.y !== arr[i].tile.y
//			)
//		) {
//			//console.log("Before set again the value of 'position'");
//			//console.log(position, i);

//			position = i;

//			//console.log("After set again the value of 'position'");
//			//console.log(position, i);

//			break;
//		}

//		tempArr.push(arr[i]);
//	}

//	// Trường hợp mà mọi pixel nó nằm trong 1 tile thì
//	// Cái điều kiện if không bao giờ chạy, nên là phải
//	// Update riêng cái position để xử lý cho trường hợp này
//	if (i >= arr.length) {
//		position = arr.length;
//	}

//	//console.log(`---- Temp arr with position ---`);
//	//console.log(tempArr.slice(0, 3), tempArr.length, position);

//	// Vì trong 1 mảng này chỉ có những pixel trong đúng 1 tile
//	// Nên là chỉ cần lấy element đầu là có tọa độ tile
//	const { tile } = tempArr[0];

//	const allPixels = tempArr.map((val) => val.data);

//	const response = await fetch(`https://place34.com/api/paint/${tile.x}/${tile.y}`, {
//		method: "POST",
//		headers: {
//			"Content-Type": "application/octet-stream",
//			"Accept": "application/json, text/plain, */*",
//			"Cookie": MY_COOKIE
//		},
//		body: packingPixel(allPixels)
//	});

//	if (response.ok) {
//		console.log(`Painted ${await response.json()} pixels on tile ${tile.x}, ${tile.y}!`);
//	}
//	else {
//		console.log(`Could not paint on tile ${tile.x}, ${tile.y}`);
//		console.log(await response.text());
//	}
//}