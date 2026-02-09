//import { ImageManiputation } from "../libs/imageManiputation.js";

//const BASE_COORD = {
//	x: 832,
//	y: 470
//}

//const getPlace34Tile = await fetch("https://place34.com/api/tile/1630/962.png", {
//	method: "GET"
//});

//// Need to get width and height of the base image
//const imageFromInput = await ImageManiputation.create("./input/940_cropped.png");

//const imageFromPlace34 = await ImageManiputation.create(await getPlace34Tile.arrayBuffer());

//await imageFromPlace34.crop({
//	left: BASE_COORD.x,
//	top: BASE_COORD.y,
//	height: imageFromInput.metadata.height,
//	width: imageFromInput.metadata.width
//}).flush();

//function isMatching(firstPixel: {
//	r: number, g: number, b: number, a: number
//}, secondPixel: {
//	r: number, g: number, b: number, a: number
//}) {
//	return Object.keys(firstPixel).every((prop) => (firstPixel as any)[prop] === (secondPixel as any)[prop]);
//}

//for (let y = 0; y < imageFromInput.metadata.height; y++) {
//	for (let x = 0; x < imageFromInput.metadata.width; x++) {
//		const pixelFromInput = imageFromInput.getPixel(x, y);
//		const pixelFromPlace34 = imageFromPlace34.getPixel(x, y);

//		//console.log(pixelFromInput, "-", pixelFromPlace34);

//		if (!isMatching(pixelFromInput, pixelFromPlace34)) {
//			console.log(`Pixel (${BASE_COORD.x + x}, ${BASE_COORD.y + y}) is mismatch!`);
//			console.log(pixelFromInput, "-", pixelFromPlace34);
//		}
//	}
//}
