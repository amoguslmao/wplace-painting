// save as computeSelection.ts and run with: npx ts-node computeSelection.ts
// or compile with tsc and chạy node.

type Point = {
	tileX: number;
	tileY: number;
	pixelX: number;
	pixelY: number;
};

const TILE_SIZE = 1000;

function validatePoint(p: Point) {
	for (const key of ["tileX", "tileY", "pixelX", "pixelY"] as const) {
		if (!Number.isFinite(p[key]) || !Number.isInteger(p[key])) {
			throw new Error(`${key} must be an integer. Got: ${p[key]}`);
		}
	}
	if (p.pixelX < 0 || p.pixelX >= TILE_SIZE) {
		throw new Error(`pixelX must be in [0, ${TILE_SIZE - 1}]. Got: ${p.pixelX}`);
	}
	if (p.pixelY < 0 || p.pixelY >= TILE_SIZE) {
		throw new Error(`pixelY must be in [0, ${TILE_SIZE - 1}]. Got: ${p.pixelY}`);
	}
}

function computeSelection(first: Point, second: Point) {
	validatePoint(first);
	validatePoint(second);

	const g1x = first.tileX * TILE_SIZE + first.pixelX;
	const g1y = first.tileY * TILE_SIZE + first.pixelY;
	const g2x = second.tileX * TILE_SIZE + second.pixelX;
	const g2y = second.tileY * TILE_SIZE + second.pixelY;

	const width = Math.abs(g2x - g1x) + 1;
	const height = Math.abs(g2y - g1y) + 1;

	// totalPixel fits into JS Number for reasonable tile coords; if extremely large use BigInt
	const totalPixel = width * height;

	return { width, height, totalPixel };
}

// ---------- Example from the prompt ----------
const firstPoint: Point = {
	tileX: 1630,
	tileY: 962,
	pixelX: 531,
	pixelY: 38,
};

const secondPoint: Point = {
	tileX: 1630,
	tileY: 962,
	pixelX: 558,
	pixelY: 50,
};

console.log("first - second",computeSelection(firstPoint, secondPoint));
console.log("second - first",computeSelection(secondPoint, firstPoint));
// Expected output:
// { width: 28, height: 13, totalPixel: 364 }

// ---------- More quick tests ----------
//console.log(computeSelection(firstPoint, firstPoint)); // same pixel => {1,1,1}
//console.log(
//	computeSelection(
//		{ tileX: 0, tileY: 0, pixelX: 999, pixelY: 0 },
//		{ tileX: 1, tileY: 0, pixelX: 0, pixelY: 0 }
//	)
//); // across tile boundary horizontally: width = 2, height = 1, totalPixel = 2
