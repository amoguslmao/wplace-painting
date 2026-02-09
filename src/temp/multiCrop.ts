import { ImageManiputation } from "../libs/imageManiputation.js";

const FIRST_CROP = {
	x: 295,
	y: 199
}

const BASE_COORD = {
	x: 832,
	y: 470
}

const getPlace34Tile = await fetch("https://place34.com/api/tile/1630/962.png", {
	method: "GET"
});

const imageFromPlace34 = await ImageManiputation.create(await getPlace34Tile.arrayBuffer());

imageFromPlace34.crop({
	left: FIRST_CROP.x,
	top: FIRST_CROP.y,
	height: 406,
	width: 200
});

console.log(imageFromPlace34.metadata.height, imageFromPlace34.metadata.width, imageFromPlace34.metadata.size);

await imageFromPlace34.crop({
	left: 120,
	top: 256,
	height: 15,
	width: 14
}).flush();

console.log(imageFromPlace34.metadata.height, imageFromPlace34.metadata.width, imageFromPlace34.metadata.size);