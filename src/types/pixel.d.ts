export interface Pixel {
	x: number, 
	y: number,
	tile: Tile
}

export interface Tile {
	x: number,
	y: number
}

export interface PixelInformation {
	x: number,
	y: number,
	color: number
}

export interface PaintingTile {
	x: number,
	y: number,
	pixels: {
		x: number[],
		y: number[],
		colors: number[]
	}
}

export type GlobalPixel = Omit<Pixel, "tile">;